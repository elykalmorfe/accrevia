import { fetchRepositoryFile, isLocalCertificatePath, isRepositoryFile } from './repositoryFiles';
import { apiFetch, isApiConfigured } from '../services/api/client';

export interface StoredFile {
  sha256?: string;
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  storedAt: string;
}

const DB_NAME = 'accrevia-files';
const STORE = 'files';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredFile(id: string, file: File | Blob, name?: string, notify = true): Promise<void> {
  const context = window.location.pathname.startsWith('/evidence/upload') ? 'upload-documents' : 'accreditation';
  const record: StoredFile = {
    id,
    name: name ?? (file instanceof File ? file.name : id),
    type: file.type,
    size: file.size,
    blob: file,
    storedAt: new Date().toISOString()
  };
  await withStore('readwrite', (store) => store.put(record));
  if (notify) window.dispatchEvent(new CustomEvent('accrevia-original-stored',{detail:{id,context}}));
}

export function getLocalStoredFile(id: string): Promise<StoredFile | undefined> {
  return withStore<StoredFile | undefined>('readonly', (store) => store.get(id));
}

export async function getStoredFile(id: string): Promise<StoredFile | undefined> {
  const local = await getLocalStoredFile(id).catch(() => undefined);
  if (!isApiConfigured()) return local;
  let repositoryResponse: Response | undefined;
  try { repositoryResponse = await apiFetch(`/api/repository/files/${encodeURIComponent(id)}/`, {}, 120000); } catch { return undefined; }
  if (repositoryResponse.ok) {
    const blob = await repositoryResponse.blob();
    const disposition = repositoryResponse.headers.get('Content-Disposition') || '';
    const encoded = /filename\*=utf-8''([^;]+)/i.exec(disposition)?.[1];
    const name = encoded ? decodeURIComponent(encoded) : /filename="([^"]+)"/.exec(disposition)?.[1] || id;
    const stored: StoredFile = {id, name, type:blob.type, size:blob.size, blob, storedAt:new Date().toISOString(), sha256:repositoryResponse.headers.get('ETag')?.replace(/"/g,'')};
    await withStore('readwrite', store => store.put(stored));
    return stored;
  }
  if ([401,403,404].includes(repositoryResponse.status)) return undefined;
  const response = await apiFetch(`/api/portal-storage/workspace/files/?id=${encodeURIComponent(id)}`, {}, 120_000);
  if (!response.ok) return undefined;
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const encoded = /filename\*=utf-8''([^;]+)/i.exec(disposition)?.[1];
  const name = encoded ? decodeURIComponent(encoded) : /filename="([^"]+)"/.exec(disposition)?.[1] || id;
  if (!await isRepositoryFile(blob, name)) return undefined;
  const stored: StoredFile = { id, name, type: blob.type, size: blob.size, blob, storedAt: new Date().toISOString() };
  await withStore('readwrite', (store) => store.put(stored)).catch(() => undefined);
  return stored;
}

export function listStoredFileIds(): Promise<string[]> {
  return withStore<IDBValidKey[]>('readonly', (store) => store.getAllKeys()).then((keys) =>
    keys.filter((key): key is string => typeof key === 'string')
  );
}

export async function deleteStoredFile(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}

/** Persists the original upload; failures are logged so the metadata upload still succeeds. */
export async function persistUpload(id: string, file: File | Blob | undefined, name?: string): Promise<void> {
  if (!file) return;
  await saveStoredFile(id, file, name);
}

export async function loadRepositoryFile(id: string, path: string, force = false): Promise<StoredFile | undefined> {
  if (!force) {
    const stored = await getStoredFile(id).catch(() => undefined);
    if (stored && await isRepositoryFile(stored.blob, path)) return stored;
  }
  const blob = await fetchRepositoryFile(path);
  if (!blob) return undefined;
  const name = path.trim().split('/').pop() || id;
  await saveStoredFile(id, blob, name, false).catch(() => undefined);
  return { id, name, blob, type: blob.type, size: blob.size, storedAt: new Date().toISOString() };
}

export async function downloadStoredFile(id: string, fallbackName: string, originalPath?: string): Promise<boolean> {
  if (isApiConfigured()) {
    try {
      const response=await apiFetch(`/api/repository/files/${encodeURIComponent(id)}/?download=1`,{},120000);
      if (!response.ok) return false;
      const url=URL.createObjectURL(await response.blob());
      const link=document.createElement('a'); link.href=url;
      const disposition=response.headers.get('Content-Disposition') || '';
      const encoded=/filename\*=utf-8''([^;]+)/i.exec(disposition)?.[1];
      link.download=encoded ? decodeURIComponent(encoded) : /filename="([^"]+)"/.exec(disposition)?.[1] || fallbackName;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
      return true;
    } catch {return false;}
  }
  const stored = await (originalPath && isLocalCertificatePath(originalPath)
    ? loadRepositoryFile(id, originalPath) : getStoredFile(id))
    .catch(() => undefined);
  if (!stored) return false;
  const url = URL.createObjectURL(stored.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = stored.name || fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
