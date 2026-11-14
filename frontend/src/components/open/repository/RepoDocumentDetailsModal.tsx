import { ExternalLinkIcon, EyeIcon } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import type { RepoDocumentItem } from '../../../types/accreditationRepository';
import { getDocumentAccessHints } from '../../../services/repository/documentAccess';
import { getLinkMappingByCatalogId } from '../../../data/repositoryCatalog/verifiedIndividualCertificateLinks';

type RepoDocumentDetailsModalProps = {
  doc: RepoDocumentItem | null;
  onClose: () => void;
  onPreview: (doc: RepoDocumentItem) => void;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-ink break-words">{value}</dd>
    </div>
  );
}

export function RepoDocumentDetailsModal({ doc, onClose, onPreview }: RepoDocumentDetailsModalProps) {
  const hints = doc ? getDocumentAccessHints(doc) : null;
  const linkMapping = doc ? getLinkMappingByCatalogId(doc.id) : undefined;

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title={doc?.name ?? 'Document details'}
      description={
        doc?.provenance === 'verified'
          ? 'Verified source record — static catalog snapshot'
          : doc?.isDemo
            ? 'Demonstration record — not verified institutional metadata'
            : undefined
      }
      size="lg"
      footer={
        doc && hints ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-ghost text-brand-700" onClick={() => onPreview(doc)}>
              <EyeIcon className="h-3.5 w-3.5" />
              Check local preview
            </button>
            {hints.canOpenExternal && hints.primaryExternalUrl ? (
              <a
                href={hints.primaryExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center justify-center gap-1.5"
              >
                {hints.primaryExternalLabel}
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="inline-flex items-center justify-center rounded-xl border border-line bg-canvas px-3 py-2 text-[12px] font-semibold text-ink-muted">
                Document link unavailable
              </span>
            )}
          </div>
        ) : null
      }
    >
      {doc && hints ? (
        <div className="space-y-5">
          {doc.isDemo || doc.provenance === 'demonstration' ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-950">
              <strong>Demonstration record.</strong> Invented frontend test data — not a verified institutional record.
            </p>
          ) : null}
          {doc.provenance === 'verified' ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12px] font-medium text-emerald-950">
              <strong>Verified source record.</strong> Metadata was extracted for UI visualization as a static snapshot.
              It is not live-synchronized and does not independently validate institutional compliance.
            </p>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">Document</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Original filename" value={doc.name} />
              <Field label="File type" value={doc.documentType} />
              <Field label="Source category" value={doc.category || 'aaccup-certificate'} />
              <Field label="Availability" value={hints.availabilityLabel} />
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">Location</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Campus" value={doc.campus} />
              <Field label="College" value={doc.college} />
              <Field label="Program" value={doc.program} />
              <Field label="Level / year folder" value={doc.academicYear} />
              <div className="sm:col-span-2">
                <Field label="Original source location" value={doc.locationPath} />
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">Viewing</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Source availability" value={hints.catalogHint} />
              </div>
              <Field label="Local asset path (candidate)" value={doc.localPreviewUrl} />
              <Field
                label="Individual Drive file URL"
                value={hints.driveFileUrl || 'Not available — awaiting publication-approved mapping'}
              />
              <Field label="Drive folder URL" value={hints.driveFolderUrl || 'Not attached'} />
              <Field
                label="Publication approval"
                value={
                  linkMapping
                    ? linkMapping.publicationApprovalStatus
                    : 'No individual file mapping (folder or metadata only)'
                }
              />
              <Field label="Data source" value={doc.dataSource} />
              {linkMapping?.sourceReference ? (
                <div className="sm:col-span-2">
                  <Field label="Individual link source reference" value={linkMapping.sourceReference} />
                </div>
              ) : null}
              {doc.verificationNote ? (
                <div className="sm:col-span-2">
                  <Field label="Verification note" value={doc.verificationNote} />
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
