import React from 'react';
import { useLookup } from '../../hooks/useLookup';
import { BarList } from '../ui/BarList';
import { evidenceByArea, evidenceByCriterion, evidenceByFramework, evidenceByYear, repositoryStats } from '../../data/analytics';
import { formatNumber } from '../../utils/format';

export function EvidenceStatistics() {
  const lookup = useLookup();
  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-x-10 gap-y-3 p-5">
        <div>
          <p className="text-[13px] text-ink-muted">Total documents</p>
          <p className="font-serif text-4xl font-semibold text-ink">{formatNumber(repositoryStats.total)}</p>
        </div>
        <p className="max-w-lg text-[13px] text-ink-muted">
          Faculty and curriculum evidence make up 30% of the repository. Institutional Planning and Library are the thinnest areas going into the 2025 institutional accreditation cycle.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by framework</h2>
          <BarList items={evidenceByFramework} />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by academic year</h2>
          <BarList items={evidenceByYear} tone="gold" />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by area</h2>
          <BarList items={evidenceByArea} />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Top criteria by document count</h2>
          <BarList
            items={evidenceByCriterion.map((c) => {
              const criterion = lookup.criterion(c.criterionId);
              const fw = criterion ? lookup.framework(criterion.frameworkId)?.shortName : '';
              return { label: `${fw} · ${criterion?.code} – ${criterion?.name}`, value: c.value };
            })} />
          
        </section>
      </div>
    </div>);

}