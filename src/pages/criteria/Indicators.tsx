import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { Indicator } from '../../types/evidence';
import { coverageLevel, countForIndicator } from '../../utils/coverage';
import { PageHeader } from '../../components/ui/PageHeader';
import { SelectField } from '../../components/ui/SelectField';
import { FrameworkTag } from '../../components/ui/FrameworkTag';
import { CoverageBadge } from '../../components/ui/CoverageBadge';
import { IndicatorFormModal } from '../../components/criteria/IndicatorFormModal';

export function Indicators() {
  const { frameworks, indicators, documents } = usePortal();
  const lookup = useLookup();
  const [frameworkId, setFrameworkId] = useState('');
  const [text, setText] = useState('');
  const [modal, setModal] = useState<{open: boolean;indicator: Indicator | null;}>({ open: false, indicator: null });

  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return indicators.filter((i) => {
      const c = lookup.criterion(i.criterionId);
      return (!frameworkId || c?.frameworkId === frameworkId) && (!needle || `${i.code} ${i.name} ${c?.name}`.toLowerCase().includes(needle));
    });
  }, [indicators, frameworkId, text, lookup]);

  return (
    <>
      <PageHeader
        title="Indicators"
        description="Measurable indicators under each criterion, with the evidence currently linked to them."
        actions={
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, indicator: null })}>
            <PlusIcon className="h-4 w-4" /> Add indicator
          </button>
        } />
      
      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <div className="relative sm:w-72">
            <label htmlFor="indicator-filter" className="sr-only">Filter indicators</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <input id="indicator-filter" value={text} onChange={(e) => setText(e.target.value)} placeholder="Filter by code or name" className="input h-8 pl-9 text-[13px]" />
          </div>
          <SelectField compact hideLabel label="Framework" value={frameworkId} onChange={setFrameworkId} placeholder="All frameworks" options={frameworks.map((f) => ({ value: f.id, label: f.name }))} className="sm:w-60" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Indicator</th>
                <th className="th">Criterion</th>
                <th className="th">Framework</th>
                <th className="th">Requirements</th>
                <th className="th">Evidence</th>
                <th className="th">Coverage</th>
                <th className="th text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((i) => {
                const c = lookup.criterion(i.criterionId);
                const count = countForIndicator(documents, i.id);
                return (
                  <tr key={i.id}>
                    <td className="td">
                      <Link to={`/criteria/criteria?framework=${c?.frameworkId}&criterion=${i.criterionId}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
                        {i.code} – {i.name}
                      </Link>
                    </td>
                    <td className="td whitespace-nowrap text-ink-muted">{c?.code} – {c?.name}</td>
                    <td className="td">{c && <FrameworkTag frameworkId={c.frameworkId} />}</td>
                    <td className="td tabular-nums text-ink-muted">{i.requirements.length}</td>
                    <td className="td tabular-nums text-ink-muted">{count}</td>
                    <td className="td"><CoverageBadge level={coverageLevel(count)} /></td>
                    <td className="td text-right">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal({ open: true, indicator: i })}>
                        <PencilIcon className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-ink-muted">No indicators match these filters.</p>}
        </div>
      </section>
      <IndicatorFormModal open={modal.open} indicator={modal.indicator} onClose={() => setModal({ open: false, indicator: null })} />
    </>);

}