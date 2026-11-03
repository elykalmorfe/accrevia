import { ComponentType, ReactNode } from 'react';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  AwardIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  ExternalLinkIcon,
  FileCheckIcon,
  FileSearchIcon,
  LayersIcon,
  MapPinIcon,
  PencilIcon,
  PrinterIcon,
  SearchXIcon,
  Trash2Icon,
  XCircleIcon
} from 'lucide-react';
import { AccreditationLevel, ProgramAccreditation } from '../../types/accreditation';
import {
  ExpiryState,
  formatReportDate,
  getExpiryInfo,
  isUrl,
  levelRank,
  parseAccreditationDate
} from '../../utils/programAccreditation';

type IconType = ComponentType<{ className?: string }>;

interface LevelStyle {
  pill: string;
  accent: string;
  meter: string;
}

const LEVEL_STYLES: Record<string, LevelStyle> = {
  Candidate: { pill: 'bg-orange-50 text-orange-700 ring-orange-200', accent: 'bg-orange-400', meter: 'bg-orange-400' },
  'Level 1': { pill: 'bg-sky-50 text-sky-700 ring-sky-200', accent: 'bg-sky-500', meter: 'bg-sky-500' },
  'Level 2': { pill: 'bg-indigo-50 text-indigo-700 ring-indigo-200', accent: 'bg-indigo-500', meter: 'bg-indigo-500' },
  'Level 3': { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', accent: 'bg-emerald-500', meter: 'bg-emerald-500' },
  'Level 4': {
    pill: 'bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 ring-amber-300',
    accent: 'bg-amber-500',
    meter: 'bg-amber-500'
  },
  'Not Accreditable': { pill: 'bg-slate-100 text-slate-600 ring-slate-200', accent: 'bg-slate-300', meter: 'bg-slate-300' }
};

const FALLBACK_STYLE = LEVEL_STYLES['Not Accreditable'];

const LEGEND: AccreditationLevel[] = ['Candidate', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Not Accreditable'];

const levelStyle = (level: string) => LEVEL_STYLES[level] ?? FALLBACK_STYLE;

function humanizeSpan(days: number): string {
  const d = Math.abs(days);
  if (d < 45) return `${d} day${d === 1 ? '' : 's'}`;
  const months = Math.round(d / 30.44);
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.round((d / 365.25) * 10) / 10;
  return `${years} years`;
}

// ================= Filters =================

export function FilterSelect({
  label,
  icon: Icon,
  value,
  onChange,
  title,
  children
}: {
  label: string;
  icon: IconType;
  value: string;
  onChange: (value: string) => void;
  title?: string;
  children: ReactNode;
}) {
  const active = value !== 'all';
  return (
    <label className="block min-w-0" title={title}>
      <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-ink-subtle">{label}</span>
      <span className="relative block">
        <Icon
          className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
            active ? 'text-brand-600' : 'text-ink-subtle'
          }`}
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full appearance-none truncate rounded-xl border pl-9 pr-8 text-[13px] font-medium outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
            active ? 'border-brand-300 bg-brand-50/60 text-brand-800' : 'border-line bg-white text-ink hover:border-line-strong'
          }`}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      </span>
    </label>
  );
}

export type ValidityTab = 'all' | 'active' | 'expiring' | 'expired';

const VALIDITY_TABS: { id: ValidityTab; label: string; hint: string; dot: string }[] = [
  { id: 'all', label: 'All', hint: 'Every program', dot: 'bg-slate-400' },
  { id: 'active', label: 'Valid', hint: 'More than 1 year of validity left', dot: 'bg-emerald-500' },
  { id: 'expiring', label: 'Expiring Soon', hint: 'Validity ends within the next 12 months', dot: 'bg-amber-500' },
  { id: 'expired', label: 'Expired', hint: 'Validity period has already ended', dot: 'bg-rose-500' }
];

