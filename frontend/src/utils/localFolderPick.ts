import { getApiBaseUrl } from '../services/api/client';
import { getSettings } from '../settings/portalSettings';
import type { PendingUpload } from './dropFiles';

export type LocalFolderPick = PendingUpload[] | 'cancelled' | 'unsupported';

interface PickedFile {
  index: number;
  name: string;
  path: string;
  size: number;
}

/** Opens the Windows folder window where several folders can be Ctrl+clicked together. */
export async function pickLocalFolders(): Promise<LocalFolderPick> {
  const base = getApiBaseUrl();
  if (!base) return 'unsupported';
  let response: Response;
  try {
    response = await fetch(`${base}/api/live/pick-folders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxMb: getSettings().uploads.maxFileSizeMb }),
      signal: AbortSignal.timeout(10 * 60 * 1000)
    });
  } catch {
    return 'unsupported';
  }
  if (response.status === 404 || response.status === 501) return 'unsupported';
  if (!response.ok) throw new Error('Could not open the folder window.');
  const data = (await response.json()) as { cancelled?: boolean; pickId?: string; files?: PickedFile[] };
  if (data.cancelled || !data.pickId) return 'cancelled';
  const files = data.files ?? [];
  const uploads: PendingUpload[] = new Array(files.length);
  let cursor = 0;
  const take = async () => {
    while (cursor < files.length) {
      const file = files[cursor];
      const slot = cursor;
      cursor += 1;
      const fileResponse = await fetch(`${base}/api/live/pick-folders/${data.pickId}/${file.index}/`);
      if (!fileResponse.ok) continue;
      const blob = await fileResponse.blob();
      uploads[slot] = {
        file: new File([blob], file.name, { type: blob.type || 'application/octet-stream' }),
        path: file.path
      };
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(4, Math.max(files.length, 1)) }, take));
  } finally {
    void fetch(`${base}/api/live/pick-folders/${data.pickId}/`, { method: 'DELETE' }).catch(() => undefined);
  }
  return uploads.filter((item): item is PendingUpload => Boolean(item));
}
