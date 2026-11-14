import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  FileStackIcon,
  LayoutGridIcon,
  SearchIcon,
  XIcon
} from 'lucide-react';
import { usePublicDocuments } from '../../hooks/usePublicDocuments';
import { useLookup } from '../../hooks/useLookup';
import { usePortal } from '../../contexts/PortalContext';
import { PublicDocumentSort } from '../../utils/publicDocuments';
import { EvidenceDocument } from '../../types/evidence';
import { formatNumber, pluralize } from '../../utils/format';
import { EmptyState } from '../../components/ui/EmptyState';
import { PublicDocumentCard } from '../../components/open/PublicDocumentCard';
import { PublicDocumentPreviewModal } from '../../components/open/PublicDocumentPreviewModal';

const PAGE_SIZE = 9;

type SortParam = 'newest' | 'oldest' | 'az';

const SORT_OPTIONS: { value: SortParam; label: string; sort: PublicDocumentSort }[] = [
  { value: 'newest', label: 'Newest First', sort: 'published-desc' },
  { value: 'oldest', label: 'Oldest First', sort: 'published-asc' },
  { value: 'az', label: 'Alphabetical (A–Z)', sort: 'title-asc' }
];

function sortToFilter(sort: SortParam): PublicDocumentSort {
  return SORT_OPTIONS.find((o) => o.value === sort)?.sort ?? 'published-desc';
}

function sortLabel(sort: SortParam): string {
  return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Newest First';
}

function parseSort(raw: string | null): SortParam {
  if (raw === 'oldest' || raw === 'az' || raw === 'newest') return raw;
  return 'newest';
}

