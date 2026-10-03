import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { AccessAction } from '../../types/sharing';
import { formatDateTime } from '../../utils/format';
import { SelectField } from '../ui/SelectField';
import { Badge, BadgeTone } from '../ui/Badge';

const actionTone: Record<AccessAction, BadgeTone> = {
  Viewed: 'neutral',
  Downloaded: 'brand',
  Shared: 'success',
  'Permission changed': 'gold',
  'Access extended': 'brand',
  'Access revoked': 'danger',
  'Access expired': 'warning',
  'Access denied': 'danger'
};

export function AccessLogTable() {
  const { accessLog, documents } = usePortal();
  const [action, setAction] = useState('');
  const [text, setText] = useState('');

  const titleOf = (id: string) => documents.find((d) => d.id === id)?.title ?? 'Unknown document';

  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return accessLog.filter(
      (l) => (!action || l.action === action) && (!needle || `${l.actor} ${titleOf(l.documentId)} ${l.detail ?? ''}`.toLowerCase().includes(needle))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessLog, documents, action, text]);

  return (
    <section className="panel overflow-hidden" aria-label="Access log">
      <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center">
        <input aria-label="Filter access log" value={text} onChange={(e) => setText(e.target.value)} placeholder="Filter by user or document" className="input h-8 text-[13px] sm:w-72" />
        <SelectField compact hideLabel label="Action" value={action} onChange={setAction} placeholder="All actions" options={Object.keys(actionTone)} className="sm:w-52" />
        <button type="button" className="btn btn-ghost btn-sm sm:ml-auto" onClick={() => toast.success('Access log exported as CSV')}>
          <DownloadIcon className="h-3.5 w-3.5" /> Export log
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="bg-canvas">
            <tr>
              <th className="th">User</th>
              <th className="th">Action</th>
              <th className="th">Document</th>
              <th className="th">Details</th>
              <th className="th">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((l) =>
            <tr key={l.id}>
                <td className="td whitespace-nowrap">
                  <p className="font-medium text-ink">{l.actor}</p>
                  <p className="text-xs text-ink-muted">{l.actorRole}</p>
                </td>
                <td className="td"><Badge tone={actionTone[l.action]}>{l.action}</Badge></td>
                <td className="td max-w-[280px]">
                  <Link to={`/documents/${l.documentId}`} className="text-ink hover:text-brand-700 hover:underline">{titleOf(l.documentId)}</Link>
                </td>
                <td className="td max-w-[320px] text-ink-muted">{l.detail ?? '—'}</td>
                <td className="td whitespace-nowrap text-ink-muted">{formatDateTime(l.at)}</td>
              </tr>
            )}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-ink-muted">No log entries match.</p>}
      </div>
    </section>);

}