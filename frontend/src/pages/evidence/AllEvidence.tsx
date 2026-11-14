import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { useDismiss } from '../../hooks/useDismiss';
import { ApprovalStatus, EvidenceDocument } from '../../types/evidence';
import { documentTypes } from '../../data/options';
import { uniqueValues } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { SelectField } from '../../components/ui/SelectField';
import { EmptyState } from '../../components/ui/EmptyState';
import { EvidenceTable } from '../../components/evidence/EvidenceTable';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { EditMetadataModal } from '../../components/documents/EditMetadataModal';

type FilterKey =
  | 'frameworkId'
  | 'areaId'
  | 'docType'
  | 'status'
  | 'approvalStatus'
  | 'campus'
  | 'criterionId'
  | 'indicatorId'
  | 'program'
  | 'office'
  | 'academicYear'
  | 'cycle';

const emptyFilters: Record<FilterKey, string> = {
  frameworkId: '',
  areaId: '',
  docType: '',
  status: '',
  approvalStatus: '',
  campus: '',
  criterionId: '',
  indicatorId: '',
  program: '',
  office: '',
  academicYear: '',
  cycle: ''
};

const labels: Record<FilterKey, string> = {
  frameworkId: 'Framework',
  areaId: 'Area',
  docType: 'Type',
  status: 'System Status',
  approvalStatus: 'Review Status',
  campus: 'Campus',
  criterionId: 'Criterion',
  indicatorId: 'Indicator',
  program: 'Program',
  office: 'Office / Unit',
  academicYear: 'Academic Year',
  cycle: 'Accreditation Cycle'
};

const placeholders: Record<FilterKey, string> = {
  frameworkId: 'All frameworks',
  areaId: 'All areas',
  docType: 'All types',
  status: 'All statuses',
  approvalStatus: 'All review statuses',
  campus: 'All campuses',
  criterionId: 'All criteria',
  indicatorId: 'All indicators',
  program: 'All programs',
  office: 'All offices / units',
  academicYear: 'All academic years',
  cycle: 'All accreditation cycles'
};

const advancedGroups: { title: string; keys: FilterKey[] }[] = [
  { title: 'Accreditation', keys: ['criterionId', 'indicatorId', 'cycle'] },
  { title: 'Program & office', keys: ['program', 'office'] },
  { title: 'Record', keys: ['academicYear', 'status'] }
];
const advancedKeys = advancedGroups.flatMap((g) => g.keys);
const clearedAdvanced = Object.fromEntries(advancedKeys.map((k) => [k, ''])) as Partial<Record<FilterKey, string>>;

const quickSelectClass = '[&_select]:h-10 [&_select]:min-h-0 [&_select]:rounded-xl';
const activeSelectClass =
  '[&_select]:border-brand-300 [&_select]:bg-brand-50/60 [&_select]:font-medium [&_select]:text-brand-800';

const statusChipTone: Record<ApprovalStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'Pending Review': 'border-brand-200 bg-brand-50 text-brand-800',
  'Needs Revision': 'border-orange-200 bg-orange-50 text-orange-800'
};

/** Documents without a recorded review decision are awaiting review. */
const approvalOf = (d: EvidenceDocument): ApprovalStatus => d.approvalStatus ?? 'Pending Review';

const kpiTones = {
  blue: {
    selected: 'border-brand-400 bg-brand-50/40 ring-2 ring-brand-500/15',
    icon: 'border-blue-100 bg-blue-50 text-brand-600',
    iconSelected: 'border-brand-600 bg-brand-600 text-white'
  },
  green: {
    selected: 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-500/15',
    icon: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    iconSelected: 'border-emerald-600 bg-emerald-600 text-white'
  },
  orange: {
    selected: 'border-orange-400 bg-orange-50/40 ring-2 ring-orange-500/15',
    icon: 'border-orange-100 bg-orange-50 text-orange-600',
    iconSelected: 'border-orange-600 bg-orange-600 text-white'
  }
};

