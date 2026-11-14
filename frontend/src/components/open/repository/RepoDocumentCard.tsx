import { EyeIcon, FileTextIcon, ImageIcon, InfoIcon } from 'lucide-react';
import type { RepoDocumentItem } from '../../../types/accreditationRepository';
import { getDocumentAccessHints } from '../../../services/repository/documentAccess';

type RepoDocumentCardProps = {
  doc: RepoDocumentItem;
  onDetails: (doc: RepoDocumentItem) => void;
  onPreview: (doc: RepoDocumentItem) => void;
};

function TypeIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
  return <FileTextIcon className="h-[18px] w-[18px]" aria-hidden="true" />;
}

export function RepoDocumentCard({ doc, onDetails, onPreview }: RepoDocumentCardProps) {
  const hints = getDocumentAccessHints(doc);

  return (
    <article className="panel flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
          <TypeIcon mimeType={doc.mimeType} />
        </span>
        <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
          {doc.provenance === 'verified' && !doc.isDemo ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900">
              Verified source
            </span>
          ) : null}
          {doc.isDemo || doc.provenance === 'demonstration' ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
              Demonstration
            </span>
          ) : null}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[14px] font-bold text-ink">{doc.name}</h3>
      <dl className="mt-2 space-y-1 text-[12px] font-medium text-ink-muted">
        {doc.documentType ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-subtle">Type</dt>
            <dd className="truncate text-ink">{doc.documentType}</dd>
          </div>
        ) : null}
        {doc.campus ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-subtle">Campus</dt>
            <dd className="truncate text-ink">{doc.campus}</dd>
          </div>
        ) : null}
        {doc.college ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-subtle">College</dt>
            <dd className="truncate text-ink">{doc.college}</dd>
          </div>
        ) : null}
        {doc.program ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-subtle">Program</dt>
            <dd className="truncate text-ink">{doc.program}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="shrink-0 text-ink-subtle">Access</dt>
          <dd className="truncate text-ink">{hints.availabilityLabel}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDetails(doc)}>
          <InfoIcon className="h-3.5 w-3.5" />
          Details
        </button>
        <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={() => onPreview(doc)}>
          <EyeIcon className="h-3.5 w-3.5" />
          Check preview
        </button>
      </div>
    </article>
  );
}
