import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangleIcon, CalendarClockIcon, CheckCircle2Icon, ClipboardCheckIcon, FileSearchIcon, FolderXIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { countForIndicator } from '../../utils/coverage';
import { formatNumber } from '../../utils/format';
import {
  AttentionItem,
  Health,
  READY_PERCENT,
  buildAttentionItems,
  campusScorecard,
  getProgramReadiness,
  percentOf,
  summarizeReview
} from '../../utils/reportMetrics';
import { expiringWindowMonths } from '../../utils/programAccreditation';
import { CampusScopeNote, HealthLegend, PanelHeader, SummaryCard } from './ReportParts';
import { healthDot, healthText } from './healthStyles';

const MAX_ATTENTION_ITEMS = 8;

function ratioHealth(good: number, total: number): Health {
  if (total === 0) return 'good';
  const pct = percentOf(good, total);
  return pct >= 75 ? 'good' : pct >= 40 ? 'warning' : 'danger';
}

function countHealth(problems: number, dangerAt: number): Health {
  if (problems === 0) return 'good';
  return problems >= dangerAt ? 'danger' : 'warning';
}

export function ReportsSummary() {
  const {
    campuses,
    filteredPrograms,
    filteredDocuments,
    filteredIsoRecords,
    programAccreditations,
    documents,
    iaRecords,
    indicators,
    selectedCampus,
    selectedCampusObj,
    isCampusMatch
  } = usePortal();

  const readiness = useMemo(() => filteredPrograms.map((p) => getProgramReadiness(p)), [filteredPrograms]);
  const readyCount = readiness.filter((r) => r.level === 'Ready').length;
  const endingCount = readiness.filter((r) => r.expiry.state === 'expired' || r.expiry.state === 'expiring').length;
  const review = useMemo(() => summarizeReview(filteredDocuments), [filteredDocuments]);
  const waiting = review.pending + review.revision;
  const missingEvidence = useMemo(
    () => indicators.filter((i) => countForIndicator(filteredDocuments, i.id) === 0).length,
    [indicators, filteredDocuments]
  );

  const attention = useMemo(
    () =>
      buildAttentionItems({
        programs: filteredPrograms,
        iaRecords: selectedCampus === 'all' ? iaRecords : iaRecords.filter((r) => r.campusId === selectedCampus),
        campuses,
        documents: filteredDocuments,
        isoRecords: filteredIsoRecords
      }),
    [filteredPrograms, iaRecords, selectedCampus, campuses, filteredDocuments, filteredIsoRecords]
  );

  const scorecard = useMemo(
    () => campusScorecard(campuses, programAccreditations, documents, isCampusMatch),
    [campuses, programAccreditations, documents, isCampusMatch]
  );

  const windowMonths = expiringWindowMonths();

  return (
    <div className="space-y-5">
      <CampusScopeNote campusName={selectedCampusObj?.name} />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-ink-muted">
          The most important numbers at a glance. Click a card to see the details behind it.
        </p>
        <HealthLegend />
      </div>

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Programs ready for survey"
          value={
            <>
              {readyCount}
              <span className="ml-1 text-base font-medium text-ink-subtle">of {filteredPrograms.length}</span>
            </>
          }
          hint={`Programs that have submitted at least ${READY_PERCENT}% of their survey requirements.`}
          health={ratioHealth(readyCount, filteredPrograms.length)}
          icon={ClipboardCheckIcon}
          to="/reports?tab=readiness"
          linkLabel="See each program"
        />
        <SummaryCard
          label="Accreditations ending soon"
          value={endingCount}
          hint={`Programs whose accreditation has ended or ends within the next ${windowMonths} months.`}
          health={countHealth(endingCount, 5)}
          icon={CalendarClockIcon}
          to="/reports?tab=readiness&due=soon"
          linkLabel="See which programs"
        />
        <SummaryCard
          label="Documents waiting for review"
          value={formatNumber(waiting)}
          hint={
            review.revision
              ? `${review.pending} waiting for approval and ${review.revision} returned for revision.`
              : 'Uploaded documents count as evidence only after they are approved.'
          }
          health={review.overdue || review.revision ? 'danger' : countHealth(waiting, 20)}
          icon={FileSearchIcon}
          to={`/evidence?review=${encodeURIComponent('Pending Review')}`}
          linkLabel="Review documents"
        />
        <SummaryCard
          label="Requirements with no documents"
          value={
            <>
              {missingEvidence}
              <span className="ml-1 text-base font-medium text-ink-subtle">of {indicators.length}</span>
            </>
          }
          hint="Accreditation requirements that do not have a single uploaded document yet."
          health={countHealth(missingEvidence, Math.max(Math.ceil(indicators.length / 4), 1))}
          icon={FolderXIcon}
          to="/reports?tab=coverage"
          linkLabel="See what is missing"
        />
      </section>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="panel p-5">
          <PanelHeader
            title="What needs attention"
            help="The most urgent items first. Each one tells you what to do next."
          />
          {attention.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2Icon className="h-8 w-8 text-success-600" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-ink">Everything is on track</p>
              <p className="mt-0.5 text-xs text-ink-muted">No expiring accreditations, overdue reviews, or expired documents.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {attention.slice(0, MAX_ATTENTION_ITEMS).map((item) => (
                  <AttentionRow key={item.id} item={item} />
                ))}
              </ul>
              {attention.length > MAX_ATTENTION_ITEMS && (
                <p className="mt-3 text-xs text-ink-muted">
                  And {attention.length - MAX_ATTENTION_ITEMS} more.{' '}
                  <Link to="/reports?tab=readiness&due=soon" className="font-semibold text-brand-700 hover:underline">
                    See all programs that are due
                  </Link>
                </p>
              )}
            </>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="p-5 pb-0">
            <PanelHeader
              title="Campus comparison"
              help="How each campus is doing. Percentages are out of the programs offered on that campus."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-canvas">
                <tr>
                  <th className="th">Campus</th>
                  <th className="th text-right">Programs</th>
                  <th className="th text-right">Accredited</th>
                  <th className="th text-right">With COPC</th>
                  <th className="th text-right">Ending soon</th>
                  <th className="th text-right">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {scorecard.map((row) => {
                  const accreditedPct = percentOf(row.accredited, row.programs);
                  const copcPct = percentOf(row.copcCompliant, row.programs);
                  const selected = row.campus.id === selectedCampus;
                  return (
                    <tr key={row.campus.id} className={selected ? 'bg-brand-50/60' : undefined}>
                      <td className="td font-medium text-ink">
                        {row.campus.shortName}
                        {row.campus.isMain && <span className="ml-1.5 text-[10px] font-semibold uppercase text-ink-subtle">Main</span>}
                      </td>
                      <td className="td text-right tabular-nums text-ink-muted">{row.programs}</td>
                      <td className={`td text-right font-semibold tabular-nums ${healthText[ratioHealth(row.accredited, row.programs)]}`}>
                        {row.programs ? `${accreditedPct}%` : '—'}
                      </td>
                      <td className={`td text-right font-semibold tabular-nums ${healthText[ratioHealth(row.copcCompliant, row.programs)]}`}>
                        {row.programs ? `${copcPct}%` : '—'}
                      </td>
                      <td className={`td text-right font-semibold tabular-nums ${row.endingSoon ? healthText.danger : 'text-ink-muted'}`}>
                        {row.endingSoon}
                      </td>
                      <td className="td text-right tabular-nums text-ink-muted">{formatNumber(row.documents)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {item.health === 'danger' ? (
        <AlertTriangleIcon className={`mt-0.5 h-4 w-4 shrink-0 ${healthText.danger}`} aria-label="Action needed now" />
      ) : (
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${healthDot.warning}`} aria-label="Needs attention soon" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink">{item.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.detail}</p>
      </div>
      <Link to={item.to} className="btn btn-secondary btn-sm shrink-0 text-xs">
        {item.action}
      </Link>
    </li>
  );
}
