import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">{eyebrow}</div>}
        <h1 className="font-sans text-2xl sm:text-[28px] font-extrabold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm font-medium text-ink-muted leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>);

}