import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { parseIntent, SearchResult } from '../utils/search';
import { academicYears, searchSuggestions } from '../data/options';
import { documentTypeSearchOptions, programSearchOptions } from '../data/searchParameters';
import { usePortalSettings } from '../settings/portalSettings';
import { SelectField } from '../components/ui/SelectField';
import { SearchResultCard } from '../components/search/SearchResultCard';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { EmptyState } from '../components/ui/EmptyState';
import { GlobalSearch } from '../components/layout/GlobalSearch';
import { searchEvidenceAsync, searchParameterParams, SearchParameter } from '../services/search/evidenceSearchClient';

type Filters = Record<SearchParameter, string>;
type SortKey = 'relevance' | 'newest' | 'oldest' | 'name';

const PAGE_SIZE = 10;

/** Retired accreditation query keys. Search now keeps only the three parameters below. */
const retiredSearchParams = ['framework', 'area', 'criterion', 'indicator'];

const searchParameterFields: {
  key: SearchParameter;
  label: string;
  placeholder: string;
  width: string;
}[] = [
  { key: 'docType', label: 'Document type', placeholder: 'All types', width: 'sm:w-52' },
  { key: 'program', label: 'Program', placeholder: 'All programs', width: 'sm:w-80' },
  { key: 'academicYear', label: 'Academic year', placeholder: 'All years', width: 'sm:w-40' }
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Sort: Relevance' },
  { value: 'newest', label: 'Sort: Newest first' },
  { value: 'oldest', label: 'Sort: Oldest first' },
  { value: 'name', label: 'Sort: Document name' }
];

const activeFilterClass =
  '[&_select]:border-brand-300 [&_select]:bg-brand-50/60 [&_select]:font-medium [&_select]:text-brand-800';

function acceptedParameter(options: readonly string[], raw: string) {
  return options.includes(raw) ? raw : '';
}

export function SearchResults() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const { addRecentSearch, isAdmin } = usePortal();
  const configuredYears = usePortalSettings().accreditation.academicYears;
  const searchParameters = useMemo(() => {
    const optionSets: Record<SearchParameter, readonly string[]> = {
      docType: documentTypeSearchOptions,
      program: programSearchOptions,
      academicYear: configuredYears.length > 0 ? configuredYears : academicYears
    };
    return searchParameterFields.map((field) => ({ ...field, options: optionSets[field.key] }));
  }, [configuredYears]);
  const { accessibleDocuments: documents } = useAccess();
  const lookup = useLookup();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [failed, setFailed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [preview, setPreview] = useState<SearchResult | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  const filters = Object.fromEntries(
    searchParameters.map((parameter) => [
      parameter.key,
      acceptedParameter(parameter.options, params.get(searchParameterParams[parameter.key]) ?? '')
    ])
  ) as Filters;
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

  const setFilter = (key: SearchParameter, value: string) => {
    const parameter = searchParameters.find((item) => item.key === key);
    updateParams({
      [searchParameterParams[key]]: parameter ? acceptedParameter(parameter.options, value) : '',
      page: ''
    });
  };
  const clearFilters = () =>
    updateParams({
      ...Object.fromEntries(searchParameters.map((parameter) => [searchParameterParams[parameter.key], ''])),
      ...Object.fromEntries(retiredSearchParams.map((key) => [key, ''])),
      page: ''
    });

  useEffect(() => {
    const stale = [
      ...retiredSearchParams.filter((key) => params.has(key)),
      ...searchParameters
        .filter((parameter) => {
          const raw = params.get(searchParameterParams[parameter.key]);
          return Boolean(raw) && !parameter.options.includes(raw as string);
        })
        .map((parameter) => searchParameterParams[parameter.key])
    ];
    if (stale.length === 0) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        stale.forEach((key) => next.delete(key));
        return next;
      },
      { replace: true }
    );
  }, [params, setParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { results: next } = await searchEvidenceAsync(query, documents, lookup, {
          docType: filters.docType || undefined,
          program: filters.program || undefined,
          academicYear: filters.academicYear || undefined
        });
        if (!cancelled) {
          setResults(next);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, documents, lookup, attempt, filters.docType, filters.program, filters.academicYear]);

  const sorted = useMemo(() => {
    const byDate = (a: SearchResult, b: SearchResult) =>
      (a.doc.documentDate || a.doc.dateAdded || '').localeCompare(b.doc.documentDate || b.doc.dateAdded || '');
    if (sort === 'newest') return [...results].sort((a, b) => byDate(b, a));
    if (sort === 'oldest') return [...results].sort(byDate);
    if (sort === 'name') return [...results].sort((a, b) => a.doc.title.localeCompare(b.doc.title));
    return results;
  }, [results, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageResults = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  const goToPage = (next: number) => {
    updateParams({ page: next > 1 ? String(next) : '' });
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeCount = searchParameters.filter((parameter) => filters[parameter.key]).length;
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

  const filterRowClass = 'grid gap-2 md:grid-cols-[9rem_minmax(0,1fr)] md:items-center md:gap-4';
  const filterGroupLabelClass = 'whitespace-nowrap text-[10.5px] font-semibold uppercase leading-4 tracking-wider text-ink-subtle md:pt-5';
  const filterFieldsClass = 'grid grid-cols-2 gap-x-3 gap-y-2.5 sm:flex sm:flex-wrap sm:gap-3';

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
          <div role="group" aria-labelledby="filters-search" className={filterRowClass}>
            <p id="filters-search" className={filterGroupLabelClass}>
              Search parameters
            </p>
            <div className={filterFieldsClass}>
              {searchParameters.map((parameter) => (
                <SelectField
                  key={parameter.key}
                  label={parameter.label}
                  compact
                  value={filters[parameter.key]}
                  onChange={(value) => setFilter(parameter.key, value)}
                  placeholder={parameter.placeholder}
                  options={parameter.options}
                  labelClassName="mb-1 block text-[11px] font-medium text-ink-muted"
                  className={`min-w-0 ${parameter.width} ${filters[parameter.key] ? activeFilterClass : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={listTopRef} className="mb-3 flex scroll-mt-20 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm text-ink" aria-live="polite">
            {loading ? (
              'Searching the evidence repository…'
            ) : failed ? (
              'Search unavailable'
            ) : (
              <>
                <span className="font-semibold">{sorted.length}</span> evidence document{sorted.length === 1 ? '' : 's'} found
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
      ) : sorted.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={SearchXIcon}
            title="No Results Found"
            description={
              activeCount > 0
                ? 'No documents match your search with the current parameters. Clear one or more to see more results.'
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
