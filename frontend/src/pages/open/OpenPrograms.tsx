import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  FileStackIcon,
  GraduationCapIcon,
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

/** Most frequent non-empty value among documents (for college/department enrichment). */
function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '—') continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export function OpenPrograms() {
  const [params, setParams] = useSearchParams();
  const selectedProgram = params.get('program') ?? '';
  const lookup = useLookup();
  const { programAccreditations } = usePortal();

  const [query, setQuery] = useState('');
  const [areaId, setAreaId] = useState('');
  const [docType, setDocType] = useState('');
  const [sort, setSort] = useState<SortParam>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);

  const { publishedDocuments, totalPublished, programOptions } = usePublicDocuments();

  const programDocuments = usePublicDocuments({
    program: selectedProgram || undefined,
    query: selectedProgram ? query : '',
    areaId: selectedProgram ? areaId : '',
    docType: selectedProgram ? docType : '',
    sort: sortToFilter(sort)
  });

  useEffect(() => {
    setQuery('');
    setAreaId('');
    setDocType('');
    setSort('newest');
    setVisibleCount(PAGE_SIZE);
  }, [selectedProgram]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, areaId, docType, sort]);

  const programDirectory = useMemo(() => {
    const counts = new Map<string, number>();
    const byProgram = new Map<string, EvidenceDocument[]>();

    for (const doc of publishedDocuments) {
      if (!doc.program) continue;
      counts.set(doc.program, (counts.get(doc.program) ?? 0) + 1);
      const list = byProgram.get(doc.program) ?? [];
      list.push(doc);
      byProgram.set(doc.program, list);
    }

    return programOptions
      .map((name) => {
        const docs = byProgram.get(name) ?? [];
        const accreditation = programAccreditations.find((p) => p.programName === name);
        return {
          name,
          college: mostCommon(docs.map((d) => d.college)) || undefined,
          department: mostCommon(docs.map((d) => d.department)) || undefined,
          degreeLevel: accreditation?.degreeLevel,
          campusName: accreditation?.campusName,
          count: counts.get(name) ?? 0
        };
      })
      .filter((p) => p.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [publishedDocuments, programOptions, programAccreditations]);

  const selected = useMemo(() => {
    if (!selectedProgram) return null;
    const docs = publishedDocuments.filter((d) => d.program === selectedProgram);
    const accreditation = programAccreditations.find((p) => p.programName === selectedProgram);
    if (docs.length === 0 && !accreditation && !programOptions.includes(selectedProgram)) {
      return null;
    }
    return {
      name: selectedProgram,
      college: mostCommon(docs.map((d) => d.college)) || undefined,
      department: mostCommon(docs.map((d) => d.department)) || undefined,
      degreeLevel: accreditation?.degreeLevel,
      campusName: accreditation?.campusName,
      count: docs.length
    };
  }, [selectedProgram, publishedDocuments, programAccreditations, programOptions]);

  const areaOptionsForProgram = useMemo(() => {
    const ids = [
      ...new Set(
        publishedDocuments.filter((d) => d.program === selectedProgram && d.areaId).map((d) => d.areaId)
      )
    ];
    return ids
      .map((id) => ({ value: id, label: lookup.area(id)?.name || id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [publishedDocuments, selectedProgram, lookup]);

  const docTypeOptionsForProgram = useMemo(() => {
    return [
      ...new Set(
        publishedDocuments.filter((d) => d.program === selectedProgram && d.docType).map((d) => d.docType)
      )
    ].sort((a, b) => a.localeCompare(b));
  }, [publishedDocuments, selectedProgram]);

  const selectProgram = (programName: string) => {
    const next = new URLSearchParams(params);
    next.set('program', programName);
    setParams(next);
  };

  const clearProgramSelection = () => {
    const next = new URLSearchParams(params);
    next.delete('program');
    setParams(next);
  };

  const hasFilters = Boolean(query.trim() || areaId || docType || sort !== 'newest');
  const clearFilters = () => {
    setQuery('');
    setAreaId('');
    setDocType('');
    setSort('newest');
  };

  const docs = selectedProgram ? programDocuments.documents : [];
  const visibleDocs = docs.slice(0, visibleCount);
  const canLoadMore = visibleCount < docs.length;

  const selectClass =
    'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

  return (
    <div className="space-y-8 sm:space-y-10">
      <section
        aria-labelledby="open-programs-heading"
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
              id="open-programs-heading"
              className="mt-2 font-sans text-[24px] font-extrabold tracking-tight text-ink xs:text-[28px] sm:text-[32px]"
            >
              Academic Programs
            </h1>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted sm:text-[15px]">
              Explore publicly available accreditation documents organized by their respective academic programs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatPill
              icon={GraduationCapIcon}
              label="Public programs"
              value={formatNumber(programDirectory.length)}
            />
            <StatPill icon={FileStackIcon} label="Public documents" value={formatNumber(totalPublished)} />
          </div>
        </div>
      </section>

      {totalPublished === 0 ? (
        <section className="panel">
          <EmptyState
            icon={GraduationCapIcon}
            title="Currently, there are no publicly published documents."
            description="Academic programs will appear here once the Quality Assurance Office publishes documents for public access."
            action={
              <Link to="/open/browse" className="btn btn-secondary">
                Accreditation Repository
              </Link>
            }
          />
        </section>
      ) : selectedProgram && selected ? (
        <section aria-labelledby="selected-program-heading" className="space-y-5">
          <div className="min-w-0">
            <button type="button" className="btn btn-ghost btn-sm -ml-2 text-brand-700" onClick={clearProgramSelection}>
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Back to Academic Programs
            </button>

            <div className="mt-3 flex flex-wrap gap-2">
              {selected.degreeLevel ? (
                <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
                  {selected.degreeLevel}
                </span>
              ) : null}
              {selected.campusName ? (
                <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                  {selected.campusName}
                </span>
              ) : null}
            </div>

            <h2 id="selected-program-heading" className="mt-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {selected.name}
            </h2>

            <div className="mt-2 space-y-1 text-[13px] font-medium text-ink-muted">
              {selected.college ? <p>College: {selected.college}</p> : null}
              {selected.department ? <p>Department: {selected.department}</p> : null}
            </div>

            <p className="mt-2 text-[13px] font-medium text-ink-subtle">
              {formatNumber(selected.count)} publicly available {selected.count === 1 ? 'document' : 'documents'}
              {docs.length !== selected.count
                ? ` · Showing ${formatNumber(docs.length)} after filters · Sorted by ${sortLabel(sort)}`
                : ` · Sorted by ${sortLabel(sort)}`}
            </p>
          </div>

          {selected.count === 0 ? (
            <div className="panel">
              <EmptyState
                icon={FileStackIcon}
                title="No publicly available documents are currently listed under this academic program."
                description="Choose another academic program or return to the directory."
                action={
                  <button type="button" className="btn btn-secondary" onClick={clearProgramSelection}>
                    Back to Academic Programs
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div className="panel p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="sm:col-span-2 xl:col-span-1">
                    <label htmlFor="program-doc-search" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Search within program
                    </label>
                    <div className="relative">
                      <SearchIcon
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                        aria-hidden="true"
                      />
                      <input
                        id="program-doc-search"
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
                    <label htmlFor="program-filter-area" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Accreditation Area
                    </label>
                    <select
                      id="program-filter-area"
                      className={selectClass}
                      value={areaId}
                      onChange={(e) => setAreaId(e.target.value)}
                      disabled={areaOptionsForProgram.length === 0}
                    >
                      <option value="">All areas</option>
                      {areaOptionsForProgram.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="program-filter-type" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Document Type
                    </label>
                    <select
                      id="program-filter-type"
                      className={selectClass}
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      disabled={docTypeOptionsForProgram.length === 0}
                    >
                      <option value="">All types</option>
                      {docTypeOptionsForProgram.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="program-filter-sort" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
                      Sort
                    </label>
                    <select
                      id="program-filter-sort"
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
                    description="Try adjusting or clearing filters to view documents for this academic program."
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
      ) : selectedProgram && !selected ? (
        <section className="panel">
          <EmptyState
            icon={GraduationCapIcon}
            title="Academic program not found"
            description="The selected program has no publicly published documents or is not available in the public repository."
            action={
              <button type="button" className="btn btn-secondary" onClick={clearProgramSelection}>
                Back to Academic Programs
              </button>
            }
          />
        </section>
      ) : (
        <section aria-labelledby="programs-directory-heading" className="space-y-4">
          <div>
            <h2 id="programs-directory-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              Program Directory
            </h2>
            <p className="mt-1 text-[13px] font-medium text-ink-muted">
              {pluralize(programDirectory.length, 'academic program')} with publicly published documents.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
            {programDirectory.map((program) => (
              <article key={program.name} className="panel flex h-full flex-col p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                    <GraduationCapIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold leading-snug text-ink">{program.name}</h3>
                    <div className="mt-2 space-y-1 text-[12px] font-medium text-ink-muted">
                      {program.college ? <p className="line-clamp-2">{program.college}</p> : null}
                      {program.department ? <p className="line-clamp-1 text-ink-subtle">{program.department}</p> : null}
                      {!program.college && !program.department && program.degreeLevel ? (
                        <p>{program.degreeLevel}</p>
                      ) : null}
                    </div>
                    <p className="mt-3 text-[12px] font-semibold text-ink-subtle">
                      {formatNumber(program.count)} {program.count === 1 ? 'document' : 'documents'}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm w-full sm:w-auto"
                    onClick={() => selectProgram(program.name)}
                  >
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
  icon: typeof GraduationCapIcon;
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
