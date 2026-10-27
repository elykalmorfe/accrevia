import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  FilterIcon,
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
  const { documents, frameworks, areas, criteria, indicators, shares, accessRequests, pending } = usePortal();
  const lookup = useLookup();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [showMore, setShowMore] = useState(false);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);
  const [editing, setEditing] = useState<EvidenceDocument | null>(null);

  const activeDocs = useMemo(() => documents.filter((d) => d.status !== 'Archived'), [documents]);
  const archivedDocs = useMemo(() => documents.filter((d) => d.status === 'Archived'), [documents]);
  const activeSharesCount = useMemo(() => shares.filter((s) => shareStatus(s) === 'Active').length, [shares]);
  const pendingRequestsCount = useMemo(() => accessRequests.filter((r) => r.status === 'Pending').length, [accessRequests]);
  const totalStorageMb = useMemo(() => Math.round(documents.reduce((acc, d) => acc + (d.sizeMb || 0), 0) * 10) / 10, [documents]);

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

  const actionItemsCount =
    (processingStats.failed > 0 ? 1 : 0) +
    (pendingRequestsCount > 0 ? 1 : 0) +
    (pending.length > 0 ? 1 : 0);

  return (
    <>
      <PageHeader
        eyebrow="Document Management"
        title="All Documents"
        description="Master evidence repository with real-time pipeline monitoring, cross-framework indexing, and priority health indicators."
        actions={
          <Link to="/evidence/upload" className="btn btn-primary shadow-sm">
            <UploadIcon className="h-4 w-4" /> Upload Documents
          </Link>
        }
      />

      {/* ========================================================================= */}
      {/* 1. PRIORITY ATTENTION CALLOUT BANNER (Clean, Professional Action Cards)   */}
      {/* ========================================================================= */}
      {actionItemsCount > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-orange-50/30 p-4 shadow-xs">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-amber-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500 text-white shadow-2xs">
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                </span>
                <span className="font-bold text-sm text-amber-950 tracking-tight">
                  Priority Attention Required
                </span>
                <span className="rounded-full bg-amber-200/90 px-2 py-0.2 text-[10.5px] font-black text-amber-950 border border-amber-300">
                  {actionItemsCount} {actionItemsCount === 1 ? 'Action Item' : 'Action Items'}
                </span>
              </div>
              <p className="hidden md:inline-block text-[11px] text-amber-900/80 font-medium">
                Immediate review recommended to maintain accreditation compliance
              </p>
            </div>

            {/* Individual Action Cards */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Item 1: Processing Job Failed */}
              {processingStats.failed > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200/90 bg-white/95 p-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                      <p className="text-xs font-bold text-rose-950 truncate">1 Processing Failed</p>
                    </div>
                    <p
                      className="text-[11px] text-rose-800/80 truncate mt-0.5"
                      title={processingStats.failedJob?.fileName}
                    >
                      {processingStats.failedJob?.fileName || 'OCR pipeline error'}
                    </p>
                  </div>
                  <Link
                    to="/evidence/processing"
                    className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11.5px] font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <RotateCcwIcon className="h-3 w-3" /> Retry Job
                  </Link>
                </div>
              )}

              {/* Item 2: Access Requests Pending */}
              {pendingRequestsCount > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/90 bg-white/95 p-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                      <p className="text-xs font-bold text-amber-950 truncate">
                        {pendingRequestsCount} Access {pendingRequestsCount === 1 ? 'Request' : 'Requests'}
                      </p>
                    </div>
                    <p className="text-[11px] text-amber-800/80 truncate mt-0.5">
                      Dean & accreditor permissions
                    </p>
                  </div>
                  <Link
                    to="/evidence/shared?tab=requests"
                    className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11.5px] font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    Review Access
                  </Link>
                </div>
              )}

              {/* Item 3: Awaiting Classification */}
              {pending.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/90 bg-white/95 p-3 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      <p className="text-xs font-bold text-blue-950 truncate">
                        {pending.length} Unclassified Files
                      </p>
                    </div>
                    <p className="text-[11px] text-blue-800/80 truncate mt-0.5">
                      Awaiting criteria tagging
                    </p>
                  </div>
                  <Link
                    to="/evidence/pending"
                    className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-brand-600 px-3 py-1 text-[11.5px] font-bold text-white shadow-xs hover:bg-brand-700 transition-colors"
                  >
                    Classify Files ({pending.length})
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OVERVIEW CARDS: HARMONIZED 4-CARD EXECUTIVE DASHBOARD                 */}
      {/* ========================================================================= */}
      <section className="mb-6 space-y-4" aria-label="Evidence Overview">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: All Documents Repository */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft flex flex-col justify-between hover:border-slate-300 hover:shadow-soft-lg transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Repository</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/70">
                  <FileTextIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {activeDocs.length} <span className="text-xs font-normal text-slate-500">Active Files</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {totalStorageMb} MB indexed across {frameworks.length} frameworks
              </p>

              {/* Status breakdown pills */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  {documents.filter((d) => d.status === 'Indexed').length} Indexed
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                  {documents.filter((d) => d.status !== 'Indexed' && d.status !== 'Archived').length} In Pipeline
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Primary Store</span>
              <Link to="/evidence/upload" className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Upload to Folders <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Document Processing Pipeline (Harmonized, Clean & Balanced) */}
          <div
            className={`rounded-2xl border bg-white p-4 shadow-soft flex flex-col justify-between hover:shadow-soft-lg transition-all ${
              processingStats.failed > 0
                ? 'border-rose-300 ring-1 ring-rose-200/50'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Processing</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100/70">
                  <RotateCwIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {processingJobs.length} <span className="text-xs font-normal text-slate-500">Pipeline Jobs</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                OCR extraction & metadata queue
              </p>

              {/* Status breakdown pills (Clean unified single row) */}
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70" title="Running Jobs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  {processingStats.running} Run
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70" title="Queued Jobs">
                  {processingStats.queued} Queue
                </span>
                {processingStats.failed > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300" title="Failed Jobs">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    {processingStats.failed} Fail
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70" title="Completed Today">
                  {processingStats.completed} Done
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className={`text-[11px] font-semibold ${processingStats.failed > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                {processingStats.failed > 0 ? 'Retry Required' : 'Pipeline Healthy'}
              </span>
              <Link to="/evidence/processing" className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Jobs ({processingJobs.length}) <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Shared Access */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft flex flex-col justify-between hover:border-slate-300 hover:shadow-soft-lg transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Shared Access</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/70">
                  <Share2Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {activeSharesCount} <span className="text-xs font-normal text-slate-500">Active Shares</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {new Set(shares.map((s) => s.documentId)).size} shared documents across campuses
              </p>

              {/* Status breakdown pills */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {activeSharesCount} Active
                </span>
                {pendingRequestsCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    {pendingRequestsCount} Requests
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">{shares.filter((s) => shareStatus(s) === 'Expired').length} Expired</span>
              <Link to="/evidence/shared" className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Manage Access <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Archived & Review Inbox */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft flex flex-col justify-between hover:border-slate-300 hover:shadow-soft-lg transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Archived & Review</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/70">
                  <ArchiveIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {archivedDocs.length} <span className="text-xs font-normal text-slate-500">Archived</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Past-cycle records kept for audit reference
              </p>

              {/* Status breakdown pills */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-brand-700 border border-brand-200/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse" />
                  {pending.length} Pending Tagging
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                  Historical Archive
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link to="/evidence/archived" className="text-slate-500 hover:text-slate-800 text-[11px] font-medium">
                View Archive ({archivedDocs.length})
              </Link>
              <Link to="/evidence/pending" className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5">
                Review Pending <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. NAVIGATION VIEW TABS (Sleek Segmented Pill Control)                     */}
      {/* ========================================================================= */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 shadow-2xs">
          <Link
            to="/evidence"
            className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-xs border border-slate-200/60"
          >
            <span>All Active Documents</span>
            <span className="rounded-full bg-brand-100 text-brand-800 px-1.5 py-0.2 text-[10.5px] font-black">
              {activeDocs.length}
            </span>
          </Link>
          <Link
            to="/evidence/shared"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <span>Shared Documents</span>
            <span className="rounded-full bg-slate-200/80 text-slate-700 px-1.5 py-0.2 text-[10px] font-bold">
              {activeSharesCount}
            </span>
          </Link>
          <Link
            to="/evidence/archived"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <span>Archived Documents</span>
            <span className="rounded-full bg-slate-200/80 text-slate-700 px-1.5 py-0.2 text-[10px] font-bold">
              {archivedDocs.length}
            </span>
          </Link>
          <Link
            to="/evidence/processing"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
          >
            <span>Processing Pipeline</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                processingStats.failed > 0
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {processingJobs.length}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Active Compliance Repository</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DOCUMENTS FILTER & TABLE SECTION (No Truncation, Professional Layout)   */}
      {/* ========================================================================= */}
      <section className="panel overflow-hidden" aria-label="Compliance documents">
        <div className="space-y-3 border-b border-line p-4 bg-canvas/40">
          
          {/* Main Filter Row: Search Input + 4 Primary Dropdowns + Toggle More */}
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <label htmlFor="evidence-filter" className="sr-only">
                Filter documents by title, keyword, or office
              </label>
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="evidence-filter"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search by title, keyword, or office..."
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

            {/* Primary Dropdowns (Guaranteed minimum widths to prevent truncation) */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[145px] sm:w-[155px]">
                {renderSelect('frameworkId')}
              </div>
              <div className="w-[140px] sm:w-[150px]">
                {renderSelect('areaId')}
              </div>
              {/* Document Type Dropdown (Sufficient width to prevent "All document typ" truncation) */}
              <div className="w-[165px] sm:w-[175px]">
                {renderSelect('docType')}
              </div>
              <div className="w-[130px] sm:w-[140px]">
                {renderSelect('status')}
              </div>

              {/* More Filters Button */}
              <button
                type="button"
                onClick={() => setShowMore((s) => !s)}
                aria-expanded={showMore}
                className={`btn btn-sm shrink-0 h-9 px-3 ${
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
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 text-[11.5px]">
                Showing <strong className="text-slate-900 font-bold">{filtered.length}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{activeDocs.length}</strong> active documents
              </span>

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

              {(activeKeys.length > 0 || text) && (
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
              )}
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Sorted by latest upload date
            </span>
          </div>
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