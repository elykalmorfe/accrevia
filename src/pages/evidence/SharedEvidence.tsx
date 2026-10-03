import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePortal } from '../../contexts/PortalContext';
import { shareStatus } from '../../utils/sharing';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { SharesTable } from '../../components/sharing/SharesTable';
import { AccessLogTable } from '../../components/sharing/AccessLogTable';

type Tab = 'shares' | 'log';

export function SharedEvidence() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') as Tab || 'shares';
  const { shares, accessLog } = usePortal();
  const count = (s: 'Active' | 'Expired' | 'Revoked') => shares.filter((x) => shareStatus(x) === s).length;

  return (
    <>
      <PageHeader
        title="Shared Evidence"
        description="Evidence is private by default. Every share below was granted explicitly, and every view, download, and permission change is recorded." />
      
      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
        <div><dt className="text-ink-muted">Active shares</dt><dd className="text-xl font-semibold tabular-nums text-ink">{count('Active')}</dd></div>
        <div><dt className="text-ink-muted">Expired</dt><dd className="text-xl font-semibold tabular-nums text-warning-700">{count('Expired')}</dd></div>
        <div><dt className="text-ink-muted">Revoked</dt><dd className="text-xl font-semibold tabular-nums text-ink-muted">{count('Revoked')}</dd></div>
        <div><dt className="text-ink-muted">Shared documents</dt><dd className="text-xl font-semibold tabular-nums text-ink">{new Set(shares.map((s) => s.documentId)).size}</dd></div>
      </dl>
      <Tabs<Tab>
        label="Shared evidence sections"
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        className="mb-5"
        tabs={[
        { id: 'shares', label: `Shares (${shares.length})` },
        { id: 'log', label: `Access Log (${accessLog.length})` }]
        } />
      
      {tab === 'shares' ? <SharesTable /> : <AccessLogTable />}
    </>);

}