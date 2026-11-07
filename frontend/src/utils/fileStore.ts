export interface StoredFile {
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

export async function saveStoredFile(id: string, file: File | Blob, name?: string): Promise<void> {
  const record: StoredFile = {
    id,
    name: name ?? (file instanceof File ? file.name : id),
    type: file.type,
    size: file.size,
    blob: file,
    storedAt: new Date().toISOString()
  };
  await withStore('readwrite', (store) => store.put(record));
}

export function getStoredFile(id: string): Promise<StoredFile | undefined> {
  return withStore<StoredFile | undefined>('readonly', (store) => store.get(id));
}

export async function deleteStoredFile(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}

/** Persists the original upload; failures are logged so the metadata upload still succeeds. */
export function persistUpload(id: string, file: File | Blob | undefined, name?: string): void {
  if (!file) return;
  saveStoredFile(id, file, name).catch((err) => console.error(`Could not store original file for ${id}`, err));
}

export async function downloadStoredFile(id: string, fallbackName: string): Promise<boolean> {
  const stored = await getStoredFile(id).catch(() => undefined);
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
