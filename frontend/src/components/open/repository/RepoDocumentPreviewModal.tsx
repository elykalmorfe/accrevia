import { useEffect, useState } from 'react';
import { DownloadIcon, ExternalLinkIcon, FileWarningIcon, Loader2Icon } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import type { RepoDocumentItem } from '../../../types/accreditationRepository';
import {
  getDocumentAccessHints,
  isImagePath,
  isPdfPath,
  probeLocalPreview,
  resolveAccessMode
} from '../../../services/repository/documentAccess';

type RepoDocumentPreviewModalProps = {
  doc: RepoDocumentItem | null;
  onClose: () => void;
};

export function RepoDocumentPreviewModal({ doc, onClose }: RepoDocumentPreviewModalProps) {
  const [checkingLocal, setCheckingLocal] = useState(false);
  const [localAvailable, setLocalAvailable] = useState(false);
  const hints = doc ? getDocumentAccessHints(doc) : null;
  const isDemo = Boolean(doc?.isDemo || doc?.provenance === 'demonstration');

  useEffect(() => {
    let cancelled = false;
    setLocalAvailable(false);
    if (!doc || !hints?.localCandidateUrl) {
      setCheckingLocal(false);
      return;
    }
    setCheckingLocal(true);
    void probeLocalPreview(hints.localCandidateUrl).then((ok) => {
      if (!cancelled) {
        setLocalAvailable(ok);
        setCheckingLocal(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [doc?.id, hints?.localCandidateUrl]);

  const mode = hints
    ? resolveAccessMode({
        localAvailable: localAvailable && !checkingLocal,
        driveFileUrl: hints.driveFileUrl,
        driveFolderUrl: hints.driveFolderUrl
      })
    : 'metadata-only';

  const canEmbed =
    mode === 'local-preview' &&
    Boolean(hints?.localCandidateUrl) &&
    (isPdfPath(hints?.localCandidateUrl, doc?.mimeType) || isImagePath(hints?.localCandidateUrl, doc?.mimeType));

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title={doc ? `Preview · ${doc.name}` : 'Preview'}
      description={
        doc?.provenance === 'verified'
          ? 'Verified source record — static catalog snapshot'
          : isDemo
            ? 'Demonstration document — fictional sample for UI preview only'
            : undefined
      }
      size="xl"
      footer={
        doc && hints ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {isDemo && canEmbed && hints.localCandidateUrl ? (
              <a
                href={hints.localCandidateUrl}
                download
                className="btn btn-primary inline-flex items-center justify-center gap-1.5"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Download Sample
              </a>
            ) : hints.canOpenExternal && hints.primaryExternalUrl ? (
              <a
                href={hints.primaryExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center justify-center gap-1.5"
              >
                {hints.primaryExternalLabel}
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : !isDemo ? (
              <span className="inline-flex items-center justify-center rounded-xl border border-line bg-canvas px-3 py-2 text-[12px] font-semibold text-ink-muted">
                Document link unavailable
              </span>
            ) : null}
          </div>
        ) : null
      }
    >
      {doc && hints ? (
        <div className="space-y-4">
          {isDemo ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-950">
              <span className="mr-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
                Demonstration
              </span>
              <strong>SAMPLE DOCUMENT — FOR DEMONSTRATION ONLY.</strong> Fictional content for Faculty/Staff retrieval
              demos. Not an authentic institutional record, and opening it is not real authorization.
            </p>
          ) : null}
          {doc.provenance === 'verified' ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12px] font-medium text-emerald-950">
              Verified source record from the static catalog. Folder links are not individual documents. Local preview
              appears only when the real asset exists in this deployment.
            </p>
          ) : null}

          {checkingLocal ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-[13px] font-medium text-ink-muted">
              <Loader2Icon className="h-6 w-6 animate-spin text-brand-600" />
              Checking for a local preview file…
            </div>
          ) : canEmbed && hints.localCandidateUrl ? (
            <div className="overflow-hidden rounded-xl border border-line bg-canvas">
              {isImagePath(hints.localCandidateUrl, doc.mimeType) ? (
                <img
                  src={hints.localCandidateUrl}
                  alt={doc.name}
                  className="mx-auto max-h-[min(70vh,32rem)] w-auto max-w-full object-contain"
                />
              ) : (
                <iframe
                  title={`Preview of ${doc.name}`}
                  src={hints.localCandidateUrl}
                  className="h-[min(70vh,32rem)] w-full"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-canvas text-ink-muted">
                <FileWarningIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">Document preview unavailable</p>
              <p className="mt-1.5 max-w-md text-[13px] font-medium text-ink-muted">{hints.catalogHint}</p>
              <p className="mt-3 max-w-lg text-[12px] font-medium text-ink-subtle">
                Original filename: <span className="text-ink">{doc.name}</span>
                {doc.campus ? (
                  <>
                    {' '}
                    · Campus: <span className="text-ink">{doc.campus}</span>
                  </>
                ) : null}
                {doc.program ? (
                  <>
                    {' '}
                    · Program: <span className="text-ink">{doc.program}</span>
                  </>
                ) : null}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
