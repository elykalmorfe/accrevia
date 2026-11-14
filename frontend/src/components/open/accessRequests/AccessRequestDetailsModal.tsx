import { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { accessRequestService } from '../../../services/accessRequests/accessRequestService';
import type { TechnicalReviewAccessRequest } from '../../../types/technicalReviewAccess';
import { useSessionAccount } from '../../../utils/auth';
import { AccessRequestStatusBadge } from './AccessRequestStatusBadge';

type AccessRequestDetailsModalProps = {
  request: TechnicalReviewAccessRequest | null;
  onClose: () => void;
  onUpdated?: (request: TechnicalReviewAccessRequest) => void;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-ink break-words">{value || '—'}</dd>
    </div>
  );
}

function formatDate(iso: string) {
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

export function AccessRequestDetailsModal({ request, onClose, onUpdated }: AccessRequestDetailsModalProps) {
  const session = useSessionAccount();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel =
    request?.status === 'Pending' &&
    (!request.requesterId ||
      request.requesterId === session?.id ||
      request.requesterId === session?.email ||
      request.id.startsWith('seed-'));

  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title={request ? request.demoRequestId : 'Request details'}
      description="Simulated Technical Review access request"
      size="lg"
      footer={
        request ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={working}>
              Close
            </button>
            {canCancel ? (
              <button
                type="button"
                className="btn btn-ghost text-rose-700"
                disabled={working}
                onClick={async () => {
                  setWorking(true);
                  setError(null);
                  try {
                    const updated = await accessRequestService.cancelRequest(
                      request.id,
                      session?.id || session?.email
                    );
                    onUpdated?.(updated);
                    onClose();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Unable to cancel this demo request.');
                  } finally {
                    setWorking(false);
                  }
                }}
              >
                {working ? 'Canceling…' : 'Cancel pending request'}
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      {request ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-950">
            Status is <strong>simulated</strong> for UI demonstration. Approved demo states do not unlock restricted
            technical review documents or Google Drive links.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <AccessRequestStatusBadge status={request.status} />
            <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
              Demo only
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Demo request ID" value={request.demoRequestId} />
            <Field label="Campus" value={request.campusName} />
            <div className="sm:col-span-2">
              <Field label="College / Academic Program" value={request.collegeProgram} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Purpose of access" value={request.purpose} />
            </div>
            {request.remarks ? (
              <div className="sm:col-span-2">
                <Field label="Supporting remarks" value={request.remarks} />
              </div>
            ) : null}
            <Field label="Submitted" value={formatDate(request.submittedAt)} />
            <Field label="Last updated" value={formatDate(request.updatedAt)} />
            {request.expiresAt ? <Field label="Expires (demo)" value={request.expiresAt} /> : null}
            {request.qaRemarks ? (
              <div className="sm:col-span-2">
                <Field label="QA remarks (simulated)" value={request.qaRemarks} />
              </div>
            ) : null}
          </dl>

          {request.reviewHistory && request.reviewHistory.length > 0 ? (
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">Review history</h3>
              <ul className="mt-2 space-y-2">
                {request.reviewHistory.map((entry, index) => (
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

          {error ? (
            <p className="text-[12px] font-medium text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
