import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardListIcon, PlusIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { Criterion, Indicator } from '../../types/evidence';
import { countForCriterion } from '../../utils/coverage';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { HierarchyPath } from '../../components/criteria/HierarchyPath';
import { CriterionDetail } from '../../components/criteria/CriterionDetail';
import { CriterionFormModal } from '../../components/criteria/CriterionFormModal';
import { IndicatorFormModal } from '../../components/criteria/IndicatorFormModal';
import { RequirementFormModal } from '../../components/criteria/RequirementFormModal';
import { LinkDocumentsModal } from '../../components/criteria/LinkDocumentsModal';

export function CriteriaExplorer() {
  const [params, setParams] = useSearchParams();
  const { frameworks, areas, criteria, indicators, documents } = usePortal();
  const lookup = useLookup();
  const frameworkId = params.get('framework') ?? 'ia';
  const fwCriteria = criteria.filter((c) => c.frameworkId === frameworkId);
  const selected = fwCriteria.find((c) => c.id === params.get('criterion')) ?? fwCriteria[0];

  const [criterionModal, setCriterionModal] = useState<{open: boolean;criterion: Criterion | null;}>({ open: false, criterion: null });
  const [indicatorModal, setIndicatorModal] = useState<{open: boolean;indicator: Indicator | null;}>({ open: false, indicator: null });
  const [requirementFor, setRequirementFor] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<Indicator | null>(null);

  const select = (fw: string, criterionId?: string) => setParams(criterionId ? { framework: fw, criterion: criterionId } : { framework: fw }, { replace: true });

  const firstIndicator = selected ? indicators.find((i) => i.criterionId === selected.id) : undefined;
  const linkedCount = firstIndicator ? documents.filter((d) => d.indicatorId === firstIndicator.id && d.status === 'Indexed').length : 0;
  const fwAreas = areas.filter((a) => fwCriteria.some((c) => c.areaId === a.id));

  return (
    <>
      <PageHeader
        title="Criteria"
        description="Accreditation requirements organized as Framework → Area → Criterion → Indicator → Evidence Requirement → Evidence Documents."
        actions={
        <button type="button" className="btn btn-primary" onClick={() => setCriterionModal({ open: true, criterion: null })}>
            <PlusIcon className="h-4 w-4" /> Add criterion
          </button>
        } />
      

      <HierarchyPath
        steps={[
        { label: 'Framework', value: lookup.framework(frameworkId)?.name },
        { label: 'Accreditation Area', value: selected ? lookup.area(selected.areaId)?.name : undefined },
        { label: 'Criterion', value: selected ? `${selected.code} – ${selected.name}` : undefined },
        { label: 'Indicator', value: firstIndicator ? `${firstIndicator.code} ${firstIndicator.name}` : undefined },
        { label: 'Evidence Requirement', value: firstIndicator?.requirements[0]?.name },
        { label: 'Evidence Documents', value: firstIndicator ? `${linkedCount} linked` : undefined }]
        } />
      

      <div className="mt-5 flex flex-wrap gap-1.5" role="group" aria-label="Framework">
        {frameworks.map((f) =>
        <button
          key={f.id}
          type="button"
          onClick={() => select(f.id)}
          aria-pressed={f.id === frameworkId}
          className={`btn btn-sm ${f.id === frameworkId ? 'bg-brand-700 text-white hover:bg-brand-800' : 'btn-secondary'}`}>
          
            {f.shortName}
            <span className="sr-only"> – {f.name}</span>
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <nav aria-label="Criteria by area" className="panel self-start p-2 lg:sticky lg:top-24">
          {fwAreas.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-ink-muted">No criteria in this framework yet.</p>}
          {fwAreas.map((area) =>
          <div key={area.id} className="py-1">
              <p className="px-3 pb-1 pt-2 text-xs font-medium text-ink-subtle">{area.name}</p>
              <ul>
                {fwCriteria.filter((c) => c.areaId === area.id).map((c) => {
                const active = c.id === selected?.id;
                return (
                  <li key={c.id}>
                      <button
                      type="button"
                      onClick={() => select(frameworkId, c.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors duration-150 ${
                      active ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink hover:bg-canvas'}`
                      }>
                      
                        <span className="truncate">{c.code} – {c.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-ink-subtle">{countForCriterion(documents, c.id)}</span>
                      </button>
                    </li>);

              })}
              </ul>
            </div>
          )}
        </nav>

        {selected ?
        <CriterionDetail
          criterion={selected}
          onEditCriterion={() => setCriterionModal({ open: true, criterion: selected })}
          onAddIndicator={() => setIndicatorModal({ open: true, indicator: null })}
          onEditIndicator={(indicator) => setIndicatorModal({ open: true, indicator })}
          onDefineRequirement={setRequirementFor}
          onLinkDocuments={setLinkFor} /> :


        <div className="panel">
            <EmptyState icon={ClipboardListIcon} title="No criteria yet" description="Add the first criterion for this framework." />
          </div>
        }
      </div>

      <CriterionFormModal
        open={criterionModal.open}
        criterion={criterionModal.criterion}
        defaultFrameworkId={frameworkId}
        onClose={() => setCriterionModal({ open: false, criterion: null })}
        onSaved={(c) => select(c.frameworkId, c.id)} />
      
      <IndicatorFormModal
        open={indicatorModal.open}
        indicator={indicatorModal.indicator}
        defaultCriterionId={selected?.id}
        onClose={() => setIndicatorModal({ open: false, indicator: null })} />
      
      <RequirementFormModal open={!!requirementFor} defaultIndicatorId={requirementFor ?? ''} onClose={() => setRequirementFor(null)} />
      <LinkDocumentsModal indicator={linkFor} onClose={() => setLinkFor(null)} />
    </>);

}