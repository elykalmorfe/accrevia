import React, { ReactNode, useId } from 'react';
import { toast } from 'sonner';

export function SettingsGroup({ title, description, children }: {title: string;description?: string;children: ReactNode;}) {
  return (
    <section className="panel px-5">
      <div className="border-b border-line py-4">
        <h2 className="panel-title">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      <div>{children}</div>
    </section>);

}

export function SettingRow({ label, description, children }: {label: string;description?: string;children: ReactNode;}) {
  return (
    <div className="grid gap-3 border-b border-line py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8">
      <div>
        <p className="text-[13px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      <div>{children}</div>
    </div>);

}

interface RangeFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
}

export function RangeField({ label, value, onChange, min, max, step, format }: RangeFieldProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer accent-brand-600" />
      <span className="w-16 text-right text-[13px] font-medium tabular-nums text-ink">{format ? format(value) : value}</span>
    </div>);

}

export function SaveBar({ label = 'Settings saved' }: {label?: string;}) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" className="btn btn-secondary" onClick={() => toast('Changes discarded')}>Discard</button>
      <button type="button" className="btn btn-primary" onClick={() => toast.success(label)}>Save changes</button>
    </div>);

}