import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, LucideIcon } from 'lucide-react';
import { Health } from '../../utils/reportMetrics';
import { healthDot } from './healthStyles';

const healthCard: Record<Health, string> = {
  good: 'border-l-success-600',
  warning: 'border-l-warning-600',
  danger: 'border-l-danger-600'
};

const healthIcon: Record<Health, string> = {
  good: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700'
};

export function HealthLegend({ className = '' }: { className?: string }) {
  const items: { health: Health; label: string }[] = [
    { health: 'good', label: 'Good' },
    { health: 'warning', label: 'Needs attention soon' },
    { health: 'danger', label: 'Action needed now' }
  ];
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted ${className}`} aria-label="Color legend">
      {items.map((i) => (
        <li key={i.health} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${healthDot[i.health]}`} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

interface SummaryCardProps {
  label: string;
  value: ReactNode;
  hint: string;
  health: Health;
  icon: LucideIcon;
  to: string;
  linkLabel: string;
}

export function SummaryCard({ label, value, hint, health, icon: Icon, to, linkLabel }: SummaryCardProps) {
  return (
    <Link
      to={to}
      className={`panel group flex flex-col justify-between border-l-4 p-5 transition-shadow hover:shadow-soft ${healthCard[health]}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-[13px] font-semibold text-ink">{label}</span>
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${healthIcon[health]}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-ink">{value}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{hint}</p>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:underline">
        {linkLabel}
        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function PanelHeader({ title, help, action }: { title: string; help?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="panel-title">{title}</h2>
        {help && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{help}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ProgressBar({ percent, health, label }: { percent: number; health: Health; label: string }) {
  const value = Math.min(Math.max(percent, 0), 100);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-canvas"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${healthDot[health]}`} style={{ width: `${value}%` }} />
    </div>
  );
}

/** Banner shown on every tab when a single campus is selected. */
export function CampusScopeNote({ campusName, detail }: { campusName?: string; detail?: string }) {
  if (!campusName) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-xs text-brand-900">
      <span>
        Showing results for <strong>{campusName}</strong> only.
      </span>
      {detail && <span className="font-semibold text-brand-700">{detail}</span>}
    </div>
  );
}
