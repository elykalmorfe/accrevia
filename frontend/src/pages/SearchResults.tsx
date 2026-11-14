import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  XIcon
} from 'lucide-react';
import { usePortal } from '../contexts/PortalContext';
import { useLookup } from '../hooks/useLookup';
import { useAccess } from '../hooks/useAccess';
import { parseIntent, searchEvidence, SearchResult } from '../utils/search';
import { uniqueValues } from '../utils/format';
import { documentTypes, searchSuggestions } from '../data/options';
import { SelectField } from '../components/ui/SelectField';
import { SearchResultCard } from '../components/search/SearchResultCard';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { EmptyState } from '../components/ui/EmptyState';
import { GlobalSearch } from '../components/layout/GlobalSearch';
import { searchVerifiedCatalog } from '../services/repository/verifiedCatalogSearch';

type FilterKey = 'frameworkId' | 'areaId' | 'criterionId' | 'indicatorId' | 'docType' | 'program' | 'academicYear';
type Filters = Record<FilterKey, string>;
type SortKey = 'relevance' | 'newest' | 'oldest' | 'name';

const PAGE_SIZE = 10;

/** URL parameter for each filter, so results survive opening a document and coming back. */
const filterParams: Record<FilterKey, string> = {
  frameworkId: 'framework',
  areaId: 'area',
  criterionId: 'criterion',
  indicatorId: 'indicator',
  docType: 'type',
  program: 'program',
  academicYear: 'year'
};
const filterKeys = Object.keys(filterParams) as FilterKey[];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Sort: Relevance' },
  { value: 'newest', label: 'Sort: Newest first' },
  { value: 'oldest', label: 'Sort: Oldest first' },
  { value: 'name', label: 'Sort: Document name' }
];

const activeFilterClass =
  '[&_select]:border-brand-300 [&_select]:bg-brand-50/60 [&_select]:font-medium [&_select]:text-brand-800';
const disabledFilterClass =
  '[&_select:disabled]:cursor-not-allowed [&_select:disabled]:border-dashed [&_select:disabled]:opacity-70';

