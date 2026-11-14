import { SearchIcon, XIcon } from 'lucide-react';
import type { RepositoryFilters } from '../../../types/accreditationRepository';

export type FilterOption = { value: string; label: string };

type RepositorySearchFiltersProps = {
  filters: RepositoryFilters;
  onChange: (next: RepositoryFilters) => void;
  onClear: () => void;
  campusOptions?: FilterOption[];
  yearOptions?: FilterOption[];
  programOptions?: FilterOption[];
  documentTypeOptions?: FilterOption[];
  /** Which filter controls are meaningfully usable with current data. */
  enableCampus?: boolean;
  enableYear?: boolean;
  enableProgram?: boolean;
  enableDocumentType?: boolean;
  searchPlaceholder?: string;
  searchLabel?: string;
};

const selectClass =
  'h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-subtle';

export function RepositorySearchFilters({
  filters,
  onChange,
  onClear,
  campusOptions = [],
  yearOptions = [],
  programOptions = [],
  documentTypeOptions = [],
  enableCampus = false,
  enableYear = false,
  enableProgram = false,
  enableDocumentType = false,
  searchPlaceholder = 'Search…',
  searchLabel = 'Search'
}: RepositorySearchFiltersProps) {
  const hasActive =
    Boolean(filters.query.trim()) ||
    Boolean(filters.campus) ||
    Boolean(filters.academicYear) ||
    Boolean(filters.program) ||
    Boolean(filters.documentType);

  const patch = (partial: Partial<RepositoryFilters>) => onChange({ ...filters, ...partial });

  return (
    <div className="panel p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="sm:col-span-2 xl:col-span-1">
          <label htmlFor="repo-search" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
            {searchLabel}
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              id="repo-search"
              type="search"
              value={filters.query}
              onChange={(e) => patch({ query: e.target.value })}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-9 text-[13px] font-medium hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
            {filters.query ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink-subtle hover:bg-canvas hover:text-ink"
                aria-label="Clear search"
                onClick={() => patch({ query: '' })}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="repo-filter-campus" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
            Campus
          </label>
          <select
            id="repo-filter-campus"
            className={selectClass}
            value={filters.campus}
            onChange={(e) => patch({ campus: e.target.value })}
            disabled={!enableCampus || campusOptions.length === 0}
          >
            <option value="">{enableCampus ? 'All campuses' : 'Unavailable until data loads'}</option>
            {campusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="repo-filter-year" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
            Academic year
          </label>
          <select
            id="repo-filter-year"
            className={selectClass}
            value={filters.academicYear}
            onChange={(e) => patch({ academicYear: e.target.value })}
            disabled={!enableYear || yearOptions.length === 0}
          >
            <option value="">{enableYear ? 'All years' : 'Unavailable until data loads'}</option>
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="repo-filter-program" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
            Program
          </label>
          <select
            id="repo-filter-program"
            className={selectClass}
            value={filters.program}
            onChange={(e) => patch({ program: e.target.value })}
            disabled={!enableProgram || programOptions.length === 0}
          >
            <option value="">{enableProgram ? 'All programs' : 'Unavailable until data loads'}</option>
            {programOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="repo-filter-type" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
            Document type
          </label>
          <select
            id="repo-filter-type"
            className={selectClass}
            value={filters.documentType}
            onChange={(e) => patch({ documentType: e.target.value })}
            disabled={!enableDocumentType || documentTypeOptions.length === 0}
          >
            <option value="">{enableDocumentType ? 'All types' : 'Unavailable until data loads'}</option>
            {documentTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActive ? (
        <div className="mt-3 flex justify-end">
          <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={onClear}>
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
