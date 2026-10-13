import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { SendIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { Modal } from '../ui/Modal';

interface AccessRequestModalProps {
  open: boolean;
  documentId: string;
  documentTitle?: string;
  onClose: () => void;
}

export function AccessRequestModal({ open, documentId, documentTitle, onClose }: AccessRequestModalProps) {
  const { documents, currentUser, submitAccessRequest } = usePortal();
  const doc = documents.find((d) => d.id === documentId);
  const title = documentTitle || doc?.title || 'Accreditation Document';

  const [permission, setPermission] = useState<'View only' | 'View and Download'>('View only');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Please specify the reason for requesting document access.');
      return;
    }

    setIsSubmitting(true);
    submitAccessRequest(documentId, trimmed, permission);
    setIsSubmitting(false);
    toast.success('Access request submitted successfully', {
      description: 'Quality Assurance personnel have been notified in real time and will review your request.'
    });
    setReason('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Document Access"
      description={`Submit an official access request to the Quality Assurance Office.`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-[11px] text-ink-subtle">
            Access requests are logged and monitored by the QA Office.
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              <SendIcon className="h-4 w-4" />
              Submit Request
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document summary box */}
        <div className="rounded-lg border border-line bg-canvas p-3.5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Document</p>
          <p className="mt-1 text-sm font-bold text-ink">{title}</p>
          {doc && (
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-muted">
              <span>{doc.docType}</span>
              <span>·</span>
              <span>AY {doc.academicYear}</span>
              <span>·</span>
              <span>{doc.office}</span>
            </div>
          )}
        </div>

        {/* Requester Profile */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-ink-muted">Requester:</span>{' '}
              <strong className="text-ink">{currentUser.name}</strong> ({currentUser.role})
            </div>
            <span className="text-ink-muted">{currentUser.office}</span>
          </div>
        </div>

        {/* Permission requested */}
        <div>
          <label className="label">Requested Access Level</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setPermission('View only')}
              className={`rounded-lg border p-3 text-left transition-all ${
                permission === 'View only'
                  ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500'
                  : 'border-line bg-white hover:bg-canvas text-ink'
              }`}
            >
              <p className="text-xs font-bold">View Only</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Read and preview in viewer; downloading disabled</p>
            </button>

            <button
              type="button"
              onClick={() => setPermission('View and Download')}
              className={`rounded-lg border p-3 text-left transition-all ${
                permission === 'View and Download'
                  ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500'
                  : 'border-line bg-white hover:bg-canvas text-ink'
              }`}
            >
              <p className="text-xs font-bold">View & Download</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">Full reading access and export file download</p>
            </button>
          </div>
        </div>

        {/* Purpose / Reason */}
        <div>
          <label className="label">
            Reason / Accreditation Purpose <span className="text-danger-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            className="textarea text-[13px]"
            placeholder="Explain why you require access to this document (e.g. self-survey report preparation, curriculum review committee alignment)..."
          />
          <p className="mt-1 text-[11px] text-ink-muted">
            Provide sufficient justification to help QA personnel expedite approval.
          </p>
        </div>
      </form>
    </Modal>
  );
}
