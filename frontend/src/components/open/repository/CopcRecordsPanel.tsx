import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  SearchIcon,
  XIcon
} from 'lucide-react';
import { EmptyState } from '../../ui/EmptyState';
import type {
  CopcLocalFilters,
  CopcRecordRow,
  CopcSortDirection,
  CopcSortKey,
  RepositoryLoadState
} from '../../../types/accreditationRepository';
import {
  COPC_PAGE_SIZE,
  filterCopcRecords,
  paginateCopcRecords,
  sortCopcRecords,
  summarizeCopcRecords,
  uniqueSorted
} from '../../../services/repository/copcQuery';
import { listCopcRecords } from '../../../services/repository/repositoryService';
import { SAMPLE_COPC_SPREADSHEET_URL } from '../../../services/repository/mockRepositoryData';
import { CopcRecordDetailsModal } from './CopcRecordDetailsModal';

const EMPTY_FILTERS: CopcLocalFilters = {
  query: '',
  campus: '',
  academicYear: '',
  college: ''
};

const SELECT_CLASS =
  'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15';

function SampleBadge() {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
      Demonstration record
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900">
      Verified source record
    </span>
  );
}

function ProvenanceBadge({ row }: { row: CopcRecordRow }) {
  if (row.isSample || row.provenance === 'demonstration') return <SampleBadge />;
  if (row.provenance === 'verified' || row.isSample === false) return <VerifiedBadge />;
  return null;
}

function SortIcon({ active, direction }: { active: boolean; direction: CopcSortDirection }) {
  if (!active) return <ArrowUpDownIcon className="h-3.5 w-3.5 text-ink-subtle" aria-hidden="true" />;
  return direction === 'asc' ? (
    <ArrowUpIcon className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
  ) : (
    <ArrowDownIcon className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3 sm:px-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold tabular-nums tracking-tight text-ink">{value}</p>
    </div>
  );
}

