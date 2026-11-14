import React, { useCallback, useState } from 'react';
import { AlertTriangleIcon, ArchiveIcon, CheckCircle2Icon, ChevronDownIcon, ClockIcon, DownloadIcon, ListChecksIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useAccess } from '../../hooks/useAccess';
import { useDismiss } from '../../hooks/useDismiss';
import { usePortalSettings } from '../../settings/portalSettings';
import { ApprovalStatus, EvidenceDocument } from '../../types/evidence';
import { downloadStoredFile } from '../../utils/fileStore';
import { Modal } from '../ui/Modal';

interface DocumentBulkActionsProps {
  selected: EvidenceDocument[];
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
}

const statusOptions: { status: ApprovalStatus; icon: typeof ClockIcon; tone: string }[] = [
  { status: 'Approved', icon: CheckCircle2Icon, tone: 'text-emerald-600' },
  { status: 'Pending Review', icon: ClockIcon, tone: 'text-brand-600' },
  { status: 'Needs Revision', icon: AlertTriangleIcon, tone: 'text-orange-600' }
];

const plural = (n: number) => `${n} document${n === 1 ? '' : 's'}`;

export function DocumentBulkActions({ selected, totalCount, onSelectAll, onClear }: DocumentBulkActionsProps) {
  const { currentUser, isAdmin, updateDocument, logAccess } = usePortal();
  const { rightsFor } = useAccess();
  const { approverRoles, requireRevisionNote } = usePortalSettings().workflow;
  const canReview = approverRoles.includes(currentUser.role);

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const closeStatusMenu = useCallback(() => setStatusMenuOpen(false), []);
  const statusMenuRef = useDismiss<HTMLDivElement>(statusMenuOpen, closeStatusMenu);
  const [pendingStatus, setPendingStatus] = useState<ApprovalStatus | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const count = selected.length;
  const downloadable = selected.filter((d) => rightsFor(d.id).canDownload);
  const statusTargets = pendingStatus ? selected.filter((d) => (d.approvalStatus ?? 'Pending Review') !== pendingStatus) : [];
  const notesMissing = pendingStatus === 'Needs Revision' && requireRevisionNote && !revisionNotes.trim();

  const handleDownload = async () => {
    setDownloading(true);
    let saved = 0;
    for (const doc of downloadable) {
      logAccess('Downloaded', doc.id);
      if (await downloadStoredFile(doc.id, doc.title)) saved += 1;
    }
    setDownloading(false);
    const notes = [
      downloadable.length - saved > 0 ? `${plural(downloadable.length - saved)} had no original file stored` : '',
      count - downloadable.length > 0 ? `${plural(count - downloadable.length)} skipped (no download permission)` : ''
    ].filter(Boolean);
    const message = saved ? `Downloading ${plural(saved)}` : 'No original files were available to download';
    (saved ? toast.success : toast)(message, notes.length ? { description: notes.join(' · ') } : undefined);
  };

  const openStatusDialog = (status: ApprovalStatus) => {
    setStatusMenuOpen(false);
    setRevisionNotes('');
    setPendingStatus(status);
  };

  const applyStatus = () => {
    if (!pendingStatus || notesMissing) return;
    const reviewedAt = new Date().toISOString();
    const previous = statusTargets.map((d) => ({
      id: d.id,
      patch: { approvalStatus: d.approvalStatus, revisionNotes: d.revisionNotes, reviewedBy: d.reviewedBy, reviewedAt: d.reviewedAt }
    }));
    statusTargets.forEach((d) =>
      updateDocument(
        d.id,
        pendingStatus === 'Pending Review'
          ? { approvalStatus: pendingStatus, revisionNotes: undefined }
          : {
              approvalStatus: pendingStatus,
              revisionNotes: pendingStatus === 'Needs Revision' ? revisionNotes.trim() || undefined : undefined,
              reviewedBy: currentUser.name,
              reviewedAt
            }
      )
    );
    toast.success(`${plural(statusTargets.length)} set to ${pendingStatus}`, {
      action: { label: 'Undo', onClick: () => previous.forEach((p) => updateDocument(p.id, p.patch)) }
    });
    setPendingStatus(null);
    onClear();
  };

  const applyArchive = () => {
    const previous = selected.map((d) => ({ id: d.id, status: d.status }));
    previous.forEach((p) => updateDocument(p.id, { status: 'Archived' }));
    toast(`Moved ${plural(previous.length)} to Archived Documents`, {
      action: { label: 'Undo', onClick: () => previous.forEach((p) => updateDocument(p.id, { status: p.status })) }
    });
    setConfirmArchive(false);
    onClear();
  };

  return (
    <>
      <div
        role="region"
        aria-label="Bulk actions"
        className="flex flex-col gap-2 border-b border-brand-100 bg-brand-50/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <span className="font-semibold text-brand-800" aria-live="polite">
            {count} selected
          </span>
          {count < totalCount && (
            <button type="button" onClick={onSelectAll} className="font-medium text-brand-700 hover:underline">
              Select all {totalCount}
            </button>
          )}
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1 font-medium text-ink-muted hover:text-ink">
            <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Clear selection
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm gap-1.5 bg-white"
            onClick={handleDownload}
            disabled={downloading || downloadable.length === 0}
            title={downloadable.length === 0 ? 'You do not have download permission for the selected documents' : undefined}
          >
            <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {downloading ? 'Downloading…' : 'Download'}
          </button>

          {canReview && (
            <div ref={statusMenuRef} className="relative">
              <button
                type="button"
                className="btn btn-secondary btn-sm gap-1.5 bg-white"
                aria-haspopup="menu"
                aria-expanded={statusMenuOpen}
                onClick={() => setStatusMenuOpen((o) => !o)}
              >
                <ListChecksIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Change status
                <ChevronDownIcon className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
              </button>
              {statusMenuOpen && (
                <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-48 rounded-md border border-line bg-white py-1 shadow-lg">
                  {statusOptions.map(({ status, icon: Icon, tone }) => (
                    <button
                      key={status}
                      type="button"
                      role="menuitem"
                      onClick={() => openStatusDialog(status)}
                      className="flex h-9 w-full items-center gap-2.5 px-3 text-left text-[13px] text-ink hover:bg-canvas"
                    >
                      <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <button
              type="button"
              className="btn btn-secondary btn-sm gap-1.5 bg-white text-danger-700 hover:border-danger-200 hover:bg-danger-50"
              onClick={() => setConfirmArchive(true)}
            >
              <ArchiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Archive
            </button>
          )}
        </div>
      </div>

      <Modal
        open={!!pendingStatus}
        onClose={() => setPendingStatus(null)}
        title="Change review status"
        description={pendingStatus ? `Set the accreditation review status of the selected documents to ${pendingStatus}.` : undefined}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPendingStatus(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={applyStatus} disabled={statusTargets.length === 0 || notesMissing}>
              Update {plural(statusTargets.length)}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-ink-muted">
          <p>
            <strong className="text-ink">{plural(statusTargets.length)}</strong> will be set to{' '}
            <strong className="text-ink">{pendingStatus}</strong>.
            {count - statusTargets.length > 0 && ` ${plural(count - statusTargets.length)} already ${count - statusTargets.length === 1 ? 'has' : 'have'} this status and will not change.`}
          </p>
          {pendingStatus === 'Needs Revision' && statusTargets.length > 0 && (
            <div>
              <label htmlFor="bulk-revision-notes" className="label">
                Revision notes{requireRevisionNote ? '' : ' (optional)'}
              </label>
              <textarea
                id="bulk-revision-notes"
                className="input min-h-[96px] w-full py-2 text-sm"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Describe what needs to be revised. These notes are added to every selected document."
              />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={`Archive ${plural(count)}?`}
        description="Archived documents move to Archived Documents and are excluded from search results."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmArchive(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={applyArchive}>
              <ArchiveIcon className="h-4 w-4" aria-hidden="true" />
              Archive {plural(count)}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">You can restore them at any time from Archived Documents.</p>
      </Modal>
    </>
  );
}
