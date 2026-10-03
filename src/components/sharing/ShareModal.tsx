import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon, ShieldAlertIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { RecipientRole, ShareRecipientInput } from '../../types/sharing';
import { PortalUser } from '../../types/user';
import { initials } from '../../utils/format';
import { isRecipientRole, recipientRoles, roleGroupName, shareStatus, TODAY } from '../../utils/sharing';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

type Mode = 'users' | 'role';
interface Draft extends ShareRecipientInput {
  office: string;
}

export function ShareModal({ docId, onClose }: {docId: string | null;onClose: () => void;}) {
  const { documents, users, shares, shareDocument } = usePortal();
  const lookup = useLookup();
  const doc = documents.find((d) => d.id === docId);
  const [mode, setMode] = useState<Mode>('users');
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [role, setRole] = useState<RecipientRole>('Faculty');
  const [roleDownload, setRoleDownload] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!docId) return;
    setMode('users');
    setQuery('');
    setDrafts([]);
    setRole('Faculty');
    setRoleDownload(false);
    setExpiresAt('');
    setError('');
  }, [docId]);

  const activeRecipientIds = shares.filter((s) => s.documentId === docId && shareStatus(s) === 'Active').map((s) => s.recipientId);

  const candidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return users.
    filter(
      (u) =>
      isRecipientRole(u.role) &&
      u.status !== 'Deactivated' &&
      !drafts.some((d) => d.recipientId === u.id) &&
      `${u.name} ${u.email} ${u.office} ${u.role}`.toLowerCase().includes(needle)
    ).
    slice(0, 6);
  }, [query, users, drafts]);

  const add = (u: PortalUser) => {
    if (!isRecipientRole(u.role)) return;
    setDrafts((d) => [
    ...d,
    { recipientType: 'user', recipientId: u.id, recipientName: u.name, recipientRole: u.role as RecipientRole, office: u.office, canView: true, canDownload: false }]
    );
    setQuery('');
    setError('');
  };

  const update = (id: string, patch: Partial<Draft>) => setDrafts((d) => d.map((x) => x.recipientId === id ? { ...x, ...patch } : x));

  const submit = () => {
    if (!doc) return;
    let recipients: ShareRecipientInput[];
    if (mode === 'users') {
      if (!drafts.length) return setError('Select at least one person to share with.');
      if (drafts.some((d) => !d.canView)) return setError('Every recipient needs View permission. Download cannot be granted without View.');
      recipients = drafts.map(({ office: _office, ...r }) => r);
    } else {
      recipients = [{ recipientType: 'role', recipientId: `role-${role}`, recipientName: roleGroupName(role), recipientRole: role, canView: true, canDownload: roleDownload }];
    }
    if (expiresAt && expiresAt < TODAY) return setError('The expiration date must be today or later.');
    shareDocument(doc.id, recipients, expiresAt || null);
    toast.success(`Shared with ${recipients.length === 1 ? recipients[0].recipientName : `${recipients.length} people`}`, { description: doc.title });
    onClose();
  };

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      size="lg"
      title="Share Evidence"
      description="Recipients only get the permissions you grant here. Everything else stays private."
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit}>Share Evidence</button>
        </>
      }>
      
      {doc &&
      <div className="space-y-5">
          <div>
            <p className="label">Document</p>
            <p className="text-sm font-semibold text-ink">{doc.title}</p>
            <p className="text-xs text-ink-muted">
              {lookup.framework(doc.frameworkId)?.name} · {lookup.criterion(doc.criterionId)?.code} · {doc.docType}
            </p>
            {doc.confidentiality === 'Confidential' &&
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning-700">
                <ShieldAlertIcon className="h-3.5 w-3.5" aria-hidden="true" /> Marked Confidential — contains personnel information. Prefer View only.
              </p>
          }
          </div>

          <div role="radiogroup" aria-label="Share with" className="inline-flex rounded-md border border-line-strong p-0.5">
            {(['users', 'role'] as Mode[]).map((m) =>
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => {setMode(m);setError('');}}
            className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${mode === m ? 'bg-brand-700 text-white' : 'text-ink-muted hover:text-ink'}`}>
            
                {m === 'users' ? 'Specific users' : 'User role'}
              </button>
          )}
          </div>

          {mode === 'users' ?
        <div>
              <label htmlFor="share-search" className="label">Share with</label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
                <input
              id="share-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, faculty, staff, accreditors"
              autoComplete="off"
              className="input pl-9" />
            
              </div>
              {query.trim() &&
          <ul className="mt-1 max-h-56 overflow-y-auto rounded-md border border-line bg-white py-1 shadow-sm">
                  {candidates.map((u) =>
            <li key={u.id}>
                      <button type="button" onClick={() => add(u)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-canvas">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700" aria-hidden="true">{initials(u.name)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-ink">{u.name}</span>
                          <span className="block truncate text-xs text-ink-muted">{u.role} · {u.office}</span>
                        </span>
                        {activeRecipientIds.includes(u.id) && <span className="shrink-0 text-xs text-ink-muted">Has access · will update</span>}
                      </button>
                    </li>
            )}
                  {candidates.length === 0 && <li className="px-3 py-2 text-[13px] text-ink-muted">No faculty, staff, or accreditors match.</li>}
                </ul>
          }

              <p className="label mt-5">Selected users</p>
              {drafts.length === 0 ?
          <p className="rounded-md border border-dashed border-line-strong px-3 py-4 text-center text-[13px] text-ink-muted">No one selected yet.</p> :

          <ul className="divide-y divide-line rounded-md border border-line">
                  {drafts.map((d) =>
            <li key={d.recipientId} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700" aria-hidden="true">{initials(d.recipientName)}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">{d.recipientName}</span>
                          <span className="block truncate text-xs text-ink-muted">{d.office}</span>
                        </span>
                        <Badge>{d.recipientRole}</Badge>
                      </div>
                      <div className="flex items-center gap-4 pl-10 sm:pl-0">
                        <label className="flex items-center gap-1.5 text-[13px] text-ink">
                          <input
                    type="checkbox"
                    checked={d.canView}
                    onChange={(e) => update(d.recipientId, { canView: e.target.checked, canDownload: e.target.checked ? d.canDownload : false })}
                    className="h-4 w-4 accent-brand-600" />
                  
                          View
                        </label>
                        <label className={`flex items-center gap-1.5 text-[13px] ${d.canView ? 'text-ink' : 'text-ink-subtle'}`} title={d.canView ? undefined : 'Download requires View permission'}>
                          <input
                    type="checkbox"
                    checked={d.canDownload}
                    disabled={!d.canView}
                    onChange={(e) => update(d.recipientId, { canDownload: e.target.checked })}
                    className="h-4 w-4 accent-brand-600" />
                  
                          Download
                        </label>
                        <button type="button" onClick={() => setDrafts((x) => x.filter((r) => r.recipientId !== d.recipientId))} className="btn btn-ghost btn-icon h-7 w-7" aria-label={`Remove ${d.recipientName}`}>
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
            )}
                </ul>
          }
            </div> :

        <div className="space-y-4">
              <fieldset>
                <legend className="label">Role</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {recipientRoles.map((r) =>
              <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-[13px] transition-colors duration-150 ${role === r ? 'border-brand-500 bg-brand-50 font-medium text-brand-700' : 'border-line text-ink hover:bg-canvas'}`}>
                      <input type="radio" name="share-role" checked={role === r} onChange={() => setRole(r)} className="accent-brand-600" />
                      {roleGroupName(r)}
                    </label>
              )}
                </div>
                <p className="mt-2 text-xs text-ink-muted">Everyone with this role gets access, including users added later.</p>
              </fieldset>
              <fieldset>
                <legend className="label">Permission</legend>
                <div className="flex flex-wrap gap-4 text-[13px] text-ink">
                  <label className="flex items-center gap-2"><input type="radio" name="role-perm" checked={!roleDownload} onChange={() => setRoleDownload(false)} className="accent-brand-600" /> View</label>
                  <label className="flex items-center gap-2"><input type="radio" name="role-perm" checked={roleDownload} onChange={() => setRoleDownload(true)} className="accent-brand-600" /> View + Download</label>
                </div>
              </fieldset>
            </div>
        }

          <div className="border-t border-line pt-5">
            <label htmlFor="share-expiry" className="label">Expiration <span className="font-normal text-ink-muted">(optional)</span></label>
            <input id="share-expiry" type="date" min={TODAY} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input sm:w-56" />
            <p className="mt-1 text-xs text-ink-subtle">Access is revoked automatically after this date.</p>
          </div>

          {error &&
        <div role="alert" className="flex gap-2.5 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-700">
              <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
        }
        </div>
      }
    </Modal>);

}