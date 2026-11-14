import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronDownIcon,
  FileSearchIcon,
  FileTextIcon,
  FilterIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon
} from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatNumber, pluralize } from '../../utils/format';
import { searchDemoDocuments, type DemoSearchHit } from '../../services/repository/demoDocumentSearch';
import {
  FACULTY_ACCESS_VISIBILITY_NOTE,
  filterFacultyDiscoverableEvidence,
  classifyEvidenceForFaculty,
  isFacultyDiscoverable
} from '../../services/repository/facultyAccessVisibility';
import { RepoDocumentDetailsModal } from '../../components/open/repository/RepoDocumentDetailsModal';
import { RepoDocumentPreviewModal } from '../../components/open/repository/RepoDocumentPreviewModal';
import { PublicDocumentPreviewModal } from '../../components/open/PublicDocumentPreviewModal';
import type { RepoDocumentItem } from '../../types/accreditationRepository';
import type { EvidenceDocument } from '../../types/evidence';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { searchEvidence } from '../../utils/search';
import { campuses as campusDirectory } from '../../data/accreditationData';

const PAGE_SIZE = 12;

type FacultySearchCategory = 'demonstration-document' | 'public-evidence' | 'authorized-evidence';

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

type FacultySearchHit = DemoSearchHit | EvidenceSearchHit;

type SearchState = {
  q: string;
  campus: string;
  program: string;
  type: string;
  category: '' | FacultySearchCategory;
};

function readSearchState(params: URLSearchParams): SearchState {
  const category = params.get('category');
  return {
    q: params.get('q') ?? '',
    campus: params.get('campus') ?? '',
    program: params.get('program') ?? '',
    type: params.get('type') ?? '',
    category:
      category === 'demonstration-document' ||
      category === 'public-evidence' ||
      category === 'authorized-evidence'
        ? category
        : ''
  };
}

function writeSearchParams(state: SearchState): URLSearchParams {
  const next = new URLSearchParams();
  if (state.q.trim()) next.set('q', state.q.trim());
  if (state.campus) next.set('campus', state.campus);
  if (state.program) next.set('program', state.program);
  if (state.type) next.set('type', state.type);
  if (state.category) next.set('category', state.category);
  return next;
}