export function CopcRecordsPanel({ initialQuery = '' }: { initialQuery?: string }) {
  const [allRecords, setAllRecords] = useState<CopcRecordRow[]>([]);
  const [sourceUrl, setSourceUrl] = useState(SAMPLE_COPC_SPREADSHEET_URL);
  const [loadState, setLoadState] = useState<RepositoryLoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadToken, setReloadToken] = useState(0);

  const [filters, setFilters] = useState<CopcLocalFilters>(() => ({
    ...EMPTY_FILTERS,
    query: initialQuery
  }));

  useEffect(() => {
    setFilters((prev) => (prev.query === initialQuery ? prev : { ...prev, query: initialQuery }));
  }, [initialQuery]);
  const [sortKey, setSortKey] = useState<CopcSortKey>('campus');
  const [sortDir, setSortDir] = useState<CopcSortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CopcRecordRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState('loading');
      setErrorMessage(undefined);
      try {
        const data = await listCopcRecords();
        if (!cancelled) {
          setAllRecords(data.records);
          setSourceUrl(data.sourceReferenceUrl || SAMPLE_COPC_SPREADSHEET_URL);
          setLoadState('ready');
        }
      } catch {
        if (!cancelled) {
          setAllRecords([]);
          setLoadState('error');
          setErrorMessage('Unable to load sample COPC rows.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const summary = useMemo(() => summarizeCopcRecords(allRecords), [allRecords]);

  const campusOptions = useMemo(() => uniqueSorted(allRecords.map((r) => r.campus)), [allRecords]);
  const yearOptions = useMemo(() => uniqueSorted(allRecords.map((r) => r.academicYear)), [allRecords]);
  const collegeOptions = useMemo(() => uniqueSorted(allRecords.map((r) => r.college)), [allRecords]);

  const filtered = useMemo(() => filterCopcRecords(allRecords, filters), [allRecords, filters]);
  const sorted = useMemo(() => sortCopcRecords(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const paged = useMemo(() => paginateCopcRecords(sorted, page, COPC_PAGE_SIZE), [sorted, page]);

  useEffect(() => {
    setPage(1);
  }, [filters.query, filters.campus, filters.academicYear, filters.college, sortKey, sortDir]);

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  const hasActiveFilters = Boolean(
    filters.query.trim() || filters.campus || filters.academicYear || filters.college
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const toggleSort = useCallback(
    (key: CopcSortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  const updateFilter = useCallback(<K extends keyof CopcLocalFilters>(key: K, value: CopcLocalFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">
              Certificate of Program Compliance (COPC)
            </h2>
            <VerifiedBadge />
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-relaxed text-ink-muted">
            Browse academic program compliance records by campus, program, and academic year. Sheet labels are preserved
            as written — including notes about ongoing compliance — and are not treated as automatic approvals.
          </p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline"
          >
            Sample Google Sheets Reference
            <ExternalLinkIcon className="h-3 w-3" aria-hidden="true" />
          </a>
          <p className="mt-1 text-[11px] text-ink-subtle">
            Reference link only — sample rows are not synchronized with the spreadsheet.
          </p>
        </div>
      </div>

      {loadState === 'ready' || loadState === 'idle' ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <SummaryCard label="Sample records" value={summary.totalRecords} />
          <SummaryCard label="Campuses" value={summary.campusCount} />
          <SummaryCard label="Programs" value={summary.programCount} />
          <SummaryCard label="Academic years" value={summary.academicYearCount} />
        </div>
      ) : null}

      <div className="panel space-y-3 p-3.5 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
              Search
            </span>
            <span className="relative block">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                type="search"
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                placeholder="Program, campus, certificate no.…"
                className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-[13px] font-medium hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                aria-label="Search sample COPC records"
              />
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
              Campus
            </span>
            <select
              className={SELECT_CLASS}
              value={filters.campus}
              onChange={(e) => updateFilter('campus', e.target.value)}
              aria-label="Filter by campus"
            >
              <option value="">All campuses</option>
              {campusOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
              Academic year
            </span>
            <select
              className={SELECT_CLASS}
              value={filters.academicYear}
              onChange={(e) => updateFilter('academicYear', e.target.value)}
              aria-label="Filter by academic year"
            >
              <option value="">All years</option>
              {yearOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
              College
            </span>
            <select
              className={SELECT_CLASS}
              value={filters.college}
              onChange={(e) => updateFilter('college', e.target.value)}
              aria-label="Filter by college"
              disabled={collegeOptions.length === 0}
            >
              <option value="">All colleges</option>
              {collegeOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-10 w-full lg:w-auto"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <XIcon className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>
        </div>

        {loadState === 'ready' || loadState === 'idle' ? (
          <p className="text-[12px] font-medium text-ink-muted">
            Showing{' '}
            <span className="tabular-nums font-semibold text-ink">
              {sorted.length === 0
                ? 0
                : `${(paged.page - 1) * paged.pageSize + 1}–${Math.min(paged.page * paged.pageSize, sorted.length)}`}
            </span>{' '}
            of <span className="tabular-nums font-semibold text-ink">{sorted.length}</span> matching verified
            {sorted.length === 1 ? ' record' : ' records'}
            {hasActiveFilters ? ' (filtered)' : ''}
          </p>
        ) : null}
      </div>

      {loadState === 'loading' ? (
        <div className="panel flex flex-col items-center px-6 py-14 text-center">
          <Loader2Icon className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-ink">Loading verified COPC rows…</p>
          <p className="mt-1 text-[13px] text-ink-muted">Static 2026 worksheet snapshot — not live-synced.</p>
        </div>
      ) : null}

      {loadState === 'error' ? (
        <div className="panel space-y-3">
          <EmptyState
            icon={AlertCircleIcon}
            title="Unable to load COPC records"
            description={errorMessage || 'Sample COPC rows could not be loaded.'}
            action={
              <button type="button" className="btn btn-secondary" onClick={() => setReloadToken((n) => n + 1)}>
                Retry
              </button>
            }
          />
        </div>
      ) : null}

      {loadState === 'ready' || loadState === 'idle' ? (
        sorted.length === 0 ? (
          <div className="panel overflow-hidden">
            <EmptyState
              icon={FileSpreadsheetIcon}
              title="No verified COPC rows match"
              description="Try clearing filters. Search covers verified 2026 worksheet rows only."
              action={
                hasActiveFilters ? (
                  <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile / tablet cards */}
            <ul className="space-y-2.5 lg:hidden">
              {paged.rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="panel panel-hover flex w-full items-start gap-3 p-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-bold text-ink">{row.program || 'Sample program'}</p>
                        <ProvenanceBadge row={row} />
                      </div>
                      <p className="mt-1 text-[12px] font-medium text-ink-muted">
                        {[row.campus, row.college, row.academicYear].filter(Boolean).join(' · ')}
                      </p>
                      {row.sheetLabel ? (
                        <p className="mt-1 text-[11px] font-medium text-ink-subtle">Sheet label: {row.sheetLabel}</p>
                      ) : null}
                      {row.isOngoingCompliance ? (
                        <p className="mt-1 text-[11px] font-semibold text-amber-800">
                          Note: ongoing compliance (not an approved COPC claim)
                        </p>
                      ) : null}
                      {row.certificateNumber ? (
                        <p className="mt-1 text-[11px] font-medium text-ink-subtle">
                          Sample cert. no.: {row.certificateNumber}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="panel hidden overflow-hidden p-0 lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[13px]">
                  <thead className="border-b border-line bg-canvas text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                    <tr>
                      {(
                        [
                          { key: 'campus' as const, label: 'Campus', sortable: true },
                          { key: null, label: 'College', sortable: false },
                          { key: 'program' as const, label: 'Academic program', sortable: true },
                          { key: 'academicYear' as const, label: 'Academic year', sortable: true },
                          { key: null, label: 'Sheet label / note', sortable: false },
                          { key: null, label: '', sortable: false }
                        ] as const
                      ).map((col, idx) => (
                        <th key={col.label || `actions-${idx}`} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                          {col.sortable && col.key ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 text-ink-subtle hover:text-ink"
                              onClick={() => toggleSort(col.key!)}
                              aria-label={`Sort by ${col.label}`}
                            >
                              {col.label}
                              <SortIcon active={sortKey === col.key} direction={sortDir} />
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {paged.rows.map((row) => (
                      <tr key={row.id} className="bg-surface transition-colors hover:bg-canvas/70">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                          <span className="inline-flex flex-wrap items-center gap-1.5">
                            {row.campus || '—'}
                            <ProvenanceBadge row={row} />
                          </span>
                        </td>
                        <td className="max-w-[12rem] truncate px-4 py-3 text-ink-muted">{row.college || '—'}</td>
                        <td className="max-w-[16rem] truncate px-4 py-3 font-medium text-ink">{row.program || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{row.academicYear || '—'}</td>
                        <td className="max-w-[14rem] truncate px-4 py-3 text-ink-muted">
                          {row.sheetLabel || row.certificateNumber || row.complianceNote || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-brand-700"
                            onClick={() => setSelected(row)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {paged.totalPages > 1 ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] font-medium text-ink-muted">
                  Page <span className="tabular-nums text-ink">{paged.page}</span> of{' '}
                  <span className="tabular-nums text-ink">{paged.totalPages}</span>
                  <span className="text-ink-subtle"> · {COPC_PAGE_SIZE} per page</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={paged.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={paged.page >= paged.totalPages}
                    onClick={() => setPage((p) => Math.min(paged.totalPages, p + 1))}
                  >
                    Next
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )
      ) : null}

      <CopcRecordDetailsModal
        record={selected}
        onClose={() => setSelected(null)}
        sourceReferenceUrl={sourceUrl}
      />
    </div>
  );
}