export function SearchResults() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const { frameworks, areas, criteria, indicators, addRecentSearch, isAdmin } = usePortal();
  const { accessibleDocuments: documents } = useAccess();
  const lookup = useLookup();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [preview, setPreview] = useState<SearchResult | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 260);
    return () => clearTimeout(timer);
  }, [query, attempt]);

  const indexedDocs = useMemo(() => documents.filter((d) => d.status === 'Indexed'), [documents]);

  const areasFor = (frameworkId: string) =>
    frameworkId
      ? areas.filter(
          (a) =>
            criteria.some((c) => c.frameworkId === frameworkId && c.areaId === a.id) ||
            indexedDocs.some((d) => d.frameworkId === frameworkId && d.areaId === a.id)
        )
      : areas;
  const criteriaFor = (frameworkId: string, areaId: string) =>
    criteria.filter((c) => (!frameworkId || c.frameworkId === frameworkId) && (!areaId || c.areaId === areaId));

  /** Clears child selections that no longer fit their parent (framework → area → criterion → indicator). */
  const normalize = (f: Filters): Filters => {
    const next = { ...f };
    if (next.areaId && !areasFor(next.frameworkId).some((a) => a.id === next.areaId)) next.areaId = '';
    if (next.criterionId && !criteriaFor(next.frameworkId, next.areaId).some((c) => c.id === next.criterionId)) next.criterionId = '';
    if (next.indicatorId && !indicators.some((i) => i.id === next.indicatorId && i.criterionId === next.criterionId)) next.indicatorId = '';
    return next;
  };

  const rawFilters = Object.fromEntries(filterKeys.map((k) => [k, params.get(filterParams[k]) ?? ''])) as Filters;
  const filters = normalize(rawFilters);
  const sort = (sortOptions.some((o) => o.value === params.get('sort')) ? params.get('sort') : 'relevance') as SortKey;
  const requestedPage = Math.max(1, Number(params.get('page')) || 1);

  const updateParams = (patch: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      },
      { replace: true }
    );

  const setFilter = (key: FilterKey, value: string) => {
    const next = normalize({ ...filters, [key]: value });
    updateParams({ ...Object.fromEntries(filterKeys.map((k) => [filterParams[k], next[k]])), page: '' });
  };
  const clearFilters = () => updateParams({ ...Object.fromEntries(filterKeys.map((k) => [filterParams[k], ''])), page: '' });

  const outcome = useMemo(() => {
    try {
      return { results: searchEvidence(query, documents, lookup), failed: false };
    } catch {
      return { results: [] as SearchResult[], failed: true };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, documents, lookup, attempt]);
  const { results, failed } = outcome;

  const verifiedHits = useMemo(
    () => (query.trim().length > 1 ? searchVerifiedCatalog({ q: query.trim() }).slice(0, 8) : []),
    [query]
  );

  const filterSignature = filterKeys.map((k) => filters[k]).join('|');
  const filtered = useMemo(() => {
    const list = results.filter(({ doc }) => filterKeys.every((k) => !filters[k] || doc[k] === filters[k]));
    const byDate = (a: SearchResult, b: SearchResult) =>
      (a.doc.documentDate || a.doc.dateAdded || '').localeCompare(b.doc.documentDate || b.doc.dateAdded || '');
    if (sort === 'newest') return [...list].sort((a, b) => byDate(b, a));
    if (sort === 'oldest') return [...list].sort(byDate);
    if (sort === 'name') return [...list].sort((a, b) => a.doc.title.localeCompare(b.doc.title));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, sort, filterSignature]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageResults = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const goToPage = (next: number) => {
    updateParams({ page: next > 1 ? String(next) : '' });
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeCount = filterKeys.filter((k) => filters[k]).length;
  const intent = useMemo(() => parseIntent(query), [query]);
  const interpretation = [
    intent.frameworkId && lookup.framework(intent.frameworkId)?.name,
    intent.indicatorCode ? `Indicator ${intent.indicatorCode}` : intent.criterionNumber ? `Criterion ${intent.criterionNumber}` : null,
    intent.year && `Year ${intent.year}`
  ].filter(Boolean) as string[];

  const runExample = (q: string) => {
    addRecentSearch(q);
    setParams({ q });
  };

  const availableAreas = areasFor(filters.frameworkId);
  const availableCriteria = criteriaFor(filters.frameworkId, filters.areaId);
  const availableIndicators = indicators.filter((i) => i.criterionId === filters.criterionId);
  const presentTypes = new Set(indexedDocs.map((d) => d.docType));
  const typeOptions = documentTypes.filter((t) => presentTypes.has(t) || t === filters.docType);
  const programOptions = uniqueValues(indexedDocs, (d) => d.program);
  const yearOptions = uniqueValues(indexedDocs, (d) => d.academicYear).reverse();

  const filterProps = (key: FilterKey, label: string, width: string) => ({
    label,
    compact: true,
    value: filters[key],
    onChange: (v: string) => setFilter(key, v),
    labelClassName: 'mb-1 block text-[11px] font-medium text-ink-muted',
    className: `min-w-0 ${width} ${disabledFilterClass} ${filters[key] ? activeFilterClass : ''}`
  });

  const filterRowClass = 'grid gap-2 md:grid-cols-[9rem_minmax(0,1fr)] md:items-center md:gap-4';
  const filterGroupLabelClass = 'whitespace-nowrap text-[10.5px] font-semibold uppercase leading-4 tracking-wider text-ink-subtle md:pt-5';
  const filterFieldsClass = 'grid grid-cols-2 gap-x-3 gap-y-2.5 sm:flex sm:flex-wrap sm:gap-3';
  const filterPairClass = 'contents sm:flex sm:gap-3';

  const searchHeader = (
    <section aria-labelledby="search-heading" className="mb-5 max-w-3xl">
      <h1 id="search-heading" className="sr-only">
        Search accreditation evidence
      </h1>
      <GlobalSearch
        className="max-w-none"
        variant="prominent"
        placeholder="Search accreditation documents, criteria, or keywords..."
        matchInputWidth
      />
      {query.trim() && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-ink-muted">
          <span>Active search:</span>
          <span className="inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-full border border-brand-200 bg-brand-50 py-0.5 pl-2.5 pr-0.5 text-xs font-semibold text-brand-800">
            <span className="min-w-0 break-words">{query}</span>
            <button
              type="button"
              onClick={() => setParams({})}
              aria-label={`Remove search query “${query}”`}
              title="Remove search query"
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-brand-600 hover:bg-brand-100 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              <XIcon className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        </div>
      )}
      {query.trim() && (!isAdmin || interpretation.length > 0) && (
        <p className="mt-2 text-xs text-ink-muted">
          {!isAdmin && 'Showing only evidence that has been shared with you.'}
          {!isAdmin && interpretation.length > 0 && ' '}
          {interpretation.length > 0 && (
            <>
              Ranking boosted for: <span className="font-medium text-ink">{interpretation.join(' · ')}</span>
            </>
          )}
        </p>
      )}
    </section>
  );

  if (!query.trim()) {
    return (
      <>
        {searchHeader}
        <div className="panel">
          <EmptyState
            icon={SearchIcon}
            title="Search accreditation evidence"
            description="Try a keyword, a natural-language request, a criterion number, or a framework."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {searchSuggestions.slice(0, 4).map((s) => (
                  <button key={s} type="button" className="btn btn-secondary btn-sm" onClick={() => runExample(s)}>
                    {s}
                  </button>
                ))}
              </div>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      {searchHeader}

      <div className="mb-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3.5 sm:px-5">
        <button
          type="button"
          className="btn btn-secondary btn-sm w-full justify-center sm:hidden"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          aria-controls="search-filters"
        >
          <SlidersHorizontalIcon className="h-3.5 w-3.5" /> {showFilters ? 'Hide filters' : 'Show filters'}
          {activeCount > 0 && ` (${activeCount})`}
        </button>
        <div id="search-filters" className={`${showFilters ? 'flex' : 'hidden'} mt-3 flex-col gap-3 sm:mt-0 sm:flex`}>
          <div role="group" aria-labelledby="filters-accreditation" className={filterRowClass}>
            <p id="filters-accreditation" className={filterGroupLabelClass}>
              Accreditation filters
            </p>
            <div className={filterFieldsClass}>
              <div className={filterPairClass}>
                <SelectField {...filterProps('frameworkId', 'Framework', 'sm:w-40')} placeholder="All frameworks" options={frameworks.map((f) => ({ value: f.id, label: f.shortName === 'ISO' ? 'ISO' : f.name }))} />
                <SelectField {...filterProps('areaId', 'Area', 'sm:w-40')} placeholder={availableAreas.length ? 'All areas' : 'None available'} disabled={availableAreas.length === 0} options={availableAreas.map((a) => ({ value: a.id, label: a.name }))} />
              </div>
              <div className={filterPairClass}>
                <SelectField {...filterProps('criterionId', 'Criterion', 'sm:w-40')} placeholder={availableCriteria.length ? 'All criteria' : 'None available'} disabled={availableCriteria.length === 0} options={availableCriteria.map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))} />
                <SelectField {...filterProps('indicatorId', 'Indicator', 'sm:w-40')} placeholder={!filters.criterionId ? 'Select a criterion' : availableIndicators.length ? 'All indicators' : 'None available'} disabled={!filters.criterionId || availableIndicators.length === 0} options={availableIndicators.map((i) => ({ value: i.id, label: `${i.code} ${i.name}` }))} />
              </div>
            </div>
          </div>
          <div role="group" aria-labelledby="filters-additional" className={`${filterRowClass} border-t border-slate-200/70 pt-3`}>
            <p id="filters-additional" className={filterGroupLabelClass}>
              Additional filters
            </p>
            <div className={filterFieldsClass}>
              <SelectField {...filterProps('docType', 'Document type', 'sm:w-48')} placeholder={typeOptions.length ? 'All types' : 'None available'} disabled={typeOptions.length === 0} options={typeOptions} />
              <SelectField {...filterProps('program', 'Program', 'sm:w-44')} placeholder={programOptions.length ? 'All programs' : 'None available'} disabled={programOptions.length === 0} options={programOptions} />
              <SelectField {...filterProps('academicYear', 'Year', 'sm:w-36')} placeholder={yearOptions.length ? 'All years' : 'None available'} disabled={yearOptions.length === 0} options={yearOptions} />
            </div>
          </div>
        </div>
      </div>

      {verifiedHits.length > 0 ? (
        <section
          aria-labelledby="verified-repo-hits"
          className="mb-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3.5 sm:px-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="verified-repo-hits" className="text-sm font-extrabold text-emerald-950">
              Verified accreditation catalog
            </h2>
            <Link
              to={`/open/search?q=${encodeURIComponent(query.trim())}`}
              className="text-[12px] font-semibold text-brand-700 hover:underline"
            >
              View all in Faculty search
            </Link>
          </div>
          <p className="mt-1 text-[12px] font-medium text-emerald-900/80">
            {verifiedHits.length} matching AACCUP certificate or COPC record
            {verifiedHits.length === 1 ? '' : 's'} (metadata searchable even when local files are missing).
          </p>
          <ul className="mt-3 space-y-2">
            {verifiedHits.map((hit) => (
              <li key={hit.id}>
                <Link
                  to={hit.href}
                  className="flex flex-col gap-0.5 rounded-xl border border-emerald-100 bg-surface px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">{hit.title}</span>
                    <span className="block truncate text-[11px] font-medium text-ink-muted">
                      {[hit.categoryLabel, hit.campus, hit.program].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                    Open repository
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div ref={listTopRef} className="mb-3 flex scroll-mt-20 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm text-ink" aria-live="polite">
            {loading ? (
              'Searching the evidence repository…'
            ) : failed ? (
              'Search unavailable'
            ) : (
              <>
                <span className="font-semibold">{filtered.length}</span> evidence document{filtered.length === 1 ? '' : 's'} found
                {activeCount > 0 && <span className="text-ink-muted"> · {results.length} before filters</span>}
                {pageCount > 1 && (
                  <span className="text-ink-muted">
                    {' '}· showing {pageStart + 1}–{pageStart + pageResults.length}
                  </span>
                )}
              </>
            )}
          </p>
          {activeCount > 0 && (
            <button type="button" className="btn btn-ghost btn-sm h-7 min-h-0 gap-1 px-2 text-xs" onClick={clearFilters}>
              <XIcon className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters ({activeCount})
            </button>
          )}
        </div>
        <SelectField compact label="Sort by" hideLabel value={sort} onChange={(v) => updateParams({ sort: v === 'relevance' ? '' : v, page: '' })} options={sortOptions} className="w-48" />
      </div>

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel flex animate-pulse flex-col gap-4 p-5 sm:flex-row sm:gap-6">
              <div className="space-y-2 sm:w-20">
                <div className="h-6 w-14 rounded bg-canvas" />
                <div className="h-1 w-16 rounded bg-canvas" />
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-2/3 rounded bg-canvas" />
                <div className="h-3 w-1/2 rounded bg-canvas" />
                <div className="h-10 w-full rounded-lg bg-canvas" />
                <div className="h-3 w-5/6 rounded bg-canvas" />
                <div className="flex gap-2 pt-1">
                  <div className="h-8 w-28 rounded-lg bg-canvas" />
                  <div className="h-8 w-20 rounded-lg bg-canvas" />
                  <div className="h-8 w-20 rounded-lg bg-canvas" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <div className="panel">
          <EmptyState
            icon={AlertTriangleIcon}
            title="We couldn't complete this search"
            description="Something went wrong while searching the evidence repository. Please try again."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setAttempt((a) => a + 1)}>
                Retry search
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={SearchXIcon}
            title="No Results Found"
            description={
              results.length
                ? 'No documents match your search with the current filters. Remove one or more filters to see more results.'
                : 'No documents match your search. Try different or broader keywords, describe the evidence in your own words, or search by criterion number.'
            }
            action={
              activeCount > 0 ? (
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pageResults.map((r) => (
              <SearchResultCard key={r.doc.id} result={r} query={query} onPreview={() => setPreview(r)} />
            ))}
          </div>

          {pageCount > 1 && (
            <nav aria-label="Search results pages" className="mt-5 flex items-center justify-between gap-3">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                <ChevronLeftIcon className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-[13px] text-ink-muted">
                Page <span className="font-semibold text-ink">{page}</span> of {pageCount}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => goToPage(page + 1)} disabled={page === pageCount}>
                Next <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </nav>
          )}
        </>
      )}

      <DocumentPreviewModal doc={preview?.doc ?? null} terms={preview?.terms} query={query} onClose={() => setPreview(null)} />
    </>
  );
}
