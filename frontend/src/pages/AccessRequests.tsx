import { usePortal } from '../contexts/PortalContext';
import { PageHeader } from '../components/ui/PageHeader';
import { AccessRequestsTable } from '../components/sharing/AccessRequestsTable';

export function AccessRequests() {
  const { accessRequests } = usePortal();
  const count = (s: 'Pending' | 'Approved' | 'Rejected') => accessRequests.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader
        eyebrow="Document Access"
        title="Access Requests"
        description="Review requests to view or download private documents. Approving a request grants access immediately; every decision is recorded in the Request Logs."
      />

      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
        <div>
          <dt className="text-ink-muted">Pending</dt>
          <dd className="text-xl font-semibold tabular-nums text-amber-700">{count('Pending')}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Approved</dt>
          <dd className="text-xl font-semibold tabular-nums text-ink">{count('Approved')}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Rejected</dt>
          <dd className="text-xl font-semibold tabular-nums text-ink">{count('Rejected')}</dd>
        </div>
      </dl>

      <AccessRequestsTable />
    </>
  );
}
