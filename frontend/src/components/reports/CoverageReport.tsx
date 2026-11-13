import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { CoverageLevel, coverageHints, coverageLabels, coverageLevel, countForCriterion, countForIndicator } from '../../utils/coverage';
import { percentOf } from '../../utils/reportMetrics';
import { CoverageBadge } from '../ui/CoverageBadge';
import { FrameworkTag } from '../ui/FrameworkTag';
import { SelectField } from '../ui/SelectField';
import { CampusScopeNote, PanelHeader } from './ReportParts';

const levels: CoverageLevel[] = ['Multiple', 'Available', 'Limited', 'None'];
const barColor: Record<CoverageLevel, string> = { Multiple: 'bg-success-600', Available: 'bg-brand-500', Limited: 'bg-warning-600', None: 'bg-danger-600' };

export function CoverageReport() {
  const { frameworks, criteria, indicators, filteredDocuments, selectedCampusObj } = usePortal();
  const lookup = useLookup();
  const [frameworkId, setFrameworkId] = useState('');

  const rows = criteria.
  filter((c) => !frameworkId || c.frameworkId === frameworkId).
  map((c) => {
    const list = indicators.filter((i) => i.criterionId === c.id);
    const count = countForCriterion(filteredDocuments, c.id);
    return { criterion: c, indicators: list, count, level: coverageLevel(count), gaps: list.filter((i) => countForIndicator(filteredDocuments, i.id) === 0) };
  }).
  sort((a, b) => a.count - b.count);

  const tally = levels.map((l) => ({ level: l, n: rows.filter((r) => r.level === l).length }));
  const gaps = rows.flatMap((r) => r.gaps.map((g) => ({ indicator: g, criterion: r.criterion })));
  const covered = rows.filter((r) => r.level === 'Multiple' || r.level === 'Available').length;

  return (
    <div className="space-y-4">
      <CampusScopeNote campusName={selectedCampusObj?.name} />

      <section className="panel p-5">
        <PanelHeader
          title="Do we have enough evidence for each criterion?"
          help="Each criterion is rated by how many uploaded documents support it (documents still being processed are not counted yet). 2 documents is enough; 3 or more is complete."
          action={
            <SelectField compact hideLabel label="Framework" value={frameworkId} onChange={setFrameworkId} placeholder="All frameworks" options={frameworks.map((f) => ({ value: f.id, label: f.name }))} className="sm:w-60" />
          }
        />
        <p className="text-sm text-ink">
          <span className="text-2xl font-bold tabular-nums">{percentOf(covered, rows.length)}%</span>{' '}
          <span className="text-ink-muted">of criteria have enough evidence ({covered} of {rows.length}).</span>
        </p>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
          {tally.map((t) => t.n ? <div key={t.level} className={barColor[t.level]} style={{ width: `${t.n / Math.max(rows.length, 1) * 100}%` }} /> : null)}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tally.map((t) =>
          <div key={t.level}>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <span className={`h-2 w-2 rounded-full ${barColor[t.level]}`} aria-hidden="true" /> {coverageLabels[t.level]}
              </dt>
              <dd className="text-xl font-semibold tabular-nums text-ink">{t.n}</dd>
              <dd className="text-[11px] text-ink-muted">{coverageHints[t.level]}</dd>
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
                <th className="th">Requirements</th>
                <th className="th">Documents</th>
                <th className="th">Evidence</th>
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
          <PanelHeader
            title="Requirements with no documents yet"
            help="Upload at least one document for each of these before the next survey visit."
          />
          {gaps.length ?
          <ul className="divide-y divide-line">
              {gaps.map(({ indicator, criterion }) =>
            <li key={indicator.id} className="py-2.5">
                  <Link to={`/criteria/criteria?framework=${criterion.frameworkId}&criterion=${criterion.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">
                    {indicator.code} – {indicator.name}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {lookup.framework(criterion.frameworkId)?.shortName} · {criterion.code} – {criterion.name}
                  </p>
                </li>
            )}
            </ul> :

          <p className="text-[13px] text-ink-muted">Every requirement has at least one document.</p>
          }
          {gaps.length > 0 &&
          <Link to="/evidence/upload" className="btn btn-primary btn-sm mt-4 w-full text-xs">
              <UploadIcon className="h-3.5 w-3.5" /> Upload evidence
            </Link>
          }
        </section>
      </div>
    </div>);

}
