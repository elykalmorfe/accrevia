import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClockIcon, LockIcon, SendIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { AccessRequestModal } from './AccessRequestModal';
import { formatDate } from '../../utils/format';

interface AccessRestrictedProps {
  documentId?: string;
}

export function AccessRestricted({ documentId }: AccessRestrictedProps) {
  const { id } = useParams();
  const docId = documentId || id || '';
  const { documents, accessRequests, currentUser } = usePortal();
  const [modalOpen, setModalOpen] = useState(false);

  const doc = documents.find((d) => d.id === docId);
  const pendingReq = accessRequests.find(
    (r) => r.documentId === docId && r.requesterId === currentUser.id && r.status === 'Pending'
  );

  return (
    <>
      <div className="panel mx-auto max-w-xl px-6 py-12 text-center" role="alert">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-700 ring-8 ring-amber-50/50">
          <LockIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold text-ink">Permission-Based Access Restricted</h1>
        
        {doc ? (
          <div className="mt-3 rounded-lg border border-line bg-canvas/80 p-3 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Requested Document:</span>
            <p className="font-semibold text-ink text-sm mt-0.5">{doc.title}</p>
            <p className="text-xs text-ink-muted mt-0.5">Classification: {doc.docType} · Office: {doc.office}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">You do not currently have permission to view this compliance document.</p>
        )}

        {pendingReq ? (
          <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50/60 p-4 text-left">
            <div className="flex items-center gap-2 text-brand-900 font-semibold text-xs">
              <ClockIcon className="h-4 w-4 text-brand-600 animate-pulse" />
              Access Request Pending QA Review
            </div>
            <p className="mt-1 text-xs text-brand-800">
              Your request for <strong className="text-brand-900">{pendingReq.requestedPermission}</strong> was submitted on{' '}
              {formatDate(pendingReq.requestedAt)}.
            </p>
            <p className="mt-1 text-[11px] text-brand-700 italic">"{pendingReq.reason}"</p>
            <p className="mt-2 text-[11px] text-ink-muted border-t border-brand-100 pt-2">
              Authorized QA personnel will review and decide on your request shortly. You will be notified in-app once approved.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-ink-muted leading-relaxed">
              Institutional documents are secured under university quality assurance policy. Faculty and staff members may submit an official access request to QA personnel.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn btn-primary"
              >
                <SendIcon className="h-4 w-4" />
                Request Access from QA Office
              </button>
              <Link to="/shared-with-me" className="btn btn-secondary">
                Go to Shared with Me
              </Link>
            </div>
          </div>
        )}
      </div>

      {docId && (
        <AccessRequestModal
          open={modalOpen}
          documentId={docId}
          documentTitle={doc?.title}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}