import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileSearchIcon, FileTextIcon, SearchIcon, XIcon } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatNumber, pluralize } from '../../utils/format';
import {
  filterFacultyDiscoverableEvidence,
  classifyEvidenceForFaculty,
  isFacultyDiscoverable
} from '../../services/repository/facultyAccessVisibility';
import { PublicDocumentPreviewModal } from '../../components/open/PublicDocumentPreviewModal';
import type { EvidenceDocument } from '../../types/evidence';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { searchEvidence } from '../../utils/search';
import { searchEvidenceAsync } from '../../services/search/evidenceSearchClient';
import { documentTypeSearchOptions, programSearchOptions } from '../../data/searchParameters';
import { usePortalSettings } from '../../settings/portalSettings';

const PAGE_SIZE = 12;

type EvidenceSearchHit = {
  id: string;
  title: string;
  category: 'public-evidence' | 'authorized-evidence';
  categoryLabel: string;
  campus?: string;
  college?: string;
  program?: string;
  documentType?: string;
  locationPath?: string;
  href: string;
  evidence: EvidenceDocument;
  score: number;
};

type SearchState = {
  q: string;
  program: string;
  type: string;
  year: string;
};

const allowedParam = (options: readonly string[], value: string) => (options.includes(value) ? value : '');

function readSearchState(params: URLSearchParams, years: readonly string[]): SearchState {
  return {
    q: params.get('q') ?? '',
    program: allowedParam(programSearchOptions, params.get('program') ?? ''),
    type: allowedParam(documentTypeSearchOptions, params.get('type') ?? ''),
    year: allowedParam(years, params.get('year') ?? '')
  };
}

function writeSearchParams(state: SearchState): URLSearchParams {
  const next = new URLSearchParams();
  if (state.q.trim()) next.set('q', state.q.trim());
  if (state.type) next.set('type', state.type);
  if (state.program) next.set('program', state.program);
  if (state.year) next.set('year', state.year);
  return next;
}

const emptyState: SearchState = {
  q: '',
  program: '',
  type: '',
  year: ''
};

