import React, { ReactNode } from 'react';

const SHOW_TABLE = { md: 'hidden md:block', lg: 'hidden lg:block' } as const;
const SHOW_CARDS = { md: 'md:hidden', lg: 'lg:hidden' } as const;

interface ResponsiveTableProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  /** The full `<table>` element, shown from `breakpoint` up. */
  table: ReactNode;
  /** One stacked card per row, shown below `breakpoint`. */
  renderCard: (row: T) => ReactNode;
  breakpoint?: keyof typeof SHOW_TABLE;
  empty?: ReactNode;
  className?: string;
}

/** Renders a wide table on larger screens and a stacked card list on phones. */
export function ResponsiveTable<T>({ rows, rowKey, table, renderCard, breakpoint = 'lg', empty, className = '' }: ResponsiveTableProps<T>) {
  return (
    <div className={className}>
      <div className={`${SHOW_TABLE[breakpoint]} overflow-x-auto`}>{table}</div>
      <div className={SHOW_CARDS[breakpoint]}>
        {rows.length === 0 ? (
          empty ?? null
        ) : (
          <ul className="space-y-2.5">
            {rows.map((row) => (
              <li key={rowKey(row)}>{renderCard(row)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** A label/value pair laid out for use inside a mobile card. */
export function CardField({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-medium text-ink">{children}</dd>
    </div>
  );
}

/** Card shell matching the table's look in light and dark mode. */
export function MobileCard({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  const base = `block w-full rounded-xl border border-line bg-surface p-3.5 text-left shadow-xs transition-all ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} hover:border-line-strong hover:shadow-soft active:scale-[0.99]`}>
      {children}
    </button>
  ) : (
    <div className={base}>{children}</div>
  );
}
