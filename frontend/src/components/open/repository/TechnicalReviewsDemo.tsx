import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, Loader2Icon, PlusIcon } from 'lucide-react';
import { AccessRequestDetailsModal } from '../accessRequests/AccessRequestDetailsModal';
import { AccessRequestFormModal } from '../accessRequests/AccessRequestFormModal';
import { AccessRequestStatusBadge } from '../accessRequests/AccessRequestStatusBadge';
import { RestrictedAccessNotice } from './RestrictedAccessNotice';
import { accessRequestService } from '../../../services/accessRequests/accessRequestService';
import { subscribeAccessRequests } from '../../../services/accessRequests/mockAccessRequestStore';
import type { TechnicalReviewAccessRequest } from '../../../types/technicalReviewAccess';
import { useSessionAccount } from '../../../utils/auth';

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

export function TechnicalReviewsDemo() {
  const session = useSessionAccount();
  const [rows, setRows] = useState<TechnicalReviewAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<TechnicalReviewAccessRequest | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accessRequestService.listRequests(session?.id || session?.email);
      setRows(data.slice(0, 6));
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">AACCUP Technical Reviews</h2>
        <p className="mt-1 text-[13px] font-medium text-ink-muted">
          Restricted materials. Access requests below are a{' '}
          <span className="font-semibold text-ink">UI demonstration</span> only and do not grant real Google Drive
          access.
        </p>
      </div>

      <RestrictedAccessNotice
        badge="QA Approval Required"
        title="Access requires QA authorization"
        description="Technical review filenames, previews, and source Drive links are never shown in the Faculty/Staff portal. Submit a demo request to exercise the workflow UI."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Request Access
          </button>
        }
      />

      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] font-bold text-ink">Recent demo access requests</h3>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                UI demo
              </span>
            </div>
            <p className="mt-1 text-[12px] font-medium text-ink-muted">
              Pending, Approved, Denied, Expired, Revoked, and Canceled illustrate layout only. Document identities
              remain hidden.
            </p>
          </div>
          <Link to="/open/access-requests" className="btn btn-ghost btn-sm text-brand-700">
            My Access Requests
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] font-medium text-ink-muted">
            <Loader2Icon className="h-4 w-4 animate-spin text-brand-600" />
            Loading demo requests…
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line-subtle overflow-hidden rounded-xl border border-line">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="flex w-full flex-col gap-2 bg-surface px-3.5 py-3 text-left transition hover:bg-canvas sm:flex-row sm:items-center sm:justify-between sm:px-4"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold tabular-nums text-ink">{row.demoRequestId}</p>
                    <p className="mt-0.5 text-[12px] font-medium text-ink-muted">
                      {row.campusName} · {row.collegeProgram}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-subtle">Submitted {formatDate(row.submittedAt)}</p>
                  </div>
                  <AccessRequestStatusBadge status={row.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AccessRequestFormModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={() => void reload()} />
      <AccessRequestDetailsModal
        request={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => void reload()}
      />
    </div>
  );
}
