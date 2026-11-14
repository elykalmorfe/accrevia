import { EyeIcon, FileIcon, FileTextIcon, ImageIcon, InfoIcon } from 'lucide-react';
import type { RepoDocumentItem } from '../../../types/accreditationRepository';
import { getDocumentAccessHints } from '../../../services/repository/documentAccess';

function fileIcon(mimeType?: string) {
  if (!mimeType) return FileIcon;
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return FileTextIcon;
  }
  return FileIcon;
}

type RepoDocumentListProps = {
  documents: RepoDocumentItem[];
  onDetails: (doc: RepoDocumentItem) => void;
  onPreview: (doc: RepoDocumentItem) => void;
};

export function RepoDocumentList({ documents, onDetails, onPreview }: RepoDocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <ul className="divide-y divide-line-subtle overflow-hidden rounded-2xl border border-line bg-surface">
      {documents.map((doc) => {
        const Icon = fileIcon(doc.mimeType);
        const hints = getDocumentAccessHints(doc);
        return (
          <li key={doc.id} className="flex flex-col gap-3 px-3.5 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-ink">{doc.name}</p>
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
                <p className="mt-0.5 truncate text-[11px] font-medium text-ink-muted">
                  {[doc.documentType, doc.campus, doc.college || doc.program, hints.availabilityLabel]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {doc.locationPath ? (
                  <p className="mt-0.5 truncate text-[11px] text-ink-subtle">{doc.locationPath}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDetails(doc)}>
                <InfoIcon className="h-3.5 w-3.5" />
                Details
              </button>
              <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={() => onPreview(doc)}>
                <EyeIcon className="h-3.5 w-3.5" />
                Check preview
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
