import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { AccessRequestStatusBadge } from '../open/accessRequests/AccessRequestStatusBadge';
import { accessRequestService } from '../../services/accessRequests/accessRequestService';
import type { TechnicalReviewAccessRequest } from '../../types/technicalReviewAccess';

type TechnicalReviewReviewModalProps = {
  request: TechnicalReviewAccessRequest | null;
  onClose: () => void;
  onUpdated?: (request: TechnicalReviewAccessRequest) => void;
  reviewerName?: string;
};

type Mode = 'review' | 'approve' | 'deny' | 'revoke';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-ink break-words">{value || '—'}</dd>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

const inputClass =
  'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';
const textareaClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

export function TechnicalReviewReviewModal({
  request,
  onClose,
  onUpdated,
  reviewerName
}: TechnicalReviewReviewModalProps) {
  const [mode, setMode] = useState<Mode>('review');
  const [expiresAt, setExpiresAt] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMode('review');
    setExpiresAt('');
    setRemarks('');
    setReason('');
    setError(null);
    setSuccess(null);
    setWorking(false);
  }, [request?.id]);

  const run = async (action: () => Promise<TechnicalReviewAccessRequest>, message: string) => {
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await action();
      setSuccess(message);
      onUpdated?.(updated);
      setMode('review');
      setReason('');
      setRemarks('');
      setExpiresAt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this demo request.');
    } finally {
      setWorking(false);
    }
  };

  const onApprove = async (e: FormEvent) => {
    e.preventDefault();
    await run(
      () =>
        accessRequestService.approveRequest(request!.id, {
          expiresAt,
          remarks,
          reviewerName
        }),
      'Demo request approved (simulated). Restricted documents remain locked.'
    );
  };

  const onDeny = async (e: FormEvent) => {
    e.preventDefault();
    await run(
      () =>
        accessRequestService.denyRequest(request!.id, {
          reason,
          reviewerName
        }),
      'Demo request denied (simulated).'
    );
  };

  const onRevoke = async (e: FormEvent) => {
    e.preventDefault();
    await run(
      () =>
        accessRequestService.revokeRequest(request!.id, {
          reason,
          reviewerName
        }),
      'Demo approval revoked (simulated). No Drive permissions were changed.'
    );
  };

  const current = request;

  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title={current ? `Review · ${current.demoRequestId}` : 'Review request'}
      description="QA demo review — decisions are simulated only"
      size="lg"
      footer={
        current && mode === 'review' ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={working}>
              Close
            </button>
            {current.status === 'Pending' ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost text-rose-700"
                  disabled={working}
                  onClick={() => {
                    setMode('deny');
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Deny
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={working}
                  onClick={() => {
                    setMode('approve');
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Approve
                </button>
              </>
            ) : null}
            {current.status === 'Approved' ? (
              <button
                type="button"
                className="btn btn-ghost text-rose-700"
                disabled={working}
                onClick={() => {
                  setMode('revoke');
                  setError(null);
                  setSuccess(null);
                }}
              >
                Revoke approval
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      {current ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-950">
            <strong>DEMO MODE:</strong> Approving does not grant real document access, open restricted Drive folders, or
            expose Technical Review filenames.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <AccessRequestStatusBadge status={current.status} />
            <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
              Demo only
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Request ID" value={current.demoRequestId} />
            <Field label="Requester" value={current.requesterName || current.requesterEmail} />
            <Field label="Campus" value={current.campusName} />
            <Field label="Submitted" value={formatDate(current.submittedAt)} />
            <div className="sm:col-span-2">
              <Field label="College / Academic Program" value={current.collegeProgram} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Purpose of access" value={current.purpose} />
            </div>
            {current.remarks ? (
              <div className="sm:col-span-2">
                <Field label="Supporting remarks" value={current.remarks} />
              </div>
            ) : null}
            {current.expiresAt ? <Field label="Expires (demo)" value={current.expiresAt} /> : null}
            {current.qaRemarks ? (
              <div className="sm:col-span-2">
                <Field label="Latest QA remarks" value={current.qaRemarks} />
              </div>
            ) : null}
          </dl>

          {current.reviewHistory && current.reviewHistory.length > 0 ? (
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">Review history</h3>
              <ul className="mt-2 space-y-2">
                {current.reviewHistory.map((entry, index) => (
                  <li
                    key={`${entry.at}-${entry.action}-${index}`}
                    className="rounded-xl border border-line-subtle bg-canvas px-3 py-2 text-[12px]"
                  >
                    <p className="font-semibold text-ink">
                      {entry.action}
                      {entry.by ? ` · ${entry.by}` : ''}
                    </p>
                    <p className="text-ink-muted">{formatDate(entry.at)}</p>
                    {entry.note ? <p className="mt-1 text-ink-subtle">{entry.note}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {mode === 'approve' ? (
            <form onSubmit={onApprove} className="space-y-3 rounded-xl border border-line p-4">
              <h3 className="text-[14px] font-bold text-ink">Approve (simulated)</h3>
              <p className="text-[12px] font-medium text-ink-muted">
                Requires a future expiration date. This never unlocks restricted Technical Review content.
              </p>
              <div>
                <label htmlFor="qa-expire" className="mb-1.5 block text-[12px] font-semibold text-ink">
                  Expiration date <span className="text-rose-600">*</span>
                </label>
                <input
                  id="qa-expire"
                  type="date"
                  required
                  className={inputClass}
                  value={expiresAt}
                  disabled={working}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="qa-approve-remarks" className="mb-1.5 block text-[12px] font-semibold text-ink">
                  QA remarks <span className="font-medium text-ink-subtle">(optional)</span>
                </label>
                <textarea
                  id="qa-approve-remarks"
                  rows={2}
                  className={textareaClass}
                  value={remarks}
                  disabled={working}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-secondary" disabled={working} onClick={() => setMode('review')}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={working}>
                  {working ? 'Saving…' : 'Confirm approve'}
                </button>
              </div>
            </form>
          ) : null}

          {mode === 'deny' ? (
            <form onSubmit={onDeny} className="space-y-3 rounded-xl border border-line p-4">
              <h3 className="text-[14px] font-bold text-ink">Deny (simulated)</h3>
              <div>
                <label htmlFor="qa-deny-reason" className="mb-1.5 block text-[12px] font-semibold text-ink">
                  Reason for denial <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="qa-deny-reason"
                  rows={3}
                  required
                  className={textareaClass}
                  value={reason}
                  disabled={working}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-secondary" disabled={working} onClick={() => setMode('review')}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={working || !reason.trim()}>
                  {working ? 'Saving…' : 'Confirm deny'}
                </button>
              </div>
            </form>
          ) : null}

          {mode === 'revoke' ? (
            <form onSubmit={onRevoke} className="space-y-3 rounded-xl border border-line p-4">
              <h3 className="text-[14px] font-bold text-ink">Revoke approval (simulated)</h3>
              <div>
                <label htmlFor="qa-revoke-reason" className="mb-1.5 block text-[12px] font-semibold text-ink">
                  Reason for revocation <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="qa-revoke-reason"
                  rows={3}
                  required
                  className={textareaClass}
                  value={reason}
                  disabled={working}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn btn-secondary" disabled={working} onClick={() => setMode('review')}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={working || !reason.trim()}>
                  {working ? 'Saving…' : 'Confirm revoke'}
                </button>
              </div>
            </form>
          ) : null}

          {error ? (
            <p className="text-[12px] font-medium text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-900"
              role="status"
              aria-live="polite"
            >
              {success}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
