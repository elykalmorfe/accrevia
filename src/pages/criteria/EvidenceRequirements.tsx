import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { coverageLevel, countForRequirement } from '../../utils/coverage';
import { PageHeader } from '../../components/ui/PageHeader';
import { SelectField } from '../../components/ui/SelectField';
import { FrameworkTag } from '../../components/ui/FrameworkTag';
import { CoverageBadge } from '../../components/ui/CoverageBadge';
import { RequirementFormModal } from '../../components/criteria/RequirementFormModal';

export function EvidenceRequirements() {
  const { frameworks, indicators, documents } = usePortal();
  const lookup = useLookup();
  const [frameworkId, setFrameworkId] = useState('');
  const [open, setOpen] = useState(false);

  const rows = indicators.
  filter((i) => !frameworkId || lookup.criterion(i.criterionId)?.frameworkId === frameworkId).
  flatMap((i) => i.requirements.map((r, idx) => ({ indicator: i, requirement: r, count: countForRequirement(documents, i.id, r.id, idx === 0) })));

  return (
    <>
      <PageHeader
        title="Evidence Requirements"
        description="What each indicator needs as proof. Evidence documents are linked to these requirements so accreditors can trace every claim."
        actions={
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <PlusIcon className="h-4 w-4" /> Define requirement
          </button>
        } />
      
      <section className="panel overflow-hidden">
        <div className="border-b border-line p-4">
          <SelectField compact hideLabel label="Framework" value={frameworkId} onChange={setFrameworkId} placeholder="All frameworks" options={frameworks.map((f) => ({ value: f.id, label: f.name }))} className="sm:w-60" />
        </div>
        <ul className="divide-y divide-line">
          {rows.map(({ indicator, requirement, count }) => {
            const c = lookup.criterion(indicator.criterionId);
            return (
              <li key={requirement.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)_auto] md:items-center md:gap-6">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{requirement.name}</p>
                  {requirement.description && <p className="mt-0.5 text-xs text-ink-muted">{requirement.description}</p>}
                </div>
                <div className="flex min-w-0 items-center gap-2 text-[13px]">
                  {c && <FrameworkTag frameworkId={c.frameworkId} />}
                  <Link to={`/criteria/criteria?framework=${c?.frameworkId}&criterion=${indicator.criterionId}`} className="truncate text-ink-muted hover:text-brand-700 hover:underline">
                    {c?.code} · Indicator {indicator.code}
                  </Link>
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                  <span className="text-xs tabular-nums text-ink-muted">{count} linked</span>
                  <CoverageBadge level={coverageLevel(count)} />
                </div>
              </li>);

          })}
        </ul>
      </section>
      <RequirementFormModal open={open} onClose={() => setOpen(false)} />
    </>);

}