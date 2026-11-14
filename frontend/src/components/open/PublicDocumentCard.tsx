import { DownloadIcon, EyeIcon, FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EvidenceDocument } from '../../types/evidence';
import { useLookup } from '../../hooks/useLookup';
import { formatDate } from '../../utils/format';
import { usePublicDocumentAccess } from '../../hooks/usePublicDocumentAccess';
import { publicEligibilityMessage } from '../../utils/publicDocuments';

interface PublicDocumentCardProps {
  doc: EvidenceDocument;
  onPreview: (doc: EvidenceDocument) => void;
}

function formatPublishedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return formatDate(value.length === 10 ? value : value.slice(0, 10));
  } catch {
    try {
      return formatDate(value);
    } catch {
      return null;
    }
  }
}

/** Public-safe document summary card for the Public Document Portal. */
export function PublicDocumentCard({ doc, onPreview }: PublicDocumentCardProps) {
  const lookup = useLookup();
  const { resolveEligible, downloadDoc } = usePublicDocumentAccess();
  const areaName = lookup.area(doc.areaId)?.name || null;
  const publishedLabel = formatPublishedAt(doc.publicPublishedAt);

  return (
    <article className="panel flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700"
          aria-hidden="true"
        >
          <FileTextIcon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink sm:text-[15px]">{doc.title}</h3>
          <p className="mt-1.5 text-[12px] font-medium text-ink-muted">
            <span className="text-ink">{doc.docType}</span>
            {areaName ? (
              <>
                <span className="mx-1.5 text-ink-subtle" aria-hidden="true">
                  ·
                </span>
                <span>{areaName}</span>
              </>
            ) : null}
          </p>
          {doc.program ? <p className="mt-1 truncate text-[12px] text-ink-subtle">{doc.program}</p> : null}
          {publishedLabel ? (
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              Published {publishedLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
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

export { formatPublishedAt };
