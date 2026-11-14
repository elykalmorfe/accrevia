import { DownloadIcon, EyeIcon, FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EvidenceDocument } from '../../types/evidence';
import { useLookup } from '../../hooks/useLookup';
import { usePublicDocumentAccess } from '../../hooks/usePublicDocumentAccess';
import { publicEligibilityMessage } from '../../utils/publicDocuments';
import { formatPublishedAt } from './PublicDocumentCard';

interface PublicDocumentListItemProps {
  doc: EvidenceDocument;
  onPreview: (doc: EvidenceDocument) => void;
}

/** Compact horizontal row for Browse Documents list view. */
export function PublicDocumentListItem({ doc, onPreview }: PublicDocumentListItemProps) {
  const lookup = useLookup();
  const { resolveEligible, downloadDoc } = usePublicDocumentAccess();
  const areaName = lookup.area(doc.areaId)?.name || null;
  const publishedLabel = formatPublishedAt(doc.publicPublishedAt);

  return (
    <article className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700"
          aria-hidden="true"
        >
          <FileTextIcon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-ink sm:text-[15px]">{doc.title}</h3>
          <p className="mt-1 truncate text-[12px] font-medium text-ink-muted">
            <span className="text-ink">{doc.docType}</span>
            {areaName ? (
              <>
                <span className="mx-1.5 text-ink-subtle" aria-hidden="true">
                  ·
                </span>
                <span>{areaName}</span>
              </>
            ) : null}
            {doc.program ? (
              <>
                <span className="mx-1.5 text-ink-subtle" aria-hidden="true">
                  ·
                </span>
                <span>{doc.program}</span>
              </>
            ) : null}
          </p>
          {publishedLabel ? (
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              Published {publishedLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const live = resolveEligible(doc.id);
            if (!live) {
              toast.error(publicEligibilityMessage(doc));
              return;
            }
            onPreview(live);
          }}
        >
          <EyeIcon className="h-3.5 w-3.5" />
          Preview
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void downloadDoc(doc)}>
          <DownloadIcon className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
    </article>
  );
}
