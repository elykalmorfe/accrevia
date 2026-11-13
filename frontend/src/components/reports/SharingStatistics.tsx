import React, { useMemo } from 'react';
import { usePortal } from '../../contexts/PortalContext';
import { recipientRoles, shareStatus } from '../../utils/sharing';
import { BarList } from '../ui/BarList';
import { CampusScopeNote } from './ReportParts';

export function SharingStatistics() {
  const { shares, documents, filteredDocuments, selectedCampus, selectedCampusObj } = usePortal();
  const statuses = ['Active', 'Expired', 'Revoked'] as const;

  const campusDocIds = useMemo(() => new Set(filteredDocuments.map((d) => d.id)), [filteredDocuments]);
  const activeSharesForScope = useMemo(() => {
    if (selectedCampus === 'all') return shares;
    return shares.filter((s) => campusDocIds.has(s.documentId));
  }, [shares, selectedCampus, campusDocIds]);

  const kpis = [
    { label: 'Documents shared', value: new Set(activeSharesForScope.map((s) => s.documentId)).size },
    { label: 'Shares still open', value: activeSharesForScope.filter((s) => shareStatus(s) === 'Active').length },
    { label: 'Can view only', value: activeSharesForScope.filter((s) => !s.canDownload).length },
    { label: 'Can view and download', value: activeSharesForScope.filter((s) => s.canDownload).length }
  ];

  const perDoc = Object.entries(
    activeSharesForScope.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.documentId]: (acc[s.documentId] ?? 0) + 1 }), {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, value]) => ({ label: documents.find((d) => d.id === id)?.title ?? id, value, to: `/documents/${id}` }));

  return (
    <div className="space-y-4">
      {selectedCampus !== 'all' && (
        <CampusScopeNote campusName={selectedCampusObj?.name} detail={`${activeSharesForScope.length} shares in total`} />
      )}
      <p className="text-sm text-ink-muted">Who documents have been shared with and whether that access is still open.</p>
      <dl className="panel grid grid-cols-2 gap-px overflow-hidden bg-line xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white p-5">
            <dt className="text-xs text-ink-muted">{k.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{k.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Shares by recipient role</h2>
          <BarList
            items={recipientRoles.map((r) => ({
              label: r === 'Accreditor' ? 'Accreditors' : r,
              value: activeSharesForScope.filter((s) => s.recipientRole === r).length
            }))}
          />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Share status</h2>
          <BarList
            items={statuses.map((st) => ({
              label: st,
              value: activeSharesForScope.filter((s) => shareStatus(s) === st).length
            }))}
            tone="gold"
          />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Most shared documents</h2>
          <BarList items={perDoc} />
        </section>
      </div>
    </div>
  );
}