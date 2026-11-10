import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { fileTypeStyle } from './fileTypeStyle';

export function FileList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <ul className={`divide-y divide-line overflow-hidden rounded-xl border border-line bg-white ${className}`}>{children}</ul>;
}

interface FileRowProps {
  name: ReactNode;
  /** File type (`PDF`) or a file name to derive it from. */
  fileType: string;
  meta?: ReactNode;
  /** Pill shown before the actions, e.g. approval status. */
  status?: ReactNode;
  actions?: ReactNode;
  /** Extra content under the row, e.g. a revision note. */
  children?: ReactNode;
  onOpen?: () => void;
  selected?: boolean;
}

export function FileRow({ name, fileType, meta, status, actions, children, onOpen, selected }: FileRowProps) {
  const style = fileTypeStyle(fileType);
  const Icon = style.icon;
  return (
    <li className={`group px-3 py-2.5 transition ${selected ? 'bg-brand-50/60' : 'hover:bg-brand-50/40'}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-[12rem] flex-1 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${style.className}`}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            {onOpen ? (
              <button
                type="button"
                onClick={onOpen}
                className="block max-w-full truncate text-left text-[13.5px] font-semibold text-ink hover:text-brand-700"
              >
                {name}
              </button>
            ) : (
              <p className="truncate text-[13.5px] font-semibold text-ink">{name}</p>
            )}
            {meta && <p className="truncate text-[11.5px] text-ink-subtle">{meta}</p>}
          </div>
        </div>
        {status && <span className="inline-flex shrink-0">{status}</span>}
        {actions && <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1">{actions}</div>}
      </div>
      {children && <div className="mt-2 pl-12">{children}</div>}
    </li>
  );
}

interface FileRowActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export function FileRowAction({ icon: Icon, label, onClick, danger }: FileRowActionProps) {
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
      <Icon className="h-4 w-4" />
    </button>
  );
}

const STATUS_TONE: Record<string, string> = {
  Approved: 'bg-success-50 text-success-700',
  'Needs Revision': 'bg-danger-50 text-danger-700',
  'Pending Review': 'bg-warning-50 text-warning-700'
};

export function FileStatusPill({ status }: { status?: string }) {
  const label = status ?? 'Pending Review';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_TONE[label] ?? 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
}
