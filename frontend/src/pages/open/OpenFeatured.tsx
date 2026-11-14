import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileStackIcon, SearchIcon, SparklesIcon, XIcon } from 'lucide-react';
import { usePublicDocuments } from '../../hooks/usePublicDocuments';
import { useLookup } from '../../hooks/useLookup';
import {
  filterPublicDocuments,
  selectFeaturedDocuments,
  sortPublicDocuments
} from '../../utils/publicDocuments';
import { EvidenceDocument } from '../../types/evidence';
import { formatNumber, pluralize } from '../../utils/format';
import { EmptyState } from '../../components/ui/EmptyState';
import { PublicDocumentCard } from '../../components/open/PublicDocumentCard';
import { PublicDocumentPreviewModal } from '../../components/open/PublicDocumentPreviewModal';

/** Larger pool than Home’s featured strip — still latest eligible publications (no featured flag). */
const FEATURED_PAGE_LIMIT = 24;
const PAGE_SIZE = 9;

export function OpenFeatured() {
  const lookup = useLookup();
  const { publishedDocuments, totalPublished } = usePublicDocuments({ sort: 'published-desc' });

  const [query, setQuery] = useState('');
  const [areaId, setAreaId] = useState('');
  const [program, setProgram] = useState('');
  const [docType, setDocType] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);

  const featuredPool = useMemo(
    () => selectFeaturedDocuments(publishedDocuments, FEATURED_PAGE_LIMIT),
    [publishedDocuments]
  );

  const filtered = useMemo(() => {
    const scoped = filterPublicDocuments(featuredPool, {
      areaId,
      program,
      docType,
      query: '',
      sort: 'published-desc'
    });
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return sortPublicDocuments(
      scoped.filter((d) => {
        const areaName = lookup.area(d.areaId)?.name ?? '';
        const haystack = [d.title, d.description, d.keywords.join(' '), d.docType, d.program, areaName]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      }),
      'published-desc'
    );
  }, [featuredPool, areaId, program, docType, query, lookup]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, areaId, program, docType]);

  const areaOptions = useMemo(() => {
    const ids = [...new Set(featuredPool.map((d) => d.areaId).filter(Boolean))];
    return ids
      .map((id) => ({ value: id, label: lookup.area(id)?.name || id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [featuredPool, lookup]);

  const programOptions = useMemo(
    () => [...new Set(featuredPool.map((d) => d.program).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [featuredPool]
  );

  const docTypeOptions = useMemo(
    () => [...new Set(featuredPool.map((d) => d.docType).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [featuredPool]
  );

  const hasFilters = Boolean(query.trim() || areaId || program || docType);
  const clearFilters = () => {
    setQuery('');
    setAreaId('');
    setProgram('');
    setDocType('');
  };

  const visibleDocs = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  const selectClass =
    'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

  return (
    <div className="space-y-8 sm:space-y-10">
      <section
        aria-labelledby="open-featured-heading"
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
              id="open-featured-heading"
              className="mt-2 font-sans text-[24px] font-extrabold tracking-tight text-ink xs:text-[28px] sm:text-[32px]"
            >
              Featured Documents
            </h1>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted sm:text-[15px]">
              Highlights from the Faculty & Staff Resource Center, automatically selected from the most recently published
              eligible documents. A dedicated featured designation is not yet available in this prototype.
            </p>
          </div>
          <div className="panel flex min-w-[10.5rem] items-center gap-3 px-4 py-3 shadow-none">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
              <SparklesIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Featured now</p>
              <p className="text-xl font-extrabold tabular-nums text-ink">{formatNumber(featuredPool.length)}</p>
              <p className="text-[11px] text-ink-subtle">{pluralize(totalPublished, 'published document')}</p>
            </div>
          </div>
        </div>
      </section>

      {totalPublished === 0 ? (
        <section className="panel">
          <EmptyState
            icon={SparklesIcon}
            title="Currently, there are no publicly published documents."
            description="Featured highlights will appear here once the Quality Assurance Office publishes documents for public access."
            action={
              <Link to="/open/browse" className="btn btn-secondary">
                Accreditation Repository
              </Link>
            }
          />
        </section>
      ) : (
        <section aria-labelledby="featured-results-heading" className="space-y-4">
          <div>
            <h2 id="featured-results-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              Featured collection
            </h2>
            <p className="mt-1 text-[13px] font-medium text-ink-muted">
              Showing {formatNumber(filtered.length)} of {pluralize(featuredPool.length, 'featured document')}
            </p>
          </div>

          <div className="panel p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="sm:col-span-2 xl:col-span-1">
                <label htmlFor="featured-search" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Search within featured
                </label>
                <div className="relative">
                  <SearchIcon
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                    aria-hidden="true"
                  />
                  <input
                    id="featured-search"
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
                <label htmlFor="featured-filter-area" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Accreditation Area
                </label>
                <select
                  id="featured-filter-area"
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
                <label htmlFor="featured-filter-program" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Academic Program
                </label>
                <select
                  id="featured-filter-program"
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
                <label htmlFor="featured-filter-type" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                  Document Type
                </label>
                <select
                  id="featured-filter-type"
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
            </div>

            {hasFilters ? (
              <div className="mt-3 flex justify-end">
                <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={FileStackIcon}
                title="No documents match your selected filters."
                description="Try adjusting or clearing filters to view featured documents."
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
                      ({formatNumber(filtered.length - visibleCount)} remaining)
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