export function ValidityTabs({
  value,
  onChange,
  counts
}: {
  value: ValidityTab;
  onChange: (value: ValidityTab) => void;
  counts: Record<ValidityTab, number>;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1" role="tablist" aria-label="Validity">
      {VALIDITY_TABS.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            title={tab.hint}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selected ? 'bg-white text-ink shadow-sm ring-1 ring-line' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${tab.dot}`} />
            {tab.label}
            <span
              className={`rounded-md px-1.5 py-px text-[10.5px] font-bold tabular-nums ${
                selected ? 'bg-slate-100 text-ink' : 'bg-white/70 text-ink-muted'
              }`}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ================= Cells =================

function LevelCell({ status }: { status: AccreditationLevel }) {
  const style = levelStyle(status);
  const rank = levelRank(status);
  return (
    <div className="inline-flex flex-col gap-1.5">
      <span
        className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ring-1 ring-inset ${style.pill}`}
      >
        {status === 'Level 4' && <AwardIcon className="h-3.5 w-3.5" />}
        {status}
      </span>
      {rank !== null && (
        <div className="flex items-center gap-1.5" title={rank === 0 ? 'Candidate – not yet Level 1' : `${status} of 4`}>
          <div className="grid w-16 grid-cols-4 gap-0.5">
            {[1, 2, 3, 4].map((step) => (
              <span key={step} className={`h-1.5 rounded-full ${step <= rank ? style.meter : 'bg-slate-200'}`} />
            ))}
          </div>
          <span className="text-[10px] font-semibold text-ink-subtle">{rank}/4</span>
        </div>
      )}
    </div>
  );
}

const VALIDITY_TONE: Record<Exclude<ExpiryState, 'none'>, { bar: string; text: string; icon: IconType; label: string }> = {
  active: { bar: 'bg-emerald-500', text: 'text-emerald-700', icon: CheckCircle2Icon, label: 'Valid' },
  expiring: { bar: 'bg-amber-500', text: 'text-amber-700', icon: AlertTriangleIcon, label: 'Expiring soon' },
  expired: { bar: 'bg-rose-500', text: 'text-rose-700', icon: XCircleIcon, label: 'Expired' }
};

function ValidityCell({ program }: { program: ProgramAccreditation }) {
  const info = getExpiryInfo(program);
  const start = parseAccreditationDate(program.validityStart);
  if (info.state === 'none' || !info.endDate) {
    return <span className="text-xs text-ink-subtle">No validity period</span>;
  }

  const tone = VALIDITY_TONE[info.state];
  const Icon = tone.icon;
  const now = Date.now();
  const elapsed =
    start && info.endDate > start
      ? Math.min(100, Math.max(0, ((now - start.getTime()) / (info.endDate.getTime() - start.getTime())) * 100))
      : 100;
  const days = info.daysRemaining ?? 0;
  const detail = days < 0 ? `${humanizeSpan(days)} ago` : days === 0 ? 'ends today' : `${humanizeSpan(days)} left`;

  return (
    <div className="w-[190px]">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink whitespace-nowrap">
        <span>{formatReportDate(program.validityStart)}</span>
        <ArrowRightIcon className="h-3 w-3 text-ink-subtle" />
        <span>{formatReportDate(info.endDate)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${elapsed}%` }} />
      </div>
      <div className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${tone.text}`}>
        <Icon className="h-3.5 w-3.5" />
        {tone.label}
        <span className="font-medium text-ink-muted">· {detail}</span>
      </div>
    </div>
  );
}

const CHIP_TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200 hover:bg-brand-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200 hover:bg-violet-100'
};

function DocChip({
  href,
  onClick,
  icon: Icon,
  label,
  tone,
  title
}: {
  href?: string;
  onClick?: () => void;
  icon: IconType;
  label: string;
  tone: keyof typeof CHIP_TONES;
  title: string;
}) {
  const className = `group/chip inline-flex max-w-[170px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset transition hover:-translate-y-px hover:shadow-sm ${CHIP_TONES[tone]}`;
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      {(href || onClick) && <ExternalLinkIcon className="h-3 w-3 shrink-0 opacity-50 group-hover/chip:opacity-100" />}
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} title={title}>
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} title={title}>
        {content}
      </button>
    );
  }
  return (
    <span className={className} title={title}>
      {content}
    </span>
  );
}

