import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { shareStatus } from '../../utils/sharing';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { SharesTable } from '../../components/sharing/SharesTable';
import { AccessLogTable } from '../../components/sharing/AccessLogTable';
import { AccessRequestsTable } from '../../components/sharing/AccessRequestsTable';

type Tab = 'shares' | 'requests' | 'log';

export function SharedEvidence() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'shares';
  const { shares, accessLog, accessRequests } = usePortal();
  const count = (s: 'Active' | 'Expired' | 'Revoked') => shares.filter((x) => shareStatus(x) === s).length;
  const pendingCount = accessRequests.filter((r) => r.status === 'Pending').length;

  return (
    <>
      <div className="mb-3">
        <Link to="/evidence" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to All Documents</span>
        </Link>
      </div>

      <PageHeader
        eyebrow="Document Management"
        title="Shared Documents"
        description="Documents are private by default. Every share below was granted explicitly, and every view, download, access request, and permission change is recorded."
      />

      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
        <div>
          <dt className="text-ink-muted">Active shares</dt>
          <dd className="text-xl font-semibold tabular-nums text-ink">{count('Active')}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Pending access requests</dt>
          <dd className="text-xl font-semibold tabular-nums text-amber-700">{pendingCount}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Expired shares</dt>
          <dd className="text-xl font-semibold tabular-nums text-warning-700">{count('Expired')}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Shared documents</dt>
          <dd className="text-xl font-semibold tabular-nums text-ink">{new Set(shares.map((s) => s.documentId)).size}</dd>
        </div>
      </dl>

      <Tabs<Tab>
        label="Shared documents sections"
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        className="mb-5"
        tabs={[
          { id: 'shares', label: `Shares (${shares.length})` },
          { id: 'requests', label: `Access Requests (${pendingCount ? `${pendingCount} Pending` : accessRequests.length})` },
          { id: 'log', label: `Access Log (${accessLog.length})` }
        ]}
      />

      {tab === 'shares' && <SharesTable />}
      {tab === 'requests' && <AccessRequestsTable />}
      {tab === 'log' && <AccessLogTable />}
    </>
  );
}