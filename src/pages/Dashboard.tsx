import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, UploadIcon } from 'lucide-react';
import { usePortal } from '../contexts/PortalContext';
import { useLookup } from '../hooks/useLookup';
import { PageHeader } from '../components/ui/PageHeader';
import { BarList } from '../components/ui/BarList';
import { StatusBadge } from '../components/ui/StatusBadge';
import { FrameworkTag } from '../components/ui/FrameworkTag';
import { PermissionIndicator } from '../components/sharing/PermissionIndicator';
import { evidenceByArea, evidenceByFramework, repositoryStats } from '../data/analytics';
import { formatDate, formatNumber } from '../utils/format';
import { shareStatus } from '../utils/sharing';

export function Dashboard() {
  const { documents, criteria, indicators, areas, pending, users, shares } = usePortal();
  const lookup = useLookup();
  const s = {
    total: repositoryStats.total,
    processing: repositoryStats.processing,
    pending: pending.length,
    indexed: repositoryStats.total - repositoryStats.processing - pending.length
  };
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const activeShares = shares.filter((x) => shareStatus(x) === 'Active');
  const sharedDocs = new Set(activeShares.map((x) => x.documentId)).size;

  const recent = useMemo(
    () => [...documents].filter((d) => d.status !== 'Archived').sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 6),
    [documents]
  );
  const recentShares = useMemo(() => [...shares].sort((a, b) => b.sharedAt.localeCompare(a.sharedAt)).slice(0, 5), [shares]);

  const share = (n: number) => `${n / s.total * 100}%`;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of the NEMSU–Main Campus accreditation evidence repository."
        actions={
        <>
            <Link to="/evidence/pending" className="btn btn-secondary">Review pending</Link>
            <Link to="/evidence/upload" className="btn btn-primary">
              <UploadIcon className="h-4 w-4" /> Upload Evidence
            </Link>
          </>
        } />
      

      <section aria-labelledby="repo-heading" className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="panel flex flex-col p-6">
          <h2 id="repo-heading" className="text-sm font-medium text-ink-muted">Total Evidence Documents</h2>
          <p className="mt-2 font-serif text-5xl font-semibold tracking-tight text-ink">{formatNumber(s.total)}</p>
          <div className="mt-auto pt-6">
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-ink-muted">Indexed and ready for retrieval</span>
              <span className="font-semibold tabular-nums text-ink">
                {formatNumber(s.indexed)} · {Math.round(s.indexed / s.total * 100)}%
              </span>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
              <div className="bg-brand-600" style={{ width: share(s.indexed) }} />
              <div className="bg-brand-200" style={{ width: share(s.processing) }} />
              <div className="bg-gold-500" style={{ width: share(s.pending) }} />
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-600" aria-hidden="true" /><dt>Indexed</dt><dd className="font-medium tabular-nums text-ink">{formatNumber(s.indexed)}</dd></div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-200" aria-hidden="true" /><dt>Processing</dt><dd className="font-medium tabular-nums text-ink">{s.processing}</dd></div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold-500" aria-hidden="true" /><dt>Pending classification</dt><dd className="font-medium tabular-nums text-ink">{s.pending}</dd></div>
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          <StatCell label="Pending Classification" value={String(s.pending)} valueClass="text-warning-700" detail="Need metadata before they can be retrieved" linkLabel="Classify now" to="/evidence/pending" />
          <StatCell label="Shared Evidence" value={String(sharedDocs)} detail={`${activeShares.length} active shares · ${activeShares.filter((x) => x.canDownload).length} allow download`} linkLabel="Manage sharing" to="/evidence/shared" />
          <StatCell label="Accreditation Criteria" value={String(criteria.length)} detail={`${indicators.length} indicators across ${areas.length} areas`} linkLabel="Manage criteria" to="/criteria/criteria" />
          <StatCell label="Active Users" value={String(activeUsers)} detail="Administrators, QA, faculty, staff, and accreditors" linkLabel="Manage users" to="/users" />
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="panel-title">Evidence by Framework</h2>
            <Link to="/frameworks" className="link text-xs">Frameworks</Link>
          </div>
          <BarList items={evidenceByFramework.map((f) => ({ label: f.label, value: f.value, to: `/frameworks/${f.id}` }))} />
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="panel-title">Evidence by Accreditation Area</h2>
            <Link to="/reports" className="link text-xs">Full report</Link>
          </div>
          <BarList items={evidenceByArea} />
        </div>

        <div className="panel flex flex-col p-5 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="panel-title">Recent Sharing Activity</h2>
            <Link to="/evidence/shared" className="link text-xs">All shares</Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {recentShares.map((x) => {
              const doc = documents.find((d) => d.id === x.documentId);
              const status = shareStatus(x);
              return (
                <li key={x.id} className="py-3">
                  <Link to={`/documents/${x.documentId}`} className="block truncate text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">
                    {doc?.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    Shared with <span className="text-ink">{x.recipientName}</span> · {x.recipientRole}
                    {status !== 'Active' && <span className="text-warning-700"> · {status}</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <PermissionIndicator canDownload={x.canDownload} />
                    <span className="text-[11px] text-ink-subtle">{formatDate(x.sharedAt)} · by {x.sharedBy.replace(/^(Dr\.|Prof\.)\s/, '')}</span>
                  </div>
                </li>);

            })}
          </ul>
        </div>
      </section>

      <section className="panel mt-4" aria-labelledby="recent-heading">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 id="recent-heading" className="panel-title">Recent Evidence</h2>
          <Link to="/evidence" className="link text-xs">View all evidence</Link>
        </div>
        <div className="hidden overflow-x-auto border-t border-line md:block">
          <table className="w-full min-w-[960px]">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Document title</th>
                <th className="th">Framework</th>
                <th className="th">Area</th>
                <th className="th">Criterion</th>
                <th className="th">Document type</th>
                <th className="th">Date uploaded</th>
                <th className="th">Processing status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((d) =>
              <tr key={d.id} className="hover:bg-canvas/60">
                  <td className="td max-w-[340px]">
                    <Link to={`/documents/${d.id}`} className="font-medium text-ink hover:text-brand-700 hover:underline">{d.title}</Link>
                  </td>
                  <td className="td"><FrameworkTag frameworkId={d.frameworkId} /></td>
                  <td className="td whitespace-nowrap text-ink-muted">{lookup.area(d.areaId)?.shortName}</td>
                  <td className="td whitespace-nowrap text-ink-muted">{lookup.criterion(d.criterionId)?.code}</td>
                  <td className="td whitespace-nowrap text-ink-muted">{d.docType}</td>
                  <td className="td whitespace-nowrap text-ink-muted">{formatDate(d.dateAdded)}</td>
                  <td className="td"><StatusBadge status={d.status} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line border-t border-line md:hidden">
          {recent.map((d) =>
          <li key={d.id} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/documents/${d.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700">{d.title}</Link>
                <StatusBadge status={d.status} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {lookup.framework(d.frameworkId)?.shortName} · {lookup.criterion(d.criterionId)?.code} · {d.docType} · {formatDate(d.dateAdded)}
              </p>
            </li>
          )}
        </ul>
      </section>
    </>);

}

interface StatCellProps {
  label: string;
  value: string;
  detail: string;
  linkLabel: string;
  to: string;
  valueClass?: string;
}

function StatCell({ label, value, detail, linkLabel, to, valueClass = 'text-ink' }: StatCellProps) {
  return (
    <div className="flex flex-col bg-white p-5">
      <h3 className="text-[13px] font-medium text-ink-muted">{label}</h3>
      <p className={`mt-1.5 text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
      <Link to={to} className="link mt-auto inline-flex items-center gap-1 pt-3 text-xs">
        {linkLabel} <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>);

}