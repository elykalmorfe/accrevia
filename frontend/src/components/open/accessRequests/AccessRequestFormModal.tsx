import { useState } from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { accessRequestService } from '../../../services/accessRequests/accessRequestService';
import type { TechnicalReviewAccessRequest } from '../../../types/technicalReviewAccess';
import { useSessionAccount } from '../../../utils/auth';
import { AccessRequestForm } from './AccessRequestForm';

type AccessRequestFormModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (request: TechnicalReviewAccessRequest) => void;
};

export function AccessRequestFormModal({ open, onClose, onCreated }: AccessRequestFormModalProps) {
  const session = useSessionAccount();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<TechnicalReviewAccessRequest | null>(null);

  const handleClose = () => {
    setError(null);
    setCreated(null);
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={created ? 'Demo request submitted' : 'Request Technical Review access'}
      description={
        created
          ? 'Your mock request was saved locally for this prototype'
          : 'Faculty/Staff demo form — QA Approval Required materials stay restricted'
      }
      size="lg"
      footer={
        created ? (
          <button type="button" className="btn btn-primary" onClick={handleClose}>
            Done
          </button>
        ) : null
      }
    >
      {created ? (
        <div className="space-y-4 text-center sm:text-left">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 sm:mx-0">
            <CheckCircle2Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              Demo request <span className="tabular-nums">{created.demoRequestId}</span> created with Pending status.
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-ink-muted" role="status" aria-live="polite">
              This submission is <strong>DEMO ONLY</strong>. It is saved in this browser’s shared demo store so the QA
              Access Management page can review it here — it does not unlock restricted technical review documents or
              notify anyone outside this prototype.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-800" role="alert">
              {error}
            </p>
          ) : null}
          <AccessRequestForm
            submitting={submitting}
            onCancel={handleClose}
            onSubmit={async (values) => {
              setSubmitting(true);
              setError(null);
              try {
                const displayName =
                  [session?.firstName, session?.lastName].filter(Boolean).join(' ').trim() || session?.email;
                const request = await accessRequestService.createRequest({
                  ...values,
                  requesterId: session?.id || session?.email,
                  requesterName: displayName,
                  requesterEmail: session?.email
                });
                setCreated(request);
                onCreated?.(request);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to save the demo request.');
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </div>
      )}
    </Modal>
  );
}
