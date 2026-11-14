import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompassIcon, FileStackIcon, SearchIcon, XIcon } from 'lucide-react';
import { usePublicDocuments } from '../../hooks/usePublicDocuments';
import { PublicDocumentSort, sortByPublicPublishedAt } from '../../utils/publicDocuments';
import { EvidenceDocument } from '../../types/evidence';
import { formatNumber, pluralize } from '../../utils/format';
import { EmptyState } from '../../components/ui/EmptyState';
import { PublicDocumentCard } from '../../components/open/PublicDocumentCard';
import { PublicDocumentPreviewModal } from '../../components/open/PublicDocumentPreviewModal';

const PAGE_SIZE = 12;

type SortParam = 'newest' | 'oldest';

const SORT_OPTIONS: { value: SortParam; label: string; sort: PublicDocumentSort; direction: 'desc' | 'asc' }[] = [
  { value: 'newest', label: 'Newest First', sort: 'published-desc', direction: 'desc' },
  { value: 'oldest', label: 'Oldest First', sort: 'published-asc', direction: 'asc' }
];

export function OpenRecent() {
  const [query, setQuery] = useState('');
  const [areaId, setAreaId] = useState('');
  const [program, setProgram] = useState('');
  const [docType, setDocType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<SortParam>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);

  const sortMeta = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  const { documents, publishedDocuments, totalPublished, areaOptions, programOptions, docTypeOptions } =
    usePublicDocuments({
      query,
      areaId,
      program,
      docType,
      publishedFrom: from,
      publishedTo: to,
      sort: sortMeta.sort
    });

  // Prefer strict publicPublishedAt ordering for this page (no upload-date substitution).
  const sortedDocs = useMemo(
    () => sortByPublicPublishedAt(documents, sortMeta.direction),
    [documents, sortMeta.direction]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, areaId, program, docType, from, to, sort]);

  const hasFilters = Boolean(query.trim() || areaId || program || docType || from || to || sort !== 'newest');
  const clearFilters = () => {
    setQuery('');
    setAreaId('');
    setProgram('');
    setDocType('');
    setFrom('');
    setTo('');
    setSort('newest');
  };

  const visibleDocs = sortedDocs.slice(0, visibleCount);
  const canLoadMore = visibleCount < sortedDocs.length;

  const selectClass =
    'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';
  const inputClass =
    'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

  return (
    <div className="space-y-8 sm:space-y-10">
      <section
        aria-labelledby="open-recent-heading"
        className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-canvas px-5 py-7 sm:px-8 sm:py-9"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Faculty & Staff Resource Center</p>
            <h1
              id="open-recent-heading"
              className="mt-2 font-sans text-[24px] font-extrabold tracking-tight text-ink xs:text-[28px] sm:text-[32px]"
            >
              Recently Published
            </h1>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted sm:text-[15px]">
              Documents recently published to the Faculty & Staff Resource Center by the NEMSU Quality Assurance Office, ordered
              by public publication date.
            </p>
          </div>
          <div className="panel flex min-w-[10.5rem] items-center gap-3 px-4 py-3 shadow-none">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
              <CompassIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Published</p>
              <p className="text-xl font-extrabold tabular-nums text-ink">{formatNumber(totalPublished)}</p>
              <p className="text-[11px] text-ink-subtle">{pluralize(publishedDocuments.length, 'document')}</p>
            </div>
          </div>
        </div>
      </section>

      {totalPublished === 0 ? (
        <section className="panel">
          <EmptyState
            icon={CompassIcon}
            title="Currently, there are no publicly published documents."
            description="Newly published documents will appear here once the Quality Assurance Office releases them for public access."
            action={
              <Link to="/open/browse" className="btn btn-secondary">
                Accreditation Repository
              </Link>
            }
          />
        </section>
      ) : (
        <section aria-labelledby="recent-results-heading" className="space-y-4">
          <div>
            <h2 id="recent-results-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              Publication timeline
            </h2>
            <p className="mt-1 text-[13px] font-medium text-ink-muted">
              {formatNumber(sortedDocs.length)} {sortedDocs.length === 1 ? 'document' : 'documents'} · Sorted by{' '}
              {sortMeta.label.toLowerCase()} using public publication date
            </p>
          </div>

          <div className="panel p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="sm:col-span-2 xl:col-span-1">
                <label htmlFor="recent-search" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Search within recently published
                </label>
                <div className="relative">
                  <SearchIcon
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                    aria-hidden="true"
                  />
                  <input
                    id="recent-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter by title, keyword…"
                    className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-9 text-[13px] font-medium hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  />
                  {query ? (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink-subtle hover:bg-canvas hover:text-ink"
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="recent-filter-area" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Accreditation Area
                </label>
                <select
                  id="recent-filter-area"
                  className={selectClass}
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  disabled={areaOptions.length === 0}
                >
                  <option value="">All areas</option>
                  {areaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="recent-filter-program" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Academic Program
                </label>
                <select
                  id="recent-filter-program"
                  className={selectClass}
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  disabled={programOptions.length === 0}
                >
                  <option value="">All programs</option>
                  {programOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="recent-filter-type" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Document Type
                </label>
                <select
                  id="recent-filter-type"
                  className={selectClass}
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={docTypeOptions.length === 0}
                >
                  <option value="">All types</option>
                  {docTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="recent-filter-from" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Published from
                </label>
                <input
                  id="recent-filter-from"
                  type="date"
                  className={inputClass}
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="recent-filter-to" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Published to
                </label>
                <input
                  id="recent-filter-to"
                  type="date"
                  className={inputClass}
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="recent-filter-sort" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Sort
                </label>
                <select
                  id="recent-filter-sort"
                  className={selectClass}
                  value={sort}
                  onChange={(e) => setSort(e.target.value === 'oldest' ? 'oldest' : 'newest')}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasFilters ? (
              <div className="mt-3 flex justify-end">
                <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>

          {sortedDocs.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={FileStackIcon}
                title="No documents match your selected filters."
                description="Try adjusting or clearing filters to view recently published documents."
                action={
                  <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
                {visibleDocs.map((doc) => (
                  <PublicDocumentCard key={doc.id} doc={doc} onPreview={setPreview} />
                ))}
              </div>
              {canLoadMore ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  >
                    Load more
                    <span className="text-ink-muted">
                      ({formatNumber(sortedDocs.length - visibleCount)} remaining)
                    </span>
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      )}

      <PublicDocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
