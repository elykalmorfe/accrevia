import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowRightIcon,
  FileTextIcon,
  RotateCcwIcon,
  RotateCwIcon,
  SearchIcon,
  Share2Icon,
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
import { processingJobs } from '../../data/processing';
import { shareStatus } from '../../utils/sharing';

type FilterKey =
  | 'frameworkId'
  | 'areaId'
  | 'docType'
  | 'status'
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
  status: 'Status',
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
  docType: 'All document types',
  status: 'All statuses',
  criterionId: 'All criteria',
  indicatorId: 'All indicators',
  program: 'All programs',
  office: 'All offices / units',
  academicYear: 'All academic years',
  cycle: 'All accreditation cycles'
};

const primaryKeys: FilterKey[] = ['frameworkId', 'areaId', 'docType', 'status'];
const secondaryKeys: FilterKey[] = ['criterionId', 'indicatorId', 'program', 'office', 'academicYear', 'cycle'];

export function AllEvidence() {
  const {
    documents,
    frameworks,
    areas,
    criteria,
    indicators,
    shares,
    accessRequests,
    pending,
    selectedCampus,
    selectedCampusObj,
    setSelectedCampus,
    isCampusMatch
  } = usePortal();
  const lookup = useLookup();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [showMore, setShowMore] = useState(false);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);
  const [editing, setEditing] = useState<EvidenceDocument | null>(null);

  const campusDocs = useMemo(() => {
    if (selectedCampus === 'all') return documents;
    return documents.filter((d) => isCampusMatch(d.campus, selectedCampus));
  }, [documents, selectedCampus, isCampusMatch]);

  const activeDocs = useMemo(() => campusDocs.filter((d) => d.status !== 'Archived'), [campusDocs]);
  const archivedDocs = useMemo(() => campusDocs.filter((d) => d.status === 'Archived'), [campusDocs]);
  const campusDocIds = useMemo(() => new Set(campusDocs.map((d) => d.id)), [campusDocs]);
  const campusShares = useMemo(
    () => (selectedCampus === 'all' ? shares : shares.filter((s) => campusDocIds.has(s.documentId))),
    [shares, selectedCampus, campusDocIds]
  );
  const activeSharesCount = useMemo(() => campusShares.filter((s) => shareStatus(s) === 'Active').length, [campusShares]);
  const pendingRequestsCount = useMemo(() => accessRequests.filter((r) => r.status === 'Pending').length, [accessRequests]);
  const totalStorageMb = useMemo(() => Math.round(campusDocs.reduce((acc, d) => acc + (d.sizeMb || 0), 0) * 10) / 10, [campusDocs]);

  // Priority Document Processing breakdown (Running, Queued, Failed, Completed today)
  const processingStats = useMemo(() => {
    return {
      running: processingJobs.filter((j) => j.status === 'Running').length,
      queued: processingJobs.filter((j) => j.status === 'Queued').length,
      failed: processingJobs.filter((j) => j.status === 'Failed').length,
      completed: processingJobs.filter((j) => j.status === 'Completed').length,
      failedJob: processingJobs.find((j) => j.status === 'Failed')
    };
  }, []);

  const options = useMemo<Record<FilterKey, { value: string; label: string }[]>>(() => {
    const plain = (values: string[]) => values.map((v) => ({ value: v, label: v }));
    return {
      frameworkId: frameworks.map((f) => ({ value: f.id, label: f.name })),
      areaId: areas.map((a) => ({ value: a.id, label: a.name })),
      docType: plain(documentTypes),
      status: plain(['Indexed', 'Processing', 'Pending Classification', 'Failed']),
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
      .filter((d) => (Object.keys(filters) as FilterKey[]).every((k) => !filters[k] || String(d[k]) === filters[k]))
      .filter((d) => !needle || `${d.title} ${d.keywords.join(' ')} ${d.office}`.toLowerCase().includes(needle))
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [activeDocs, filters, text]);

  const activeKeys = (Object.keys(filters) as FilterKey[]).filter((k) => filters[k]);
  const secondaryActive = secondaryKeys.filter((k) => filters[k]).length;
  const displayValue = (key: FilterKey) => options[key].find((o) => o.value === filters[key])?.label ?? filters[key];

  const renderSelect = (key: FilterKey) => (
    <SelectField
      key={key}
      label={labels[key]}
      hideLabel
      compact
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
        eyebrow="Document Management"
        title="All Documents"
        description="Master evidence repository with real-time pipeline monitoring, cross-framework indexing, and priority health indicators."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/evidence/common" className="btn btn-secondary shadow-2xs">
              <FileTextIcon className="h-4 w-4 text-brand-600" /> Common Documents (8)
            </Link>
            <Link to="/evidence/upload" className="btn btn-primary shadow-sm">
              <UploadIcon className="h-4 w-4" /> Upload Documents
            </Link>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. PRIORITY ATTENTION CALLOUT BANNER (Action Required Alerts)             */}
      {/* ========================================================================= */}
      {(processingStats.failed > 0 || pendingRequestsCount > 0 || pending.length > 0) && (
        <div className="mb-5 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs text-amber-950 shadow-xs">
          <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200/80 shadow-2xs mt-0.5">
                <AlertTriangleIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm sm:text-[15px] text-amber-900 tracking-tight">Priority Attention Required</p>
                  <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wide">
                    Action Needed
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                  {processingStats.failed > 0 && (
                    <li className="flex items-start gap-2 font-medium text-danger-700 leading-snug">
                      <span className="h-2 w-2 rounded-full bg-danger-600 animate-pulse mt-1 shrink-0" />
                      <span className="min-w-0">
                        <span>{processingStats.failed} Processing Job Failed</span>
                        {processingStats.failedJob?.fileName && (
                          <span className="block sm:inline sm:ml-1 text-[11px] font-normal text-danger-600/90 truncate max-w-xs">
                            ({processingStats.failedJob.fileName})
                          </span>
                        )}
                      </span>
                    </li>
                  )}
                  {pendingRequestsCount > 0 && (
                    <li className="flex items-start gap-2 font-medium text-amber-800 leading-snug">
                      <span className="h-2 w-2 rounded-full bg-amber-600 mt-1 shrink-0" />
                      <span>{pendingRequestsCount} Access Request{pendingRequestsCount > 1 ? 's' : ''} Pending Approval</span>
                    </li>
                  )}
                  {pending.length > 0 && (
                    <li className="flex items-start gap-2 font-medium text-slate-700 leading-snug">
                      <span className="h-2 w-2 rounded-full bg-brand-600 mt-1 shrink-0" />
                      <span>{pending.length} Documents Awaiting Criteria Classification</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto lg:shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-amber-200/80">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                {processingStats.failed > 0 && (
                  <Link
                    to="/evidence/processing"
                    className="btn btn-secondary btn-sm bg-white text-danger-700 border-danger-200 hover:bg-danger-50 justify-center text-center py-2 min-h-[38px] shadow-2xs text-xs font-semibold"
                  >
                    <RotateCcwIcon className="h-3.5 w-3.5 text-danger-600 shrink-0" />
                    <span className="truncate">Retry Failed Job</span>
                  </Link>
                )}
                {pendingRequestsCount > 0 && (
                  <Link
                    to="/evidence/shared?tab=requests"
                    className="btn btn-secondary btn-sm bg-white text-amber-800 border-amber-200 hover:bg-amber-100 justify-center text-center py-2 min-h-[38px] shadow-2xs text-xs font-semibold"
                  >
                    <span className="truncate">Review Access</span>
                  </Link>
                )}
              </div>
              {pending.length > 0 && (
                <Link
                  to="/evidence/pending"
                  className="btn btn-primary btn-sm justify-center text-center py-2 min-h-[38px] w-full sm:w-auto shadow-xs text-xs font-bold"
                >
                  <span>Classify Files ({pending.length})</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OVERVIEW CARDS: REPOSITORY, PROCESSING PRIORITY, SHARED, ARCHIVED     */}
      {/* ========================================================================= */}
      <section className="mb-6 space-y-4" aria-label="Evidence Overview">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: All Documents Repository */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Repository</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <FileTextIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                {activeDocs.length} <span className="text-xs font-normal text-slate-500">Active Files</span>
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {totalStorageMb} MB indexed across {frameworks.length} frameworks
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{campusDocs.filter((d) => d.status === 'Indexed').length} Indexed</span>
              <Link to="/evidence/upload" className="font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Upload to Folders <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Document Processing Priority (Explicitly requested by user) */}
          <div
            className={`rounded-xl border bg-white p-4 shadow-xs flex flex-col justify-between transition-all ${
              processingStats.failed > 0
                ? 'border-danger-300 ring-1 ring-danger-200/50'
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Document Processing</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50 text-violet-600">
                  <RotateCwIcon className="h-4 w-4" />
                </span>
              </div>

              {/* Priority metrics breakdown: Running, Queued, Failed, Completed today */}
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-blue-50/70 p-2 border border-blue-100/80">
                  <p className="text-[11px] font-medium text-blue-700">Running</p>
                  <p className="text-base font-bold text-blue-900 mt-0.5">{processingStats.running}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                  <p className="text-[11px] font-medium text-slate-600">Queued</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{processingStats.queued}</p>
                </div>

                <div
                  className={`rounded-lg p-2 border ${
                    processingStats.failed > 0
                      ? 'bg-danger-50 border-danger-200 text-danger-900'
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  <p className="text-[11px] font-medium text-danger-700">Failed</p>
                  <p className="text-base font-bold text-danger-900 mt-0.5">{processingStats.failed}</p>
                </div>

                <div className="rounded-lg bg-emerald-50/70 p-2 border border-emerald-100/80">
                  <p className="text-[11px] font-medium text-emerald-700">Completed today</p>
                  <p className="text-base font-bold text-emerald-900 mt-0.5">{processingStats.completed}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className={`text-[11px] font-medium ${processingStats.failed > 0 ? 'text-danger-700' : 'text-slate-500'}`}>
                {processingStats.failed > 0 ? 'Requires OCR retry' : 'Pipeline healthy'}
              </span>
              <Link to="/evidence/processing" className="font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Jobs ({processingJobs.length}) <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Shared Documents */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shared Access</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Share2Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                {activeSharesCount} <span className="text-xs font-normal text-slate-500">Active Shares</span>
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                <p>{new Set(campusShares.map((s) => s.documentId)).size} shared documents</p>
                <p className={pendingRequestsCount > 0 ? 'font-semibold text-amber-700' : ''}>
                  {pendingRequestsCount} access requests pending review
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{campusShares.filter((s) => shareStatus(s) === 'Expired').length} Expired shares</span>
              <Link to="/evidence/shared" className="font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Manage Access <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Archived & Review Inbox */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Archived & Review</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <ArchiveIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
                {archivedDocs.length} <span className="text-xs font-normal text-slate-500">Archived</span>
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                <p>Past-cycle records kept for reference</p>
                <p className="font-semibold text-brand-700">
                  {pending.length} pending criteria tagging
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link to="/evidence/archived" className="text-slate-500 hover:text-ink">
                View Archive ({archivedDocs.length})
              </Link>
              <Link to="/evidence/pending" className="font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Review Pending <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Campus Active Filter Banner */}
      {selectedCampus !== 'all' && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/70 p-3 text-xs text-brand-900 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold">Campus Filter Active:</span>
            <span>Showing evidence repository for <strong>{selectedCampusObj?.name}</strong> ({activeDocs.length} active files)</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCampus('all')}
            className="btn btn-secondary btn-sm h-7 text-xs bg-white text-ink hover:bg-brand-100 shadow-2xs"
          >
            Show All Campuses
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NAVIGATION VIEW TABS                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200/80 pb-2 mb-4">
        <Link
          to="/evidence"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-brand-50 text-brand-700 shadow-xs"
        >
          All Active ({activeDocs.length})
        </Link>
        <Link
          to="/evidence/shared"
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-slate-100 transition-colors"
        >
          Shared Documents ({activeSharesCount})
        </Link>
        <Link
          to="/evidence/archived"
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-slate-100 transition-colors"
        >
          Archived Documents ({archivedDocs.length})
        </Link>
        <Link
          to="/evidence/processing"
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-slate-100 transition-colors"
        >
          Processing Jobs ({processingJobs.length})
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 4. DOCUMENTS FILTER & TABLE SECTION                                       */}
      {/* ========================================================================= */}
      <section className="panel" aria-label="Compliance documents">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative xl:w-72 xl:shrink-0">
              <label htmlFor="evidence-filter" className="sr-only">
                Filter this list by title, keyword, or office
              </label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
              <input
                id="evidence-filter"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Filter by title or keyword"
                className="input h-8 pl-9 text-[13px]"
              />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">{primaryKeys.map(renderSelect)}</div>
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              aria-expanded={showMore}
              className={`btn btn-sm shrink-0 ${showMore || secondaryActive ? 'border border-brand-200 bg-brand-50 text-brand-700' : 'btn-secondary'}`}
            >
              <SlidersHorizontalIcon className="h-3.5 w-3.5" /> More filters{secondaryActive ? ` (${secondaryActive})` : ''}
            </button>
          </div>
          {showMore && <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{secondaryKeys.map(renderSelect)}</div>}
          {activeKeys.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeKeys.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white py-0.5 pl-2.5 pr-1 text-xs text-ink">
                  <span className="text-ink-muted">{labels[k]}:</span> {displayValue(k)}
                  <button type="button" onClick={() => setFilter(k, '')} className="grid h-5 w-5 place-items-center rounded-full hover:bg-canvas" aria-label={`Remove ${labels[k]} filter`}>
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button type="button" onClick={() => setFilters(emptyFilters)} className="btn btn-ghost btn-sm text-xs">
                Reset filters
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
              activeKeys.length > 0 ? (
                <button type="button" onClick={() => setFilters(emptyFilters)} className="btn btn-secondary btn-sm">
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