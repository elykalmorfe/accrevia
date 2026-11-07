import React, { useEffect, useRef, useState } from 'react';
import { DownloadIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsGroup } from './SettingsLayout';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { usePortal } from '../../contexts/PortalContext';
import { formatNumber } from '../../utils/format';

const KEY_PREFIX = 'accrevia_';
const FILE_DB_NAME = 'accrevia-files';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function portalKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(KEY_PREFIX)) keys.push(key);
  }
  return keys;
}

function recordsSize(): number {
  return portalKeys().reduce((sum, key) => sum + key.length + (localStorage.getItem(key)?.length ?? 0), 0) * 2;
}

function exportPortalData() {
  const data: Record<string, unknown> = {};
  for (const key of portalKeys()) {
    const raw = localStorage.getItem(key);
    try {
      data[key] = raw ? JSON.parse(raw) : raw;
    } catch {
      data[key] = raw;
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accrevia-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseBackup(text: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
  const entries = Object.entries(parsed as Record<string, unknown>).filter(([key]) => key.startsWith(KEY_PREFIX));
  if (entries.length === 0) throw new Error('no portal records');
  return Object.fromEntries(entries);
}

function restoreBackup(data: Record<string, unknown>) {
  portalKeys().forEach((key) => localStorage.removeItem(key));
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
}

function deleteFileDatabase(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(FILE_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export function MaintenanceSettings() {
  const { documents, folders } = usePortal();
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ name: string; data: Record<string, unknown> } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearText, setClearText] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const passageCount = documents.reduce((sum, d) => sum + (d.passages?.length ?? 0), 0);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setStorage({ usage: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => setStorage(null));
  }, [documents]);

  const services = [
  { name: 'Portal records', detail: `${formatNumber(documents.length)} documents · ${formatNumber(folders.length)} folders · ${formatBytes(recordsSize())} of browser storage` },
  { name: 'Original file storage', detail: storage ? `${formatBytes(storage.usage)} used of ${formatBytes(storage.quota)} available` : 'Storage estimate unavailable in this browser' },
  { name: 'Search index', detail: `${formatNumber(passageCount)} passages from ${formatNumber(documents.length)} documents` }];


  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    file.text().then((text) => {
      try {
        setPendingImport({ name: file.name, data: parseBackup(text) });
      } catch {
        toast.error('This file is not an Accrevia backup.');
      }
    });
  };

  return (
    <div className="space-y-4">
      <SettingsGroup title="System status">
        <ul className="divide-y divide-line">
          {services.map((s) =>
          <li key={s.name} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium text-ink">{s.name}</p>
                <p className="text-xs text-ink-muted">{s.detail}</p>
              </div>
              <Badge tone="success" dot>Available</Badge>
            </li>
          )}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Backup and restore">
        <div className="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink">Export portal data</p>
            <p className="text-xs text-ink-muted">Downloads folders, document records, accreditation records, and settings as a JSON file. Original uploaded files are not included.</p>
          </div>
          <button type="button" className="btn btn-secondary shrink-0" onClick={() => {exportPortalData();toast.success('Portal data exported');}}>
            <DownloadIcon className="h-4 w-4" /> Export backup
          </button>
        </div>
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink">Import backup</p>
            <p className="text-xs text-ink-muted">Replaces the records in this browser with the contents of a backup file. The page reloads afterwards.</p>
          </div>
          <button type="button" className="btn btn-secondary shrink-0" onClick={() => importInput.current?.click()}>
            <UploadIcon className="h-4 w-4" /> Import backup
          </button>
          <input
            ref={importInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              handleImportFile(e.target.files?.[0]);
              e.target.value = '';
            }} />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink">Clear all local data</p>
            <p className="text-xs text-ink-muted">Deletes every document, folder, accreditation record, uploaded file, and setting stored in this browser. Export a backup first.</p>
          </div>
          <button type="button" className="btn shrink-0 border border-danger-200 bg-white text-danger-700 hover:bg-danger-50" onClick={() => setConfirmClear(true)}>
            <Trash2Icon className="h-4 w-4" /> Clear data
          </button>
        </div>
      </SettingsGroup>

      <section className="panel overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="panel-title">System logs</h2>
        </div>
        <p className="border-t border-line px-5 py-8 text-center text-xs text-ink-muted">No system logs have been recorded.</p>
      </section>

      <Modal
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Import backup?"
        description={pendingImport ? `${pendingImport.name} · ${Object.keys(pendingImport.data).length} record groups` : undefined}
        footer={
        <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setPendingImport(null)}>Cancel</button>
            <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!pendingImport) return;
              restoreBackup(pendingImport.data);
              window.location.reload();
            }}>
              Replace and reload
            </button>
          </div>
        }>
        <p className="text-[13px] text-ink-muted">
          The records currently in this browser will be replaced by the backup. Original files that are already stored stay available for documents that still exist.
        </p>
      </Modal>

      <Modal
        open={confirmClear}
        onClose={() => {
          setConfirmClear(false);
          setClearText('');
        }}
        title="Clear all local data?"
        description="This cannot be undone."
        footer={
        <div className="flex justify-end gap-2">
            <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setConfirmClear(false);
              setClearText('');
            }}>
              Cancel
            </button>
            <button
            type="button"
            className="btn bg-danger-600 text-white hover:bg-danger-700 disabled:opacity-50"
            disabled={clearText !== 'DELETE'}
            onClick={async () => {
              portalKeys().forEach((key) => localStorage.removeItem(key));
              await deleteFileDatabase();
              window.location.reload();
            }}>
              Delete everything
            </button>
          </div>
        }>
        <div className="space-y-3 text-[13px] text-ink-muted">
          <p>All documents, folders, accreditation records, uploaded files, and settings in this browser will be removed.</p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink">Type DELETE to confirm</span>
            <input className="input" value={clearText} onChange={(e) => setClearText(e.target.value)} autoComplete="off" />
          </label>
        </div>
      </Modal>
    </div>);

}
