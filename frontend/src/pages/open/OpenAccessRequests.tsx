import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  InboxIcon,
  PlusIcon,
  SearchIcon,
  XIcon
} from 'lucide-react';
import { AccessRequestDetailsModal } from '../../components/open/accessRequests/AccessRequestDetailsModal';
import { AccessRequestFormModal } from '../../components/open/accessRequests/AccessRequestFormModal';
import { AccessRequestStatusBadge } from '../../components/open/accessRequests/AccessRequestStatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { accessRequestService } from '../../services/accessRequests/accessRequestService';
import { subscribeAccessRequests } from '../../services/accessRequests/mockAccessRequestStore';
import type {
  TechnicalReviewAccessRequest,
  TechnicalReviewAccessStatus
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

export function OpenAccessRequests() {
  const session = useSessionAccount();
  const [requests, setRequests] = useState<TechnicalReviewAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TechnicalReviewAccessStatus | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<TechnicalReviewAccessRequest | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await accessRequestService.listRequests(session?.id || session?.email);
      setRequests(rows);
    } finally {
      setLoading(false);
    }
  }, [session?.id, session?.email]);

  useEffect(() => {
    void reload();
    return subscribeAccessRequests(() => {
      void reload();
    });
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [r.demoRequestId, r.campusName, r.collegeProgram, r.purpose, r.status]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [requests, query, status]);

  const clearFilters = () => {
    setQuery('');
    setStatus('');
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/open" className="btn btn-ghost btn-sm text-brand-700">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link to="/open/browse?tab=technical-reviews" className="btn btn-ghost btn-sm">
            Technical Reviews
          </Link>
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
          NEMSU · ACCREVIA
        </p>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
                My Access Requests
              </h1>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                Demo
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-relaxed text-ink-muted sm:text-[14px]">
              Demo requests for AACCUP Technical Review access. Statuses are simulated and never unlock restricted
              documents. Client-side role checks are not secure authorization.
            </p>
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={() => setFormOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            New demo request
          </button>
        </div>
      </header>

      <div className="panel space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
          <div className="relative">
            <label htmlFor="tr-req-search" className="sr-only">
              Search access requests
            </label>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              id="tr-req-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, campus, program, purpose…"
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
          <div>
            <label htmlFor="tr-req-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="tr-req-status"
              className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium"
              value={status}
              onChange={(e) => setStatus(e.target.value as TechnicalReviewAccessStatus | '')}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s || 'all'} value={s}>
                  {s || 'All statuses'}
                </option>
              ))}
            </select>
          </div>
          {(query || status) && (
            <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
        <p className="text-[12px] font-medium text-ink-subtle">
          {filtered.length} request{filtered.length === 1 ? '' : 's'} · DEMO catalog stored locally in this browser
        </p>
      </div>

      {loading ? (
        <div className="panel px-6 py-14 text-center text-[13px] font-medium text-ink-muted">Loading demo requests…</div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={InboxIcon}
            title="No access requests match"
            description="Submit a demo request from Technical Reviews, or clear filters to see sample statuses."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
                New demo request
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile cards */}
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
                  <p className="text-[11px] text-ink-subtle">Submitted {formatDate(row.submittedAt)}</p>
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
                    <th className="whitespace-nowrap px-4 py-3">Request ID</th>
                    <th className="whitespace-nowrap px-4 py-3">Campus</th>
                    <th className="px-4 py-3">College / Program</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="whitespace-nowrap px-4 py-3">Submitted</th>
                    <th className="whitespace-nowrap px-4 py-3">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Action</th>
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
                          View details
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

      <AccessRequestFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
      <AccessRequestDetailsModal
        request={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          void reload();
        }}
      />
    </div>
  );
}
