import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLookup } from '../../hooks/useLookup';
import { usePortal } from '../../contexts/PortalContext';
import { BarList, BarItem } from '../ui/BarList';
import { formatNumber } from '../../utils/format';
import { REVIEW_OVERDUE_DAYS, activeDocuments, expiredDocuments, percentOf, summarizeReview } from '../../utils/reportMetrics';
import { CampusScopeNote, PanelHeader } from './ReportParts';
import { healthDot } from './healthStyles';

const UPLOAD_TREND_MONTHS = 6;

function countBy<T>(items: T[], key: (item: T) => string | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const k = key(item);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  });
  return counts;
}

export function EvidenceStatistics() {
  const lookup = useLookup();
  const { filteredDocuments, pending, selectedCampus, selectedCampusObj, frameworks, areas } = usePortal();
  const docs = useMemo(() => activeDocuments(filteredDocuments), [filteredDocuments]);
  const review = useMemo(() => summarizeReview(docs), [docs]);
  const expired = useMemo(() => expiredDocuments(docs).length, [docs]);
  const processing = docs.filter((d) => d.status === 'Processing').length;
  const failed = docs.filter((d) => d.status === 'Failed').length;
  const unclassified = selectedCampus === 'all' ? pending.length : 0;

  const byFramework = useMemo<BarItem[]>(() => {
    const counts = countBy(docs, (d) => d.frameworkId);
    return frameworks
      .map((f) => ({ label: f.name, value: counts.get(f.id) || 0 }))
      .filter((i) => i.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [docs, frameworks]);

  const byYear = useMemo<BarItem[]>(() => {
    const counts = countBy(docs, (d) => d.academicYear);
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.label.localeCompare(a.label));
  }, [docs]);

  const byArea = useMemo<BarItem[]>(() => {
    const counts = countBy(docs, (d) => d.areaId);
    return areas
      .map((a) => ({ label: a.name, value: counts.get(a.id) || 0 }))
      .filter((a) => a.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [docs, areas]);

  const topCriteria = useMemo<BarItem[]>(() => {
    const counts = countBy(docs, (d) => d.criterionId);
    return [...counts.entries()]
      .map(([critId, value]) => {
        const criterion = lookup.criterion(critId);
        const fw = criterion ? lookup.framework(criterion.frameworkId)?.shortName : '';
        return { label: `${fw} · ${criterion?.code || critId} – ${criterion?.name || ''}`, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [docs, lookup]);

  const uploadTrend = useMemo<BarItem[]>(() => {
    const counts = countBy(docs, (d) => d.dateAdded.slice(0, 7));
    const now = new Date();
    return Array.from({ length: UPLOAD_TREND_MONTHS }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      return { label: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), value: counts.get(key) || 0 };
    });
  }, [docs]);

  const reviewRows = [
    { label: 'Approved', value: review.approved, dot: healthDot.good, to: 'Approved' },
    { label: 'Waiting for review', value: review.pending, dot: healthDot.warning, to: 'Pending Review' },
    { label: 'Returned for revision', value: review.revision, dot: healthDot.danger, to: 'Needs Revision' }
  ];
  const problemRows = [
    { label: 'Expired ("valid until" date has passed)', value: expired },
    { label: 'Failed to process', value: failed },
    { label: 'Still being processed', value: processing },
    { label: 'Uploaded but not yet classified', value: unclassified }
  ];
  const problems = problemRows.reduce((sum, r) => sum + r.value, 0);

  const emptyText = 'No documents uploaded yet.';

  return (
    <div className="space-y-4">
      <CampusScopeNote campusName={selectedCampusObj?.name} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-5">
          <p className="text-[13px] font-semibold text-ink">
            {selectedCampus === 'all' ? 'Documents in the repository' : `Documents for ${selectedCampusObj?.shortName || 'this campus'}`}
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-ink">{formatNumber(docs.length)}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {docs.length === 0 ? (
              <>
                Nothing uploaded yet.{' '}
                <Link to="/evidence/upload" className="font-semibold text-brand-700 hover:underline">Upload the first document</Link>
              </>
            ) : (
              `${percentOf(review.approved, docs.length)}% are approved and count as evidence. Archived documents are not included.`
            )}
          </p>
        </section>

        <section className="panel p-5">
          <PanelHeader
            title="Review status"
            help={
              review.oldestWaitingDays
                ? `The oldest document has waited ${review.oldestWaitingDays} day${review.oldestWaitingDays === 1 ? '' : 's'}. Try to review within ${REVIEW_OVERDUE_DAYS} days.`
                : 'Only approved documents count as evidence.'
            }
          />
          <ul className="space-y-2">
            {reviewRows.map((r) => (
              <li key={r.label}>
                <Link to={`/evidence?review=${encodeURIComponent(r.to)}`} className="flex items-center justify-between gap-3 rounded-md px-1 py-0.5 text-[13px] hover:bg-canvas">
                  <span className="flex items-center gap-2 text-ink">
                    <span className={`h-2 w-2 rounded-full ${r.dot}`} aria-hidden="true" />
                    {r.label}
                  </span>
                  <span className="font-semibold tabular-nums text-ink">{formatNumber(r.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <PanelHeader
            title="Documents that need fixing"
            help={problems ? 'These documents cannot be used as evidence until they are fixed.' : 'No problems found.'}
          />
          <ul className="space-y-2">
            {problemRows.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex items-center gap-2 text-ink">
                  <span className={`h-2 w-2 rounded-full ${r.value ? healthDot.danger : healthDot.good}`} aria-hidden="true" />
                  {r.label}
                </span>
                <span className="font-semibold tabular-nums text-ink">{formatNumber(r.value)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <PanelHeader title="Uploads per month" help={`Documents added in the last ${UPLOAD_TREND_MONTHS} months, newest first.`} />
          <BarList items={uploadTrend} tone="gold" emptyText={emptyText} />
        </section>
        <section className="panel p-5">
          <PanelHeader title="Documents by framework" help="Which accreditation or compliance body the documents are for." />
          <BarList items={byFramework} emptyText={emptyText} />
        </section>
        <section className="panel p-5">
          <PanelHeader title="Documents by area" help="Areas with few documents may need more evidence." />
          <BarList items={byArea} emptyText={emptyText} />
        </section>
        <section className="panel p-5">
          <PanelHeader title="Documents by academic year" />
          <BarList items={byYear} tone="gold" emptyText={emptyText} />
        </section>
        <section className="panel p-5 lg:col-span-2">
          <PanelHeader title="Criteria with the most documents" help="The 8 criteria that are best supported by evidence." />
          <BarList items={topCriteria} emptyText={emptyText} />
        </section>
      </div>
    </div>
  );
}
