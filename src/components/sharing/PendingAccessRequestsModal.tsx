import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheckIcon,
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  ClockIcon,
  SearchIcon,
  CheckIcon,
  XIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { formatDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface PendingAccessRequestsModalProps {
  open: boolean;
  onClose: () => void;
}

export function PendingAccessRequestsModal({ open, onClose }: PendingAccessRequestsModalProps) {
  const { accessRequests, reviewAccessRequest, documents } = usePortal();

  const [search, setSearch] = useState('');
  const [selectedExpiries, setSelectedExpiries] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const pendingRequests = accessRequests.filter((r) => r.status === 'Pending');

  const filteredRequests = pendingRequests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.requesterName.toLowerCase().includes(q) ||
      r.documentTitle.toLowerCase().includes(q) ||
      r.requesterRole.toLowerCase().includes(q) ||
      (r.requesterOffice && r.requesterOffice.toLowerCase().includes(q)) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  const viewDownloadCount = pendingRequests.filter((r) => r.requestedPermission === 'View and Download').length;
  const viewOnlyCount = pendingRequests.filter((r) => r.requestedPermission === 'View only').length;

  const handleApprove = (id: string, requesterName: string, requestedPermission: string) => {
    const notes = reviewNotes[id] || '';
    const expiresAt = selectedExpiries[id] || '';

    reviewAccessRequest(id, 'Approved', notes.trim() || undefined, expiresAt || undefined);

    toast.success(`Access Approved for ${requesterName}`, {
      description: `Granted "${requestedPermission}" permission. An active document share has been created immediately.`
    });
  };

  const handleReject = (id: string, requesterName: string) => {
    const notes = reviewNotes[id] || '';

    reviewAccessRequest(id, 'Rejected', notes.trim() || 'Request declined by QA personnel.');

    toast.error(`Access Request Rejected`, {
      description: `Declined request for ${requesterName}. Requester will be notified in-app.`
    });
  };

  const getInitials = (name: string) => {
    return name
      .replace(/^Dr\.\s*|^Prof\.\s*|^Engr\.\s*/i, '')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Link
            to="/evidence/shared?tab=requests"
            onClick={onClose}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1"
          >
            Open Complete Access Requests Registry →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="-mt-2 space-y-4">
        {/* ENHANCED HEADER HERO BANNER */}
        <div className="rounded-xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-5 text-white shadow-md relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-xl" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-sm">
                <ShieldCheckIcon className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Pending Document Access Requests
                  </h2>
                  <span className="rounded-full bg-amber-400/90 text-amber-950 font-black px-2 py-0.5 text-[11px] uppercase tracking-wide">
                    {pendingRequests.length} Pending
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/80 max-w-xl leading-relaxed">
                  Authorize faculty and staff permissions for institutional documents, accreditation evidence, and confidential records. Approving a request instantly grants access and enforces rights.
                </p>
              </div>
            </div>

            {/* Quick Summary Counter Badges */}
            <div className="flex sm:flex-col gap-2 shrink-0 text-xs">
              <div className="rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm border border-white/10 flex items-center justify-between gap-3">
                <span className="text-white/70">View & Download:</span>
                <span className="font-extrabold text-emerald-300">{viewDownloadCount}</span>
              </div>
              <div className="rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm border border-white/10 flex items-center justify-between gap-3">
                <span className="text-white/70">View Only:</span>
                <span className="font-extrabold text-sky-300">{viewOnlyCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH FILTER (Shown if multiple requests exist) */}
        {pendingRequests.length > 2 && (
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
            <input
              type="text"
              placeholder="Filter requests by faculty name, office, document, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs"
            />
          </div>
        )}

        {/* REQUESTS LIST CONTAINER */}
        <div className="max-h-[55vh] overflow-y-auto space-y-3.5 pr-1">
          {pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-line bg-canvas/40 py-12 px-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 mb-3 border border-emerald-200">
                <CheckCircle2Icon className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-ink">All Caught Up!</h3>
              <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                There are currently zero pending document access requests awaiting QA personnel review.
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-line bg-canvas/40 py-8 px-6 text-center text-xs text-ink-muted">
              No pending access requests match your search filter "{search}".
            </div>
          ) : (
            filteredRequests.map((req) => {
              const doc = documents.find((d) => d.id === req.documentId);
              const initials = getInitials(req.requesterName);
              const expiryValue = selectedExpiries[req.id] || '';
              const notesValue = reviewNotes[req.id] || '';

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-line bg-white p-4.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* LEFT COLUMN: REQUESTER INFO & DOCUMENT SUMMARY */}
                    <div className="flex-1 min-w-0">
                      {/* Requester Identity Row */}
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-brand-700 to-indigo-600 text-white font-black text-xs shadow-xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-ink text-sm truncate">{req.requesterName}</span>
                            <Badge
                              tone={
                                req.requesterRole === 'Faculty'
                                  ? 'brand'
                                  : req.requesterRole === 'Accreditor'
                                  ? 'gold'
                                  : 'neutral'
                              }
                            >
                              {req.requesterRole}
                            </Badge>
                            <span className="text-[11px] text-ink-subtle flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {formatDate(req.requestedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-0.5">
                            <span>{req.requesterEmail}</span>
                            {req.requesterOffice && (
                              <>
                                <span>·</span>
                                <span>{req.requesterOffice}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Document Details Box */}
                      <div className="mt-3 rounded-lg border border-line bg-canvas/70 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-ink-subtle tracking-wider">
                              Target Document
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Link
                                to={`/documents/${req.documentId}`}
                                onClick={onClose}
                                className="font-bold text-xs text-ink hover:text-brand-700 hover:underline flex items-center gap-1.5"
                                title="Inspect document preview"
                              >
                                <span>{req.documentTitle}</span>
                                <ExternalLinkIcon className="h-3 w-3 text-ink-subtle" />
                              </Link>
                              {doc?.fileType && (
                                <span className="rounded bg-white px-1.5 py-0.2 text-[10px] font-semibold text-ink-muted border border-line">
                                  {doc.fileType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-ink-subtle uppercase">Permission:</span>
                            <Badge
                              tone={req.requestedPermission === 'View and Download' ? 'success' : 'brand'}
                              className="font-bold gap-1"
                            >
                              {req.requestedPermission === 'View and Download' ? (
                                <DownloadIcon className="h-3 w-3" />
                              ) : (
                                <EyeIcon className="h-3 w-3" />
                              )}
                              {req.requestedPermission}
                            </Badge>
                          </div>
                        </div>

                        {/* Stated Justification */}
                        <div className="mt-2.5 rounded border border-amber-200/70 bg-amber-50/50 p-2.5 text-xs text-ink">
                          <span className="font-semibold text-amber-900 block text-[11px]">
                            Stated Justification:
                          </span>
                          <p className="mt-0.5 italic text-ink-muted leading-relaxed">
                            "{req.reason}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: APPROVAL SETTINGS & ACTIONS */}
                    <div className="md:w-64 shrink-0 flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-ink">
                            Access Expiry
                          </label>
                          <select
                            value={expiryValue}
                            onChange={(e) =>
                              setSelectedExpiries((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            className="input h-8 text-[11.5px] py-0 mt-1"
                          >
                            <option value="">Indefinite (No Expiration)</option>
                            <option value="2026-11-15">30 Days (Audit Review)</option>
                            <option value="2027-01-15">90 Days (Accreditation Visit)</option>
                            <option value="2027-07-31">End of Academic Year (AY 2026-2027)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-ink">
                            Reviewer Note (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Authorized for Area II"
                            value={notesValue}
                            onChange={(e) =>
                              setReviewNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            className="input h-8 text-[11.5px] mt-1"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(req.id, req.requesterName, req.requestedPermission)
                          }
                          className="btn btn-primary btn-sm flex-1 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 border-emerald-700 font-semibold"
                        >
                          <CheckIcon className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(req.id, req.requesterName)}
                          className="btn btn-secondary btn-sm flex-1 text-xs gap-1.5 text-danger-700 hover:bg-danger-50 border-line hover:border-danger-300 font-semibold"
                        >
                          <XIcon className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
