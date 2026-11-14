import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AwardIcon,
  GraduationCapIcon,
  Building2Icon,
  FileCheck2Icon,
  CheckCircle2Icon,
  FileTextIcon,
  HelpCircleIcon,
  EyeIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  SparklesIcon,
  FilesIcon,
  BadgeCheckIcon,
  ClockIcon,
  ArchiveIcon,
  AlertTriangleIcon,
  DownloadIcon,
  EllipsisIcon,
  FolderOpenIcon,
  InfoIcon,
  LinkIcon
} from 'lucide-react';
import { usePortal } from '../contexts/PortalContext';
import { useLookup } from '../hooks/useLookup';
import { Modal } from '../components/ui/Modal';
import { formatDate, formatNumber } from '../utils/format';
import { isAccreditedLevel, levelAsOf } from '../utils/programAccreditation';
import { GlobalSearch } from '../components/layout/GlobalSearch';
import { usePortalSettings } from '../settings/portalSettings';
import { useSessionAccount } from '../utils/auth';
import { CampusId } from '../types/accreditation';
import { EvidenceDocument } from '../types/evidence';
import { useAccess } from '../hooks/useAccess';
import { downloadStoredFile } from '../utils/fileStore';
import { RowAction } from '../components/ui/RowActionsMenu';
import { ContextActionsMenu, ContextMenuAnchor } from '../components/ui/ContextActionsMenu';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';

/** No upload window is configured in Settings, so "Recently Uploaded" covers the last 30 days. */
const RECENT_UPLOAD_DAYS = 30;
const RECENT_ROW_LIMIT = 6;
const dashboardQuickSearches = ['Research Publications', 'Area III – Research', 'Faculty Development'];

type DocFilter = 'all' | 'recent' | 'pending' | 'verified';
type DocSort = 'newest' | 'oldest' | 'name';

const docFilterOptions: { value: DocFilter; label: string }[] = [
  { value: 'all', label: 'All Documents' },
  { value: 'recent', label: 'Recently Uploaded' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'verified', label: 'Verified' }
];

const docSortOptions: { value: DocSort; label: string }[] = [
  { value: 'newest', label: 'Newest Upload' },
  { value: 'oldest', label: 'Oldest Upload' },
  { value: 'name', label: 'Document Name (A–Z)' }
];

const selectClass =
  'h-10 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-ink shadow-2xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10';

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The calendar year a cycle is evaluated as of: the end year of "2025–2026", or the year itself. */
function cycleEndYear(cycle: string): number {
  const years = cycle.match(/\d{4}/g);
  return years ? Number(years[years.length - 1]) : new Date().getFullYear();
}

const yearDigits = (value?: string) => (value ?? '').replace(/\D/g, '');

