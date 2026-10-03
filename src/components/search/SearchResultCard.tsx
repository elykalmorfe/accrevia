import React from 'react';
import { Link } from 'react-router-dom';
import { BookmarkCheckIcon, BookmarkIcon, DownloadIcon, EyeIcon, FolderTreeIcon, Share2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useSharingDialogs } from '../../contexts/SharingDialogsContext';
import { useLookup } from '../../hooks/useLookup';
import { useAccess } from '../../hooks/useAccess';
import { SearchResult } from '../../utils/search';
import { Highlight } from '../ui/Highlight';
import { PermissionIndicator } from '../sharing/PermissionIndicator';

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onPreview: () => void;
}

export function SearchResultCard({ result, query, onPreview }: SearchResultCardProps) {
  const { savedIds, toggleSaved, isAdmin, logAccess } = usePortal();
  const { openShare } = useSharingDialogs();
  const { rightsFor } = useAccess();
  const lookup = useLookup();
  const { doc, score, terms, passages, reason } = result;
  const rights = rightsFor(doc.id);
  const framework = lookup.framework(doc.frameworkId);
  const area = lookup.area(doc.areaId);
  const criterion = lookup.criterion(doc.criterionId);
  const indicator = lookup.indicator(doc.indicatorId);
  const saved = savedIds.includes(doc.id);
  const viewHref = `/documents/${doc.id}?q=${encodeURIComponent(query)}`;

  const meta = [framework?.name, area?.shortName, criterion?.code, indicator ? `Indicator ${indicator.code}` : null, doc.docType, `Academic Year ${doc.academicYear}`].filter(Boolean);

  return (
    <article className="panel flex flex-col gap-4 p-5 sm:flex-row sm:gap-6">
      <div className="flex shrink-0 items-center gap-3 sm:w-20 sm:flex-col sm:items-start sm:gap-1.5">
        <p className="text-2xl font-semibold tabular-nums leading-none text-brand-700">{score}%</p>
        <p className="text-xs text-ink-muted">Match</p>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-canvas sm:w-full" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold leading-snug text-ink">
          <Link to={viewHref} className="hover:text-brand-700 hover:underline">
            <Highlight text={doc.title} terms={terms} />
          </Link>
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">{meta.join(' · ')}</p>
        {!isAdmin && <div className="mt-1.5"><PermissionIndicator canDownload={rights.canDownload} /></div>}

        <p className="mt-3 text-[13px] text-ink">{reason}</p>
        {passages.length > 0 &&
        <div className="mt-3 space-y-2">
            {passages.map((p) =>
          <blockquote key={p} className="border-l-2 border-gold-500 pl-3 text-[13px] leading-relaxed text-ink-muted">
                “<Highlight text={p} terms={terms} />”
              </blockquote>
          )}
          </div>
        }

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link to={viewHref} className="btn btn-primary btn-sm">View Document</Link>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onPreview}>
            <EyeIcon className="h-3.5 w-3.5" /> Preview
          </button>
          {rights.canDownload &&
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              logAccess('Downloaded', doc.id);
              toast.success(`Downloading ${doc.title}`);
            }}>
            
              <DownloadIcon className="h-3.5 w-3.5" /> Download
            </button>
          }
          <button
            type="button"
            aria-pressed={saved}
            className={`btn btn-sm ${saved ? 'border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100' : 'btn-secondary'}`}
            onClick={() => toast(toggleSaved(doc.id) ? 'Saved to your evidence list' : 'Removed from saved evidence')}>
            
            {saved ? <BookmarkCheckIcon className="h-3.5 w-3.5" /> : <BookmarkIcon className="h-3.5 w-3.5" />}
            {saved ? 'Saved' : 'Save'}
          </button>
          {isAdmin && criterion &&
          <Link to={`/criteria/criteria?framework=${doc.frameworkId}&criterion=${criterion.id}`} className="btn btn-ghost btn-sm">
              <FolderTreeIcon className="h-3.5 w-3.5" /> View Related Criterion
            </Link>
          }
          {isAdmin &&
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openShare(doc.id)}>
              <Share2Icon className="h-3.5 w-3.5" /> Share
            </button>
          }
        </div>
      </div>
    </article>);

}