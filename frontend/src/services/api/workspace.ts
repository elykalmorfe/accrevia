import { apiFetch, isApiConfigured } from './client';

/** Restore the selected portable database snapshot before React reads local storage. */
export async function restoreWorkspace(): Promise<void> {
  if (!isApiConfigured()) return;
  const response = await apiFetch('/api/portal-storage/workspace/records/', {}, 30_000);
  if ([401,403].includes(response.status)) return;
  if (!response.ok) throw new Error('The database workspace could not be loaded.');
  const { records } = await response.json();
  for (const [name, incoming] of Object.entries(records as Record<string, unknown>)) {
    const key = `accrevia_${name}`;
    const raw = localStorage.getItem(key);
    if (raw === null) {
      localStorage.setItem(key, JSON.stringify(incoming));
      window.dispatchEvent(new StorageEvent('storage',{key,newValue:JSON.stringify(incoming)}));
      continue;
    }
    // Keep this browser's edits while adding records from the portable copy.
    let local: unknown;
    try { local = JSON.parse(raw); } catch { continue; }
    if (Array.isArray(incoming) && Array.isArray(local) && incoming.every((item) => item && typeof item === 'object' && typeof item.id === 'string')) {
      const merged = new Map(incoming.map((item) => [item.id, item]));
      for (const item of local) if (item && typeof item.id === 'string') merged.set(item.id, item);
      localStorage.setItem(key, JSON.stringify([...merged.values()]));
    }
  }
}
