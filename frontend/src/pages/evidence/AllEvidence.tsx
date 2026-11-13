import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { EvidenceDocument } from '../../types/evidence';
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
  areaId: 'Accreditation Area',
  docType: 'Document Type',
  status: 'System Status',
  approvalStatus: 'Accreditation Status',
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

/** Review statuses that can be preselected with `?review=`, e.g. from Reports & Analytics. */
const REVIEW_FILTERS = ['Approved', 'Pending Review', 'Needs Revision'];

const secondaryKeys: FilterKey[] = ['criterionId', 'indicatorId', 'program', 'office', 'academicYear', 'cycle'];

export function AllEvidence() {
  const { documents, frameworks, areas, criteria, indicators } = usePortal();
  const lookup = useLookup();
  const [params] = useSearchParams();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState(() => {
    const review = params.get('review') ?? '';
    return REVIEW_FILTERS.includes(review) ? { ...emptyFilters, approvalStatus: review } : emptyFilters;
  });
  const [showMore, setShowMore] = useState(false);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);
  const [editing, setEditing] = useState<EvidenceDocument | null>(null);

  const activeDocs = useMemo(() => documents.filter((d) => d.status !== 'Archived'), [documents]);
  const totalStorageMb = useMemo(
    () => Math.round(activeDocs.reduce((acc, d) => acc + (d.sizeMb || 0), 0) * 10) / 10,
    [activeDocs]
  );

  // Master Accreditation Approval Counts
  const approvalCounts = useMemo(() => {
    const approved = activeDocs.filter((d) => d.approvalStatus === 'Approved').length;
    const revision = activeDocs.filter((d) => d.approvalStatus === 'Needs Revision').length;
    const pendingReview = activeDocs.filter((d) => !d.approvalStatus || d.approvalStatus === 'Pending Review').length;
    return { approved, revision, pendingReview };
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
            if (filterVal === 'Approved' && d.approvalStatus !== 'Approved') return false;
            if (filterVal === 'Needs Revision' && d.approvalStatus !== 'Needs Revision') return false;
            if (filterVal === 'Pending Review' && (d.approvalStatus === 'Approved' || d.approvalStatus === 'Needs Revision')) return false;
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
  const secondaryActive = secondaryKeys.filter((k) => filters[k]).length;
  const displayValue = (key: FilterKey) => options[key].find((o) => o.value === filters[key])?.label ?? filters[key];

  const renderSelect = (key: FilterKey, customClass = '') => (
    <SelectField
      key={key}
      label={labels[key]}
      hideLabel
      compact
      className={customClass}
      value={filters[key]}
      onChange={(v) => setFilter(key, v)}
      placeholder={placeholders[key]}
      options={options[key]}
      disabled={key === 'indicatorId' && options.indicatorId.length === 0}
    />
  );

  return (
    <>
      <PageHeader
        eyebrow="Accreditation Repository"
        title="All Documents"
        description="Master evidence catalog across all frameworks and campuses. Search, review, and verify accreditation compliance documents."
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
      <section className="mb-6 space-y-4" aria-label="Document Repository Overview">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4.5">
          {/* Card 1: All Documents */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFilter('approvalStatus', '')}
            onKeyDown={(e) => e.key === 'Enter' && setFilter('approvalStatus', '')}
            className={`group rounded-2xl border p-5 shadow-xs transition-all duration-200 cursor-pointer text-left ${
              !filters.approvalStatus
                ? 'border-brand-500 bg-white ring-2 ring-brand-500/20 shadow-sm'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
            title="Click to view all active documents"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Repository
              </span>
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl border shadow-2xs transition-colors ${
                  !filters.approvalStatus
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-brand-50 text-brand-600 border-blue-100/70 group-hover:bg-brand-100'
                }`}
              >
                <FileTextIcon className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {activeDocs.length}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 truncate">
              {totalStorageMb} MB indexed across {frameworks.length} frameworks
            </p>
          </div>

          {/* Card 2: Approved Documents */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFilter('approvalStatus', filters.approvalStatus === 'Approved' ? '' : 'Approved')}
            onKeyDown={(e) =>
              e.key === 'Enter' && setFilter('approvalStatus', filters.approvalStatus === 'Approved' ? '' : 'Approved')
            }
            className={`group rounded-2xl border p-5 shadow-xs transition-all duration-200 cursor-pointer text-left ${
              filters.approvalStatus === 'Approved'
                ? 'border-brand-500 bg-white ring-2 ring-brand-500/20 shadow-sm'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
            title="Click to filter by approved evidence"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Approved Evidence
              </span>
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl border shadow-2xs transition-colors ${
                  filters.approvalStatus === 'Approved'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-brand-50 text-brand-600 border-brand-100/70 group-hover:bg-brand-100'
                }`}
              >
                <CheckCircle2Icon className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {approvalCounts.approved}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 truncate">
              Verified criteria compliance
            </p>
          </div>

          {/* Card 3: Pending Review Documents */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFilter('approvalStatus', filters.approvalStatus === 'Pending Review' ? '' : 'Pending Review')}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              setFilter('approvalStatus', filters.approvalStatus === 'Pending Review' ? '' : 'Pending Review')
            }
            className={`group rounded-2xl border p-5 shadow-xs transition-all duration-200 cursor-pointer text-left ${
              filters.approvalStatus === 'Pending Review'
                ? 'border-brand-500 bg-white ring-2 ring-brand-500/20 shadow-sm'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
            title="Click to filter by evidence pending review"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Review
              </span>
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl border shadow-2xs transition-colors ${
                  filters.approvalStatus === 'Pending Review'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-brand-50 text-brand-600 border-blue-100/70 group-hover:bg-brand-100'
                }`}
              >
                <ClockIcon className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {approvalCounts.pendingReview}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 truncate">
              Awaiting accreditation sign-off
            </p>
          </div>

          {/* Card 4: Needs Revision Documents */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFilter('approvalStatus', filters.approvalStatus === 'Needs Revision' ? '' : 'Needs Revision')}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              setFilter('approvalStatus', filters.approvalStatus === 'Needs Revision' ? '' : 'Needs Revision')
            }
            className={`group rounded-2xl border p-5 shadow-xs transition-all duration-200 cursor-pointer text-left ${
              filters.approvalStatus === 'Needs Revision'
                ? 'border-brand-500 bg-white ring-2 ring-brand-500/20 shadow-sm'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
            title="Click to filter by evidence requiring revision"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Needs Revision
              </span>
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl border shadow-2xs transition-colors ${
                  filters.approvalStatus === 'Needs Revision'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-brand-50 text-brand-600 border-brand-100/70 group-hover:bg-brand-100'
                }`}
              >
                <AlertTriangleIcon className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {approvalCounts.revision}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 truncate">
              Requires updates or re-upload
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DOCUMENTS FILTER & TABLE SECTION (Clean, Enterprise UX)                */}
      {/* ========================================================================= */}
      <section className="panel overflow-hidden shadow-xs" aria-label="Compliance documents">
        <div className="space-y-3.5 border-b border-line p-4 sm:p-5 bg-canvas/40">
          {/* Quick Approval Status Filter Tabs + Active Count Summary */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pb-1">
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs flex-wrap">
              <button
                type="button"
                onClick={() => setFilter('approvalStatus', '')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  !filters.approvalStatus
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>All Documents</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold ${
                    !filters.approvalStatus ? 'bg-slate-200 text-slate-900' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {activeDocs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('approvalStatus', 'Approved')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filters.approvalStatus === 'Approved'
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-brand-700 hover:bg-brand-50'
                }`}
                title="Filter by approved evidence"
              >
                <CheckCircle2Icon className="h-3.5 w-3.5" />
                <span>Approved</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold ${
                    filters.approvalStatus === 'Approved' ? 'bg-white/30 text-white' : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  {approvalCounts.approved}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('approvalStatus', 'Pending Review')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filters.approvalStatus === 'Pending Review'
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-brand-700 hover:bg-brand-50'
                }`}
                title="Filter by evidence pending review"
              >
                <ClockIcon className="h-3.5 w-3.5" />
                <span>Pending Review</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold ${
                    filters.approvalStatus === 'Pending Review'
                      ? 'bg-white/30 text-white'
                      : 'bg-brand-100 text-brand-800'
                  }`}
                >
                  {approvalCounts.pendingReview}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('approvalStatus', 'Needs Revision')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filters.approvalStatus === 'Needs Revision'
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-brand-800 hover:bg-brand-50'
                }`}
                title="Filter by evidence requiring revision"
              >
                <AlertTriangleIcon className="h-3.5 w-3.5" />
                <span>Needs Revision</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold ${
                    filters.approvalStatus === 'Needs Revision'
                      ? 'bg-white/30 text-white'
                      : 'bg-brand-100 text-brand-900'
                  }`}
                >
                  {approvalCounts.revision}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-[11.5px] font-medium text-slate-600">
                Showing <strong className="text-slate-900 font-bold">{filtered.length}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{activeDocs.length}</strong> active documents
              </span>
            </div>
          </div>

          {/* Main Filter Row: Search Input + Primary Dropdowns (Framework, Campus, Type, Area) + Toggle More */}
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative w-full flex-1 lg:min-w-[220px]">
              <label htmlFor="evidence-filter" className="sr-only">
                Search documents by title, keyword, office, or campus
              </label>
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="evidence-filter"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search by title, keyword, office, or campus..."
                className="input h-9 pl-9 pr-8 text-xs w-full"
              />
              {text && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Primary Dropdowns */}
            <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
              <div className="w-full sm:w-[150px]">
                {renderSelect('frameworkId')}
              </div>
              <div className="w-full sm:w-[160px]">
                {renderSelect('campus')}
              </div>
              <div className="w-full sm:w-[160px]">
                {renderSelect('docType')}
              </div>
              <div className="w-full sm:w-[150px]">
                {renderSelect('areaId')}
              </div>

              {/* More Filters Button */}
              <button
                type="button"
                onClick={() => setShowMore((s) => !s)}
                aria-expanded={showMore}
                className={`btn btn-sm col-span-2 h-9 shrink-0 px-3 sm:col-span-1 ${
                  showMore || secondaryActive
                    ? 'border-brand-300 bg-brand-50 text-brand-700 font-bold'
                    : 'btn-secondary text-xs'
                }`}
              >
                <SlidersHorizontalIcon className="h-3.5 w-3.5" />
                <span>Filters</span>
                {secondaryActive > 0 && (
                  <span className="rounded-full bg-brand-600 text-white px-1.5 py-0.2 text-[10px] font-black">
                    {secondaryActive}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Filters Expandable Drawer */}
          {showMore && (
            <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 animate-in fade-in duration-150">
              {secondaryKeys.map((k) => renderSelect(k))}
            </div>
          )}

          {/* Active Filter Chips & Summary */}
          {(activeKeys.length > 0 || text) && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 text-[11px] font-medium">Active filters:</span>

                {activeKeys.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300/80 bg-white py-0.5 pl-2 pr-1 text-[11px] font-semibold text-slate-800 shadow-2xs"
                  >
                    <span className="text-slate-400 font-medium">{labels[k]}:</span>
                    <span>{displayValue(k)}</span>
                    <button
                      type="button"
                      onClick={() => setFilter(k, '')}
                      className="grid h-4 w-4 place-items-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      aria-label={`Remove ${labels[k]} filter`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setFilters(emptyFilters);
                    setText('');
                  }}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:underline ml-1"
                >
                  Reset all filters
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Sorted by latest upload date
              </span>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="No documents match your filters"
            description="Try clearing some filters or searching with different keywords."
            action={
              activeKeys.length > 0 || text ? (
                <button
                  type="button"
                  onClick={() => {
                    setFilters(emptyFilters);
                    setText('');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Clear all filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <EvidenceTable
            docs={filtered}
            onPreview={(doc) => setPreview(doc)}
            onEdit={(doc) => setEditing(doc)}
          />
        )}
      </section>

      <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />
      <EditMetadataModal doc={editing} onClose={() => setEditing(null)} />
    </>
  );
}
