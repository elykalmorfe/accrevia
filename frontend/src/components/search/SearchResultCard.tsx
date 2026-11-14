import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookmarkCheckIcon,
  BookmarkIcon,
  ChevronDownIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FolderTreeIcon,
  InfoIcon,
  Share2Icon,
  SparklesIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useSharingDialogs } from '../../contexts/SharingDialogsContext';
import { useLookup } from '../../hooks/useLookup';
import { useAccess } from '../../hooks/useAccess';
import { joinNatural, SearchResult } from '../../utils/search';
import { downloadStoredFile } from '../../utils/fileStore';
import { Highlight } from '../ui/Highlight';
import { PermissionIndicator } from '../sharing/PermissionIndicator';

const LONG_EXCERPT = 220;

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
  const tipId = useId();
  const [expanded, setExpanded] = useState(false);
  const { doc, score, terms, passages, keywords, relatedTerms, fields } = result;
  const rights = rightsFor(doc.id);
  const framework = lookup.framework(doc.frameworkId);
  const area = lookup.area(doc.areaId);
  const criterion = lookup.criterion(doc.criterionId);
  const indicator = lookup.indicator(doc.indicatorId);
  const saved = savedIds.includes(doc.id);
  const viewHref = `/documents/${doc.id}?q=${encodeURIComponent(query)}`;

  const classification = [
    framework && { label: framework.name, className: 'font-medium text-brand-700' },
    area && { label: area.shortName },
    criterion && { label: criterion.code, title: criterion.name },
    indicator && { label: `Indicator ${indicator.code}`, title: indicator.name }
  ].filter(Boolean) as { label: string; className?: string; title?: string }[];
  const details = [doc.program, doc.academicYear ? `AY ${doc.academicYear}` : null].filter(Boolean) as string[];

  const where = fields.length ? ` in the ${joinNatural(fields.slice(0, 3))}` : '';
  const related = criterion
    ? `Related to ${criterion.code} – ${criterion.name}${indicator ? `, Indicator ${indicator.code}` : ''}${framework ? ` under ${framework.name}` : ''}.`
    : framework
      ? `Classified under ${framework.name}.`
      : null;

  const hasMoreExcerpt = passages.length > 1 || (passages[0]?.length ?? 0) > LONG_EXCERPT;
  const visiblePassages = expanded ? passages : passages.slice(0, 1);

  const download = async () => {
    logAccess('Downloaded', doc.id);
    const stored = await downloadStoredFile(doc.id, doc.title);
    if (stored) toast.success(`Downloading ${doc.title}`);
    else toast(`No original file stored for ${doc.title}`);
  };

  return (
    <article className="panel flex flex-col gap-4 p-5 sm:flex-row sm:gap-6">
      <div className="flex shrink-0 items-center gap-3 sm:w-20 sm:flex-col sm:items-start sm:gap-1.5">
        <p className="text-2xl font-semibold tabular-nums leading-none text-brand-700">
          {score}%<span className="sr-only"> search relevance</span>
        </p>
        <span className="group/tip relative inline-flex items-center gap-1 text-xs text-ink-muted">
          Match
          <button
            type="button"
            aria-describedby={tipId}
            aria-label="What does the match percentage mean?"
            className="grid h-4 w-4 place-items-center rounded-full text-ink-subtle hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <InfoIcon className="h-3 w-3" aria-hidden="true" />
          </button>
          <span
            role="tooltip"
            id={tipId}
            className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-60 rounded-lg bg-ink px-2.5 py-2 text-[11px] leading-snug text-white opacity-0 shadow-lg transition-opacity group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
          >
            Indicates how relevant this document is to your search query. This is not an accreditation compliance score.
          </span>
        </span>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-canvas sm:w-full" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold leading-snug text-ink">
          <Link to={viewHref} title={doc.title} className="line-clamp-2 break-words hover:text-brand-700 hover:underline">
            <Highlight text={doc.title} terms={terms} />
          </Link>
        </h2>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
          {classification.length > 0 && (
            <span>
              {classification.map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <span className={item.className} title={item.title}>{item.label}</span>
                </React.Fragment>
              ))}
            </span>
          )}
          {doc.docType && (
            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-px text-[11px] font-semibold text-ink-muted">
              {doc.docType}
            </span>
          )}
          {details.length > 0 && <span>{details.join(' · ')}</span>}
        </div>
        {!isAdmin && <div className="mt-1.5"><PermissionIndicator canDownload={rights.canDownload} /></div>}

        <div className="mt-3 flex gap-2 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-[12.5px] leading-relaxed text-ink">
          <SparklesIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
          <p>
            <span className="sr-only">Why this result: </span>
            {keywords.length > 0 ? (
              <>Matched keywords: <span className="font-semibold">{keywords.slice(0, 4).join(', ')}</span>{where}. </>
            ) : relatedTerms.length > 0 ? (
              <>Matched related terms: <span className="font-semibold">{relatedTerms.slice(0, 4).join(', ')}</span>{where}. </>
            ) : (
              <>Matched through its accreditation classification. </>
            )}
            {related && <span className="text-ink-muted">{related}</span>}
          </p>
        </div>

        {passages.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              <FileTextIcon className="h-3 w-3" aria-hidden="true" />
              From the document
            </p>
            <div className="space-y-2">
              {visiblePassages.map((p) => (
                <blockquote
                  key={p}
                  className={`border-l-2 border-gold-500 pl-3 text-[13px] leading-relaxed text-ink-muted ${expanded ? '' : 'line-clamp-3'}`}
                >
                  “<Highlight text={p} terms={terms} />”
                </blockquote>
              ))}
            </div>
            {hasMoreExcerpt && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="mt-1.5 inline-flex items-center gap-1 rounded text-[12px] font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                {expanded ? 'Show less' : passages.length > 1 ? `Show more excerpts (${passages.length})` : 'Show full excerpt'}
                <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link to={viewHref} className="btn btn-primary btn-sm">View Document</Link>
          {rights.canView && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onPreview} title="Preview without leaving the results">
              <EyeIcon className="h-3.5 w-3.5" /> Preview
            </button>
          )}
          {rights.canDownload && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={download} title="Download the original file">
              <DownloadIcon className="h-3.5 w-3.5" /> Download
            </button>
          )}
          <button
            type="button"
            aria-pressed={saved}
            title={saved ? 'Remove from your saved documents' : 'Save to your documents list'}
            className={`btn btn-sm ${saved ? 'border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100' : 'btn-secondary'}`}
            onClick={() => toast(toggleSaved(doc.id) ? 'Saved to your documents list' : 'Removed from saved documents')}
          >
            {saved ? <BookmarkCheckIcon className="h-3.5 w-3.5" /> : <BookmarkIcon className="h-3.5 w-3.5" />}
            {saved ? 'Saved' : 'Save'}
          </button>

          {isAdmin && (
            <div className="flex items-center gap-3 sm:ml-1 sm:border-l sm:border-line sm:pl-3">
              {criterion && (
                <Link
                  to={`/criteria/criteria?framework=${doc.frameworkId}&criterion=${criterion.id}`}
                  className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                >
                  <FolderTreeIcon className="h-3.5 w-3.5" aria-hidden="true" /> View Related Criterion
                </Link>
              )}
              <button
                type="button"
                onClick={() => openShare(doc.id)}
                title="Share this document"
                className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                <Share2Icon className="h-3.5 w-3.5" aria-hidden="true" /> Share
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
