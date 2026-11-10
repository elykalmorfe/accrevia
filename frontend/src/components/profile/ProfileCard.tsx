import React, { ReactNode, useId } from 'react';

export function ProfileCard({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
  editing?: boolean;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date';
  placeholder?: string;
  /** Rendered instead of the plain value in read mode (e.g. a formatted date or badge). */
  display?: ReactNode;
}

export function InfoField({ label, value, editing = false, onChange, type = 'text', placeholder, display }: InfoFieldProps) {
  const id = useId();
  const editable = editing && onChange;
  return (
    <div className="min-w-0">
      <label htmlFor={editable ? id : undefined} className="block text-xs font-medium text-ink-muted">
        {label}
      </label>
      {editable ? (
        <input
          id={id}
          type={type}
          className="input mt-1.5"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="mt-1 truncate text-sm font-semibold text-ink" title={value || undefined}>
          {display ?? (value || <span className="font-normal text-ink-subtle">Not set</span>)}
        </p>
      )}
    </div>
  );
}