const Empty = () => <span className="text-ink-subtle">—</span>;

function HeaderCell({ label, hint, className = '' }: { label: string; hint?: string; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left align-bottom ${className}`}>
      <div className="whitespace-nowrap text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      {hint && <div className="mt-0.5 whitespace-nowrap text-[10.5px] font-medium normal-case text-ink-subtle">{hint}</div>}
    </th>
  );
}

// ================= Table =================

export function ProgramAccreditationTable({
  programs,
  totalCount,
  isAdmin,
  onOpenAreas,
  onEdit,
  onDelete,
  onPrintFindings
}: {
  programs: ProgramAccreditation[];
  totalCount: number;
  isAdmin: boolean;
  onOpenAreas: (program: ProgramAccreditation) => void;
  onEdit: (program: ProgramAccreditation) => void;
  onDelete: (program: ProgramAccreditation) => void;
  onPrintFindings: (program: ProgramAccreditation) => void;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="panel-title">Program Accreditation Records</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Showing <strong className="text-ink">{programs.length}</strong> of{' '}
            <strong className="text-ink">{totalCount}</strong> programs
            <span className="hidden sm:inline"> · scroll sideways to see documents and actions</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label="Level legend">
          {LEGEND.map((level) => (
            <span key={level} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${levelStyle(level).accent}`} />
              {level}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead className="border-b border-line bg-slate-50/90">
            <tr>
              <HeaderCell
                label="Programs Offered"
                hint="Program name & degree"
                className="sticky left-0 z-20 min-w-[260px] bg-slate-50 shadow-[inset_-1px_0_0_#E2E8F0]"
              />
              <HeaderCell label="Campus" />
              <HeaderCell label="Initial OP." hint="Year first offered" />
              <HeaderCell label="Accreditation Status" hint="Current AACCUP level" />
              <HeaderCell label="Validity Period" hint="Start → End" />
              <HeaderCell label="AACCUP Certification" />
              <HeaderCell label="AACCUP Technical Review" />
              <HeaderCell label="Board Action" className="min-w-[180px]" />
              <HeaderCell label="Summary of Findings" hint="& Recommendation" />
              <HeaderCell
                label="Actions"
                className="sticky right-0 z-20 bg-slate-50 text-right shadow-[inset_1px_0_0_#E2E8F0]"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {programs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-subtle">
                      <SearchXIcon className="h-6 w-6" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-ink">No programs match your filters</p>
                    <p className="mt-1 text-xs text-ink-muted">Try a different keyword or set a filter back to “All”.</p>
                  </div>
                </td>
              </tr>
            ) : (
              programs.map((prog) => {
                const style = levelStyle(prog.status);
                const hasFindingsText = !!(prog.findingsSummary || prog.recommendations);
                return (
                  <tr key={prog.id} className="group transition-colors hover:bg-slate-50/80">
                    <td className="td sticky left-0 z-10 bg-white py-3.5 pl-5 shadow-[inset_-1px_0_0_#F1F5F9] group-hover:bg-slate-50">
                      <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${style.accent}`} aria-hidden />
                      <div className="font-semibold leading-snug text-ink">{prog.programName}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                        <span
                          className={`rounded-md px-1.5 py-0.5 font-semibold ring-1 ring-inset ${
                            prog.degreeLevel === 'Graduate'
                              ? 'bg-violet-50 text-violet-700 ring-violet-200'
                              : 'bg-slate-50 text-slate-600 ring-slate-200'
                          }`}
                        >
                          {prog.degreeLevel}
                        </span>
                        {prog.scheduleForAccreditation && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                            <CalendarClockIcon className="h-3 w-3" />
                            Survey {formatReportDate(prog.scheduleForAccreditation)}
                          </span>
                        )}
                        {prog.borRes && <span className="text-ink-muted">BOR: {prog.borRes}</span>}
                        {prog.cmoNo && <span className="text-ink-muted">CMO: {prog.cmoNo}</span>}
                      </div>
                    </td>

                    <td className="td whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                        <MapPinIcon className="h-3.5 w-3.5 text-ink-subtle" />
                        {prog.campusName.replace(' Campus', '')}
                      </span>
                    </td>

                    <td className="td whitespace-nowrap tabular-nums text-ink-muted">
                      {prog.yearOfInitialOperation || <Empty />}
                    </td>

                    <td className="td whitespace-nowrap">
                      <LevelCell status={prog.status} />
                    </td>

                    <td className="td">
                      <ValidityCell program={prog} />
                    </td>

                    <td className="td">
                      {prog.certificationFile ? (
                        <DocChip
                          href={isUrl(prog.certificationFile) ? prog.certificationFile : undefined}
                          icon={FileCheckIcon}
                          label={isUrl(prog.certificationFile) ? 'Certificate' : prog.certificationFile}
                          tone="emerald"
                          title={isUrl(prog.certificationFile) ? 'Open AACCUP certificate' : prog.certificationFile}
                        />
                      ) : (
                        <Empty />
                      )}
                    </td>

                    <td className="td">
                      {prog.technicalReviewLink ? (
                        <DocChip
                          href={prog.technicalReviewLink}
                          icon={ClipboardCheckIcon}
                          label="Tech Review"
                          tone="brand"
                          title="Open AACCUP Technical Review"
                        />
                      ) : (
                        <Empty />
                      )}
                    </td>

                    <td className="td max-w-[240px] text-xs">
                      {prog.boardAction ? (
                        <p className="line-clamp-2 text-ink" title={prog.boardAction}>
                          {prog.boardAction}
                        </p>
                      ) : (
                        <Empty />
                      )}
                    </td>

                    <td className="td">
                      {prog.findingsLink ? (
                        <DocChip
                          href={prog.findingsLink}
                          icon={FileSearchIcon}
                          label="Findings"
                          tone="violet"
                          title="Open Summary of Findings & Recommendation"
                        />
                      ) : hasFindingsText ? (
                        <DocChip
                          onClick={() => onPrintFindings(prog)}
                          icon={FileSearchIcon}
                          label="Findings"
                          tone="violet"
                          title="View recorded Summary of Findings & Recommendation"
                        />
                      ) : null}
                    </td>

                    <td className="td sticky right-0 z-10 bg-white text-right shadow-[inset_1px_0_0_#F1F5F9] group-hover:bg-slate-50">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenAreas(prog)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-100"
                          title="View AACCUP survey areas and evidence portfolio"
                        >
                          <LayersIcon className="h-3.5 w-3.5" />
                          Areas
                          <span className="rounded bg-white px-1 text-[10px] font-bold tabular-nums">
                            {prog.requirements?.length || 10}
                          </span>
                        </button>
                        <div className="flex items-center divide-x divide-line overflow-hidden rounded-lg bg-white ring-1 ring-inset ring-line">
                          <button
                            type="button"
                            onClick={() => onPrintFindings(prog)}
                            className="flex h-7 w-7 items-center justify-center text-ink-muted transition hover:bg-slate-50 hover:text-brand-600"
                            title="Print Summary of Findings & Recommendation"
                          >
                            <PrinterIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(prog)}
                            className="flex h-7 w-7 items-center justify-center text-ink-muted transition hover:bg-slate-50 hover:text-brand-600"
                            title="Edit program details"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => onDelete(prog)}
                              className="flex h-7 w-7 items-center justify-center text-danger-600 transition hover:bg-danger-50"
                              title="Delete program"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
