import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLookup } from '../../hooks/useLookup';
import { usePortal } from '../../contexts/PortalContext';
import { BarList } from '../ui/BarList';
import { formatNumber } from '../../utils/format';

export function SearchAnalytics() {
  const lookup = useLookup();
  const { documents, filteredDocuments, selectedCampus, selectedCampusObj, accessLog, recentSearches } = usePortal();

  const campusDocIds = useMemo(() => new Set(filteredDocuments.map((d) => d.id)), [filteredDocuments]);
  const retrievals = useMemo(
    () => accessLog.filter((e) => (e.action === 'Viewed' || e.action === 'Downloaded') && campusDocIds.has(e.documentId)),
    [accessLog, campusDocIds]
  );

  const kpis = [
    { label: 'Recent searches', value: formatNumber(recentSearches.length) },
    { label: 'Document views', value: formatNumber(retrievals.filter((e) => e.action === 'Viewed').length) },
    { label: 'Downloads', value: formatNumber(retrievals.filter((e) => e.action === 'Downloaded').length) },
    { label: 'Searchable documents', value: formatNumber(filteredDocuments.length) },
    { label: 'Criteria with evidence', value: formatNumber(new Set(filteredDocuments.map((d) => d.criterionId).filter(Boolean)).size) }
  ];

  const mostRetrieved = useMemo(() => {
    const counts = new Map<string, number>();
    retrievals.forEach((e) => counts.set(e.documentId, (counts.get(e.documentId) || 0) + 1));
    return [...counts.entries()]
      .flatMap(([docId, value]) => {
        const doc = documents.find((d) => d.id === docId);
        return doc ? [{ doc, value }] : [];
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [retrievals, documents]);

  const requestedCriteria = useMemo(() => {
    const counts = new Map<string, number>();
    retrievals.forEach((e) => {
      const criterionId = documents.find((d) => d.id === e.documentId)?.criterionId;
      if (criterionId) counts.set(criterionId, (counts.get(criterionId) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([criterionId, value]) => {
        const c = lookup.criterion(criterionId);
        return { label: `${c ? lookup.framework(c.frameworkId)?.shortName : ''} · ${c?.code || criterionId} – ${c?.name || ''}`, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [retrievals, documents, lookup]);

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
          <h2 className="panel-title mb-3">Recent search terms</h2>
          {recentSearches.length === 0 ? (
            <p className="py-4 text-xs text-ink-muted">No searches recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentSearches.map((q) => (
                <li key={q} className="py-2">
                  <Link to={`/search?q=${encodeURIComponent(q)}`} className="text-[13px] text-ink hover:text-brand-700 hover:underline">{q}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-3">Most retrieved documents</h2>
          {mostRetrieved.length === 0 ? (
            <p className="py-4 text-xs text-ink-muted">No document retrievals recorded yet.</p>
          ) : (
            <ol className="divide-y divide-line">
              {mostRetrieved.map(({ doc, value }, i) => (
                <li key={doc.id} className="flex items-start gap-3 py-2.5">
                  <span className="w-4 shrink-0 text-[13px] font-semibold tabular-nums text-ink-subtle">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/documents/${doc.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">{doc.title}</Link>
                    <p className="text-xs text-ink-muted">{value} {value === 1 ? 'retrieval' : 'retrievals'}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Frequently requested criteria</h2>
          <BarList items={requestedCriteria} emptyText="No criteria requested yet." />
        </section>
      </div>
    </div>
  );
}
