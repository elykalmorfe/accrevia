import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardListIcon, FileTextIcon, ListTreeIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { frameworkCategories } from '../../data/frameworks';
import { Framework } from '../../types/evidence';
import { formatNumber } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Switch } from '../../components/ui/Switch';
import { Badge } from '../../components/ui/Badge';
import { RowActionsMenu } from '../../components/ui/RowActionsMenu';
import { FrameworkFormModal } from '../../components/frameworks/FrameworkFormModal';

export function Frameworks() {
  const navigate = useNavigate();
  const { frameworks, criteria, indicators, setFrameworkActive } = usePortal();
  const [modal, setModal] = useState<{open: boolean;framework: Framework | null;}>({ open: false, framework: null });

  const stats = (id: string) => {
    const ids = criteria.filter((c) => c.frameworkId === id).map((c) => c.id);
    return { criteria: ids.length, indicators: indicators.filter((i) => ids.includes(i.criterionId)).length };
  };

  const toggle = (f: Framework, active: boolean) => {
    setFrameworkActive(f.id, active);
    toast(`${f.shortName} ${active ? 'activated' : 'deactivated'}`);
  };

  return (
    <>
      <PageHeader
        title="Accreditation & Frameworks"
        description="Frameworks are the classification categories that organize quality-assurance evidence. Each document, criterion, and indicator belongs to one framework."
        actions={
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, framework: null })}>
            <PlusIcon className="h-4 w-4" /> Add framework
          </button>
        } />
      

      <div className="space-y-7">
        {frameworkCategories.map((cat) => {
          const list = frameworks.filter((f) => f.category === cat.category);
          if (!list.length) return null;
          return (
            <section key={cat.category} aria-labelledby={`cat-${cat.category}`}>
              <div className="mb-2.5">
                <h2 id={`cat-${cat.category}`} className="text-sm font-semibold text-ink">{cat.category}</h2>
                <p className="text-[13px] text-ink-muted">{cat.description}</p>
              </div>
              <ul className="panel divide-y divide-line">
                {list.map((f) => {
                  const s = stats(f.id);
                  return (
                    <li key={f.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-8">
                      <div className={`min-w-0 ${f.active ? '' : 'opacity-60'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/frameworks/${f.id}`} className="text-[15px] font-semibold text-ink hover:text-brand-700 hover:underline">{f.name}</Link>
                          <Badge tone="brand">{f.shortName}</Badge>
                          {!f.active && <Badge>Inactive</Badge>}
                        </div>
                        <p className="mt-0.5 text-[13px] text-ink-muted">{f.body}</p>
                        <p className="mt-1 text-[13px] text-ink">{f.description}</p>
                      </div>
                      <dl className="flex gap-6 text-[13px]">
                        <div>
                          <dt className="text-xs text-ink-muted">Criteria</dt>
                          <dd className="font-semibold tabular-nums text-ink">{s.criteria}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-ink-muted">Indicators</dt>
                          <dd className="font-semibold tabular-nums text-ink">{s.indicators}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-ink-muted">Evidence</dt>
                          <dd className="font-semibold tabular-nums text-ink">{formatNumber(f.documentCount)}</dd>
                        </div>
                      </dl>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 text-[13px] text-ink-muted">
                          <Switch checked={f.active} onChange={(v) => toggle(f, v)} label={`${f.name} active`} />
                          <span className="w-14">{f.active ? 'Active' : 'Inactive'}</span>
                        </span>
                        <Link to={`/frameworks/${f.id}`} className="btn btn-secondary btn-sm">View</Link>
                        <RowActionsMenu
                          label={`More actions for ${f.name}`}
                          actions={[
                          { label: 'Edit framework', icon: PencilIcon, onSelect: () => setModal({ open: true, framework: f }) },
                          { label: 'View associated evidence', icon: FileTextIcon, onSelect: () => navigate(`/frameworks/${f.id}?tab=evidence`) },
                          { label: 'View criteria', icon: ListTreeIcon, onSelect: () => navigate(`/frameworks/${f.id}?tab=criteria`) },
                          { label: 'View indicators', icon: ClipboardListIcon, onSelect: () => navigate(`/frameworks/${f.id}?tab=indicators`) }]
                          } />
                        
                      </div>
                    </li>);

                })}
              </ul>
            </section>);

        })}
      </div>

      <FrameworkFormModal open={modal.open} framework={modal.framework} onClose={() => setModal({ open: false, framework: null })} />
    </>);

}