import React, { useEffect, useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsGroup } from './SettingsLayout';
import { Badge } from '../ui/Badge';
import { usePortal } from '../../contexts/PortalContext';
import { formatNumber } from '../../utils/format';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function exportPortalData() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('accrevia_')) continue;
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

export function MaintenanceSettings() {
  const { documents, folders } = usePortal();
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const passageCount = documents.reduce((sum, d) => sum + (d.passages?.length ?? 0), 0);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setStorage({ usage: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => setStorage(null));
  }, [documents]);

  const services = [
    { name: 'Portal records', detail: `${formatNumber(documents.length)} documents · ${formatNumber(folders.length)} folders saved in this browser` },
    { name: 'Original file storage', detail: storage ? `${formatBytes(storage.usage)} used of ${formatBytes(storage.quota)} available` : 'Storage estimate unavailable in this browser' },
    { name: 'Search index', detail: `${formatNumber(passageCount)} passages from ${formatNumber(documents.length)} documents` }
  ];

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

      <SettingsGroup title="Backup">
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink">Export portal data</p>
            <p className="text-xs text-ink-muted">Downloads folders, document records, and accreditation records as a JSON file. Original uploaded files are not included.</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => { exportPortalData(); toast.success('Portal data exported'); }}>
            <DownloadIcon className="h-4 w-4" /> Export backup
          </button>
        </div>
      </SettingsGroup>

      <section className="panel overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="panel-title">System logs</h2>
        </div>
        <p className="border-t border-line px-5 py-8 text-center text-xs text-ink-muted">No system logs have been recorded.</p>
      </section>
    </div>);

}
