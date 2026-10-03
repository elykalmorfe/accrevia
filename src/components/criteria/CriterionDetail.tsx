import React from 'react';
import { Link } from 'react-router-dom';
import { LinkIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { Criterion, Indicator } from '../../types/evidence';
import { coverageLevel, countForIndicator, countForRequirement } from '../../utils/coverage';
import { CoverageBadge } from '../ui/CoverageBadge';

interface CriterionDetailProps {
  criterion: Criterion;
  onEditCriterion: () => void;
  onAddIndicator: () => void;
  onEditIndicator: (indicator: Indicator) => void;
  onDefineRequirement: (indicatorId: string) => void;
  onLinkDocuments: (indicator: Indicator) => void;
}

export function CriterionDetail({ criterion, onEditCriterion, onAddIndicator, onEditIndicator, onDefineRequirement, onLinkDocuments }: CriterionDetailProps) {
  const { indicators, documents } = usePortal();
  const lookup = useLookup();
  const list = indicators.filter((i) => i.criterionId === criterion.id);

  return (
    <section className="panel" aria-labelledby="criterion-title">
      <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] text-ink-muted">
            {lookup.framework(criterion.frameworkId)?.name} · {lookup.area(criterion.areaId)?.name}
          </p>
          <h2 id="criterion-title" className="mt-0.5 font-serif text-xl font-semibold text-ink">
            {criterion.code} – {criterion.name}
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted">{criterion.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onEditCriterion}>
            <PencilIcon className="h-3.5 w-3.5" /> Edit criterion
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onAddIndicator}>
            <PlusIcon className="h-3.5 w-3.5" /> Add indicator
          </button>
        </div>
      </div>

      {list.length === 0 && <p className="px-5 py-10 text-center text-[13px] text-ink-muted">No indicators defined for this criterion yet.</p>}

      {list.map((indicator) => {
        const linked = documents.filter((d) => d.indicatorId === indicator.id && d.status !== 'Archived');
        const count = countForIndicator(documents, indicator.id);
        return (
          <article key={indicator.id} className="border-b border-line p-5 last:border-b-0" aria-labelledby={`ind-${indicator.id}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 id={`ind-${indicator.id}`} className="text-sm font-semibold text-ink">
                  Indicator {indicator.code} – {indicator.name}
                </h3>
                <CoverageBadge level={coverageLevel(count)} />
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEditIndicator(indicator)}>
                  <PencilIcon className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onLinkDocuments(indicator)}>
                  <LinkIcon className="h-3.5 w-3.5" /> Link documents
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-ink-muted">Evidence requirements</p>
                <ul className="mt-2 space-y-2">
                  {indicator.requirements.map((r, idx) =>
                  <li key={r.id} className="rounded-md bg-canvas px-3 py-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[13px] font-medium text-ink">{r.name}</p>
                        <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                          {countForRequirement(documents, indicator.id, r.id, idx === 0)} linked
                        </span>
                      </div>
                      {r.description && <p className="mt-0.5 text-xs text-ink-muted">{r.description}</p>}
                    </li>
                  )}
                </ul>
                <button type="button" className="link mt-2 inline-flex items-center gap-1 text-xs" onClick={() => onDefineRequirement(indicator.id)}>
                  <PlusIcon className="h-3 w-3" /> Define requirement
                </button>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-muted">Evidence documents ({linked.length})</p>
                {linked.length ?
                <ul className="mt-2 divide-y divide-line">
                    {linked.map((d) =>
                  <li key={d.id} className="py-2">
                        <Link to={`/documents/${d.id}`} className="text-[13px] text-ink hover:text-brand-700 hover:underline">
                          {d.title}
                        </Link>
                        <p className="text-xs text-ink-muted">
                          {d.docType} · AY {d.academicYear}
                        </p>
                      </li>
                  )}
                  </ul> :

                <p className="mt-2 text-[13px] text-ink-muted">No evidence linked yet. Link existing documents or upload new evidence.</p>
                }
              </div>
            </div>
          </article>);

      })}
    </section>);

}