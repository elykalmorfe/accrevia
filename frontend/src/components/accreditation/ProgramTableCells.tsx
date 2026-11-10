import { ReactNode } from 'react';
import { ArrowUpRightIcon, ChevronDownIcon } from 'lucide-react';
import { AccreditationLevel, ProgramAccreditation } from '../../types/accreditation';
import { formatReportDate, getExpiryInfo, levelRank, parseAccreditationDate, statusLabel } from '../../utils/programAccreditation';

const LEVEL_STYLES: Record<string, { pill: string; bar: string }> = {
  Candidate: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', bar: 'bg-amber-400' },
  'Level 1': { pill: 'bg-sky-50 text-sky-800 ring-sky-200', bar: 'bg-sky-500' },
  'Level 2': { pill: 'bg-blue-50 text-blue-800 ring-blue-200', bar: 'bg-blue-500' },
  'Level 3': { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', bar: 'bg-emerald-500' },
  'Level 4': { pill: 'bg-violet-50 text-violet-800 ring-violet-200', bar: 'bg-violet-500' }
};
const NEUTRAL_STYLE = { pill: 'bg-slate-50 text-slate-600 ring-slate-200', bar: 'bg-slate-300' };

/** Status pill with a 4-step meter so the level reads at a glance. */
export function LevelPill({ level }: { level: AccreditationLevel }) {
  const style = LEVEL_STYLES[level] ?? NEUTRAL_STYLE;
  const rank = levelRank(level);

  return (
    <div className="inline-flex flex-col gap-1.5">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset ${style.pill}`}
      >
        {statusLabel(level)}
      </span>
      {rank !== null && (
        <span className="flex gap-0.5" aria-hidden title={rank === 0 ? 'Candidate status' : `Level ${rank} of 4`}>
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={`h-1 w-4 rounded-full ${step <= rank ? style.bar : 'bg-slate-200'}`} />
          ))}
        </span>
      )}
    </div>
  );
}

function describeRemaining(days: number): string {
  const abs = Math.abs(days);
  const span = abs < 60 ? `${abs} day${abs === 1 ? '' : 's'}` : abs < 730 ? `${Math.round(abs / 30.44)} mo` : `${Math.round(abs / 365.25)} yrs`;
  return days < 0 ? `${span} ago` : `${span} left`;
}

const VALIDITY_TONE = {
  active: { bar: 'bg-emerald-500', label: 'text-emerald-700' },
  expiring: { bar: 'bg-amber-500', label: 'text-amber-700' },
  expired: { bar: 'bg-rose-500', label: 'text-rose-700' }
} as const;

/** Validity dates with a progress bar of elapsed time and a plain-language status. */
export function ValidityCell({ program }: { program: ProgramAccreditation }) {
  const info = getExpiryInfo(program);
  if (info.state === 'none' || info.daysRemaining === null) return <EmptyCell />;

  const start = parseAccreditationDate(program.validityStart);
  const end = info.endDate;
  const now = Date.now();
  const elapsed =
    start && end && end.getTime() > start.getTime()
      ? Math.min(1, Math.max(0, (now - start.getTime()) / (end.getTime() - start.getTime())))
      : 1;
  const tone = VALIDITY_TONE[info.state];
  const status =
    info.state === 'expired'
      ? `Expired · ${describeRemaining(info.daysRemaining)}`
      : info.state === 'expiring'
      ? `Expiring soon · ${describeRemaining(info.daysRemaining)}`
      : describeRemaining(info.daysRemaining);

  return (
    <div className="w-[190px]">
      <div className="text-[12px] text-ink tabular-nums whitespace-nowrap">
        {formatReportDate(program.validityStart)} <span className="text-ink-subtle">→</span> {formatReportDate(end)}
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.round(elapsed * 100)}%` }} />
      </div>
      <div className={`mt-1 text-[11px] font-medium ${tone.label}`}>{status}</div>
    </div>
  );
}

export function DocLink({ href, label = 'View', title }: { href?: string; label?: string; title: string }) {
  if (!href) return <EmptyCell />;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className="group/link inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11.5px] font-medium text-ink ring-1 ring-inset ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 whitespace-nowrap"
    >
      {label}
      <ArrowUpRightIcon className="h-3 w-3 text-ink-subtle transition-transform group-hover/link:-translate-y-px group-hover/link:translate-x-px group-hover/link:text-brand-600" />
    </a>
  );
}

export function EmptyCell() {
  return <span className="text-slate-300">—</span>;
}

/** Native select styled as a compact pill; highlights while a non-default option is chosen. */
export function FilterSelect({
  value,
  onChange,
  children,
  title
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  title?: string;
}) {
  const active = value !== 'all';
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={title}
        className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-xs font-medium outline-none transition-colors focus:ring-2 focus:ring-brand-200 ${
          active
            ? 'border-brand-300 bg-brand-50 text-brand-800'
            : 'border-slate-200 bg-white text-ink hover:border-slate-300'
        }`}
      >
        {children}
      </select>
      <ChevronDownIcon
        className={`pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
          active ? 'text-brand-600' : 'text-ink-subtle'
        }`}
      />
    </div>
  );
}
