import { apiFetch, isApiConfigured } from '../services/api/client';

export function isLocalCertificatePath(url?: string | null): boolean {
  return /^\/certificates\//i.test((url || '').trim());
}

export async function isRepositoryFile(blob: Blob, path: string): Promise<boolean> {
  if (!blob.size || /^(text\/html|application\/xhtml\+xml)\b/i.test(blob.type)) return false;
  const head = await blob.slice(0, 1024).text();
  if (/^\s*<(?:!doctype\s+html|html\b|head\b)/i.test(head)) return false;
  return !/\.pdf(?:[?#]|$)/i.test(path) || head.includes('%PDF-');
}

export async function fetchRepositoryFile(path: string): Promise<Blob | undefined> {
  const href = path.trim();
  if (!isLocalCertificatePath(href)) return undefined;

  try {
    const response = await fetch(href, { headers: { Accept: 'application/octet-stream' } });
    if (response.ok) {
      const blob = await response.blob();
      if (await isRepositoryFile(blob, href)) return blob;
    }
  } catch {
    // The original may still be available in MySQL.
  }

  if (!isApiConfigured()) return undefined;
  try {
    const path = decodeURIComponent(new URL(href, window.location.origin).pathname);
    const query = new URLSearchParams({ path });
    const response = await apiFetch(`/api/portal-storage/catalog/original/?${query}`, {}, 60_000);
    if (response.ok) {
      const blob = await response.blob();
      if (await isRepositoryFile(blob, href)) return blob;
    }
  } catch {
    // An unavailable original is handled by the viewer.
  }
  return undefined;
}
