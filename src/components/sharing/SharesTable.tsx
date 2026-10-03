import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, ShieldCheckIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useSharingDialogs } from '../../contexts/SharingDialogsContext';
import { RecipientRole, ShareStatus } from '../../types/sharing';
import { formatDate } from '../../utils/format';
import { expiryLabel, recipientRoles, shareStatus } from '../../utils/sharing';
import { SelectField } from '../ui/SelectField';
import { PermissionIndicator } from './PermissionIndicator';
import { ShareStatusBadge } from './SharingStatusBadge';

export function SharesTable() {
  const { shares, documents } = usePortal();
  const { openManageAccess } = useSharingDialogs();
  const [text, setText] = useState('');
  const [role, setRole] = useState<RecipientRole | ''>('');
  const [permission, setPermission] = useState<'' | 'view' | 'download'>('');
  const [status, setStatus] = useState<ShareStatus | ''>('');

  const titleOf = (id: string) => documents.find((d) => d.id === id)?.title ?? 'Unknown document';

  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return [...shares].
    filter((s) => !role || s.recipientRole === role).
    filter((s) => !permission || (permission === 'download' ? s.canDownload : !s.canDownload)).
    filter((s) => !status || shareStatus(s) === status).
    filter((s) => !needle || `${titleOf(s.documentId)} ${s.recipientName} ${s.sharedBy}`.toLowerCase().includes(needle)).
    sort((a, b) => b.sharedAt.localeCompare(a.sharedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shares, documents, text, role, permission, status]);

  return (
    <section className="panel overflow-hidden" aria-label="Shared evidence">
      <div className="flex flex-col gap-2 border-b border-line p-4 md:flex-row">
        <div className="relative md:w-72">
          <label htmlFor="share-filter" className="sr-only">Filter shares</label>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
          <input id="share-filter" value={text} onChange={(e) => setText(e.target.value)} placeholder="Filter by document or recipient" className="input h-8 pl-9 text-[13px]" />
        </div>
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3 md:max-w-xl">
          <SelectField compact hideLabel label="Recipient role" value={role} onChange={(v) => setRole(v as RecipientRole | '')} placeholder="All recipient roles" options={recipientRoles} />
          <SelectField compact hideLabel label="Permission" value={permission} onChange={(v) => setPermission(v as '' | 'view' | 'download')} placeholder="All permissions" options={[{ value: 'view', label: 'View only' }, { value: 'download', label: 'Download allowed' }]} />
          <SelectField compact hideLabel label="Status" value={status} onChange={(v) => setStatus(v as ShareStatus | '')} placeholder="All statuses" options={['Active', 'Expired', 'Revoked']} />
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-canvas">
            <tr>
              <th className="th">Document</th>
              <th className="th">Shared with</th>
              <th className="th">Recipient role</th>
              <th className="th">Permission</th>
              <th className="th">Shared by</th>
              <th className="th">Date shared</th>
              <th className="th">Expiration</th>
              <th className="th">Status</th>
              <th className="th text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => {
              const st = shareStatus(s);
              return (
                <tr key={s.id} className={st === 'Active' ? '' : 'text-ink-muted'}>
                  <td className="td max-w-[300px]">
                    <Link to={`/documents/${s.documentId}`} className="font-medium text-ink hover:text-brand-700 hover:underline">{titleOf(s.documentId)}</Link>
                  </td>
                  <td className="td whitespace-nowrap">{s.recipientName}{s.recipientType === 'role' && <span className="ml-1 text-xs text-ink-subtle">(group)</span>}</td>
                  <td className="td whitespace-nowrap text-ink-muted">{s.recipientRole}</td>
                  <td className="td"><PermissionIndicator canDownload={s.canDownload} /></td>
                  <td className="td whitespace-nowrap text-ink-muted">{s.sharedBy}</td>
                  <td className="td whitespace-nowrap text-ink-muted">{formatDate(s.sharedAt)}</td>
                  <td className={`td whitespace-nowrap ${st === 'Expired' ? 'text-warning-700' : 'text-ink-muted'}`}>{expiryLabel(s.expiresAt)}</td>
                  <td className="td"><ShareStatusBadge status={st} /></td>
                  <td className="td text-right">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openManageAccess(s.documentId)}>
                      <ShieldCheckIcon className="h-3.5 w-3.5" /> Manage access
                    </button>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line lg:hidden">
        {rows.map((s) =>
        <li key={s.id} className="space-y-1.5 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/documents/${s.documentId}`} className="text-[13px] font-medium text-ink hover:text-brand-700">{titleOf(s.documentId)}</Link>
              <ShareStatusBadge status={shareStatus(s)} />
            </div>
            <p className="text-xs text-ink-muted">{s.recipientName} · {s.recipientRole} · by {s.sharedBy} · {formatDate(s.sharedAt)}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PermissionIndicator canDownload={s.canDownload} />
              <span className="text-xs text-ink-muted">Expires: {expiryLabel(s.expiresAt)}</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openManageAccess(s.documentId)}>Manage access</button>
          </li>
        )}
      </ul>
      {rows.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-ink-muted">No shares match these filters.</p>}
    </section>);

}