function FilterField({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function CategoryBadge({ hit }: { hit: EvidenceSearchHit }) {
  if (hit.category === 'authorized-evidence') {
    return (
      <span className="rounded-full border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-800">
        Shared with you
      </span>
    );
  }
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900">
      Publicly published
    </span>
  );
}

export function OpenSearch() {
  const [params, setParams] = useSearchParams();
  const yearOptions = usePortalSettings().accreditation.academicYears;
  const urlState = useMemo(() => readSearchState(params, yearOptions), [params, yearOptions]);
  const { documents, currentUser, shares } = usePortal();
  const lookup = useLookup();

  const [draftQuery, setDraftQuery] = useState(urlState.q);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceDocument | null>(null);

  useEffect(() => {
    const written = writeSearchParams(urlState);
    if (params.toString() !== written.toString()) setParams(written, { replace: true });
  }, [params, urlState, setParams]);

  useEffect(() => {
    setDraftQuery(urlState.q);
    setVisibleCount(PAGE_SIZE);
  }, [urlState.q, urlState.program, urlState.type, urlState.year]);

  const discoverable = useMemo(
    () => filterFacultyDiscoverableEvidence(documents, currentUser, shares),
    [documents, currentUser, shares]
  );

  const [apiEvidenceHits, setApiEvidenceHits] = useState<EvidenceSearchHit[]>([]);

  const localHits = useMemo(() => {
    let evidencePool = discoverable;
    if (urlState.program) {
      evidencePool = evidencePool.filter((d) => d.program === urlState.program);
    }
    if (urlState.type) {
      evidencePool = evidencePool.filter((d) => d.docType === urlState.type);
    }
    if (urlState.year) {
      evidencePool = evidencePool.filter((d) => d.academicYear === urlState.year);
    }

    const q = urlState.q.trim();
    const scored =
      q.length > 1
        ? searchEvidence(q, evidencePool, lookup)
        : evidencePool.map((doc) => ({ doc, score: 0 }));

    const evidenceHits: EvidenceSearchHit[] = [];
    for (const { doc, score } of scored) {
      const visibility = classifyEvidenceForFaculty(doc, currentUser, shares);
      if (visibility !== 'public' && visibility !== 'authorized') continue;
      const category = visibility === 'public' ? 'public-evidence' : 'authorized-evidence';
      evidenceHits.push({
        id: `evidence-${doc.id}`,
        title: doc.title,
        category,
        categoryLabel: visibility === 'public' ? 'Published' : 'Shared with you',
        campus: doc.campus || undefined,
        program: doc.program || undefined,
        documentType: doc.docType || undefined,
        href: `/open/search?q=${encodeURIComponent(doc.title)}`,
        evidence: doc,
        score
      });
    }

    return evidenceHits;
  }, [urlState, discoverable, lookup, currentUser, shares]);

  useEffect(() => {
    let cancelled = false;
    const q = urlState.q.trim();
    if (q.length <= 1) {
      setApiEvidenceHits([]);
      return;
    }
    (async () => {
      const { results, source } = await searchEvidenceAsync(q, discoverable, lookup, {
        docType: urlState.type || undefined,
        program: urlState.program || undefined,
        academicYear: urlState.year || undefined
      });
      if (cancelled || source !== 'api') {
        if (!cancelled && source === 'local') setApiEvidenceHits([]);
        return;
      }
      const evidenceHits: EvidenceSearchHit[] = [];
      for (const { doc, score } of results) {
        const visibility = classifyEvidenceForFaculty(doc, currentUser, shares);
        if (!isFacultyDiscoverable(visibility)) continue;
        if (visibility !== 'public' && visibility !== 'authorized') continue;
        evidenceHits.push({
          id: `evidence-${doc.id}`,
          title: doc.title,
          category: visibility === 'public' ? 'public-evidence' : 'authorized-evidence',
          categoryLabel: visibility === 'public' ? 'Publicly published' : 'Shared with you',
          campus: doc.campus || undefined,
          program: doc.program || undefined,
          documentType: doc.docType || undefined,
          href: `/open/search?q=${encodeURIComponent(doc.title)}`,
          evidence: doc,
          score
        });
      }
      if (!cancelled) setApiEvidenceHits(evidenceHits);
    })();
    return () => {
      cancelled = true;
    };
  }, [urlState.q, urlState.type, urlState.program, urlState.year, discoverable, lookup, currentUser, shares]);

  const hits = useMemo(
    () => (apiEvidenceHits.length > 0 ? apiEvidenceHits : localHits),
    [localHits, apiEvidenceHits]
  );

  const publicCount = hits.filter((h) => h.category === 'public-evidence').length;
  const authorizedCount = hits.filter((h) => h.category === 'authorized-evidence').length;

  const commitState = (next: SearchState, replace = false) => {
    setParams(writeSearchParams(next), { replace });
  };

  const patchFilters = (patch: Partial<SearchState>) => {
    commitState({ ...urlState, ...patch });
  };

  const onSubmitSearch = (e: FormEvent) => {
    e.preventDefault();
    commitState({ ...urlState, q: draftQuery.trim() });
  };

  const clearQuery = () => {
    setDraftQuery('');
    commitState({ ...urlState, q: '' });
  };

  const clearAll = () => {
    setDraftQuery('');
    commitState(emptyState);
  };

  const hasQuery = Boolean(urlState.q.trim());
  const hasFacetFilters = Boolean(urlState.program || urlState.type || urlState.year);
  const hasAnyFilters = hasQuery || hasFacetFilters;

  const visibleHits = hits.slice(0, visibleCount);
  const canLoadMore = visibleCount < hits.length;

  const selectClass =
    'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

  const openHit = (hit: EvidenceSearchHit) => setPreviewEvidence(hit.evidence);

  return (
    <div className="space-y-6 sm:space-y-8">
      <section
        aria-labelledby="open-search-heading"
        className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-canvas px-5 py-7 sm:px-8 sm:py-9"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Faculty &amp; Staff document search</p>
          <h1
            id="open-search-heading"
            className="mt-2 font-sans text-[24px] font-extrabold tracking-tight text-ink xs:text-[28px] sm:text-[32px]"
          >
            Search Documents
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] font-medium leading-relaxed text-ink-muted sm:text-[15px]">
            Search documents published for faculty and staff, or shared with you. Narrow the list with document type,
            program, and academic year.
          </p>

          <form onSubmit={onSubmitSearch} className="mt-5" role="search" aria-label="Search authorized documents">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <label htmlFor="open-search-input" className="sr-only">
                Search authorized documents
              </label>
              <div className="relative min-w-0 flex-1">
                <SearchIcon
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                  aria-hidden="true"
                />
                <input
                  id="open-search-input"
                  type="search"
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  placeholder="Search titles, programs, or keywords…"
                  className="h-12 w-full rounded-2xl border border-line bg-surface pl-10 pr-10 text-[16px] shadow-sm shadow-brand-900/5 hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 sm:text-[15px]"
                />
                {draftQuery ? (
                  <button
                    type="button"
                    onClick={clearQuery}
                    className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-subtle hover:bg-canvas hover:text-ink"
                    aria-label="Clear search"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <button type="submit" className="btn btn-primary h-12 shrink-0 px-6 sm:min-w-[8.5rem]">
                <SearchIcon className="h-4 w-4" />
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel p-4 sm:p-5" aria-label="Search parameters">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-ink">Search parameters</h2>
          {hasFacetFilters ? (
            <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearAll}>
              Clear parameters
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <FilterField label="Document type" htmlFor="open-filter-type">
            <select
              id="open-filter-type"
              className={selectClass}
              value={urlState.type}
              onChange={(e) => patchFilters({ type: e.target.value })}
            >
              <option value="">All document types</option>
              {documentTypeSearchOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Program" htmlFor="open-filter-program">
            <select
              id="open-filter-program"
              className={selectClass}
              value={urlState.program}
              onChange={(e) => patchFilters({ program: e.target.value })}
            >
              <option value="">All programs</option>
              {programSearchOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Academic year" htmlFor="open-filter-year">
            <select
              id="open-filter-year"
              className={selectClass}
              value={urlState.year}
              onChange={(e) => patchFilters({ year: e.target.value })}
            >
              <option value="">All academic years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </FilterField>
        </div>
      </section>

      <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-ink">{pluralize(hits.length, 'result')}</p>
              <p className="mt-0.5 text-[12px] font-medium text-ink-muted">
                {formatNumber(publicCount)} published · {formatNumber(authorizedCount)} shared
                {hasQuery ? ` · matching “${urlState.q.trim()}”` : ''}
              </p>
            </div>
          </div>

          {hits.length === 0 ? (
            <EmptyState
              icon={FileSearchIcon}
              title={hasAnyFilters ? 'No documents match these parameters' : 'Search for a document'}
              description={
                hasAnyFilters
                  ? 'Try another keyword, or clear the parameters and search again.'
                  : 'Use a keyword, or choose a document type, program, and academic year.'
              }
              action={
                hasAnyFilters ? (
                  <button type="button" className="btn btn-secondary" onClick={clearAll}>
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleHits.map((hit) => (
                <li key={hit.id}>
                  <article className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                        <FileTextIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <CategoryBadge hit={hit} />
                        <h3 className="mt-1.5 text-[14px] font-bold text-ink">{hit.title}</h3>
                        <p className="mt-1 truncate text-[12px] font-medium text-ink-muted">
                          {[hit.documentType, hit.program, hit.evidence.academicYear, hit.campus].filter(Boolean).join(' · ')}
                        </p>
                        {hit.locationPath ? (
                          <p className="mt-0.5 truncate text-[11px] text-ink-subtle">{hit.locationPath}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openHit(hit)}>
                        Preview
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {canLoadMore ? (
            <div className="flex justify-center pt-1">
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                Show more results
              </button>
            </div>
          ) : null}
      </div>

      <PublicDocumentPreviewModal doc={previewEvidence} onClose={() => setPreviewEvidence(null)} />
    </div>
  );
}
