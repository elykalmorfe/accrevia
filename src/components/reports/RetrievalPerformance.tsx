import React from 'react';
import { LockIcon } from 'lucide-react';
import { BarList } from '../ui/BarList';
import { latencyBreakdown, retrievalComparison, retrievalMetrics } from '../../data/analytics';

export function RetrievalPerformance() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-md border border-line bg-white px-4 py-3 text-[13px] text-ink-muted">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
        <span>
          Visible to administrators and researchers only. Evaluated on 120 annotated accreditation queries · last run Sep 28, 2026.
        </span>
      </div>

      <dl className="panel grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-3 xl:grid-cols-5">
        {retrievalMetrics.map((m) =>
        <div key={m.label} className="bg-white p-5">
            <dt className="text-xs font-medium text-ink">{m.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-brand-700">{m.value}</dd>
            <dd className="mt-1 text-xs text-ink-muted">{m.hint}</dd>
          </div>
        )}
      </dl>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="panel-title">Ranking performance by retrieval configuration</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Each stage of the hybrid pipeline and its contribution to ranking quality.</p>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[640px]">
              <thead className="bg-canvas">
                <tr>
                  <th className="th">Configuration</th>
                  <th className="th text-right">Precision@10</th>
                  <th className="th text-right">Recall@10</th>
                  <th className="th text-right">nDCG@10</th>
                  <th className="th text-right">MRR</th>
                  <th className="th text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {retrievalComparison.map((r, i) => {
                  const current = i === retrievalComparison.length - 1;
                  return (
                    <tr key={r.config} className={current ? 'bg-brand-50/60' : ''}>
                      <td className={`td ${current ? 'font-semibold' : ''}`}>
                        {r.config}
                        {current && <span className="ml-2 text-xs font-normal text-brand-700">In production</span>}
                      </td>
                      {[r.precision, r.recall, r.ndcg, r.mrr].map((v, j) =>
                      <td key={j} className="td text-right tabular-nums">{v.toFixed(2)}</td>
                      )}
                      <td className="td text-right tabular-nums text-ink-muted">{r.latency} ms</td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel self-start p-5">
          <h2 className="panel-title">Response time breakdown</h2>
          <p className="mb-4 mt-0.5 text-xs text-ink-muted">Average per query, 420 ms total</p>
          <BarList items={latencyBreakdown} unit="ms" />
        </section>
      </div>
    </div>);

}