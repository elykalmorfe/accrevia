/**
 * Embeddable viewer URL for a Google Drive share link (`open?id=`, `/file/d/<id>/`, `uc?id=`, or a folder link).
 * Returns null for links that are not Google Drive; those usually refuse to load inside a frame.
 */
export function driveEmbedUrl(link?: string | null): string | null {
  let url: URL;
  try {
    url = new URL((link || '').trim());
  } catch {
    return null;
  }
  if (url.hostname !== 'drive.google.com' && url.hostname !== 'docs.google.com') return null;

  const folder = /\/folders\/([\w-]+)/.exec(url.pathname)?.[1];
  if (folder) return `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folder)}#grid`;

  const file = /\/file\/d\/([\w-]+)/.exec(url.pathname)?.[1] ?? url.searchParams.get('id');
  if (file && /^[\w-]+$/.test(file)) return `https://drive.google.com/file/d/${file}/preview`;
  return null;
}
