/**
 * Original bytes for a file sent on a request. The server only returns them
 * when that person's privacy setting allows them to open it.
 */
import { getStoredFile } from '../../utils/fileStore';
import { apiFetch, getApiBaseUrl } from '../api/client';
import { currentLiveIdentity } from './roleLive';

function fileNameFrom(header: string | null, fallback: string): string {
  const match = /filename="([^"]+)"/.exec(header || '');
  return match?.[1] || fallback;
}

export async function fetchSharedOriginal(documentId: string): Promise<{ name: string; type: string; blob: Blob } | undefined> {
  if (!getApiBaseUrl() || !documentId) return undefined;
  const identity = currentLiveIdentity();
  const params = new URLSearchParams({
    role: identity.role,
    userId: identity.userId,
    email: identity.email
  });
  try {
    const res = await apiFetch(`/api/live/files/${encodeURIComponent(documentId)}/?${params.toString()}`, {}, 120000);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    const type = (blob.type || res.headers.get('Content-Type') || 'application/octet-stream').split(';')[0];
    let name = fileNameFrom(res.headers.get('Content-Disposition'), documentId);
    if (!name.includes('.') && type.includes('wordprocessingml')) name = `${name}.docx`;
    if (!name.includes('.') && type.includes('spreadsheetml')) name = `${name}.xlsx`;
    if (!name.includes('.') && type === 'application/pdf') name = `${name}.pdf`;
    return { name, type, blob };
  } catch {
    return undefined;
  }
}

/** Keeps a repository file available to the people named in its privacy setting. */
export async function publishSharedOriginal(documentId: string, fallbackName: string): Promise<void> {
  if (!getApiBaseUrl() || !documentId) return;
  const stored = await getStoredFile(documentId).catch(() => undefined);
  if (!stored) return;
  const identity = currentLiveIdentity();
  const body = new FormData();
  body.append('role', identity.role);
  body.append('userId', identity.userId);
  body.append('email', identity.email);
  body.append('file', new File([stored.blob], stored.name || fallbackName, { type: stored.type || 'application/octet-stream' }));
  await apiFetch(`/api/live/files/${encodeURIComponent(documentId)}/`, { method: 'POST', body }, 120000).catch(() => undefined);
}
