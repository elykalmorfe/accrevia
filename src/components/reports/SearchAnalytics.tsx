import React from 'react';
import { Link } from 'react-router-dom';
import { useLookup } from '../../hooks/useLookup';
import { usePortal } from '../../contexts/PortalContext';
import { BarList } from '../ui/BarList';
import { mostRetrievedDocuments, requestedCriteria, searchStats, topSearchTerms } from '../../data/analytics';
import { formatNumber } from '../../utils/format';

export function SearchAnalytics() {
  const lookup = useLookup();
  const { documents } = usePortal();

  const kpis = [
  { label: 'Total searches', value: formatNumber(searchStats.totalSearches) },
  { label: 'Last 30 days', value: formatNumber(searchStats.last30Days) },
  { label: 'Avg. response time', value: `${searchStats.avgResponseMs} ms` },
  { label: 'Searches with no results', value: `${searchStats.zeroResultRate}%` },
  { label: 'Searches leading to a document view', value: `${searchStats.clickThroughRate}%` }];


  return (
    <div className="space-y-4">
      <dl className="panel grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) =>
        <div key={k.label} className="bg-white p-5">
            <dt className="text-xs text-ink-muted">{k.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{k.value}</dd>
          </div>
        )}
      </dl>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Most searched terms</h2>
          <BarList items={topSearchTerms.map((t) => ({ ...t, to: `/search?q=${encodeURIComponent(t.label)}` }))} tone="gold" />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-3">Most retrieved documents</h2>
          <ol className="divide-y divide-line">
            {mostRetrievedDocuments.map((m, i) => {
              const doc = documents.find((d) => d.id === m.docId);
              if (!doc) return null;
              return (
                <li key={m.docId} className="flex items-start gap-3 py-2.5">
                  <span className="w-4 shrink-0 text-[13px] font-semibold tabular-nums text-ink-subtle">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/documents/${doc.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">{doc.title}</Link>
                    <p className="text-xs text-ink-muted">{m.value} retrievals</p>
                  </div>
                </li>);

            })}
          </ol>
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Frequently requested criteria</h2>
          <BarList
            items={requestedCriteria.map((r) => {
              const c = lookup.criterion(r.criterionId);
              return { label: `${c ? lookup.framework(c.frameworkId)?.shortName : ''} · ${c?.code} – ${c?.name}`, value: r.value };
            })} />
          
        </section>
      </div>
    </div>);

}