export function AllEvidence() {
  const { documents, frameworks, areas, criteria, indicators } = usePortal();
  const lookup = useLookup();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [draft, setDraft] = useState(emptyFilters);
  const advancedButtonRef = useRef<HTMLButtonElement>(null);
  const closeAdvanced = useCallback(() => setAdvancedOpen(false), []);
  const advancedRef = useDismiss<HTMLDivElement>(advancedOpen, closeAdvanced);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);
  const [editing, setEditing] = useState<EvidenceDocument | null>(null);

  const activeDocs = useMemo(() => documents.filter((d) => d.status !== 'Archived'), [documents]);
  const archivedCount = documents.length - activeDocs.length;

  const approvalCounts = useMemo(() => {
    const counts: Record<ApprovalStatus, number> = { Approved: 0, 'Pending Review': 0, 'Needs Revision': 0 };
    activeDocs.forEach((d) => counts[approvalOf(d)]++);
    return { approved: counts.Approved, revision: counts['Needs Revision'], pendingReview: counts['Pending Review'] };
  }, [activeDocs]);

  const options = useMemo<Record<FilterKey, { value: string; label: string }[]>>(() => {
    const plain = (values: string[]) => values.map((v) => ({ value: v, label: v }));
    return {
      frameworkId: frameworks.map((f) => ({ value: f.id, label: f.name })),
      areaId: areas.map((a) => ({ value: a.id, label: a.name })),
      docType: plain(documentTypes),
      status: plain(['Indexed', 'Processing', 'Pending Classification', 'Failed']),
      approvalStatus: [
        { value: 'Approved', label: 'Approved' },
        { value: 'Pending Review', label: 'Pending Review' },
        { value: 'Needs Revision', label: 'Needs Revision' }
      ],
      campus: plain(uniqueValues(activeDocs, (d) => d.campus || 'Main Campus (Tandag City)')),
      criterionId: criteria
        .filter((c) => (!filters.frameworkId || c.frameworkId === filters.frameworkId) && (!filters.areaId || c.areaId === filters.areaId))
        .map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` })),
      indicatorId: indicators
        .filter((i) => {
          const c = lookup.criterion(i.criterionId);
          if (filters.criterionId) return i.criterionId === filters.criterionId;
          return (!filters.frameworkId || c?.frameworkId === filters.frameworkId) && (!filters.areaId || c?.areaId === filters.areaId);
        })
        .map((i) => ({ value: i.id, label: `${i.code} – ${i.name}` })),
      program: plain(uniqueValues(activeDocs, (d) => d.program)),
      office: plain(uniqueValues(activeDocs, (d) => d.office)),
      academicYear: plain(uniqueValues(activeDocs, (d) => d.academicYear).reverse()),
      cycle: plain(uniqueValues(activeDocs, (d) => d.cycle))
    };
  }, [frameworks, areas, criteria, indicators, filters.frameworkId, filters.areaId, filters.criterionId, activeDocs, lookup]);

  const setFilter = (key: FilterKey, value: string) =>
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === 'frameworkId' || key === 'areaId') {
        next.criterionId = '';
        next.indicatorId = '';
      }
      if (key === 'criterionId') next.indicatorId = '';
      return next;
    });

  const filtered = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return activeDocs
      .filter((d) => {
        // Standard filters matching
        for (const k of Object.keys(filters) as FilterKey[]) {
          const filterVal = filters[k];
          if (!filterVal) continue;

          if (k === 'approvalStatus') {
            if (approvalOf(d) !== filterVal) return false;
            continue;
          }

          if (k === 'campus') {
            const docCampus = d.campus || 'Main Campus (Tandag City)';
            if (docCampus !== filterVal) return false;
            continue;
          }

          if (String(d[k]) !== filterVal) return false;
        }
        return true;
      })
      .filter((d) => !needle || `${d.title} ${(d.keywords || []).join(' ')} ${d.office || ''} ${d.campus || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [activeDocs, filters, text]);

  const activeKeys = (Object.keys(filters) as FilterKey[]).filter((k) => filters[k]);
  const advancedActive = advancedKeys.filter((k) => filters[k]).length;
  const searchTerm = text.trim();
  const hasActiveFilters = activeKeys.length > 0 || searchTerm !== '';
  const clearAll = () => {
    setFilters(emptyFilters);
    setText('');
  };

  const openAdvanced = () => {
    setDraft(filters);
    setAdvancedOpen(true);
  };
  const finishAdvanced = (patch: Partial<Record<FilterKey, string>>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setAdvancedOpen(false);
    advancedButtonRef.current?.focus();
  };
  const setDraftValue = (key: FilterKey, value: string) =>
    setDraft((d) => ({ ...d, [key]: value, ...(key === 'criterionId' ? { indicatorId: '' } : {}) }));
  const draftIndicatorOptions = draft.criterionId
    ? indicators.filter((i) => i.criterionId === draft.criterionId).map((i) => ({ value: i.id, label: `${i.code} – ${i.name}` }))
    : options.indicatorId;
  const displayValue = (key: FilterKey) => options[key].find((o) => o.value === filters[key])?.label ?? filters[key];

  const shareOfActive = (n: number) =>
    activeDocs.length ? `${Math.round((n / activeDocs.length) * 100)}% of active documents` : 'No active documents yet';
  const kpis: {
    label: string;
    status: '' | ApprovalStatus;
    value: number;
    description: string;
    hint: string;
    icon: typeof FileTextIcon;
    tone: keyof typeof kpiTones;
  }[] = [
    {
      label: 'Active Repository',
      status: '',
      value: activeDocs.length,
      description: archivedCount ? `Excludes ${archivedCount} archived` : `Across ${frameworks.length} frameworks`,
      hint: 'Show all active documents',
      icon: FileTextIcon,
      tone: 'blue'
    },
    {
      label: 'Approved Documents',
      status: 'Approved',
      value: approvalCounts.approved,
      description: shareOfActive(approvalCounts.approved),
      hint: 'Show documents with Approved status',
      icon: CheckCircle2Icon,
      tone: 'green'
    },
    {
      label: 'Pending Review',
      status: 'Pending Review',
      value: approvalCounts.pendingReview,
      description: shareOfActive(approvalCounts.pendingReview),
      hint: 'Show documents awaiting review',
      icon: ClockIcon,
      tone: 'blue'
    },
    {
      label: 'Needs Revision',
      status: 'Needs Revision',
      value: approvalCounts.revision,
      description: shareOfActive(approvalCounts.revision),
      hint: 'Show documents that need updates',
      icon: AlertTriangleIcon,
      tone: 'orange'
    }
  ];

  const quickSelect = (key: FilterKey, width: string) => (
    <SelectField
      key={key}
      label={labels[key]}
      hideLabel
      compact
      className={`min-w-0 ${width} ${quickSelectClass} ${filters[key] ? activeSelectClass : ''}`}
      value={filters[key]}
      onChange={(v) => setFilter(key, v)}
      placeholder={placeholders[key]}
      options={options[key]}
    />
  );

  const renderChip = (key: string, label: string, value: string, onRemove: () => void, tone?: string) => (
    <span
      key={key}
      className={`inline-flex max-w-full items-center gap-1 rounded-lg border py-0.5 pl-2 pr-0.5 text-[11px] font-semibold ${
        tone ?? 'border-slate-200 bg-white text-slate-800'
      }`}
    >
      <span className="shrink-0 font-medium opacity-70">{label}:</span>
      <span className="min-w-0 truncate">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md opacity-60 hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        aria-label={`Remove ${label} filter`}
      >
        <XIcon className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );

  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li className="text-[11px]">Documents</li>
              <li aria-hidden="true" className="font-normal text-slate-300">
                /
              </li>
              <li aria-current="page" className="text-xs font-medium normal-case tracking-normal text-slate-500">
                All Documents
              </li>
            </ol>
          </nav>
        }
        title="All Documents"
        description="Manage, organize, and track accreditation evidence across frameworks and campuses."
        actions={
          <Link to="/evidence/upload" className="btn btn-primary shadow-xs gap-1.5 font-semibold">
            <UploadIcon className="h-4 w-4" />
            <span>Upload Documents</span>
          </Link>
        }
      />

      {/* ========================================================================= */}
      {/* 1. DOCUMENT REPOSITORY KPIS (Focused, Document-Specific Metrics)           */}
      {/* ========================================================================= */}
      <section className="mb-6" aria-label="Document repository overview">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const selected = filters.approvalStatus === kpi.status;
            const tone = kpiTones[kpi.tone];
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.label}
                type="button"
                aria-pressed={selected}
                title={kpi.hint}
                onClick={() => setFilter('approvalStatus', selected ? '' : kpi.status)}
                className={`flex h-full flex-col rounded-2xl border p-4 text-left shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 sm:p-5 ${
                  selected ? tone.selected : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">{kpi.label}</span>
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors ${
                      selected ? tone.iconSelected : tone.icon
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                </span>
                <span className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-ink sm:text-3xl">{kpi.value}</span>
                <span className="mt-1 block w-full text-xs font-medium leading-snug text-slate-500">{kpi.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DOCUMENTS FILTER & TABLE SECTION (Clean, Enterprise UX)                */}
      {/* ========================================================================= */}
      <section className="panel" aria-label="Compliance documents">
        <div className="space-y-3 rounded-t-2xl border-b border-line bg-canvas/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] font-medium text-slate-600" aria-live="polite">
              Showing <strong className="font-bold text-slate-900">{filtered.length}</strong> of{' '}
              <strong className="font-bold text-slate-900">{activeDocs.length}</strong> active documents
            </p>
            <span className="hidden text-[11px] text-slate-400 sm:inline">Sorted by latest upload date</span>
          </div>

          <div className="relative flex flex-col gap-2 min-[1500px]:flex-row min-[1500px]:items-center">
            <form
              role="search"
              className="relative min-w-0 min-[1500px]:min-w-[260px] min-[1500px]:flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                setText((t) => t.trim());
              }}
            >
              <label htmlFor="evidence-filter" className="sr-only">
                Search documents by title, keyword, office, or campus
              </label>
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="evidence-filter"
                type="search"
                enterKeyHint="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search by title, keyword, office, or campus..."
                className="input h-10 w-full pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {text && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </form>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              {quickSelect('frameworkId', 'sm:w-52')}
              {quickSelect('campus', 'sm:w-44')}
              {quickSelect('docType', 'sm:w-36')}
              {quickSelect('areaId', 'sm:w-36')}

              <div ref={advancedRef} className="col-span-2 sm:col-span-1">
                <button
                  ref={advancedButtonRef}
                  type="button"
                  onClick={() => (advancedOpen ? closeAdvanced() : openAdvanced())}
                  aria-expanded={advancedOpen}
                  aria-controls="advanced-filters"
                  aria-haspopup="dialog"
                  className={`btn h-10 min-h-0 w-full gap-1.5 rounded-xl px-3.5 text-[13px] sm:w-auto ${
                    advancedOpen || advancedActive ? 'border border-brand-300 bg-brand-50 text-brand-700' : 'btn-secondary'
                  }`}
                >
                  <SlidersHorizontalIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Filters</span>
                  {advancedActive > 0 && (
                    <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">{advancedActive}</span>
                  )}
                </button>

                {advancedOpen && (
                  <div
                    id="advanced-filters"
                    role="dialog"
                    aria-labelledby="advanced-filters-title"
                    className="absolute right-0 top-full z-30 mt-2 w-full rounded-2xl border border-line bg-white p-4 shadow-soft-lg sm:w-[36rem] sm:max-w-full"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 id="advanced-filters-title" className="text-sm font-semibold text-ink">
                        More filters
                      </h3>
                      <button
                        type="button"
                        onClick={closeAdvanced}
                        className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle hover:bg-slate-100 hover:text-ink"
                        aria-label="Close more filters"
                      >
                        <XIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-3 space-y-3.5">
                      {advancedGroups.map((group) => (
                        <fieldset key={group.title}>
                          <legend className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle">
                            {group.title}
                          </legend>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            {group.keys.map((k) => {
                              const keyOptions = k === 'indicatorId' ? draftIndicatorOptions : options[k];
                              return (
                                <SelectField
                                  key={k}
                                  label={labels[k]}
                                  labelClassName="mb-1 block text-[11px] font-medium text-ink-muted"
                                  compact
                                  className={`min-w-0 ${draft[k] ? activeSelectClass : ''}`}
                                  value={draft[k]}
                                  onChange={(v) => setDraftValue(k, v)}
                                  placeholder={keyOptions.length ? placeholders[k] : 'None available'}
                                  options={keyOptions}
                                  disabled={keyOptions.length === 0}
                                />
                              );
                            })}
                          </div>
                        </fieldset>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => finishAdvanced(clearedAdvanced)}>
                        Clear filters
                      </button>
                      <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={closeAdvanced}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => finishAdvanced(Object.fromEntries(advancedKeys.map((k) => [k, draft[k]])))}
                        >
                          Apply filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-3">
              <span className="text-[11px] font-medium text-slate-500">Active filters:</span>
              {filters.approvalStatus &&
                renderChip(
                  'approvalStatus',
                  labels.approvalStatus,
                  filters.approvalStatus,
                  () => setFilter('approvalStatus', ''),
                  statusChipTone[filters.approvalStatus as ApprovalStatus]
                )}
              {searchTerm && renderChip('search', 'Search', `“${searchTerm}”`, () => setText(''))}
              {activeKeys
                .filter((k) => k !== 'approvalStatus')
                .map((k) => renderChip(k, labels[k], displayValue(k), () => setFilter(k, '')))}
              <button
                type="button"
                onClick={clearAll}
                className="ml-1 rounded text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="No documents match your filters"
            description="Try clearing some filters or searching with different keywords."
            action={
              hasActiveFilters ? (
                <button type="button" onClick={clearAll} className="btn btn-secondary btn-sm">
                  Clear all filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-b-2xl">
            <EvidenceTable docs={filtered} onPreview={(doc) => setPreview(doc)} onEdit={(doc) => setEditing(doc)} />
          </div>
        )}
      </section>

      <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />
      <EditMetadataModal doc={editing} onClose={() => setEditing(null)} />
    </>
  );
}
