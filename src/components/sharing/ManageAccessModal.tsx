import React, { useEffect, useState } from 'react';
import { BanIcon, CalendarPlusIcon, DownloadIcon, EyeIcon, LockIcon, Trash2Icon, UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { DocumentShare } from '../../types/sharing';
import { expiryLabel, shareStatus, TODAY } from '../../utils/sharing';
import { Modal } from '../ui/Modal';
import { RowActionsMenu, RowAction } from '../ui/RowActionsMenu';
import { ShareStatusBadge } from './SharingStatusBadge';

interface ManageAccessModalProps {
  docId: string | null;
  onClose: () => void;
  onShareMore: (docId: string) => void;
}

const rank = { Active: 0, Expired: 1, Revoked: 2 };

export function ManageAccessModal({ docId, onClose, onShareMore }: ManageAccessModalProps) {
  const { documents, shares, updateSharePermission, extendShare, revokeShare, removeShare } = usePortal();
  const doc = documents.find((d) => d.id === docId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');

  useEffect(() => setEditingId(null), [docId]);

  const list = shares.
  filter((s) => s.documentId === docId).
  sort((a, b) => rank[shareStatus(a)] - rank[shareStatus(b)] || b.sharedAt.localeCompare(a.sharedAt));
  const active = list.filter((s) => shareStatus(s) === 'Active');

  const startExtend = (s: DocumentShare) => {
    setEditingId(s.id);
    setNewDate(s.expiresAt && s.expiresAt >= TODAY ? s.expiresAt : '');
  };

  const saveExtend = (s: DocumentShare, value: string | null) => {
    if (value !== null && (!value || value < TODAY)) {
      toast.error('Choose a date from today onward.');
      return;
    }
    extendShare(s.id, value);
    setEditingId(null);
    toast.success(`Access for ${s.recipientName} ${value ? 'extended' : 'set to never expire'}`);
  };

  const togglePermission = (s: DocumentShare, canDownload: boolean) => {
    updateSharePermission(s.id, canDownload);
    toast(`${s.recipientName}: ${canDownload ? 'View + Download' : 'View only'}`);
  };

  const actionsFor = (s: DocumentShare): RowAction[] => {
    const status = shareStatus(s);
    if (status === 'Active') {
      return [
      s.canDownload ?
      { label: 'Change to view only', icon: EyeIcon, onSelect: () => togglePermission(s, false) } :
      { label: 'Allow download', icon: DownloadIcon, onSelect: () => togglePermission(s, true) },
      { label: 'Extend access', icon: CalendarPlusIcon, onSelect: () => startExtend(s) },
      { label: 'Revoke access', icon: BanIcon, tone: 'danger', onSelect: () => {revokeShare(s.id);toast(`Access revoked for ${s.recipientName}`);} }];

    }
    return [
    ...(status === 'Expired' ? [{ label: 'Extend access', icon: CalendarPlusIcon, onSelect: () => startExtend(s) }] : []),
    { label: 'Remove from list', icon: Trash2Icon, tone: 'danger' as const, onSelect: () => removeShare(s.id) }];

  };

  const expiryCell = (s: DocumentShare) =>
  editingId === s.id ?
  <div className="flex flex-wrap items-center gap-1.5">
        <label htmlFor={`exp-${s.id}`} className="sr-only">New expiration date for {s.recipientName}</label>
        <input id={`exp-${s.id}`} type="date" min={TODAY} value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input h-8 w-40 text-[13px]" />
        <button type="button" className="btn btn-primary btn-sm" onClick={() => saveExtend(s, newDate)}>Save</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveExtend(s, null)}>No expiry</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
      </div> :

  <span className={shareStatus(s) === 'Expired' ? 'text-warning-700' : 'text-ink-muted'}>{expiryLabel(s.expiresAt)}</span>;


  const downloadCell = (s: DocumentShare) =>
  shareStatus(s) === 'Active' ?
  <label className="inline-flex items-center gap-1.5">
        <input type="checkbox" checked={s.canDownload} onChange={(e) => togglePermission(s, e.target.checked)} className="h-4 w-4 accent-brand-600" aria-label={`Allow download for ${s.recipientName}`} />
        <span className="text-[13px] md:sr-only">Download</span>
      </label> :

  <span className="text-ink-subtle">{s.canDownload ? '✓' : '—'}</span>;


  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      size="xl"
      title="Manage Access"
      description={doc ? `Document: ${doc.title}` : ''}
      footer={
      doc &&
      <>
            <button type="button" className="btn btn-secondary mr-auto" onClick={() => onShareMore(doc.id)}>
              <UserPlusIcon className="h-4 w-4" /> Share with more people
            </button>
            {active.length > 0 &&
        <button
          type="button"
          className="btn btn-ghost text-danger-700 hover:bg-danger-50 hover:text-danger-700"
          onClick={() => {active.forEach((s) => revokeShare(s.id));toast(`All access revoked for ${doc.title}`);}}>
          
                Revoke all
              </button>
        }
            <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
          </>

      }>
      
      {list.length === 0 ?
      <div className="py-10 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-canvas text-ink-muted"><LockIcon className="h-4 w-4" aria-hidden="true" /></span>
          <p className="mt-3 text-sm font-semibold text-ink">This document is private</p>
          <p className="mt-1 text-[13px] text-ink-muted">Only administrators and QA personnel can open it.</p>
        </div> :

      <>
          <p className="mb-3 text-[13px] text-ink-muted">
            <span className="font-medium text-ink">{active.length} active</span> · {list.length - active.length} expired or revoked. Changes apply immediately.
          </p>
          <div className="hidden overflow-x-auto rounded-md border border-line md:block">
            <table className="w-full min-w-[760px]">
              <thead className="bg-canvas">
                <tr>
                  <th className="th">Recipient</th>
                  <th className="th">Role</th>
                  <th className="th text-center">View</th>
                  <th className="th text-center">Download</th>
                  <th className="th">Expires</th>
                  <th className="th">Status</th>
                  <th className="th text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((s) =>
              <tr key={s.id} className={shareStatus(s) === 'Active' ? '' : 'bg-canvas/40'}>
                    <td className="td">
                      <p className="font-medium text-ink">{s.recipientName}</p>
                      <p className="text-xs text-ink-muted">{s.recipientType === 'role' ? 'Role group' : `Shared by ${s.sharedBy}`}</p>
                    </td>
                    <td className="td whitespace-nowrap text-ink-muted">{s.recipientRole}</td>
                    <td className="td text-center text-success-700">✓</td>
                    <td className="td text-center">{downloadCell(s)}</td>
                    <td className="td">{expiryCell(s)}</td>
                    <td className="td"><ShareStatusBadge status={shareStatus(s)} /></td>
                    <td className="td text-right"><RowActionsMenu label={`Access actions for ${s.recipientName}`} actions={actionsFor(s)} /></td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line rounded-md border border-line md:hidden">
            {list.map((s) =>
          <li key={s.id} className="space-y-2 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{s.recipientName}</p>
                    <p className="text-xs text-ink-muted">{s.recipientRole}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShareStatusBadge status={shareStatus(s)} />
                    <RowActionsMenu label={`Access actions for ${s.recipientName}`} actions={actionsFor(s)} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[13px]">
                  <span className="text-success-700">✓ View</span>
                  {downloadCell(s)}
                </div>
                <div className="text-xs">Expires: {expiryCell(s)}</div>
              </li>
          )}
          </ul>
        </>
      }
    </Modal>);

}