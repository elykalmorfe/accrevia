import { useEffect, useMemo, useState } from 'react';
import { AlertTriangleIcon, DownloadIcon, LoaderIcon } from 'lucide-react';
import { EvidenceDocument } from '../../types/evidence';
import { useLookup } from '../../hooks/useLookup';
import { usePublicDocumentAccess } from '../../hooks/usePublicDocumentAccess';
import { Modal } from '../ui/Modal';
import { OriginalDocumentView } from '../documents/OriginalDocumentView';
import { formatPublishedAt } from './PublicDocumentCard';
import { publicEligibilityMessage } from '../../utils/publicDocuments';

interface PublicDocumentPreviewModalProps {
  doc: EvidenceDocument | null;
  onClose: () => void;
}

/**
 * Public-portal preview modal.
 * Revalidates live eligibility on every render so unpublish/archive/confidential
 * changes invalidate an already-open preview without a separate bypass path.
 */
export function PublicDocumentPreviewModal({ doc, onClose }: PublicDocumentPreviewModalProps) {
  const lookup = useLookup();
  const { resolveEligible, downloadById, documents } = usePublicDocumentAccess();
  const [downloading, setDownloading] = useState(false);

  const live = useMemo(() => (doc ? resolveEligible(doc.id) : null), [doc, resolveEligible]);
  const staleOrMissing = Boolean(doc) && !live;
  const currentRecord = useMemo(
    () => (doc ? documents.find((d) => d.id === doc.id) ?? doc : null),
    [documents, doc]
  );

  useEffect(() => {
    setDownloading(false);
  }, [doc?.id]);

  const areaName = live ? lookup.area(live.areaId)?.name : undefined;
  const publishedLabel = live ? formatPublishedAt(live.publicPublishedAt) : null;

  const metaParts = live
    ? [live.docType, areaName, live.program, publishedLabel ? `Published ${publishedLabel}` : null].filter(Boolean)
    : [];

  const title = live?.title || doc?.title || 'Document preview';

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title={title}
      description={live ? metaParts.join(' · ') : undefined}
      size="xl"
      footer={
        doc ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!live || downloading}
              aria-disabled={!live || downloading}
              onClick={async () => {
                if (!live || downloading) return;
                setDownloading(true);
                try {
                  await downloadById(live.id);
                } finally {
                  setDownloading(false);
                }
              }}
            >
              {downloading ? <LoaderIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <DownloadIcon className="h-4 w-4" />}
              {downloading ? 'Preparing…' : 'Download'}
            </button>
          </div>
        ) : null
      }
    >
      {staleOrMissing ? (
        <div className="flex flex-col items-center px-4 py-12 text-center sm:px-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            <AlertTriangleIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-ink">Document no longer publicly available</h3>
          <p className="mt-1 max-w-md text-[13px] text-ink-muted">
            {currentRecord
              ? publicEligibilityMessage(currentRecord)
              : 'This document is not available on the Public Document Portal.'}
          </p>
        </div>
      ) : live ? (
        <div className="-mx-4 -my-3 bg-canvas p-3 sm:-mx-6 sm:-my-5 sm:p-6">
          <dl className="mb-3 grid gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-[12px] sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink-muted">Document type</dt>
              <dd className="mt-0.5 font-medium text-ink break-words">{live.docType}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Accreditation area</dt>
              <dd className="mt-0.5 font-medium text-ink break-words">{areaName || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Academic program</dt>
              <dd className="mt-0.5 font-medium text-ink break-words">{live.program || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">Publication date</dt>
              <dd className="mt-0.5 font-medium text-ink break-words">{publishedLabel || '—'}</dd>
            </div>
          </dl>
          <OriginalDocumentView
            doc={live}
            canDownload={false}
            missingFallback="notice"
            heightClass={live.docType === 'Certificate' ? 'h-[min(70vh,560px)]' : 'h-[min(65vh,520px)]'}
          />
        </div>
      ) : null}
    </Modal>
  );
}