export function Dashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    documents,
    programAccreditations,
    iaRecords,
    isoRecords,
    pqaRecords,
    campuses,
    selectedCampus,
    setSelectedCampus,
    isAdmin,
    folders,
    updateDocument,
    logAccess
  } = usePortal();
  const { rightsFor } = useAccess();
  const lookup = useLookup();
  const session = useSessionAccount();
  const settings = usePortalSettings();

  const userName = [session?.firstName, session?.lastName].filter(Boolean).join(' ') || currentUser.name;
  const userRole = session?.role ?? currentUser.role;

  const cycleOptions = useMemo(() => {
    const { academicYears } = settings.accreditation;
    const fallback = settings.general.defaultAcademicYear;
    return fallback && !academicYears.includes(fallback) ? [fallback, ...academicYears] : academicYears;
  }, [settings]);

  const [qaGuideModalOpen, setQaGuideModalOpen] = useState(false);
  const [activeLegendBar, setActiveLegendBar] = useState<'all' | 'inst' | 'prog'>('all');
  const [selectedCycle, setSelectedCycle] = useState(() => settings.general.defaultAcademicYear || cycleOptions[0] || '');
  const [hoveredBarYear, setHoveredBarYear] = useState<string | null>(null);
  const [docFilter, setDocFilter] = useState<DocFilter>('all');
  const [docSort, setDocSort] = useState<DocSort>('newest');
  const [docMenu, setDocMenu] = useState<{ doc: EvidenceDocument; anchor: ContextMenuAnchor } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);
  const closeDocMenu = useCallback(() => setDocMenu(null), []);

  const cycleYear = cycleEndYear(selectedCycle);
  const campusFilterId = selectedCampus === 'all' ? null : selectedCampus;

  const cycleDocuments = useMemo(
    () => {
      const cycleYears: string[] = selectedCycle.match(/\d{4}/g) ?? [];
      return documents.filter((d) =>
        yearDigits(d.academicYear)
          ? yearDigits(d.academicYear) === yearDigits(selectedCycle)
          : cycleYears.includes((d.documentDate || d.dateAdded || '').slice(0, 4))
      );
    },
    [documents, selectedCycle]
  );
  const scopedDocuments = useMemo(
    () =>
      campusFilterId
        ? cycleDocuments.filter((d) => {
            if (d.campusId) return d.campusId === campusFilterId;
            const campus = (d.campus || 'Main Campus (Tandag City)').toLowerCase();
            return campus.includes(campusFilterId.replace('-', ' '));
          })
        : cycleDocuments,
    [cycleDocuments, campusFilterId]
  );

  /** Each document lands in exactly one bucket: archived first, then by review status. */
  const documentOverview = useMemo(() => {
    const counts = { total: scopedDocuments.length, verified: 0, pending: 0, revision: 0, archived: 0 };
    scopedDocuments.forEach((d) => {
      if (d.status === 'Archived') counts.archived += 1;
      else if (d.approvalStatus === 'Approved') counts.verified += 1;
      else if (d.approvalStatus === 'Needs Revision') counts.revision += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [scopedDocuments]);
  const overviewPct = (count: number) =>
    documentOverview.total === 0 ? 0 : Math.round((count / documentOverview.total) * 1000) / 10;
  const overviewSegments = [
    { label: 'Verified', count: documentOverview.verified, color: 'bg-emerald-500' },
    { label: 'Pending review', count: documentOverview.pending, color: 'bg-amber-400' },
    { label: 'Needs revision', count: documentOverview.revision, color: 'bg-rose-400' },
    { label: 'Archived', count: documentOverview.archived, color: 'bg-slate-300' }
  ].filter((seg) => seg.label !== 'Needs revision' || seg.count > 0);
  const activePrograms = useMemo(() => {
    const operating = programAccreditations.filter((p) => {
      const opened = Number(p.yearOfInitialOperation?.slice(0, 4));
      return !opened || opened <= cycleYear;
    });
    if (!campusFilterId) return operating;
    return operating.filter((p) => {
      if (p.campusId === campusFilterId) return true;
      return p.campusName.toLowerCase().includes(campusFilterId.replace('-', ' '));
    });
  }, [programAccreditations, campusFilterId, cycleYear]);

  const compliantCopc = useMemo(() => {
    return activePrograms.filter((p) => p.copcStatus === 'Compliant').length;
  }, [activePrograms]);

  const copcRate = useMemo(() => {
    if (activePrograms.length === 0) return '0';
    return ((compliantCopc / activePrograms.length) * 100).toFixed(1);
  }, [compliantCopc, activePrograms.length]);

  const level1To4Count = useMemo(() => {
    return activePrograms.filter((p) => isAccreditedLevel(levelAsOf(p, cycleYear))).length;
  }, [activePrograms, cycleYear]);

  const certifiedPercentage = useMemo(() => {
    if (activePrograms.length === 0) return '0';
    return ((level1To4Count / activePrograms.length) * 100).toFixed(1);
  }, [activePrograms.length, level1To4Count]);

  const activeIa = useMemo(
    () => iaRecords.filter((r) => !campusFilterId || r.campusId === campusFilterId),
    [iaRecords, campusFilterId]
  );
  const cycleIa = useMemo(
    () => activeIa.filter((r) => {
      const start = Number(r.validityStart?.slice(0, 4));
      return !start || start <= cycleYear;
    }),
    [activeIa, cycleYear]
  );
  const highestIaLevel = useMemo(() => {
    const ranked = ['Level IV', 'Level III', 'Level II', 'Level I'];
    return ranked.find((lvl) => cycleIa.some((r) => r.status === lvl || r.status.startsWith(`${lvl} `))) ?? 'No record';
  }, [cycleIa]);

  const isoSummary = useMemo(() => {
    const latestByCampus = new Map<string, (typeof isoRecords)[number]>();
    isoRecords
      .filter((r) => Number(r.auditDate?.slice(0, 4)) <= cycleYear && (!campusFilterId || r.campusId === campusFilterId))
      .forEach((r) => {
        const current = latestByCampus.get(r.campusId);
        if (!current || r.auditDate > current.auditDate) latestByCampus.set(r.campusId, r);
      });
    const latest = [...latestByCampus.values()];
    const conforming = latest.filter((r) => r.complianceStatus === 'Compliant' || r.complianceStatus === 'Certified').length;
    return {
      campuses: latest.length,
      conforming,
      rate: latest.length === 0 ? 0 : Math.round((conforming / latest.length) * 100),
      openMajor: latest.reduce((sum, r) => sum + (r.findingsCount?.majorNC ?? 0), 0)
    };
  }, [isoRecords, campusFilterId, cycleYear]);

  const highestPqaLevel = useMemo(() => {
    const levels = pqaRecords
      .filter((r) => !campusFilterId || r.campusId === campusFilterId)
      .map((r) => Number(/^Level (\d)/.exec(r.recognitionLevel)?.[1] ?? 0));
    const top = Math.max(0, ...levels);
    return top > 0 ? `PQA Level ${['', 'I', 'II', 'III', 'IV'][top] ?? top}` : 'PQA Candidate';
  }, [pqaRecords, campusFilterId]);

  const recentMatches = useMemo(() => {
    const recentCutoff = new Date(Date.now() - RECENT_UPLOAD_DAYS * 86400000).toISOString().slice(0, 10);
    const list = scopedDocuments.filter((d) => {
      if (d.status === 'Archived') return false;
      if (docFilter === 'recent') return (d.dateAdded ?? '') >= recentCutoff;
      if (docFilter === 'verified') return d.approvalStatus === 'Approved';
      if (docFilter === 'pending') return !d.approvalStatus || d.approvalStatus === 'Pending Review';
      return true;
    });
    const byName = (a: EvidenceDocument, b: EvidenceDocument) => (a.title ?? '').localeCompare(b.title ?? '');
    return list.sort((a, b) => {
      if (docSort === 'name') return byName(a, b);
      const byDate = (a.dateAdded ?? '').localeCompare(b.dateAdded ?? '');
      return (docSort === 'oldest' ? byDate : -byDate) || byName(a, b);
    });
  }, [scopedDocuments, docFilter, docSort]);
  const recent = recentMatches.slice(0, RECENT_ROW_LIMIT);

  const copyDocumentLink = (doc: EvidenceDocument) => {
    navigator.clipboard.writeText(`${window.location.origin}/documents/${doc.id}`);
    toast.success('Link copied');
  };

  const documentActions = (doc: EvidenceDocument): RowAction[] => {
    const rights = rightsFor(doc.id);
    const folder = doc.folderId ? folders.find((f) => f.id === doc.folderId) : undefined;
    const actions: RowAction[] = [];
    if (rights.canView) {
      actions.push(
        { label: 'View Document', icon: EyeIcon, onSelect: () => setPreviewDoc(doc) },
        { label: 'View Details', icon: InfoIcon, onSelect: () => navigate(`/documents/${doc.id}`) }
      );
    }
    if (rights.canDownload) {
      actions.push({
        label: 'Download',
        icon: DownloadIcon,
        onSelect: async () => {
          logAccess('Downloaded', doc.id);
          const saved = await downloadStoredFile(doc.id, doc.title);
          toast.success(saved ? `Downloading ${doc.title}` : `No original file stored for ${doc.title}`);
        }
      });
    }
    if (rights.canView) actions.push({ label: 'Copy Document Link', icon: LinkIcon, onSelect: () => copyDocumentLink(doc) });
    if (isAdmin && folder) {
      actions.push({
        label: 'Open Containing Folder',
        icon: FolderOpenIcon,
        onSelect: () => navigate(`/evidence/upload?folder=${encodeURIComponent(folder.id)}`)
      });
    }
    if (isAdmin) {
      actions.push({
        label: 'Archive',
        icon: ArchiveIcon,
        tone: 'danger',
        onSelect: () => {
          const previous = doc.status;
          updateDocument(doc.id, { status: 'Archived' });
          toast('Moved to Archived Documents', {
            description: doc.title,
            action: { label: 'Undo', onClick: () => updateDocument(doc.id, { status: previous }) }
          });
        }
      });
    }
    return actions;
  };

  const openDocMenuAtButton = (doc: EvidenceDocument, button: HTMLButtonElement) => {
    if (docMenu?.doc.id === doc.id && docMenu.anchor.trigger === button) return closeDocMenu();
    const rect = button.getBoundingClientRect();
    setDocMenu({ doc, anchor: { x: rect.right - 200, y: rect.bottom + 4, flipY: rect.top - 4, trigger: button } });
  };

  const barChartYears = useMemo(() => {
    const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
    return Array.from({ length: 6 }, (_, i) => {
      const year = cycleYear - 5 + i;
      const accreditedPrograms = activePrograms.filter((p) => isAccreditedLevel(levelAsOf(p, year))).length;
      const accreditedCampuses = activeIa.filter((r) => {
        const start = Number(r.validityStart?.slice(0, 4));
        const end = Number(r.validityEnd?.slice(0, 4));
        return start > 0 && start <= year && (!end || end >= year);
      }).length;
      return {
        year: String(year),
        inst: pct(accreditedCampuses, activeIa.length),
        prog: pct(accreditedPrograms, activePrograms.length),
        accreditedCampuses,
        accreditedPrograms
      };
    });
  }, [activePrograms, activeIa, cycleYear]);
  const latestAttainment = barChartYears[barChartYears.length - 1];
  const attainmentSummary = [
    {
      label: 'Institutional Attainment',
      icon: Building2Icon,
      pct: latestAttainment.inst,
      count: latestAttainment.accreditedCampuses,
      total: activeIa.length,
      unit: activeIa.length === 1 ? 'campus' : 'campuses',
      iconTone: 'bg-brand-50 text-brand-600 border-brand-100',
      valueTone: 'text-brand-700'
    },
    {
      label: 'Program Attainment',
      icon: GraduationCapIcon,
      pct: latestAttainment.prog,
      count: latestAttainment.accreditedPrograms,
      total: activePrograms.length,
      unit: activePrograms.length === 1 ? 'program' : 'programs',
      iconTone: 'bg-sky-50 text-sky-600 border-sky-100',
      valueTone: 'text-sky-600'
    }
  ];

  const renderReviewStatus = (doc: EvidenceDocument) => {
    if (doc.approvalStatus === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-200/90 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2Icon className="h-3 w-3" />
          Verified
        </span>
      );
    }
    if (doc.approvalStatus === 'Needs Revision') {
      return (
        <span
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-200/90 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800"
          title={doc.revisionNotes ? `Revision: ${doc.revisionNotes}` : 'Requires revision'}
        >
          <AlertTriangleIcon className="h-3 w-3" />
          Needs Revision
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-blue-200/90 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
        <ClockIcon className="h-3 w-3" />
        Pending Review
      </span>
    );
  };

  const getFileIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.csv') || lower.endsWith('.xls')) {
      return (
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600 border border-brand-100 shrink-0">
          <FileSpreadsheetIcon className="h-3.5 w-3.5" />
        </div>
      );
    }
    if (lower.endsWith('.pdf')) {
      return (
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-800 border border-brand-100 shrink-0">
          <FileTextIcon className="h-3.5 w-3.5" />
        </div>
      );
    }
    return (
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600 border border-brand-100 shrink-0">
        <FileTextIcon className="h-3.5 w-3.5" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────
          EXECUTIVE COMMAND HEADER & CONTROLS
          ───────────────────────────────────────────────────────────────── */}
      <div className="space-y-4 border-b border-slate-100 pb-4">
        {/* WELCOME MESSAGE & CYCLE / CAMPUS SELECTORS */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">
                {greetingFor(new Date())}, {userName}
              </h1>
              <span className="inline-flex items-center rounded-full bg-brand-50 border border-brand-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                {userRole}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Manage accreditation evidence, monitor institutional readiness, and keep your quality assurance records organized.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:flex md:shrink-0">
            <label className="block min-w-0 md:w-40">
              <span className="mb-1 block text-[11px] font-semibold text-ink-muted">Accreditation cycle</span>
              <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className={selectClass}>
                {cycleOptions.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    AY {cycle}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0 md:w-52">
              <span className="mb-1 block text-[11px] font-semibold text-ink-muted">Campus</span>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value as CampusId | 'all')}
                aria-label="Filter by campus"
                className={selectClass}
              >
                <option value="all">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* INTELLIGENT EVIDENCE SEARCH & QA GUIDE */}
        <section
          aria-labelledby="evidence-search-heading"
          className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5"
        >
          <h2 id="evidence-search-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
            <SparklesIcon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            Find the document you need, faster.
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Search accreditation documents, criteria, and supporting evidence across your institution.
          </p>

          <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 lg:w-[70%] lg:flex-none">
              <GlobalSearch
                className="max-w-none"
                variant="featured"
                placeholder="Search accreditation documents, criteria, or keywords..."
                quickSearches={dashboardQuickSearches}
                matchInputWidth
              />
            </div>

            <button
              type="button"
              onClick={() => setQaGuideModalOpen(true)}
              className="btn btn-secondary h-11 shrink-0 gap-1.5 rounded-2xl px-4 text-[13px]"
              title="View QA standards, AACCUP levels, and COPC guide"
            >
              <HelpCircleIcon className="h-4 w-4 text-brand-600" />
              <span>QA Guide</span>
            </button>
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 1: 4 BALANCED EXECUTIVE KPI CARDS
          ───────────────────────────────────────────────────────────────── */}
      <section aria-label="Key Performance Indicators" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Program Accreditation */}
        <Link
          to="/frameworks/pa"
          className="panel group p-5 border border-slate-200/90 hover:border-brand-300 hover:shadow-soft transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">AACCUP Programs</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:scale-105 transition-transform">
              <GraduationCapIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-ink tracking-tight">
              {level1To4Count}
              <span className="text-sm font-medium text-ink-subtle ml-1">
                / {activePrograms.length}
              </span>
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-brand-700">{certifiedPercentage}% Certified</span>
              <span className="text-ink-subtle">Level I to IV</span>
            </div>
          </div>
        </Link>

        {/* Card 2: CHED COPC Compliance */}
        <Link
          to="/frameworks/copc"
          className="panel group p-5 border border-slate-200/90 hover:border-brand-300 hover:shadow-soft transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">CHED COPC</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:scale-105 transition-transform">
              <FileCheck2Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-ink tracking-tight">
              {copcRate}%
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-brand-700">{compliantCopc} Compliant</span>
              <span className="text-ink-subtle">Statutory PSGs</span>
            </div>
          </div>
        </Link>

        {/* Card 3: Institutional Accreditation */}
        <Link
          to="/frameworks/ia"
          className="panel group p-5 border border-slate-200/90 hover:border-brand-300 hover:shadow-soft transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Institutional (IA)</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:scale-105 transition-transform">
              <Building2Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-ink tracking-tight">
              {highestIaLevel}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-brand-700">
                {cycleIa.length} {cycleIa.length === 1 ? 'Campus' : 'Campuses'} Monitored
              </span>
              <span className="text-ink-subtle">Highest level</span>
            </div>
          </div>
        </Link>

        {/* Card 4: ISO 9001 & PQA Standard */}
        <Link
          to="/frameworks/iso"
          className="panel group p-5 border border-slate-200/90 hover:border-brand-300 hover:shadow-soft transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">ISO 9001 & PQA</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:scale-105 transition-transform">
              <AwardIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-ink tracking-tight">
              {isoSummary.rate}%
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${isoSummary.openMajor > 0 ? 'text-danger-700' : 'text-brand-700'}`}>
                {isoSummary.openMajor} Major NC{isoSummary.openMajor === 1 ? '' : 's'}
              </span>
              <span className="text-ink-subtle">{highestPqaLevel}</span>
            </div>
          </div>
        </Link>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2: ACCREDITATION TREND & CORE FRAMEWORKS
          ───────────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* LEFT (7 Cols): CLEAN ATTAINMENT TREND BAR CHART */}
        <div className="panel p-5 shadow-soft lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-ink">Accreditation Attainment</h2>
                <p className="text-xs text-ink-muted">
                  {barChartYears[0].year} – {latestAttainment.year} Academic Cycles
                </p>
              </div>

              {/* Legend Toggles */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveLegendBar(activeLegendBar === 'inst' ? 'all' : 'inst')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                    activeLegendBar === 'all' || activeLegendBar === 'inst'
                      ? 'border-brand-200 bg-brand-50 text-brand-800'
                      : 'border-slate-200 bg-white text-ink-subtle opacity-50'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-brand-600" />
                  <span>Institutional</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLegendBar(activeLegendBar === 'prog' ? 'all' : 'prog')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                    activeLegendBar === 'all' || activeLegendBar === 'prog'
                      ? 'border-brand-200 bg-brand-50 text-brand-800'
                      : 'border-slate-200 bg-white text-ink-subtle opacity-50'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  <span>Programs</span>
                </button>
              </div>
            </div>

            {/* Summary Indicators */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {attainmentSummary.map(({ label, icon: Icon, pct, count, total, unit, iconTone, valueTone }) => (
                <div
                  key={label}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 px-3 py-2"
                  title={total > 0 ? `${count} of ${total} ${unit} accredited as of ${latestAttainment.year}` : `No ${unit} on record`}
                >
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${iconTone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-ink-muted">{label}</p>
                    <p className="flex items-baseline gap-1.5">
                      <span className={`text-lg font-bold leading-tight tabular-nums ${total > 0 ? valueTone : 'text-ink-subtle'}`}>
                        {total > 0 ? `${pct}%` : '—'}
                      </span>
                      <span className="truncate text-[10px] text-ink-subtle">
                        Current Cycle
                        <span className="hidden sm:inline">
                          {' · '}
                          {total > 0 ? `${count} of ${total} ${unit}` : 'No records'}
                        </span>
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar Chart Canvas */}
            <div className="relative mt-5 h-48 w-full">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-medium text-ink-subtle">
                {['100%', '75%', '50%', '25%', '0%'].map((val) => (
                  <div key={val} className="flex items-center w-full">
                    <span className="w-7 shrink-0 text-right pr-2">{val}</span>
                    <div className="h-[1px] w-full border-b border-dashed border-slate-100" />
                  </div>
                ))}
              </div>

              {/* Bars */}
              <div className="absolute bottom-5 left-8 right-2 top-2 flex items-end justify-between px-2 sm:px-6">
                {barChartYears.map((d) => {
                  const isHovered = hoveredBarYear === d.year;
                  return (
                    <div
                      key={d.year}
                      onMouseEnter={() => setHoveredBarYear(d.year)}
                      onMouseLeave={() => setHoveredBarYear(null)}
                      onClick={() => navigate('/frameworks/pa')}
                      className="group relative flex flex-col items-center cursor-pointer"
                      title={`${d.year}: Institutional ${d.inst}%, Programs ${d.prog}%`}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-white shadow-md pointer-events-none">
                          <span>Inst: {d.inst}% • Prog: {d.prog}%</span>
                        </div>
                      )}

                      <div className="flex items-end gap-1.5 h-36">
                        {(activeLegendBar === 'all' || activeLegendBar === 'inst') && (
                          <div
                            style={{ height: `${d.inst}%` }}
                            className={`w-3 sm:w-4 rounded-t bg-brand-600 transition-all ${
                              isHovered ? 'brightness-125 scale-y-105' : 'hover:brightness-110'
                            }`}
                          />
                        )}
                        {(activeLegendBar === 'all' || activeLegendBar === 'prog') && (
                          <div
                            style={{ height: `${d.prog}%` }}
                            className={`w-3 sm:w-4 rounded-t bg-brand-400 transition-all ${
                              isHovered ? 'brightness-110 scale-y-105' : 'hover:brightness-105'
                            }`}
                          />
                        )}
                      </div>
                      <span className="mt-1.5 text-[11px] font-semibold text-ink-muted">
                        {d.year}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium text-brand-700 flex items-center gap-1.5">
              <CheckCircle2Icon className="h-3.5 w-3.5" />
              <span>
                {latestAttainment.prog}% of programs accredited as of {latestAttainment.year}
              </span>
            </span>
            <Link to="/frameworks/pa" className="font-semibold text-brand-600 hover:underline">
              View Rosters →
            </Link>
          </div>
        </div>

        {/* RIGHT (5 Cols): DOCUMENT OVERVIEW */}
        <div className="panel p-5 shadow-soft lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-ink">Document Overview</h2>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[
                { label: 'Total Documents', count: documentOverview.total, icon: FilesIcon, tone: 'bg-brand-50 text-brand-600 border-brand-100', hover: 'hover:border-brand-200 hover:bg-brand-50/40', to: '/evidence' },
                { label: 'Verified Documents', count: documentOverview.verified, icon: BadgeCheckIcon, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100', hover: 'hover:border-emerald-200 hover:bg-emerald-50/40', to: '/evidence' },
                { label: 'Pending Review', count: documentOverview.pending, icon: ClockIcon, tone: 'bg-amber-50 text-amber-600 border-amber-100', hover: 'hover:border-amber-200 hover:bg-amber-50/40', to: '/evidence' },
                { label: 'Archived Documents', count: documentOverview.archived, icon: ArchiveIcon, tone: 'bg-slate-50 text-slate-500 border-slate-200', hover: 'hover:border-slate-300 hover:bg-slate-50', to: '/evidence/archived' }
              ].map(({ label, count, icon: Icon, tone, hover, to }) => (
                <Link
                  key={label}
                  to={to}
                  className={`group flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 transition-all ${hover}`}
                >
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight tabular-nums text-ink">{formatNumber(count)}</p>
                    <p className="truncate text-[11px] text-ink-muted group-hover:text-brand-600 transition-colors">{label}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Verification status distribution */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-ink">Verification Status</span>
                <span className="font-medium text-ink-muted">{overviewPct(documentOverview.verified)}% verified</span>
              </div>
              <div
                className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={overviewSegments.map((seg) => `${seg.label} ${overviewPct(seg.count)}%`).join(', ')}
              >
                {overviewSegments.map((seg) => (
                  <div
                    key={seg.label}
                    style={{ width: `${overviewPct(seg.count)}%` }}
                    className={`h-full ${seg.color} transition-all`}
                    title={`${seg.label}: ${seg.count} (${overviewPct(seg.count)}%)`}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                {overviewSegments.map((seg) => (
                  <span key={seg.label} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${seg.color}`} />
                    <span>
                      {seg.label} <span className="font-semibold text-ink tabular-nums">{seg.count}</span> ({overviewPct(seg.count)}%)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-ink-muted">Computed from document records for AY {selectedCycle}</span>
            <Link to="/evidence" className="font-semibold text-brand-600 hover:underline">
              View Documents →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 3: RECENT EVIDENCE & ACTION CENTER
          ───────────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* RECENT EVIDENCE TABLE */}
        <div className="panel shadow-soft lg:col-span-12 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                    <span>Recent Documents</span>
                    <span
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-ink-muted"
                      aria-label={`${recentMatches.length} documents match this filter`}
                    >
                      {formatNumber(recentMatches.length)}
                    </span>
                  </h2>
                  <p className="text-xs text-ink-muted">Recently uploaded and updated accreditation evidence.</p>
                </div>
                <Link to="/evidence" className="shrink-0 text-xs font-semibold text-brand-600 hover:underline flex items-center gap-0.5">
                  <span>View All</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Status Filter & Sort */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div
                  role="group"
                  aria-label="Filter documents"
                  className="flex w-fit max-w-full flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium sm:flex-nowrap"
                >
                  {docFilterOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={docFilter === value}
                      onClick={() => setDocFilter(value)}
                      title={value === 'recent' ? `Uploaded in the last ${RECENT_UPLOAD_DAYS} days` : undefined}
                      className={`whitespace-nowrap px-2 py-0.5 rounded text-[11px] transition-all ${
                        docFilter === value
                          ? 'bg-surface text-ink shadow-2xs font-semibold'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span className="shrink-0">Sort by</span>
                  <select
                    value={docSort}
                    onChange={(e) => setDocSort(e.target.value as DocSort)}
                    className="h-7 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-ink focus:border-brand-500 focus:outline-none"
                  >
                    {docSortOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[860px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[31%]" />
                  <col className="w-[20%]" />
                  <col className="w-[15%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead className="bg-slate-50/70 border-b border-slate-100 text-ink-muted">
                  <tr className="[&>th]:whitespace-normal [&>th]:leading-tight">
                    <th className="th py-2.5 pl-4 pr-2.5">Document Title</th>
                    <th className="th py-2.5 px-2.5">Document Type</th>
                    <th className="th py-2.5 px-1.5 text-center">Status</th>
                    <th className="th py-2.5 px-2.5">Uploaded By</th>
                    <th className="th py-2.5 px-2.5">Date Uploaded</th>
                    <th className="th py-2.5 pl-1 pr-3 text-right">
                      <span className="sr-only">Options</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.length === 0 && (
                    <tr>
                      <td colSpan={6} className="td py-10 text-center text-xs text-ink-muted">
                        {scopedDocuments.length === 0
                          ? `No documents uploaded for AY ${selectedCycle} yet.`
                          : 'No documents match this filter.'}
                      </td>
                    </tr>
                  )}
                  {recent.map((d) => {
                    const framework = lookup.framework(d.frameworkId);
                    const menuOpenFromButton = docMenu?.doc.id === d.id && !!docMenu.anchor.trigger;
                    return (
                      <tr
                        key={d.id}
                        onClick={() => navigate(`/documents/${d.id}`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="td py-2.5 pl-4 pr-2.5">
                          <div
                            className="flex min-w-0 items-center gap-2"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setDocMenu({ doc: d, anchor: { x: e.clientX, y: e.clientY } });
                            }}
                          >
                            {getFileIcon(d.title)}
                            <span className="min-w-0 break-words font-medium leading-snug text-ink group-hover:text-brand-600 line-clamp-2 transition-colors" title={d.title}>
                              {d.title || 'Untitled document'}
                            </span>
                          </div>
                        </td>
                        <td className="td py-2.5 px-2.5">
                          {framework ? (
                            <span
                              title={framework.name}
                              className="w-fit max-w-full break-words rounded border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-brand-700 line-clamp-2"
                            >
                              {framework.name}
                            </span>
                          ) : (
                            <span className="inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                              Unclassified
                            </span>
                          )}
                        </td>
                        <td className="td py-2.5 px-1.5 text-center">{renderReviewStatus(d)}</td>
                        <td className="td py-2.5 px-2.5 truncate text-ink-muted" title={d.uploadedBy || undefined}>
                          {d.uploadedBy || '—'}
                        </td>
                        <td className="td py-2.5 px-2.5 text-ink-muted whitespace-nowrap">
                          {d.dateAdded ? formatDate(d.dateAdded) : '—'}
                        </td>
                        <td className="td py-2.5 pl-1 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => openDocMenuAtButton(d, e.currentTarget)}
                            aria-haspopup="menu"
                            aria-expanded={menuOpenFromButton}
                            aria-label={`Options for ${d.title}`}
                            className="grid h-7 w-7 place-items-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink"
                          >
                            <EllipsisIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs">
            <span className="text-ink-muted">
              Showing {recent.length} of {formatNumber(recentMatches.length)} documents
            </span>
          </div>
          <ContextActionsMenu
            anchor={docMenu?.anchor ?? null}
            actions={docMenu ? documentActions(docMenu.doc) : []}
            label={docMenu ? `Options for ${docMenu.doc.title}` : 'Document options'}
            onClose={closeDocMenu}
          />
          <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        </div>
      </section>

      {/* STREAMLINED QA STANDARDS GUIDE MODAL */}
      <Modal
        open={qaGuideModalOpen}
        onClose={() => setQaGuideModalOpen(false)}
        title="Quality Assurance & Accreditation Guide"
        description="Core standards and regulatory compliance frameworks across all university campuses."
        size="lg"
      >
        <div className="space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* AACCUP */}
            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">AACCUP</span>
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-800">
                  Academic Programs
                </span>
              </div>
              <p className="text-[11px] font-semibold text-brand-700 mt-1">
                Chartered Colleges & Universities
              </p>
              <ul className="mt-1.5 text-[11px] text-ink-muted space-y-1 list-disc list-inside">
                <li>Evaluates programs from Candidate to Level IV.</li>
                <li>Assesses 10 key areas (Faculty, Curriculum, Research, etc.).</li>
              </ul>
            </div>

            {/* CHED COPC */}
            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">CHED COPC</span>
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-800">
                  Regulatory Mandate
                </span>
              </div>
              <p className="text-[11px] font-semibold text-brand-700 mt-1">
                Certificate of Program Compliance
              </p>
              <ul className="mt-1.5 text-[11px] text-ink-muted space-y-1 list-disc list-inside">
                <li>Validates statutory Policies, Standards, and Guidelines (PSGs).</li>
                <li>Required for all degree offerings in state universities.</li>
              </ul>
            </div>

            {/* ISO 9001:2015 */}
            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">ISO 9001:2015</span>
                <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                  International Standard
                </span>
              </div>
              <p className="text-[11px] font-semibold text-brand-700 mt-1">
                Quality Management System (QMS)
              </p>
              <ul className="mt-1.5 text-[11px] text-ink-muted space-y-1 list-disc list-inside">
                <li>Annual third-party surveillance audits (TÜV Rheinland).</li>
                <li>Monitors non-conformances and Corrective Actions (CARs).</li>
              </ul>
            </div>

            {/* PQA */}
            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">PQA</span>
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-800">
                  Performance Excellence
                </span>
              </div>
              <p className="text-[11px] font-semibold text-brand-700 mt-1">
                Philippine Quality Award
              </p>
              <ul className="mt-1.5 text-[11px] text-ink-muted space-y-1 list-disc list-inside">
                <li>Patterned after the US Malcolm Baldrige National Award.</li>
                <li>Evaluates leadership, strategy, operations, and results.</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}