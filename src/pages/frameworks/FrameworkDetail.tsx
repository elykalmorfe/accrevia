import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LandmarkIcon, PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { coverageLevel, countForCriterion, countForIndicator } from '../../utils/coverage';
import { formatDate, formatNumber } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Switch } from '../../components/ui/Switch';
import { CoverageBadge } from '../../components/ui/CoverageBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { FrameworkFormModal } from '../../components/frameworks/FrameworkFormModal';

type Tab = 'criteria' | 'indicators' | 'evidence';

export function FrameworkDetail() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') as Tab || 'criteria';
  const { frameworks, areas, criteria, indicators, documents, setFrameworkActive } = usePortal();
  const lookup = useLookup();
  const [editing, setEditing] = useState(false);

  const framework = frameworks.find((f) => f.id === id);
  if (!framework) {
    return (
      <div className="panel">
        <EmptyState icon={LandmarkIcon} title="Framework not found" action={<Link to="/frameworks" className="btn btn-primary">All frameworks</Link>} />
      </div>);

  }

  const fwCriteria = criteria.filter((c) => c.frameworkId === id);
  const fwIndicators = indicators.filter((i) => fwCriteria.some((c) => c.id === i.criterionId));
  const fwDocs = documents.filter((d) => d.frameworkId === id && d.status !== 'Archived').sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  const fwAreas = areas.filter((a) => fwCriteria.some((c) => c.areaId === a.id));

  return (
    <>
      <PageHeader
        eyebrow={
        <span>
            <Link to="/frameworks" className="hover:text-ink hover:underline">Accreditation & Frameworks</Link> / {framework.category}
          </span>
        }
        title={framework.name}
        description={framework.description}
        actions={
        <>
            <span className="flex items-center gap-2 text-[13px] text-ink-muted">
              <Switch
              checked={framework.active}
              onChange={(v) => {
                setFrameworkActive(framework.id, v);
                toast(`${framework.shortName} ${v ? 'activated' : 'deactivated'}`);
              }}
              label="Framework active" />
            
              {framework.active ? 'Active' : 'Inactive'}
            </span>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              <PencilIcon className="h-4 w-4" /> Edit framework
            </button>
          </>
        } />
      

      {!framework.active &&
      <div className="mb-5 rounded-md border border-warning-100 bg-warning-50 px-4 py-3 text-[13px] text-warning-700">
          This framework is inactive. Its evidence stays searchable, but it is hidden from classification options.
        </div>
      }

      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
        <div><dt className="text-ink-muted">Standard</dt><dd className="font-medium text-ink">{framework.body}</dd></div>
        <div><dt className="text-ink-muted">Evidence documents</dt><dd className="font-medium tabular-nums text-ink">{formatNumber(framework.documentCount)}</dd></div>
        <div><dt className="text-ink-muted">Areas used</dt><dd className="font-medium tabular-nums text-ink">{fwAreas.length}</dd></div>
        <div><dt className="text-ink-muted">Last updated</dt><dd className="font-medium text-ink">{formatDate(framework.lastUpdated)}</dd></div>
      </dl>

      <Tabs<Tab>
        label="Framework sections"
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        tabs={[
        { id: 'criteria', label: `Criteria (${fwCriteria.length})` },
        { id: 'indicators', label: `Indicators (${fwIndicators.length})` },
        { id: 'evidence', label: `Evidence (${fwDocs.length})` }]
        }
        className="mb-5" />
      

      {tab === 'criteria' &&
      <div className="space-y-5">
          {fwAreas.length === 0 && <div className="panel"><EmptyState icon={LandmarkIcon} title="No criteria yet" description="Add criteria for this framework in Criteria & Indicators." action={<Link to={`/criteria/criteria?framework=${id}`} className="btn btn-primary">Add criteria</Link>} /></div>}
          {fwAreas.map((area) =>
        <section key={area.id}>
              <h2 className="mb-2 text-[13px] font-semibold text-ink-muted">{area.name}</h2>
              <ul className="panel divide-y divide-line">
                {fwCriteria.filter((c) => c.areaId === area.id).map((c) => {
              const count = countForCriterion(documents, c.id);
              return (
                <li key={c.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link to={`/criteria/criteria?framework=${id}&criterion=${c.id}`} className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline">
                          {c.code} – {c.name}
                        </Link>
                        <p className="mt-0.5 text-[13px] text-ink-muted">{c.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-[13px] text-ink-muted">
                        <span>{indicators.filter((i) => i.criterionId === c.id).length} indicators</span>
                        <CoverageBadge level={coverageLevel(count)} />
                      </div>
                    </li>);

            })}
              </ul>
            </section>
        )}
        </div>
      }

      {tab === 'indicators' &&
      <section className="panel overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Indicator</th>
                <th className="th">Criterion</th>
                <th className="th">Requirements</th>
                <th className="th">Evidence</th>
                <th className="th">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {fwIndicators.map((i) => {
              const count = countForIndicator(documents, i.id);
              const c = lookup.criterion(i.criterionId);
              return (
                <tr key={i.id}>
                    <td className="td">
                      <Link to={`/criteria/criteria?framework=${id}&criterion=${i.criterionId}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
                        {i.code} – {i.name}
                      </Link>
                    </td>
                    <td className="td whitespace-nowrap text-ink-muted">{c?.code} – {c?.name}</td>
                    <td className="td tabular-nums text-ink-muted">{i.requirements.length}</td>
                    <td className="td tabular-nums text-ink-muted">{count}</td>
                    <td className="td"><CoverageBadge level={coverageLevel(count)} /></td>
                  </tr>);

            })}
            </tbody>
          </table>
        </section>
      }

      {tab === 'evidence' &&
      <section className="panel">
          <ul className="divide-y divide-line">
            {fwDocs.map((d) =>
          <li key={d.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link to={`/documents/${d.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">{d.title}</Link>
                  <p className="text-xs text-ink-muted">
                    {lookup.criterion(d.criterionId)?.code} · Indicator {lookup.indicator(d.indicatorId)?.code} · {d.docType} · AY {d.academicYear}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-muted">{formatDate(d.dateAdded)}</span>
                  <StatusBadge status={d.status} />
                </div>
              </li>
          )}
          </ul>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">
            Showing the {fwDocs.length} most recently added documents. Use the search bar to find specific evidence across all {formatNumber(framework.documentCount)}.
          </p>
        </section>
      }

      <FrameworkFormModal open={editing} framework={framework} onClose={() => setEditing(false)} />
    </>);

}