import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon, SearchXIcon, SlidersHorizontalIcon } from 'lucide-react';
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

type FilterKey = 'frameworkId' | 'areaId' | 'criterionId' | 'indicatorId' | 'docType' | 'program' | 'academicYear';
const emptyFilters: Record<FilterKey, string> = {
  frameworkId: '', areaId: '', criterionId: '', indicatorId: '', docType: '', program: '', academicYear: ''
};

export function SearchResults() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const { frameworks, areas, criteria, indicators, addRecentSearch, isAdmin } = usePortal();
  const { accessibleDocuments: documents } = useAccess();
  const lookup = useLookup();
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState<'relevance' | 'newest'>('relevance');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [preview, setPreview] = useState<SearchResult | null>(null);

  useEffect(() => {
    setLoading(true);
    setFilters(emptyFilters);
    const timer = setTimeout(() => setLoading(false), 260);
    return () => clearTimeout(timer);
  }, [query]);

  const intent = useMemo(() => parseIntent(query), [query]);
  const results = useMemo(() => searchEvidence(query, documents, lookup), [query, documents, lookup]);

  const filtered = useMemo(() => {
    const list = results.filter(({ doc }) => (Object.keys(filters) as FilterKey[]).every((k) => !filters[k] || doc[k] === filters[k]));
    return sort === 'newest' ? [...list].sort((a, b) => b.doc.documentDate.localeCompare(a.doc.documentDate)) : list;
  }, [results, filters, sort]);

  const setFilter = (key: FilterKey, value: string) =>
  setFilters((f) => {
    const next = { ...f, [key]: value };
    if (key === 'frameworkId' || key === 'areaId') {
      next.criterionId = '';
      next.indicatorId = '';
    }
    if (key === 'criterionId') next.indicatorId = '';
    return next;
  });

  const activeCount = Object.values(filters).filter(Boolean).length;
  const indexedDocs = documents.filter((d) => d.status === 'Indexed');

  const interpretation = [
  intent.frameworkId && lookup.framework(intent.frameworkId)?.name,
  intent.indicatorCode ? `Indicator ${intent.indicatorCode}` : intent.criterionNumber ? `Criterion ${intent.criterionNumber}` : null,
  intent.year && `Year ${intent.year}`].
  filter(Boolean) as string[];

  const runExample = (q: string) => {
    addRecentSearch(q);
    setParams({ q });
  };

  if (!query.trim()) {
    return (
      <div className="panel">
        <EmptyState
          icon={SearchIcon}
          title="Search accreditation evidence"
          description="Use the search bar at the top of any page. Try a keyword, a natural-language request, a criterion number, or a framework."
          action={
          <div className="flex flex-wrap justify-center gap-2">
              {searchSuggestions.slice(0, 4).map((s) =>
            <button key={s} type="button" className="btn btn-secondary btn-sm" onClick={() => runExample(s)}>
                  {s}
                </button>
            )}
            </div>
          } />
        
      </div>);

  }

  return (
    <>
      <div className="mb-5">
        <p className="text-[13px] text-ink-muted">Search Results</p>
        <h1 className="mt-1 flex items-start gap-2.5 font-serif text-2xl font-semibold leading-snug text-ink">
          <SearchIcon className="mt-1.5 h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
          <span className="min-w-0 break-words">{query}</span>
        </h1>
        {!isAdmin &&
        <p className="mt-2 text-[13px] text-ink-muted">Showing only evidence that has been shared with you.</p>
        }
        {interpretation.length > 0 &&
        <p className="mt-2 text-[13px] text-ink-muted">
            Ranking boosted for: <span className="font-medium text-ink">{interpretation.join(' · ')}</span>
          </p>
        }
      </div>

      <div className="panel mb-4 p-3">
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontalIcon className="h-3.5 w-3.5" /> Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
        </div>
        <div className={`${showFilters ? 'grid' : 'hidden'} mt-3 grid-cols-2 gap-2 sm:mt-0 sm:flex sm:flex-wrap sm:items-center`}>
          <span className="hidden text-[13px] font-medium text-ink-muted sm:inline">Filters:</span>
          <SelectField compact hideLabel label="Framework" value={filters.frameworkId} onChange={(v) => setFilter('frameworkId', v)} placeholder="Framework" options={frameworks.map((f) => ({ value: f.id, label: f.shortName === 'ISO' ? 'ISO' : f.name }))} className="sm:w-48" />
          <SelectField compact hideLabel label="Area" value={filters.areaId} onChange={(v) => setFilter('areaId', v)} placeholder="Area" options={areas.map((a) => ({ value: a.id, label: a.name }))} className="sm:w-44" />
          <SelectField compact hideLabel label="Criterion" value={filters.criterionId} onChange={(v) => setFilter('criterionId', v)} placeholder="Criterion" options={criteria.filter((c) => (!filters.frameworkId || c.frameworkId === filters.frameworkId) && (!filters.areaId || c.areaId === filters.areaId)).map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` }))} className="sm:w-44" />
          <SelectField compact hideLabel label="Indicator" value={filters.indicatorId} onChange={(v) => setFilter('indicatorId', v)} placeholder="Indicator" disabled={!filters.criterionId} options={indicators.filter((i) => i.criterionId === filters.criterionId).map((i) => ({ value: i.id, label: `${i.code} ${i.name}` }))} className="sm:w-40" />
          <SelectField compact hideLabel label="Document type" value={filters.docType} onChange={(v) => setFilter('docType', v)} placeholder="Document Type" options={documentTypes} className="sm:w-44" />
          <SelectField compact hideLabel label="Program" value={filters.program} onChange={(v) => setFilter('program', v)} placeholder="Program" options={uniqueValues(indexedDocs, (d) => d.program)} className="sm:w-44" />
          <SelectField compact hideLabel label="Academic year" value={filters.academicYear} onChange={(v) => setFilter('academicYear', v)} placeholder="Year" options={uniqueValues(indexedDocs, (d) => d.academicYear).reverse()} className="sm:w-32" />
          {activeCount > 0 &&
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilters(emptyFilters)}>
              Clear filters
            </button>
          }
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink" aria-live="polite">
          {loading ? 'Searching the evidence repository…' :
          <>
              <span className="font-semibold">{filtered.length}</span> relevant document{filtered.length === 1 ? '' : 's'} found
              {activeCount > 0 && <span className="text-ink-muted"> · {results.length} before filters</span>}
            </>
          }
        </p>
        <SelectField compact label="Sort by" hideLabel value={sort} onChange={(v) => setSort(v as 'relevance' | 'newest')} options={[{ value: 'relevance', label: 'Sort: Relevance' }, { value: 'newest', label: 'Sort: Newest first' }]} className="w-44" />
      </div>

      {loading ?
      <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) =>
        <div key={i} className="panel flex animate-pulse gap-6 p-5">
              <div className="h-8 w-16 rounded bg-canvas" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-2/3 rounded bg-canvas" />
                <div className="h-3 w-1/2 rounded bg-canvas" />
                <div className="h-3 w-full rounded bg-canvas" />
              </div>
            </div>
        )}
        </div> :
      filtered.length === 0 ?
      <div className="panel">
          <EmptyState
          icon={SearchXIcon}
          title={results.length ? 'No results match these filters' : 'No relevant evidence found'}
          description={
          results.length ?
          'Remove one or more filters to see more results.' :
          'Try broader terms, describe the evidence in your own words, or search by criterion number.'
          }
          action={
          results.length ?
          <button type="button" className="btn btn-secondary" onClick={() => setFilters(emptyFilters)}>
                  Clear filters
                </button> :
          undefined
          } />
        
        </div> :

      <div className="space-y-3">
          {filtered.map((r) =>
        <SearchResultCard key={r.doc.id} result={r} query={query} onPreview={() => setPreview(r)} />
        )}
        </div>
      }

      <DocumentPreviewModal doc={preview?.doc ?? null} terms={preview?.terms} query={query} onClose={() => setPreview(null)} />
    </>);

}