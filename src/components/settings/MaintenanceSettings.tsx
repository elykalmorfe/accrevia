import React from 'react';
import { DownloadIcon, PlayIcon } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsGroup } from './SettingsLayout';
import { Badge, BadgeTone } from '../ui/Badge';

const services: {name: string;detail: string;status: string;tone: BadgeTone;}[] = [
{ name: 'Database (PostgreSQL 16)', detail: 'Metadata, users, and audit records · 2.4 GB · 12 ms avg query', status: 'Operational', tone: 'success' },
{ name: 'Vector database (Qdrant)', detail: '48,302 vectors in collection “evidence_passages” · 1024 dimensions', status: 'Operational', tone: 'success' },
{ name: 'Lexical index (BM25)', detail: 'Last refreshed today at 8:40 AM', status: 'Healthy', tone: 'success' },
{ name: 'Embedding service (BGE-M3)', detail: 'GPU worker · queue depth 3', status: 'Busy', tone: 'warning' }];


const logs = [
{ time: '08:51:12', level: 'INFO', message: 'Search “faculty qualification” returned 14 results in 402 ms' },
{ time: '08:40:03', level: 'INFO', message: 'BM25 index refreshed (1,217 documents)' },
{ time: '08:36:47', level: 'INFO', message: 'OCR started for Scanned_BOR_Resolutions_2024.pdf (52 pages)' },
{ time: '07:52:19', level: 'ERROR', message: 'OCR confidence 41% below threshold for Old_Faculty_Records_1998.pdf' },
{ time: '02:00:00', level: 'INFO', message: 'Nightly backup completed · 6.8 GB · verified' }];


export function MaintenanceSettings() {
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
              <Badge tone={s.tone} dot>{s.status}</Badge>
            </li>
          )}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Backup">
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink">Last backup: Oct 1, 2026 at 2:00 AM</p>
            <p className="text-xs text-ink-muted">Daily at 2:00 AM · 30 backups retained · includes database, vector index, and files</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => toast.success('Backup started — you will be notified when it completes')}>
            <PlayIcon className="h-4 w-4" /> Run backup now
          </button>
        </div>
      </SettingsGroup>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="panel-title">System logs</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => toast.success('Logs exported')}>
            <DownloadIcon className="h-3.5 w-3.5" /> Download logs
          </button>
        </div>
        <ul className="divide-y divide-line border-t border-line font-mono text-xs">
          {logs.map((l) =>
          <li key={l.time} className="flex gap-4 px-5 py-2.5">
              <span className="shrink-0 text-ink-subtle">{l.time}</span>
              <span className={`w-12 shrink-0 font-semibold ${l.level === 'ERROR' ? 'text-danger-700' : 'text-ink-muted'}`}>{l.level}</span>
              <span className="min-w-0 text-ink">{l.message}</span>
            </li>
          )}
        </ul>
      </section>
    </div>);

}