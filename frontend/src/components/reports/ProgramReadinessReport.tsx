import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { expiringWindowMonths, formatLevel } from '../../utils/programAccreditation';
import {
  ProgramReadiness,
  ReadinessLevel,
  deadlineHealth,
  describeDays,
  describeDeadline,
  getProgramReadiness,
  readinessHealth,
  readinessHints
} from '../../utils/reportMetrics';
import { Badge } from '../ui/Badge';
import { CampusScopeNote, PanelHeader, ProgressBar } from './ReportParts';
import { healthDot, healthText, healthTone } from './healthStyles';

const LEVELS: ReadinessLevel[] = ['Ready', 'In progress', 'Needs work'];

function byUrgency(a: ProgramReadiness, b: ProgramReadiness): number {
  if (a.dueSoon !== b.dueSoon) return a.dueSoon ? -1 : 1;
  const da = a.deadline?.daysRemaining ?? Infinity;
  const db = b.deadline?.daysRemaining ?? Infinity;
  if (da !== db) return da - db;
  return a.percent - b.percent;
}

export function ProgramReadinessReport() {
  const { filteredPrograms, campuses, selectedCampusObj } = usePortal();
  const [params] = useSearchParams();
  const [onlyDueSoon, setOnlyDueSoon] = useState(params.get('due') === 'soon');
  const [level, setLevel] = useState<ReadinessLevel | ''>('');
  const [query, setQuery] = useState('');

  const all = useMemo(() => filteredPrograms.map((p) => getProgramReadiness(p)).sort(byUrgency), [filteredPrograms]);
  const scoped = onlyDueSoon ? all.filter((r) => r.dueSoon) : all;
  const tally = LEVELS.map((l) => ({ level: l, count: scoped.filter((r) => r.level === l).length }));

  const q = query.trim().toLowerCase();
  const rows = scoped.filter((r) => (!level || r.level === level) && (!q || r.program.programName.toLowerCase().includes(q)));
  const dueSoonCount = all.filter((r) => r.dueSoon).length;
  const campusName = (id: string) => campuses.find((c) => c.id === id)?.shortName ?? id;

  return (
    <div className="space-y-4">
      <CampusScopeNote campusName={selectedCampusObj?.name} />

      <section className="panel p-5">
        <PanelHeader
          title="Is each program ready for its next survey?"
          help="Readiness is the share of the program's survey requirements (one per area) that have been submitted. Programs with the closest deadline are listed first."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {tally.map((t) => {
            const active = level === t.level;
            return (
              <button
                key={t.level}
                type="button"
                onClick={() => setLevel(active ? '' : t.level)}
                aria-pressed={active}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  active ? 'border-brand-500 bg-brand-50/60' : 'border-line hover:bg-canvas'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <span className={`h-2 w-2 rounded-full ${healthDot[readinessHealth[t.level]]}`} aria-hidden="true" />
                  {t.level}
                </span>
                <span className="mt-1 block text-2xl font-bold tabular-nums text-ink">{t.count}</span>
                <span className="block text-[11px] text-ink-muted">{readinessHints[t.level]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line bg-canvas/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center rounded-lg border border-line bg-canvas p-0.5 text-xs font-medium" role="group" aria-label="Which programs to show">
            {[
              { value: false, label: `All programs (${all.length})` },
              { value: true, label: `Due in the next ${expiringWindowMonths()} months (${dueSoonCount})` }
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setOnlyDueSoon(opt.value)}
                aria-pressed={onlyDueSoon === opt.value}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  onlyDueSoon === opt.value ? 'bg-surface font-semibold text-ink shadow-2xs' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a program..."
              aria-label="Find a program"
              className="input h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-canvas">
              <tr>
                <th className="th">Program</th>
                <th className="th w-56">Requirements submitted</th>
                <th className="th">Next deadline</th>
                <th className="th">Status</th>
                <th className="th text-right">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="td py-10 text-center text-ink-muted">
                    {all.length === 0 ? 'No programs are registered yet.' : 'No programs match these filters.'}
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const health = readinessHealth[r.level];
                return (
                  <tr key={r.program.id} className="hover:bg-canvas/40">
                    <td className="td">
                      <p className="font-semibold text-ink">{r.program.programName}</p>
                      <p className="text-[11px] text-ink-muted">
                        {campusName(r.program.campusId)} · {formatLevel(r.program.status)}
                      </p>
                    </td>
                    <td className="td">
                      <ProgressBar percent={r.percent} health={health} label={`${r.program.programName} requirements submitted`} />
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {r.total ? (
                          <>
                            <span className="font-semibold text-ink">{r.submitted} of {r.total}</span> submitted · {r.verified} verified
                          </>
                        ) : (
                          'No requirements listed'
                        )}
                      </p>
                    </td>
                    <td className="td">
                      {r.deadline ? (
                        <>
                          <p className="text-ink">{describeDeadline(r.deadline)}</p>
                          <p className={`text-[11px] font-semibold ${healthText[deadlineHealth(r.deadline.daysRemaining)]}`}>
                            {describeDays(r.deadline.daysRemaining)}
                          </p>
                        </>
                      ) : (
                        <span className="text-ink-subtle">No date set</span>
                      )}
                    </td>
                    <td className="td">
                      <Badge tone={healthTone[health]} dot title={readinessHints[r.level]}>
                        {r.level}
                      </Badge>
                    </td>
                    <td className="td text-right">
                      <Link to="/frameworks/pa" className="btn btn-ghost btn-sm text-[11px] font-semibold text-brand-700">
                        Open program
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
