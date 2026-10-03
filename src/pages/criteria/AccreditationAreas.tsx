import React, { useState } from 'react';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { AccreditationArea } from '../../types/evidence';
import { indexedDocs } from '../../utils/coverage';
import { PageHeader } from '../../components/ui/PageHeader';
import { FrameworkTag } from '../../components/ui/FrameworkTag';
import { AreaFormModal } from '../../components/criteria/AreaFormModal';

export function AccreditationAreas() {
  const { areas, criteria, documents } = usePortal();
  const [modal, setModal] = useState<{open: boolean;area: AccreditationArea | null;}>({ open: false, area: null });
  const indexed = indexedDocs(documents);

  return (
    <>
      <PageHeader
        title="Accreditation Areas"
        description="Subject areas that group criteria. Different frameworks may use different structures, so areas can be added or renamed at any time."
        actions={
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, area: null })}>
            <PlusIcon className="h-4 w-4" /> Add area
          </button>
        } />
      
      <section className="panel overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px]">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Area</th>
                <th className="th">Used by frameworks</th>
                <th className="th">Criteria</th>
                <th className="th">Indexed evidence</th>
                <th className="th text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {areas.map((a) => {
                const areaCriteria = criteria.filter((c) => c.areaId === a.id);
                const fwIds = Array.from(new Set(areaCriteria.map((c) => c.frameworkId)));
                return (
                  <tr key={a.id}>
                    <td className="td max-w-[420px]">
                      <p className="font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-ink-muted">{a.description}</p>
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {fwIds.length ? fwIds.map((id) => <FrameworkTag key={id} frameworkId={id} />) : <span className="text-ink-subtle">Not used yet</span>}
                      </div>
                    </td>
                    <td className="td tabular-nums text-ink-muted">{areaCriteria.length}</td>
                    <td className="td tabular-nums text-ink-muted">{indexed.filter((d) => d.areaId === a.id).length}</td>
                    <td className="td text-right">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal({ open: true, area: a })}>
                        <PencilIcon className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line md:hidden">
          {areas.map((a) =>
          <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
              <div>
                <p className="text-[13px] font-medium text-ink">{a.name}</p>
                <p className="text-xs text-ink-muted">
                  {criteria.filter((c) => c.areaId === a.id).length} criteria · {indexed.filter((d) => d.areaId === a.id).length} indexed documents
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label={`Edit ${a.name}`} onClick={() => setModal({ open: true, area: a })}>
                <PencilIcon className="h-4 w-4" />
              </button>
            </li>
          )}
        </ul>
      </section>
      <AreaFormModal open={modal.open} area={modal.area} onClose={() => setModal({ open: false, area: null })} />
    </>);

}