const emptyState: SearchState = {
  q: '',
  campus: '',
  program: '',
  type: '',
  category: ''
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

function CategoryBadge({ hit }: { hit: FacultySearchHit }) {
  if (hit.category === 'demonstration-document') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
          Demonstration document
        </span>
      </span>
    );
  }
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
  const urlState = useMemo(() => readSearchState(params), [params]);
  const { documents, currentUser, shares } = usePortal();
  const lookup = useLookup();

  const [draftQuery, setDraftQuery] = useState(urlState.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [detailsDoc, setDetailsDoc] = useState<RepoDocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RepoDocumentItem | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceDocument | null>(null);

  useEffect(() => {
    setDraftQuery(urlState.q);
    setVisibleCount(PAGE_SIZE);
  }, [urlState.q, urlState.campus, urlState.program, urlState.type, urlState.category]);

  const discoverable = useMemo(
    () => filterFacultyDiscoverableEvidence(documents, currentUser, shares),
    [documents, currentUser, shares]
  );

  const campusOptions = useMemo(() => {
    const fromEvidence = new Set(discoverable.map((d) => d.campus).filter(Boolean));
    const fromDemo = searchDemoDocuments({}).map((h) => h.campus).filter(Boolean) as string[];
    return Array.from(new Set([...campusDirectory.map((c) => c.name), ...fromEvidence, ...fromDemo])).sort();
  }, [discoverable]);

  const programOptions = useMemo(() => {
    const fromEvidence = discoverable.map((d) => d.program).filter(Boolean) as string[];
    const fromDemo = searchDemoDocuments({})
      .map((h) => h.program)
      .filter(Boolean) as string[];
    return Array.from(new Set([...fromEvidence, ...fromDemo])).sort();
  }, [discoverable]);

  const typeOptions = useMemo(() => {
    const fromEvidence = discoverable.map((d) => d.docType).filter(Boolean);
    const fromDemo = searchDemoDocuments({})
      .map((h) => h.documentType)
      .filter(Boolean) as string[];
    return Array.from(new Set([...fromEvidence, ...fromDemo])).sort();
  }, [discoverable]);

  const hits = useMemo(() => {
    const includeDemo = !urlState.category || urlState.category === 'demonstration-document';
    const includePublic = !urlState.category || urlState.category === 'public-evidence';
    const includeAuthorized = !urlState.category || urlState.category === 'authorized-evidence';

    const demos: FacultySearchHit[] = includeDemo
      ? searchDemoDocuments({
          q: urlState.q,
          campus: urlState.campus || undefined,
          program: urlState.program || undefined,
          documentType: urlState.type || undefined
        })
      : [];

    let evidencePool = discoverable;
    if (urlState.campus) {
      const c = urlState.campus.toLowerCase();
      evidencePool = evidencePool.filter(
        (d) => d.campus.toLowerCase() === c || d.campus.toLowerCase().includes(c)
      );
    }
    if (urlState.program) {
      const p = urlState.program.toLowerCase();
      evidencePool = evidencePool.filter((d) => (d.program ?? '').toLowerCase().includes(p));
    }
    if (urlState.type) {
      evidencePool = evidencePool.filter((d) => d.docType === urlState.type);
    }

    const q = urlState.q.trim();
    const scored =
      q.length > 1
        ? searchEvidence(q, evidencePool, lookup)
        : evidencePool.map((doc) => ({ doc, score: 0 }));

    const evidenceHits: EvidenceSearchHit[] = [];
    for (const { doc, score } of scored) {
      const visibility = classifyEvidenceForFaculty(doc, currentUser, shares);
      if (!isFacultyDiscoverable(visibility)) continue;
      if (visibility === 'public' && !includePublic) continue;
      if (visibility === 'authorized' && !includeAuthorized) continue;
      if (visibility !== 'public' && visibility !== 'authorized') continue;
      const category = visibility === 'public' ? 'public-evidence' : 'authorized-evidence';
      evidenceHits.push({
        id: `evidence-${doc.id}`,
        title: doc.title,
        category,
        categoryLabel: visibility === 'public' ? 'Publicly published' : 'Shared with you',
        campus: doc.campus || undefined,
        program: doc.program || undefined,
        documentType: doc.docType || undefined,
        href: `/open/search?q=${encodeURIComponent(doc.title)}`,
        evidence: doc,
        score
      });
    }

    return [...demos, ...evidenceHits];
  }, [urlState, discoverable, lookup, currentUser, shares]);

  const demoCount = hits.filter((h) => h.category === 'demonstration-document').length;
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
  const hasFacetFilters = Boolean(urlState.campus || urlState.program || urlState.type || urlState.category);
  const hasAnyFilters = hasQuery || hasFacetFilters;

  const visibleHits = hits.slice(0, visibleCount);
  const canLoadMore = visibleCount < hits.length;

  const selectClass =
    'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

  const openHit = (hit: FacultySearchHit) => {
    if (hit.category === 'demonstration-document' && hit.document) {
      setDetailsDoc(hit.document);
      return;
    }
    if ('evidence' in hit) {
      setPreviewEvidence(hit.evidence);
    }
  };

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
            Results are limited to publicly published documents, materials shared with you, and labeled demonstration
            samples. Verified AACCUP/COPC catalog rows without publication approval are not listed here.
          </p>

          <form onSubmit={onSubmitSearch} className="mt-5" role="search" aria-label="Search authorized and demonstration documents">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <label htmlFor="open-search-input" className="sr-only">
                Search authorized and demonstration documents
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
                  placeholder="Search titles, programs, sample documents…"
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
          <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">{FACULTY_ACCESS_VISIBILITY_NOTE}</p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              className="btn btn-secondary"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontalIcon className="h-4 w-4" />
              Filters
              <ChevronDownIcon className={`h-4 w-4 transition ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
            {hasAnyFilters ? (
              <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearAll}>
                Clear all
              </button>
            ) : null}
          </div>

          <div className={`panel p-4 sm:p-5 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="mb-4 hidden items-center justify-between gap-2 lg:flex">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-brand-700" aria-hidden="true" />
                <h2 className="text-sm font-extrabold text-ink">Filters</h2>
              </div>
              {hasAnyFilters ? (
                <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearAll}>
                  Clear all
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              <FilterField label="Source category" htmlFor="open-filter-category">
                <select
                  id="open-filter-category"
                  className={selectClass}
                  value={urlState.category}
                  onChange={(e) => patchFilters({ category: e.target.value as SearchState['category'] })}
                >
                  <option value="">All authorized sources</option>
                  <option value="public-evidence">Publicly published</option>
                  <option value="authorized-evidence">Shared with you</option>
                  <option value="demonstration-document">Demonstration documents</option>
                </select>
              </FilterField>

              <FilterField label="Campus" htmlFor="open-filter-campus">
                <select
                  id="open-filter-campus"
                  className={selectClass}
                  value={urlState.campus}
                  onChange={(e) => patchFilters({ campus: e.target.value })}
                >
                  <option value="">All campuses</option>
                  {campusOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Academic program" htmlFor="open-filter-program">
                <select
                  id="open-filter-program"
                  className={selectClass}
                  value={urlState.program}
                  onChange={(e) => patchFilters({ program: e.target.value })}
                >
                  <option value="">All programs</option>
                  {programOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="File type" htmlFor="open-filter-type">
                <select
                  id="open-filter-type"
                  className={selectClass}
                  value={urlState.type}
                  onChange={(e) => patchFilters({ type: e.target.value })}
                >
                  <option value="">All types</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </FilterField>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-ink">{pluralize(hits.length, 'result')}</p>
              <p className="mt-0.5 text-[12px] font-medium text-ink-muted">
                {formatNumber(publicCount)} public · {formatNumber(authorizedCount)} shared ·{' '}
                {formatNumber(demoCount)} demonstration
                {hasQuery ? ` · matching “${urlState.q.trim()}”` : ''}
              </p>
            </div>
            <Link to="/open/browse?tab=sample-documents" className="btn btn-ghost btn-sm text-brand-700">
              Sample documents
            </Link>
          </div>

          {hits.length === 0 ? (
            <EmptyState
              icon={FileSearchIcon}
              title={hasAnyFilters ? 'No documents match your search' : 'Enter a search or choose a filter'}
              description={
                hasAnyFilters
                  ? 'Try another keyword or clear filters. Restricted Technical Review files and unverified catalog rows are never searchable here.'
                  : 'Search covers publicly published evidence, documents shared with you, and labeled demonstration PDFs.'
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
                          {[hit.campus, hit.college, hit.program, hit.documentType].filter(Boolean).join(' · ')}
                        </p>
                        {hit.locationPath ? (
                          <p className="mt-0.5 truncate text-[11px] text-ink-subtle">{hit.locationPath}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openHit(hit)}>
                        {hit.category === 'demonstration-document' ? 'Details' : 'Preview'}
                      </button>
                      {hit.category === 'demonstration-document' ? (
                        <Link to={hit.href} className="btn btn-ghost btn-sm text-brand-700">
                          Open sample
                        </Link>
                      ) : null}
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
      </div>

      <RepoDocumentDetailsModal
        doc={detailsDoc}
        onClose={() => setDetailsDoc(null)}
        onPreview={(doc) => {
          setDetailsDoc(null);
          setPreviewDoc(doc);
        }}
      />
      <RepoDocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      <PublicDocumentPreviewModal doc={previewEvidence} onClose={() => setPreviewEvidence(null)} />
    </div>
  );
}
