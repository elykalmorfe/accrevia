import React, { ReactNode, useId, useState } from 'react';
import { ServerOffIcon, XIcon } from 'lucide-react';
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

export function ServerNotice({ children }: {children: ReactNode;}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-line bg-white px-4 py-3 text-[13px] text-ink-muted">
      <ServerOffIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" />
      <p>{children}</p>
    </div>);

}

interface SaveBarProps {
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onReset?: () => void;
  label?: string;
}

export function SaveBar({ dirty, onSave, onDiscard, onReset, label = 'Settings saved' }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-2 rounded-lg bg-canvas/90 px-1 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {onReset &&
        <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={onReset}>Restore defaults</button>
        }
        {dirty && <span className="text-xs font-medium text-warning-700">You have unsaved changes</span>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!dirty}
          onClick={() => {
            onDiscard();
            toast('Changes discarded');
          }}>
          Discard
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!dirty}
          onClick={() => {
            onSave();
            toast.success(label);
          }}>
          Save changes
        </button>
      </div>
    </div>);

}

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

/** Editable list of short text values (add, rename, remove, move to top). */
export function ListEditor({ label, items, onChange, placeholder }: ListEditorProps) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim();
    if (!value || items.includes(value)) return;
    onChange([value, ...items]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          aria-label={`New ${label}`}
          className="input flex-1"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }} />
        <button type="button" className="btn btn-secondary" onClick={add} disabled={!draft.trim()}>Add</button>
      </div>
      {items.length === 0 ?
      <p className="text-xs text-ink-muted">No {label} yet.</p> :

      <ul className="divide-y divide-line rounded-md border border-line">
          {items.map((item, i) =>
        <li key={`${item}-${i}`} className="flex items-center gap-2 px-2 py-1.5">
              <input
            aria-label={`${label} ${i + 1}`}
            className="min-w-0 flex-1 rounded border-0 bg-transparent px-1 py-0.5 text-[13px] text-ink focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
            value={item}
            onChange={(e) => onChange(items.map((x, j) => j === i ? e.target.value : x))} />
              <button
            type="button"
            className="rounded p-1 text-ink-subtle hover:bg-slate-100 hover:text-danger-600"
            aria-label={`Remove ${item}`}
            onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </li>
        )}
        </ul>
      }
    </div>);

}