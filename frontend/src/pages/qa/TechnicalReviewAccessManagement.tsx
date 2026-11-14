import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheckIcon,
  InboxIcon,
  Loader2Icon,
  SearchIcon,
  XIcon
} from 'lucide-react';
import { TechnicalReviewReviewModal } from '../../components/qa/TechnicalReviewReviewModal';
import { AccessRequestStatusBadge } from '../../components/open/accessRequests/AccessRequestStatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { accessRequestService } from '../../services/accessRequests/accessRequestService';
import { subscribeAccessRequests } from '../../services/accessRequests/mockAccessRequestStore';
import type {
  TechnicalReviewAccessRequest,
  TechnicalReviewAccessStatus,
  TechnicalReviewAccessStatusCounts
} from '../../types/technicalReviewAccess';
import { useSessionAccount } from '../../utils/auth';

const STATUS_FILTERS: Array<TechnicalReviewAccessStatus | ''> = [
  '',
  'Pending',
  'Approved',
  'Denied',
  'Expired',
  'Revoked',
  'Canceled'
];

type SortOrder = 'newest' | 'oldest';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return iso;
  }
}

const emptyCounts = (): TechnicalReviewAccessStatusCounts => ({
  Pending: 0,
  Approved: 0,
  Denied: 0,
  Expired: 0,
  Revoked: 0,
  Canceled: 0
});

export function TechnicalReviewAccessManagement() {
  const session = useSessionAccount();
  const [requests, setRequests] = useState<TechnicalReviewAccessRequest[]>([]);
  const [counts, setCounts] = useState<TechnicalReviewAccessStatusCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TechnicalReviewAccessStatus | ''>('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [selected, setSelected] = useState<TechnicalReviewAccessRequest | null>(null);

  const reviewerName =
    [session?.firstName, session?.lastName].filter(Boolean).join(' ').trim() ||
    session?.email ||
    'QA Personnel';

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, nextCounts] = await Promise.all([
        accessRequestService.listRequests(),
        accessRequestService.getStatusCounts()
      ]);
      setRequests(rows);
      setCounts(nextCounts);
      setSelected((prev) => (prev ? rows.find((r) => r.id === prev.id) ?? null : null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return subscribeAccessRequests(() => {
      void reload();
    });
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = requests.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [r.demoRequestId, r.campusName, r.collegeProgram, r.purpose, r.requesterName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    return rows.sort((a, b) =>
      sort === 'newest' ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt)
    );
  }, [requests, query, status, sort]);

  const clearFilters = () => {
    setQuery('');
    setStatus('');
    setSort('newest');
  };

  const summaryCards: Array<{ key: TechnicalReviewAccessStatus; label: string; tone: string }> = [
    { key: 'Pending', label: 'Pending', tone: 'text-amber-700' },
    { key: 'Approved', label: 'Approved', tone: 'text-emerald-700' },
    { key: 'Denied', label: 'Denied', tone: 'text-rose-700' },
    { key: 'Expired', label: 'Expired', tone: 'text-ink-muted' },
    { key: 'Revoked', label: 'Revoked', tone: 'text-slate-700' },
    { key: 'Canceled', label: 'Canceled', tone: 'text-slate-600' }
  ];

  return (
    <>
      <PageHeader
        eyebrow="QA · Restricted documents"
        title="Technical Review Access Management"
        description="Review and manage faculty and staff requests for restricted accreditation documents."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-950">
            Demo mode
          </span>
        }
      />

      <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-950">
        Client-side role checks and localStorage updates are for UI demonstration only. They are not real security,
        and approval never unlocks restricted Technical Review files or Drive links.
      </p>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setStatus((prev) => (prev === card.key ? '' : card.key))}
            aria-pressed={status === card.key}
            aria-label={`Filter ${card.label} requests, ${counts[card.key]} total`}
            className={`panel panel-hover p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${status === card.key ? 'border-brand-300 ring-2 ring-brand-500/15' : ''}`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">{card.label}</p>
            <p className={`mt-1 text-2xl font-extrabold tabular-nums ${card.tone}`}>{counts[card.key]}</p>
          </button>
        ))}
      </div>

      <div className="panel mb-4 space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_11rem_11rem_auto]">
          <div className="relative">
            <label htmlFor="qa-tr-search" className="sr-only">
              Search requests
            </label>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              id="qa-tr-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by request ID, campus, or program…"
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
          <select
            aria-label="Filter by status"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-[13px] font-medium"
            value={status}
            onChange={(e) => setStatus(e.target.value as TechnicalReviewAccessStatus | '')}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'All statuses'}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort by submission date"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-[13px] font-medium"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          {(query || status || sort !== 'newest') && (
            <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
        <p className="text-[12px] font-medium text-ink-subtle">
          {filtered.length} request{filtered.length === 1 ? '' : 's'} · shared demo store with Faculty/Staff My Access
          Requests
        </p>
      </div>

      {loading ? (
        <div className="panel flex items-center justify-center gap-2 px-6 py-14 text-[13px] font-medium text-ink-muted">
          <Loader2Icon className="h-4 w-4 animate-spin text-brand-600" />
          Loading access requests…
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={InboxIcon}
            title="No Technical Review access requests match"
            description="Adjust filters or wait for Faculty/Staff demo submissions in this browser."
            action={
              query || status ? (
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <ul className="space-y-2.5 lg:hidden">
            {filtered.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="panel panel-hover flex w-full flex-col gap-2 p-4 text-left"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-bold tabular-nums text-ink">{row.demoRequestId}</p>
                    <AccessRequestStatusBadge status={row.status} />
                  </div>
                  <p className="text-[13px] font-semibold text-ink">{row.campusName}</p>
                  <p className="text-[12px] font-medium text-ink-muted line-clamp-2">{row.collegeProgram}</p>
                  <p className="line-clamp-2 text-[12px] text-ink-subtle">{row.purpose}</p>
                  <p className="text-[11px] text-ink-subtle">Submitted {formatDate(row.submittedAt)}</p>
                </button>
              </li>
            ))}
          </ul>

          <div className="panel hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-line bg-canvas text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Request ID</th>
                    <th className="whitespace-nowrap px-4 py-3">Campus</th>
                    <th className="px-4 py-3">College / Program</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="whitespace-nowrap px-4 py-3">Submitted</th>
                    <th className="whitespace-nowrap px-4 py-3">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {filtered.map((row) => (
                    <tr key={row.id} className="bg-surface hover:bg-canvas/70">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-ink">
                        {row.demoRequestId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.campusName}</td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-ink-muted">{row.collegeProgram}</td>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-ink-muted">{row.purpose}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatDate(row.submittedAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <AccessRequestStatusBadge status={row.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-brand-700"
                          onClick={() => setSelected(row)}
                        >
                          <ClipboardCheckIcon className="h-3.5 w-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <TechnicalReviewReviewModal
        request={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          void reload();
        }}
        reviewerName={reviewerName}
      />
    </>
  );
}
