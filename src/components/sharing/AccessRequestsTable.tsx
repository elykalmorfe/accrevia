import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SearchIcon,
  ThumbsDownIcon,
  ThumbsUpIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { AccessRequest, AccessRequestStatus } from '../../types/sharing';
import { formatDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export function AccessRequestsTable() {
  const { accessRequests, reviewAccessRequest } = usePortal();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AccessRequestStatus>('All');
  
  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    request: AccessRequest | null;
    decision: 'Approved' | 'Rejected';
    notes: string;
    expiresAt: string;
  }>({
    open: false,
    request: null,
    decision: 'Approved',
    notes: '',
    expiresAt: ''
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accessRequests
      .filter((r) => statusFilter === 'All' || r.status === statusFilter)
      .filter(
        (r) =>
          !q ||
          r.documentTitle.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q) ||
          (r.requesterOffice && r.requesterOffice.toLowerCase().includes(q)) ||
          r.reason.toLowerCase().includes(q)
      )
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }, [accessRequests, statusFilter, search]);

  const openReview = (request: AccessRequest, decision: 'Approved' | 'Rejected') => {
    setReviewModal({
      open: true,
      request,
      decision,
      notes: decision === 'Approved' ? 'Approved by Quality Assurance Office' : 'Access not authorized for requested scope',
      expiresAt: '2026-12-31'
    });
  };

  const handleConfirmReview = () => {
    if (!reviewModal.request) return;
    reviewAccessRequest(
      reviewModal.request.id,
      reviewModal.decision,
      reviewModal.notes,
      reviewModal.decision === 'Approved' ? reviewModal.expiresAt || null : null
    );
    toast.success(
      `Access request ${reviewModal.decision.toLowerCase()} for ${reviewModal.request.requesterName}`,
      {
        description: reviewModal.decision === 'Approved'
          ? `Granted ${reviewModal.request.requestedPermission} permission. Active share created.`
          : 'Request marked as rejected in the audit log.'
      }
    );
    setReviewModal((prev) => ({ ...prev, open: false, request: null }));
  };

  return (
    <section className="panel overflow-hidden" aria-label="Access Requests">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <label htmlFor="req-search" className="sr-only">
            Search access requests
          </label>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            id="req-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by requester, document, or reason"
            className="input h-8 pl-9 text-[13px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Filter status:</span>
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-canvas text-ink-muted hover:bg-line hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-xs text-ink-muted">
          No document access requests match your criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-canvas border-b border-line text-ink-muted">
              <tr>
                <th className="th py-3">Document Title</th>
                <th className="th py-3">Requester</th>
                <th className="th py-3">Requested Permission</th>
                <th className="th py-3">Reason / Justification</th>
                <th className="th py-3">Status</th>
                <th className="th py-3">Date Requested</th>
                <th className="th py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => {
                const isPending = r.status === 'Pending';
                return (
                  <tr key={r.id} className="hover:bg-canvas/60 transition-colors">
                    <td className="td py-3.5 max-w-[260px]">
                      <Link
                        to={`/documents/${r.documentId}`}
                        className="font-semibold text-ink hover:text-brand-700 block truncate"
                        title={r.documentTitle}
                      >
                        {r.documentTitle}
                      </Link>
                    </td>

                    <td className="td py-3.5">
                      <p className="font-semibold text-ink">{r.requesterName}</p>
                      <p className="text-[11px] text-ink-muted">
                        {r.requesterRole} {r.requesterOffice ? `· ${r.requesterOffice}` : ''}
                      </p>
                    </td>

                    <td className="td py-3.5">
                      <Badge tone={r.requestedPermission === 'View and Download' ? 'success' : 'brand'}>
                        {r.requestedPermission}
                      </Badge>
                    </td>

                    <td className="td py-3.5 max-w-[240px]">
                      <p className="line-clamp-2 text-ink-muted leading-relaxed" title={r.reason}>
                        {r.reason}
                      </p>
                      {r.reviewNotes && (
                        <p className="mt-1 text-[11px] text-ink-subtle italic">
                          Notes: {r.reviewNotes}
                        </p>
                      )}
                    </td>

                    <td className="td py-3.5">
                      <Badge
                        tone={
                          r.status === 'Approved'
                            ? 'success'
                            : r.status === 'Pending'
                            ? 'warning'
                            : 'neutral'
                        }
                        dot
                      >
                        {r.status}
                      </Badge>
                    </td>

                    <td className="td py-3.5 text-ink-muted whitespace-nowrap">
                      {formatDate(r.requestedAt)}
                    </td>

                    <td className="td py-3.5 text-right whitespace-nowrap">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openReview(r, 'Approved')}
                            className="btn btn-primary btn-sm text-[11px] h-7 px-2.5 gap-1 bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
                            title="Approve request and grant access immediately"
                          >
                            <ThumbsUpIcon className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openReview(r, 'Rejected')}
                            className="btn btn-secondary btn-sm text-[11px] h-7 px-2 gap-1 text-danger-700 hover:bg-danger-50"
                            title="Reject request"
                          >
                            <ThumbsDownIcon className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink-subtle">
                          {r.reviewedBy ? `Reviewed by ${r.reviewedBy}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && reviewModal.request && (
        <Modal
          open={reviewModal.open}
          onClose={() => setReviewModal((prev) => ({ ...prev, open: false }))}
          title={reviewModal.decision === 'Approved' ? 'Approve Access Request' : 'Reject Access Request'}
          description={`Decision for ${reviewModal.request.requesterName} on "${reviewModal.request.documentTitle}".`}
          size="md"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <button
                type="button"
                onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className={`btn ${
                  reviewModal.decision === 'Approved'
                    ? 'btn-primary bg-emerald-700 hover:bg-emerald-800'
                    : 'btn-secondary text-danger-700 hover:bg-danger-50'
                }`}
              >
                {reviewModal.decision === 'Approved' ? 'Confirm Approval & Grant Access' : 'Confirm Rejection'}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-md border border-line bg-canvas p-3">
              <p className="font-semibold text-ink">{reviewModal.request.documentTitle}</p>
              <p className="text-ink-muted mt-1">
                Requester: <strong className="text-ink">{reviewModal.request.requesterName}</strong> ({reviewModal.request.requesterRole})
              </p>
              <p className="text-ink-muted mt-0.5">
                Requested Level: <strong className="text-ink">{reviewModal.request.requestedPermission}</strong>
              </p>
              <p className="mt-1 text-ink italic">"{reviewModal.request.reason}"</p>
            </div>

            {reviewModal.decision === 'Approved' && (
              <div>
                <label className="label">Access Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={reviewModal.expiresAt}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  className="input text-[13px]"
                />
                <p className="mt-1 text-[11px] text-ink-muted">
                  Leave blank for indefinite access. Default is set to the current accreditation cycle end date.
                </p>
              </div>
            )}

            <div>
              <label className="label">Review Remarks / Notes</label>
              <textarea
                value={reviewModal.notes}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="textarea text-[13px]"
                placeholder="Optional notes logged into the university audit trail..."
              />
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
