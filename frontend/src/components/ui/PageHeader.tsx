import { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">{eyebrow}</div>}
        <h1 className="font-sans text-[22px] font-extrabold tracking-tight text-ink xs:text-2xl sm:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-1 line-clamp-2 max-w-3xl text-[13px] font-medium leading-relaxed text-ink-muted sm:line-clamp-none sm:text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:gap-2.5 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>
      )}
    </div>
  );
}
