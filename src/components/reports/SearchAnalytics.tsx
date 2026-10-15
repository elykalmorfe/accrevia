import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLookup } from '../../hooks/useLookup';
import { usePortal } from '../../contexts/PortalContext';
import { BarList } from '../ui/BarList';
import { mostRetrievedDocuments, requestedCriteria, searchStats, topSearchTerms } from '../../data/analytics';
import { formatNumber } from '../../utils/format';

export function SearchAnalytics() {
  const lookup = useLookup();
  const { documents, filteredDocuments, selectedCampus, selectedCampusObj } = usePortal();

  const campusDocIds = useMemo(() => new Set(filteredDocuments.map((d) => d.id)), [filteredDocuments]);

  const campusSearches = useMemo(() => {
    if (selectedCampus === 'all') return searchStats.totalSearches;
    return Math.round(searchStats.totalSearches / 7);
  }, [selectedCampus]);

  const campusLast30 = useMemo(() => {
    if (selectedCampus === 'all') return searchStats.last30Days;
    return Math.round(searchStats.last30Days / 7);
  }, [selectedCampus]);

  const kpis = [
    { label: 'Total searches', value: formatNumber(campusSearches) },
    { label: 'Last 30 days', value: formatNumber(campusLast30) },
    { label: 'Avg. response time', value: `${searchStats.avgResponseMs} ms` },
    { label: 'Searches with no results', value: `${searchStats.zeroResultRate}%` },
    { label: 'Searches leading to a document view', value: `${searchStats.clickThroughRate}%` }
  ];

  const campusRetrieved = useMemo(() => {
    if (selectedCampus === 'all') return mostRetrievedDocuments;
    return mostRetrievedDocuments.filter((m) => campusDocIds.has(m.docId));
  }, [selectedCampus, campusDocIds]);

  return (
    <div className="space-y-4">
      {selectedCampus !== 'all' && (
        <div className="rounded-lg border border-brand-200 bg-brand-50/60 px-4 py-2 text-xs text-brand-900 flex items-center justify-between">
          <span>Search and retrieval analytics filtered for <strong>{selectedCampusObj?.name}</strong></span>
          <span className="font-semibold text-brand-700">Campus Query Telemetry</span>
        </div>
      )}
      <dl className="panel grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white p-5">
            <dt className="text-xs text-ink-muted">{k.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{k.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Most searched terms</h2>
          <BarList items={topSearchTerms.map((t) => ({ ...t, to: `/search?q=${encodeURIComponent(t.label)}` }))} tone="gold" />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-3">Most retrieved documents</h2>
          {campusRetrieved.length === 0 ? (
            <p className="text-xs text-ink-muted py-4">No campus-specific retrievals recorded yet.</p>
          ) : (
            <ol className="divide-y divide-line">
              {campusRetrieved.map((m, i) => {
                const doc = documents.find((d) => d.id === m.docId);
                if (!doc) return null;
                return (
                  <li key={m.docId} className="flex items-start gap-3 py-2.5">
                    <span className="w-4 shrink-0 text-[13px] font-semibold tabular-nums text-ink-subtle">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/documents/${doc.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">{doc.title}</Link>
                      <p className="text-xs text-ink-muted">{m.value} retrievals</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Frequently requested criteria</h2>
          <BarList
            items={requestedCriteria.map((r) => {
              const c = lookup.criterion(r.criterionId);
              return { label: `${c ? lookup.framework(c.frameworkId)?.shortName : ''} · ${c?.code} – ${c?.name}`, value: r.value };
            })}
          />
        </section>
      </div>
    </div>
  );
}