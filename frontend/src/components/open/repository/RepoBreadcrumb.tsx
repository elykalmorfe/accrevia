import { ChevronRightIcon, HomeIcon } from 'lucide-react';

export type RepoBreadcrumbCrumb = {
  id: string;
  label: string;
};

type RepoBreadcrumbProps = {
  items: RepoBreadcrumbCrumb[];
  rootLabel?: string;
  onNavigate: (pathIds: string[]) => void;
};

export function RepoBreadcrumb({ items, rootLabel = 'Campuses', onNavigate }: RepoBreadcrumbProps) {
  return (
    <nav aria-label="Repository breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1 text-[13px]">
        <li className="inline-flex min-w-0 items-center">
          <button
            type="button"
            onClick={() => onNavigate([])}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-1.5 py-1 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <HomeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{rootLabel}</span>
          </button>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const pathIds = items.slice(0, index + 1).map((c) => c.id);
          return (
            <li key={`${item.id}-${index}`} className="inline-flex min-w-0 items-center gap-1">
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
              {isLast ? (
                <span className="truncate px-1.5 py-1 font-bold text-ink" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate(pathIds)}
                  className="truncate rounded-lg px-1.5 py-1 font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
