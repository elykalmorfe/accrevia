import { useEffect, useRef } from 'react';
import { getLocalStoredFile, listStoredFileIds } from '../../utils/fileStore';
import { isRepositoryFile } from '../../utils/repositoryFiles';
import { apiFetch, getApiBaseUrl } from './client';

const BROWSER_ID = 'accrevia-db-browser-id';
const LOCAL_FRONTENDS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
const LOCAL_BACKENDS = new Set(['http://localhost:8000', 'http://127.0.0.1:8000']);
const BROWSER_COLLECTIONS = new Set([
  'dismissed_reminders', 'hidden_folders', 'iso_area_layout', 'iso_section_description',
  'iso_section_title', 'report_signatories', 'settings', 'theme'
]);

let syncNow: (() => Promise<void>) | undefined;

export function canSyncPortalDatabase(): boolean {
  return LOCAL_FRONTENDS.has(window.location.origin) && LOCAL_BACKENDS.has(getApiBaseUrl());
}

export function syncPortalDatabase(): Promise<void> {
  if (!syncNow) return Promise.reject(new Error('Open Accrevia locally and sign in to copy this browser’s data.'));
  return syncNow();
}

function browserCollections(): Record<string, unknown> {
  const collections: Record<string, unknown> = {};
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith('accrevia_')) continue;
    const name = key.slice('accrevia_'.length);
    if (!BROWSER_COLLECTIONS.has(name) && !/^profile_[\w.-]{1,80}$/.test(name)) continue;
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      collections[name] = JSON.parse(raw);
    } catch {
      collections[name] = raw;
    }
  }
  return collections;
}

export function usePortalDatabase(active: boolean, records: Record<string, unknown>) {
  const current = useRef(records);
  current.current = records;

  useEffect(() => {
    if (!active || !canSyncPortalDatabase()) return;

    let browserId = localStorage.getItem(BROWSER_ID);
    if (!browserId) {
      browserId = crypto.randomUUID();
      localStorage.setItem(BROWSER_ID, browserId);
    }
    const path = `/api/portal-storage/${browserId}`;
    const sent = new Map<string, string>();
    const fileStamps = new Map<string, string>();
    let activeRun: Promise<void> | undefined;
    let stopped = false;

    async function sync() {
      const collections = { ...browserCollections(), ...current.current };
      const snapshot = new Map(Object.entries(collections).map(([name, value]) => [name, JSON.stringify(value)]));
      const changed = Object.keys(collections).filter((name) => snapshot.get(name) !== sent.get(name));
      const removed = [...sent.keys()].filter((name) => !snapshot.has(name));
      if (changed.length || removed.length) {
        const payload = Object.fromEntries([
          ...changed.map((name) => [name, collections[name]]),
          ...removed.map((name) => [name, []])
        ]);
        const response = await apiFetch(`${path}/records/`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        }, 60_000);
        if (!response.ok) throw new Error('MySQL could not save the portal records.');
        changed.forEach((name) => sent.set(name, snapshot.get(name)!));
        removed.forEach((name) => sent.delete(name));
      }

      for (const id of await listStoredFileIds()) {
        if (stopped) return;
        const file = await getLocalStoredFile(id);
        if (!file || fileStamps.get(id) === file.storedAt) continue;
        if (!await isRepositoryFile(file.blob, file.name)) continue;
        const data = new FormData();
        data.set('id', id);
        data.set('file', file.blob, file.name);
        const response = await apiFetch(`${path}/files/`, { method: 'POST', body: data }, 120_000);
        if (!response.ok) throw new Error(`MySQL could not save ${file.name}.`);
        fileStamps.set(id, file.storedAt);
      }
    }

    function run() {
      activeRun ??= sync().finally(() => { activeRun = undefined; });
      return activeRun;
    }

    const retry = () => { void run().catch(() => undefined); };
    syncNow = run;
    retry();
    const timer = window.setInterval(retry, 5000);
    window.addEventListener('online', retry);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener('online', retry);
      if (syncNow === run) syncNow = undefined;
    };
  }, [active]);
}
