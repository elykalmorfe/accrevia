import React, { ReactNode } from 'react';
import { ChevronRightIcon, FolderIcon, LucideIcon } from 'lucide-react';

export type FolderStatusTone = 'neutral' | 'warning' | 'info' | 'danger' | 'success';

export interface FolderStatus {
  label: string;
  tone: FolderStatusTone;
}

const TONE_STYLE: Record<FolderStatusTone, { text: string; dot: string }> = {
  neutral: { text: 'text-ink-subtle', dot: 'bg-slate-300' },
  warning: { text: 'text-amber-700', dot: 'bg-amber-400' },
  info: { text: 'text-brand-700', dot: 'bg-brand-500' },
  danger: { text: 'text-rose-700', dot: 'bg-rose-500' },
  success: { text: 'text-emerald-700', dot: 'bg-emerald-500' }
};

interface FolderCardProps {
  name: ReactNode;
  /** Small line above the name, e.g. "Area 1" or a deadline. */
  eyebrow?: ReactNode;
  /** Footer summary, e.g. "2 folders · 5 files". */
  meta: ReactNode;
  status?: FolderStatus | null;
  /** Icon buttons revealed on hover; clicks never open the folder. */
  actions?: ReactNode;
  onOpen: () => void;
  title?: string;
}

export function FolderCard({ name, eyebrow, meta, status, actions, onOpen, title }: FolderCardProps) {
  const tone = status ? TONE_STYLE[status.tone] : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen();
        }
      }}
      title={title}
      className="group flex cursor-pointer flex-col rounded-xl border border-line bg-white p-4 text-left outline-none transition-colors hover:border-brand-300 hover:bg-slate-50/60 focus-visible:ring-2 focus-visible:ring-brand-200"
    >
      <div className="mb-4 flex w-full items-start gap-3">
        <FolderIcon className="h-9 w-9 shrink-0 fill-amber-100 text-amber-400" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="truncate text-[11px] font-semibold text-ink-subtle">{eyebrow}</p>}
          <h4 className="break-words text-sm font-semibold leading-snug text-ink group-hover:text-brand-700">{name}</h4>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {actions && (
            <div
              className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
          <ChevronRightIcon className="mt-1 h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-600" />
        </div>
      </div>

      <div className="mt-auto flex w-full items-center justify-between gap-2 border-t border-line pt-3 text-[11.5px]">
        <span className="min-w-0 truncate text-ink-muted">{meta}</span>
        {status && tone && (
          <span className={`inline-flex shrink-0 items-center gap-1.5 font-medium ${tone.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {status.label}
          </span>
        )}
      </div>
    </div>
  );
}

interface FolderActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export function FolderAction({ icon: Icon, label, onClick, danger }: FolderActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-md p-1.5 text-ink-subtle transition-colors ${
        danger ? 'hover:bg-danger-50 hover:text-danger-600' : 'hover:bg-canvas hover:text-brand-700'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}