export function OpenAreas() {
  const [params, setParams] = useSearchParams();
  const selectedAreaId = params.get('area') ?? '';
  const lookup = useLookup();
  const { areas } = usePortal();

  const [query, setQuery] = useState('');
  const [program, setProgram] = useState('');
  const [docType, setDocType] = useState('');
  const [sort, setSort] = useState<SortParam>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);

  const { publishedDocuments, totalPublished, areaOptions } = usePublicDocuments();

  const areaDocuments = usePublicDocuments({
    areaId: selectedAreaId || undefined,
    query: selectedAreaId ? query : '',
    program: selectedAreaId ? program : '',
    docType: selectedAreaId ? docType : '',
    sort: sortToFilter(sort)
  });

  // Reset area-scoped filters when switching areas.
  useEffect(() => {
    setQuery('');
    setProgram('');
    setDocType('');
    setSort('newest');
    setVisibleCount(PAGE_SIZE);
  }, [selectedAreaId]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, program, docType, sort]);

  const areaDirectory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of publishedDocuments) {
      if (!doc.areaId) continue;
      counts.set(doc.areaId, (counts.get(doc.areaId) ?? 0) + 1);
    }

    return areaOptions
      .map((opt) => {
        const record = areas.find((a) => a.id === opt.value) || lookup.area(opt.value);
        return {
          id: opt.value,
          name: record?.name || opt.label,
          shortName: record?.shortName,
          description: record?.description,
          count: counts.get(opt.value) ?? 0
        };
      })
      .filter((a) => a.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [publishedDocuments, areaOptions, areas, lookup]);

  const selectedArea = useMemo(() => {
    if (!selectedAreaId) return null;
    const record = areas.find((a) => a.id === selectedAreaId) || lookup.area(selectedAreaId);
    const count = publishedDocuments.filter((d) => d.areaId === selectedAreaId).length;
    if (count === 0 && !record) return null;
    return {
      id: selectedAreaId,
      name: record?.name || areaOptions.find((a) => a.value === selectedAreaId)?.label || selectedAreaId,
      shortName: record?.shortName,
      description: record?.description,
      count
    };
  }, [selectedAreaId, areas, lookup, publishedDocuments, areaOptions]);

  const programOptionsForArea = useMemo(() => {
    return [...new Set(
      publishedDocuments.filter((d) => d.areaId === selectedAreaId && d.program).map((d) => d.program)
    )].sort((a, b) => a.localeCompare(b));
  }, [publishedDocuments, selectedAreaId]);

  const docTypeOptionsForArea = useMemo(() => {
    return [...new Set(
      publishedDocuments.filter((d) => d.areaId === selectedAreaId && d.docType).map((d) => d.docType)
    )].sort((a, b) => a.localeCompare(b));
  }, [publishedDocuments, selectedAreaId]);

  const selectArea = (areaId: string) => {
    const next = new URLSearchParams(params);
    next.set('area', areaId);
    setParams(next);
  };

  const clearAreaSelection = () => {
    const next = new URLSearchParams(params);
    next.delete('area');
    setParams(next);
  };

  const hasFilters = Boolean(query.trim() || program || docType || sort !== 'newest');
  const clearFilters = () => {
    setQuery('');
    setProgram('');
    setDocType('');
    setSort('newest');
  };

  const docs = selectedAreaId ? areaDocuments.documents : [];
  const visibleDocs = docs.slice(0, visibleCount);
  const canLoadMore = visibleCount < docs.length;

  const selectClass =
    'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <section
        aria-labelledby="open-areas-heading"
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
              id="open-areas-heading"
              className="mt-2 font-sans text-[24px] font-extrabold tracking-tight text-ink xs:text-[28px] sm:text-[32px]"
            >
              Accreditation Areas
            </h1>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted sm:text-[15px]">
              Explore publicly available accreditation documents organized by their respective accreditation areas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatPill
              icon={LayoutGridIcon}
              label="Public areas"
              value={formatNumber(areaDirectory.length)}
            />
            <StatPill
              icon={FileStackIcon}
              label="Public documents"
              value={formatNumber(totalPublished)}
            />
          </div>
        </div>
      </section>

      {totalPublished === 0 ? (
        <section className="panel">
          <EmptyState
            icon={LayoutGridIcon}
            title="Currently, there are no publicly published documents."
            description="Accreditation areas will appear here once the Quality Assurance Office publishes documents for public access."
            action={
              <Link to="/open/browse" className="btn btn-secondary">
                Accreditation Repository
              </Link>
            }
          />
        </section>
      ) : selectedAreaId && selectedArea ? (
        /* Area detail */
        <section aria-labelledby="selected-area-heading" className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button type="button" className="btn btn-ghost btn-sm -ml-2 text-brand-700" onClick={clearAreaSelection}>
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back to Accreditation Areas
              </button>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
                  {selectedArea.shortName || selectedArea.id}
                </span>
                <span className="text-[12px] font-medium text-ink-subtle">ID: {selectedArea.id}</span>
              </div>
              <h2 id="selected-area-heading" className="mt-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                {selectedArea.name}
              </h2>
              {selectedArea.description ? (
                <p className="mt-2 max-w-3xl text-[14px] font-medium leading-relaxed text-ink-muted">
                  {selectedArea.description}
                </p>
              ) : null}
              <p className="mt-2 text-[13px] font-medium text-ink-subtle">
                {formatNumber(selectedArea.count)} publicly available{' '}
                {selectedArea.count === 1 ? 'document' : 'documents'}
                {docs.length !== selectedArea.count
                  ? ` · Showing ${formatNumber(docs.length)} after filters · Sorted by ${sortLabel(sort)}`
                  : ` · Sorted by ${sortLabel(sort)}`}
              </p>
            </div>
          </div>

          {selectedArea.count === 0 ? (
            <div className="panel">
              <EmptyState
                icon={FileStackIcon}
                title="No publicly available documents are currently listed under this accreditation area."
                description="Choose another accreditation area or return to the directory."
                action={
                  <button type="button" className="btn btn-secondary" onClick={clearAreaSelection}>
                    Back to Accreditation Areas
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div className="panel p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="sm:col-span-2 xl:col-span-1">
                    <label htmlFor="area-doc-search" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Search within area
                    </label>
                    <div className="relative">
                      <SearchIcon
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                        aria-hidden="true"
                      />
                      <input
                        id="area-doc-search"
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
                    <label htmlFor="area-filter-program" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Academic Program
                    </label>
                    <select
                      id="area-filter-program"
                      className={selectClass}
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      disabled={programOptionsForArea.length === 0}
                    >
                      <option value="">All programs</option>
                      {programOptionsForArea.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="area-filter-type" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Document Type
                    </label>
                    <select
                      id="area-filter-type"
                      className={selectClass}
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      disabled={docTypeOptionsForArea.length === 0}
                    >
                      <option value="">All types</option>
                      {docTypeOptionsForArea.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="area-filter-sort" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Sort
                    </label>
                    <select
                      id="area-filter-sort"
                      className={selectClass}
                      value={sort}
                      onChange={(e) => setSort(parseSort(e.target.value))}
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

              {docs.length === 0 ? (
                <div className="panel">
                  <EmptyState
                    icon={SearchIcon}
                    title="No documents match your selected filters."
                    description="Try adjusting or clearing filters to view documents in this accreditation area."
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
                          ({formatNumber(docs.length - visibleCount)} remaining)
                        </span>
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </section>
      ) : selectedAreaId && !selectedArea ? (
        <section className="panel">
          <EmptyState
            icon={LayoutGridIcon}
            title="Accreditation area not found"
            description="The selected area has no publicly published documents or is not available in the public repository."
            action={
              <button type="button" className="btn btn-secondary" onClick={clearAreaSelection}>
                Back to Accreditation Areas
              </button>
            }
          />
        </section>
      ) : (
        /* Directory */
        <section aria-labelledby="areas-directory-heading" className="space-y-4">
          <div>
            <h2 id="areas-directory-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              Area Directory
            </h2>
            <p className="mt-1 text-[13px] font-medium text-ink-muted">
              {pluralize(areaDirectory.length, 'accreditation area')} with publicly published documents.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
            {areaDirectory.map((area, index) => (
              <article key={area.id} className="panel flex h-full flex-col p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-[12px] font-extrabold text-brand-700">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                      {area.shortName || area.id}
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold leading-snug text-ink">{area.name}</h3>
                    {area.description ? (
                      <p className="mt-2 line-clamp-3 text-[12px] font-medium leading-relaxed text-ink-muted">
                        {area.description}
                      </p>
                    ) : null}
                    <p className="mt-3 text-[12px] font-semibold text-ink-subtle">
                      {formatNumber(area.count)} {area.count === 1 ? 'document' : 'documents'}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <button type="button" className="btn btn-primary btn-sm w-full sm:w-auto" onClick={() => selectArea(area.id)}>
                    Accreditation Repository
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <PublicDocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value
}: {
  icon: typeof LayoutGridIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="panel flex min-w-[9.5rem] items-center gap-3 px-4 py-3 shadow-none">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="text-xl font-extrabold tabular-nums text-ink">{value}</p>
      </div>
    </div>
  );
}
