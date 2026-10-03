import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { CoverageLevel, coverageLabels, coverageLevel, countForCriterion, countForIndicator } from '../../utils/coverage';
import { CoverageBadge } from '../ui/CoverageBadge';
import { FrameworkTag } from '../ui/FrameworkTag';
import { SelectField } from '../ui/SelectField';

const levels: CoverageLevel[] = ['Multiple', 'Available', 'Limited', 'None'];
const barColor: Record<CoverageLevel, string> = { Multiple: 'bg-success-600', Available: 'bg-brand-500', Limited: 'bg-gold-500', None: 'bg-danger-600' };

export function CoverageReport() {
  const { frameworks, criteria, indicators, documents } = usePortal();
  const lookup = useLookup();
  const [frameworkId, setFrameworkId] = useState('');

  const rows = criteria.
  filter((c) => !frameworkId || c.frameworkId === frameworkId).
  map((c) => {
    const list = indicators.filter((i) => i.criterionId === c.id);
    const count = countForCriterion(documents, c.id);
    return { criterion: c, indicators: list, count, level: coverageLevel(count), gaps: list.filter((i) => countForIndicator(documents, i.id) === 0) };
  }).
  sort((a, b) => a.count - b.count);

  const tally = levels.map((l) => ({ level: l, n: rows.filter((r) => r.level === l).length }));
  const gaps = rows.flatMap((r) => r.gaps.map((g) => ({ indicator: g, criterion: r.criterion })));

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="panel-title">Accreditation coverage by criterion</h2>
          <SelectField compact hideLabel label="Framework" value={frameworkId} onChange={setFrameworkId} placeholder="All frameworks" options={frameworks.map((f) => ({ value: f.id, label: f.name }))} className="sm:w-60" />
        </div>
        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
          {tally.map((t) => t.n ? <div key={t.level} className={barColor[t.level]} style={{ width: `${t.n / Math.max(rows.length, 1) * 100}%` }} /> : null)}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tally.map((t) =>
          <div key={t.level}>
              <dt className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className={`h-2 w-2 rounded-full ${barColor[t.level]}`} aria-hidden="true" /> {coverageLabels[t.level]}
              </dt>
              <dd className="text-xl font-semibold tabular-nums text-ink">{t.n}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Criterion</th>
                <th className="th">Framework</th>
                <th className="th">Indicators</th>
                <th className="th">Indexed documents</th>
                <th className="th">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) =>
              <tr key={r.criterion.id}>
                  <td className="td">
                    <Link to={`/criteria/criteria?framework=${r.criterion.frameworkId}&criterion=${r.criterion.id}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
                      {r.criterion.code} – {r.criterion.name}
                    </Link>
                  </td>
                  <td className="td"><FrameworkTag frameworkId={r.criterion.frameworkId} /></td>
                  <td className="td tabular-nums text-ink-muted">{r.indicators.length}</td>
                  <td className="td tabular-nums text-ink-muted">{r.count}</td>
                  <td className="td"><CoverageBadge level={r.level} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel self-start p-5">
          <h2 className="panel-title">Indicators with no indexed evidence</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Prioritize these before the next survey visit.</p>
          {gaps.length ?
          <ul className="mt-3 divide-y divide-line">
              {gaps.map(({ indicator, criterion }) =>
            <li key={indicator.id} className="py-2.5">
                  <Link to={`/criteria/criteria?framework=${criterion.frameworkId}&criterion=${criterion.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">
                    Indicator {indicator.code} – {indicator.name}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {lookup.framework(criterion.frameworkId)?.shortName} · {criterion.code} – {criterion.name}
                  </p>
                </li>
            )}
            </ul> :

          <p className="mt-3 text-[13px] text-ink-muted">Every indicator has at least one indexed document.</p>
          }
        </section>
      </div>
    </div>);

}