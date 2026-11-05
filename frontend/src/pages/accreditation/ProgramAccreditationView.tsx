import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { ProgramAccreditation } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { ProgramFormModal } from '../../components/accreditation/ProgramFormModal';
import { ProgramAreaRepositoryModal } from '../../components/accreditation/ProgramAreaRepositoryModal';
import { ExpiryIndicator } from '../../components/accreditation/ExpiryIndicator';
import { ProgramReportPrintModal, ProgramReportType } from '../../components/accreditation/reports/ProgramReportPrintModal';
import { FindingsPrintModal } from '../../components/accreditation/reports/FindingsPrintModal';
import { Modal } from '../../components/ui/Modal';
import { compareYears, formatLevel, getExpiryInfo, getLevelHistory, isUrl, levelAsOf } from '../../utils/programAccreditation';

type HigherLevelFilter = 'all' | 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'improved';

export type OverviewStatFilter =
  | 'none'
  | 'total'
  | 'new'
  | 'candidate'
  | 'level-1'
  | 'level-2'
  | 'level-3'
  | 'level-4'
  | 'accredited'
  | 'undergraduate'
  | 'graduate'
  | 'due-this-year';

const CURRENT_YEAR = new Date().getFullYear();
const TARGET_YEAR = Math.max(2027, CURRENT_YEAR);
const BASELINE_YEAR = CURRENT_YEAR - 1;

function isNewProgram(p: ProgramAccreditation, currentYear = CURRENT_YEAR): boolean {
  if (p.status === 'waiting') return true;
  if (p.yearOfInitialOperation) {
    const yearMatch = p.yearOfInitialOperation.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      if (year >= currentYear - 2) return true;
    }
  }
  if (p.remarks && p.remarks.toLowerCase().includes('new program')) return true;
  return false;
}

function isDueThisYear(p: ProgramAccreditation, currentYear = CURRENT_YEAR): boolean {
  const yearStr = String(currentYear);
  const inValidityEnd = Boolean(p.validityEnd && p.validityEnd.includes(yearStr));
  const inSchedule = Boolean(p.scheduleForAccreditation && p.scheduleForAccreditation.includes(yearStr));
  const isForAccred = p.status === 'for accreditation';
  const inLevelStatus = Boolean(p.levelStatusForAccreditation && p.levelStatusForAccreditation.includes(yearStr));
  return inValidityEnd || inSchedule || isForAccred || inLevelStatus;
}

function getOverviewFilterLabel(filter: OverviewStatFilter): string {
  switch (filter) {
    case 'total':
      return 'All Programs';
    case 'accredited':
      return 'Accredited Programs (Levels 1–4)';
    case 'due-this-year':
      return `For Accreditation This Year (${CURRENT_YEAR})`;
    case 'level-1':
      return 'Level 1 Accredited';
    case 'level-2':
      return 'Level 2 Re-accredited';
    case 'level-3':
      return 'Level 3 Re-accredited';
    case 'level-4':
      return 'Level 4 Accredited';
    case 'candidate':
      return 'Candidate Programs';
    case 'new':
      return 'New / Newly Established Programs';
    case 'undergraduate':
      return 'Undergraduate Degree Programs';
    case 'graduate':
      return 'Graduate Degree Programs (Master\'s & Ph.D.)';
    default:
      return '';
  }
}
import {
  SearchIcon,
  PlusIcon,
  ExternalLinkIcon,
  FileCheckIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircle2Icon,
  PrinterIcon,
  Building2Icon,
  GraduationCapIcon,
  BookOpenIcon,
  ClockIcon,
  AwardIcon,
  SparklesIcon,
  RotateCcwIcon,
  FolderOpenIcon,
  UploadIcon,
  XIcon,
  ShieldCheckIcon,
  FilterIcon,
  LayersIcon
} from 'lucide-react';

export function ProgramAccreditationView() {
  const {
    campuses,
    programAccreditations,
    deleteProgramAccreditation,
    documents,
    folders,
    isAdmin
  } = usePortal();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [overviewFilter, setOverviewFilter] = useState<OverviewStatFilter>('none');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDegree, setSelectedDegree] = useState<string>('all');
  const [validityFilter, setValidityFilter] = useState<'all' | 'expiring' | 'active' | 'expired'>('all');
  const [higherLevelFilter, setHigherLevelFilter] = useState<HigherLevelFilter>('all');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramAccreditation | null>(null);

  // Requirements / Detail Modal State
  const [detailsSnapshot, setDetailsModalProgram] = useState<ProgramAccreditation | null>(null);
  const detailsModalProgram = detailsSnapshot
    ? programAccreditations.find((p) => p.id === detailsSnapshot.id) ?? detailsSnapshot
    : null;
  const [repositoryReqId, setRepositoryReqId] = useState<string | null>(null);
  const repositoryRequirement = detailsModalProgram?.requirements?.find((r) => r.id === repositoryReqId) ?? null;

  const areaRepositoryStats = useMemo(() => {
    const stats: Record<string, { files: number; folders: number }> = {};
    const reqIds = new Set((detailsModalProgram?.requirements || []).map((r) => r.id));
    const bump = (areaId: string | undefined, key: 'files' | 'folders') => {
      if (!areaId || !reqIds.has(areaId)) return;
      stats[areaId] = stats[areaId] || { files: 0, folders: 0 };
      stats[areaId][key] += 1;
    };
    documents.forEach((d) => d.frameworkId === 'pa' && bump(d.areaId, 'files'));
    folders.forEach((f) => f.frameworkId === 'pa' && bump(f.areaId, 'folders'));
    return stats;
  }, [detailsModalProgram?.requirements, documents, folders]);

  // Print / report modals
  const [reportModal, setReportModal] = useState<{
    open: boolean;
    type: ProgramReportType;
    fromYear?: number;
    targetYear?: number;
  }>({ open: false, type: 'summary' });
  const [findingsProgramId, setFindingsProgramId] = useState<string | null>(null);

  const improvedProgramIds = useMemo(
    () => new Set(compareYears(programAccreditations, BASELINE_YEAR, TARGET_YEAR).improved.map((c) => c.program.id)),
    [programAccreditations]
  );

  // Filtered Programs
  const filtered = useMemo(() => {
    return programAccreditations.filter((prog) => {
      // 1. Campus Filter (Primary Campus Scope)
      if (selectedCampus !== 'all' && prog.campusId !== selectedCampus) return false;

      // 2. Interactive Overview Stat Card Filter
      if (overviewFilter !== 'none') {
        if (overviewFilter === 'level-1' && prog.status !== 'Level 1') return false;
        if (overviewFilter === 'level-2' && prog.status !== 'Level 2') return false;
        if (overviewFilter === 'level-3' && prog.status !== 'Level 3') return false;
        if (overviewFilter === 'level-4' && prog.status !== 'Level 4') return false;
        if (overviewFilter === 'candidate' && prog.status !== 'Candidate') return false;
        if (overviewFilter === 'new' && !isNewProgram(prog)) return false;
        if (overviewFilter === 'accredited' && !['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(prog.status)) return false;
        if (overviewFilter === 'undergraduate' && prog.degreeLevel !== 'Undergraduate') return false;
        if (overviewFilter === 'graduate' && prog.degreeLevel !== 'Graduate') return false;
        if (overviewFilter === 'due-this-year' && !isDueThisYear(prog)) return false;
      }

      // 3. Dropdown Status Filter
      if (selectedStatus !== 'all' && prog.status !== selectedStatus) return false;

      // 4. Dropdown Degree Filter
      if (selectedDegree !== 'all' && prog.degreeLevel !== selectedDegree) return false;

      // 5. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = prog.programName.toLowerCase().includes(q);
        const matchCampus = prog.campusName.toLowerCase().includes(q);
        const matchRemarks = (prog.remarks || '').toLowerCase().includes(q);
        const matchCert = (prog.certificationFile || '').toLowerCase().includes(q);
        const matchBoard = (prog.boardAction || '').toLowerCase().includes(q);
        if (!matchName && !matchCampus && !matchRemarks && !matchCert && !matchBoard) return false;
      }

      // 6. Validity Filter
      if (validityFilter !== 'all') {
        const expiry = getExpiryInfo(prog).state;
        if (validityFilter === 'expired' && expiry !== 'expired') return false;
        if (validityFilter === 'expiring' && expiry !== 'expiring') return false;
        if (validityFilter === 'active' && expiry !== 'active' && expiry !== 'expiring') return false;
      }

      // 7. Higher Level Filter
      if (higherLevelFilter === 'improved') return improvedProgramIds.has(prog.id);
      if (higherLevelFilter !== 'all') return levelAsOf(prog, TARGET_YEAR) === higherLevelFilter;

      return true;
    });
  }, [
    programAccreditations,
    selectedCampus,
    overviewFilter,
    selectedStatus,
    selectedDegree,
    search,
    validityFilter,
    higherLevelFilter,
    improvedProgramIds
  ]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from accreditation tracking?`)) {
      deleteProgramAccreditation(id);
      toast.success('Program removed from accreditation registry');
    }
  };

  // Summary view mode: AACCUP or COPC
  const [summaryMode, setSummaryMode] = useState<'aaccup' | 'copc'>('aaccup');

  // Campus-scoped dataset (Strict Campus Scope: All Campuses vs Specific Campus)
  const totalInstitutionalPrograms = programAccreditations.length;

  const campusScopedPrograms = useMemo(() => {
    if (selectedCampus === 'all') return programAccreditations;
    return programAccreditations.filter((p) => p.campusId === selectedCampus);
  }, [selectedCampus, programAccreditations]);

  const selectedCampusObj = useMemo(() => {
    return campuses.find((c) => c.id === selectedCampus) || null;
  }, [campuses, selectedCampus]);

  // Program count per campus for quick badges
  const campusProgramCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    campuses.forEach((c) => {
      counts[c.id] = programAccreditations.filter((p) => p.campusId === c.id).length;
    });
    return counts;
  }, [campuses, programAccreditations]);

  // 11 Required Dashboard Statistics (Strictly scoped to selectedCampus)
  // 1. Total Programs
  const totalProgramsScoped = campusScopedPrograms.length;

  // 2. New Programs
  const newProgramsCount = useMemo(
    () => campusScopedPrograms.filter((p) => isNewProgram(p)).length,
    [campusScopedPrograms]
  );

  // 3. Candidate Programs
  const candidateCount = useMemo(
    () => campusScopedPrograms.filter((p) => p.status === 'Candidate').length,
    [campusScopedPrograms]
  );

  // 4. Level 1 Programs
  const level1Count = useMemo(
    () => campusScopedPrograms.filter((p) => p.status === 'Level 1').length,
    [campusScopedPrograms]
  );

  // 5. Level 2 Programs
  const level2Count = useMemo(
    () => campusScopedPrograms.filter((p) => p.status === 'Level 2').length,
    [campusScopedPrograms]
  );

  // 6. Level 3 Programs
  const level3Count = useMemo(
    () => campusScopedPrograms.filter((p) => p.status === 'Level 3').length,
    [campusScopedPrograms]
  );

  // 7. Level 4 Programs
  const level4Count = useMemo(
    () => campusScopedPrograms.filter((p) => p.status === 'Level 4').length,
    [campusScopedPrograms]
  );

  // Total Accredited Programs (Levels 1–4)
  const accreditedCount = level1Count + level2Count + level3Count + level4Count;

  // Non-accreditable programs (e.g. recent or awaiting initial operating requirements)
  const notAccreditableCount = useMemo(
    () => campusScopedPrograms.filter((p) => !['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Candidate'].includes(p.status)).length,
    [campusScopedPrograms]
  );
  const candidateOrNotAccreditableCount = candidateCount + notAccreditableCount;

  // 8. Accreditation Rate (Strictly differentiated: Institutional vs Campus)
  const accreditationRate =
    totalProgramsScoped > 0
      ? ((accreditedCount / totalProgramsScoped) * 100).toFixed(2)
      : '0.00';

  // 9. Undergraduate Programs
  const undergradCount = useMemo(
    () => campusScopedPrograms.filter((p) => p.degreeLevel === 'Undergraduate').length,
    [campusScopedPrograms]
  );

  // 10. Graduate Programs
  const gradCount = useMemo(
    () => campusScopedPrograms.filter((p) => p.degreeLevel === 'Graduate').length,
    [campusScopedPrograms]
  );

  // 11. Programs for Accreditation This Year
  const dueThisYearCount = useMemo(
    () => campusScopedPrograms.filter((p) => isDueThisYear(p)).length,
    [campusScopedPrograms]
  );

  // Card filter click handlers
  const handleOverviewFilterClick = (filterKey: OverviewStatFilter) => {
    setOverviewFilter((prev) => (prev === filterKey ? 'none' : filterKey));
  };

  const handleTotalProgramsClick = () => {
    setOverviewFilter('none');
    setSelectedStatus('all');
    setSelectedDegree('all');
    setValidityFilter('all');
    setHigherLevelFilter('all');
  };

  // COPC metrics (Scoped)
  const copcCompliantCount = useMemo(
    () => campusScopedPrograms.filter((p) => p.copcStatus === 'Compliant').length,
    [campusScopedPrograms]
  );
  const copcPendingCount = useMemo(
    () => campusScopedPrograms.filter((p) => p.copcStatus === 'Pending' || p.copcStatus === 'Not Applicable').length,
    [campusScopedPrograms]
  );
  const copcRate = totalProgramsScoped > 0 ? ((copcCompliantCount / totalProgramsScoped) * 100).toFixed(2) : '0';

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            Accreditation & Frameworks / Program-Level Accreditation
          </span>
        }
        title="AACCUP Program Accreditation Status"
        description="Comprehensive program accreditation tracking across all 7 campuses, including survey levels, certificates, Drive evaluation portfolios, technical reviews, and accreditation visit schedules."
      />

      {/* Quick Action Overview Section */}
      <section className="mb-6 space-y-4" aria-label="Quick Action Overview">
        {/* Campus scope pills + header actions */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {/* All Campuses Button (Default) */}
            <button
              type="button"
              onClick={() => setSelectedCampus('all')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCampus === 'all'
                  ? 'bg-brand-700 text-white shadow-xs ring-2 ring-brand-700/20'
                  : 'bg-canvas text-ink-muted hover:text-ink hover:bg-slate-100 border border-line/70'
              }`}
            >
              <Building2Icon className="h-3.5 w-3.5" />
              <span>All Campuses</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  selectedCampus === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-ink-muted'
                }`}
              >
                {totalInstitutionalPrograms}
              </span>
            </button>

            {/* Individual Campus Buttons */}
            {campuses.map((c) => {
              const isSelected = selectedCampus === c.id;
              const count = campusProgramCounts[c.id] || 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCampus(c.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-700 text-white shadow-xs ring-2 ring-brand-700/20'
                      : 'bg-canvas text-ink-muted hover:text-ink hover:bg-slate-100 border border-line/70'
                  }`}
                >
                  <span>{c.shortName}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-ink-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReportModal({ open: true, type: 'summary' })}
              className="btn btn-secondary btn-sm"
            >
              <PrinterIcon className="h-4 w-4" /> Print Summary Report
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingProgram(null);
                setFormModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <PlusIcon className="h-4 w-4" /> Add Academic Program
            </button>
          </div>
        </div>

        {/* Active Filter Notification Banner */}
        {overviewFilter !== 'none' && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-brand-50 via-amber-50/40 to-white border border-brand-200/90 p-3 text-xs text-brand-950 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
              <span>
                Active Card Filter:{' '}
                <strong className="text-brand-900 underline font-bold">
                  {getOverviewFilterLabel(overviewFilter)}
                </strong>
                {' · '}
                Displaying <strong>{filtered.length}</strong> matching programs
                {selectedCampus !== 'all' ? ` in ${selectedCampusObj?.shortName}` : ' across all campuses'}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOverviewFilter('none')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-brand-300 px-3 py-1 text-xs font-bold text-brand-900 hover:bg-brand-100 hover:border-brand-400 transition-all shadow-2xs cursor-pointer"
            >
              <XIcon className="h-3.5 w-3.5" /> Clear Filter
            </button>
          </div>
        )}

        {/* 2. Key Executive Overview Cards (4 Balanced, Semantically Organized KPI Cards) */}
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Degree Programs & Academic Offerings */}
          <div
            onClick={handleTotalProgramsClick}
            className={`panel p-4 text-left transition-all cursor-pointer relative overflow-hidden group hover:shadow-soft flex flex-col justify-between ${
              overviewFilter === 'none' || overviewFilter === 'total'
                ? 'bg-slate-50/90 border-slate-300 ring-1 ring-slate-400/20'
                : 'hover:border-slate-300 shadow-2xs'
            }`}
            title="Click to view all programs for active campus scope"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                  Total Programs
                </span>
                <span className="rounded-full bg-slate-100 text-ink-subtle px-2 py-0.5 text-[9.5px] font-bold">
                  {selectedCampus === 'all' ? 'All Campuses' : selectedCampusObj?.shortName}
                </span>
              </div>
              <p className="mt-1.5 text-3xl font-black text-ink">{totalProgramsScoped}</p>
              <p className="text-[11px] text-ink-subtle mt-0.5 line-clamp-1">
                {selectedCampus === 'all'
                  ? 'University-wide degree offerings'
                  : `Active in ${selectedCampusObj?.name || 'campus'}`}
              </p>
            </div>

            {/* Program Breakdown Chips (Undergrad, Grad, New) */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-line/70">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOverviewFilterClick('undergraduate');
                }}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  overviewFilter === 'undergraduate'
                    ? 'bg-sky-100 text-sky-950 ring-1 ring-sky-400 font-bold shadow-2xs'
                    : 'bg-canvas text-ink-muted hover:text-ink hover:bg-slate-100 border border-line/60'
                }`}
                title="Filter Undergraduate programs"
              >
                <GraduationCapIcon className="h-3.5 w-3.5 text-sky-700" />
                <span>{undergradCount} Undergrad</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOverviewFilterClick('graduate');
                }}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  overviewFilter === 'graduate'
                    ? 'bg-violet-100 text-violet-950 ring-1 ring-violet-400 font-bold shadow-2xs'
                    : 'bg-canvas text-ink-muted hover:text-ink hover:bg-slate-100 border border-line/60'
                }`}
                title="Filter Graduate programs"
              >
                <BookOpenIcon className="h-3.5 w-3.5 text-violet-700" />
                <span>{gradCount} Grad</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOverviewFilterClick('new');
                }}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  overviewFilter === 'new'
                    ? 'bg-teal-100 text-teal-950 ring-1 ring-teal-400 font-bold shadow-2xs'
                    : 'bg-canvas text-ink-muted hover:text-ink hover:bg-slate-100 border border-line/60'
                }`}
                title="Filter New programs"
              >
                <SparklesIcon className="h-3 w-3 text-teal-600" />
                <span>{newProgramsCount} New</span>
              </button>
            </div>
          </div>

          {/* Card 2: Accreditation Rate & Certified Ratio */}
          <div
            onClick={() => handleOverviewFilterClick('accredited')}
            className={`panel p-4 text-left transition-all cursor-pointer relative overflow-hidden group hover:shadow-soft flex flex-col justify-between ${
              overviewFilter === 'accredited'
                ? 'bg-brand-50/90 border-brand-500 ring-2 ring-brand-400/40 shadow-sm'
                : 'bg-gradient-to-br from-brand-50/40 via-white to-white hover:border-brand-300 shadow-2xs'
            }`}
            title="Click to view all accredited programs (Levels 1–4)"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wider truncate">
                  {selectedCampus === 'all'
                    ? 'Institutional Rate'
                    : `${selectedCampusObj?.shortName || 'Campus'} Rate`}
                </span>
                <span className="rounded-full bg-brand-100 text-brand-800 border border-brand-200 px-2 py-0.5 text-[9.5px] font-bold">
                  {selectedCampus === 'all' ? 'Institutional' : 'Campus Scope'}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <p className="text-3xl font-black text-brand-700">{accreditationRate}%</p>
                <span className="text-xs font-semibold text-ink-muted">
                  ({accreditedCount} / {totalProgramsScoped})
                </span>
              </div>
              <p className="text-[11px] text-ink-subtle mt-0.5 line-clamp-1">
                {accreditedCount} of {totalProgramsScoped} degree offerings certified
              </p>
            </div>

            {/* Visual Progress Bar & Filter Pills */}
            <div className="mt-3.5 space-y-2 pt-2.5 border-t border-line/70">
              <div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-brand-600 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, parseFloat(accreditationRate)))}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOverviewFilterClick('accredited');
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                    overviewFilter === 'accredited'
                      ? 'bg-brand-700 text-white font-bold shadow-2xs'
                      : 'bg-brand-50 text-brand-900 hover:bg-brand-100 border border-brand-200'
                  }`}
                  title="Filter all accredited programs (Levels 1–4)"
                >
                  <ShieldCheckIcon className="h-3 w-3 text-brand-600" />
                  <span>{accreditedCount} Accredited</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOverviewFilterClick('candidate');
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                    overviewFilter === 'candidate'
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                  title="Filter Candidate programs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>{candidateCount} Candidate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: AACCUP Accreditation Levels (Levels 1–4 Clean Breakdown) */}
          <div
            className={`panel p-4 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
              ['level-1', 'level-2', 'level-3', 'level-4'].includes(overviewFilter)
                ? 'bg-slate-50/90 border-slate-300 ring-1 ring-slate-400/20'
                : 'hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                  Accreditation Levels
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[9.5px] font-black uppercase">
                  Levels 1–4
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <p className="text-3xl font-black text-emerald-800">{accreditedCount}</p>
                <span className="text-xs font-semibold text-ink-muted">
                  Programs Certified
                </span>
              </div>
              <p className="text-[11px] text-ink-subtle mt-0.5 line-clamp-1">
                Distribution across survey levels
              </p>
            </div>

            {/* 2x2 Grid of Clean Clickable Level Buttons */}
            <div className="mt-3.5 grid grid-cols-2 gap-1.5 pt-2.5 border-t border-line/70">
              <button
                type="button"
                onClick={() => handleOverviewFilterClick('level-1')}
                className={`flex items-center justify-between px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  overviewFilter === 'level-1'
                    ? 'bg-amber-100 text-amber-950 ring-2 ring-amber-500 font-bold shadow-2xs'
                    : 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80'
                }`}
                title="Filter Level 1 Accredited"
              >
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  Level 1
                </span>
                <span className="font-black text-xs">{level1Count}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOverviewFilterClick('level-2')}
                className={`flex items-center justify-between px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  overviewFilter === 'level-2'
                    ? 'bg-blue-100 text-blue-950 ring-2 ring-blue-500 font-bold shadow-2xs'
                    : 'bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 border border-blue-200/80'
                }`}
                title="Filter Level 2 Re-accredited"
              >
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  Level 2
                </span>
                <span className="font-black text-xs">{level2Count}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOverviewFilterClick('level-3')}
                className={`flex items-center justify-between px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  overviewFilter === 'level-3'
                    ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 font-bold shadow-2xs'
                    : 'bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/80'
                }`}
                title="Filter Level 3 Re-accredited"
              >
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Level 3
                </span>
                <span className="font-black text-xs">{level3Count}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOverviewFilterClick('level-4')}
                className={`flex items-center justify-between px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  overviewFilter === 'level-4'
                    ? 'bg-purple-100 text-purple-950 ring-2 ring-purple-500 font-bold shadow-2xs'
                    : 'bg-purple-50/70 hover:bg-purple-100/80 text-purple-900 border border-purple-200/80'
                }`}
                title="Filter Level 4 Accredited"
              >
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                  Level 4
                </span>
                <span className="font-black text-xs">{level4Count}</span>
              </button>
            </div>
          </div>

          {/* Card 4: For Accreditation This Year (Annual Action Roster) */}
          <div
            onClick={() => handleOverviewFilterClick('due-this-year')}
            className={`panel p-4 text-left transition-all cursor-pointer relative overflow-hidden group hover:shadow-soft flex flex-col justify-between ${
              overviewFilter === 'due-this-year'
                ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                : 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-amber-300/80 hover:border-amber-400 shadow-2xs'
            }`}
            title={`Click to filter programs due or scheduled for accreditation in ${CURRENT_YEAR}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  Due This Year
                </span>
                <span className="rounded-full bg-amber-200/90 text-amber-900 border border-amber-300 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide">
                  {CURRENT_YEAR} Action
                </span>
              </div>
              <p className="mt-1.5 text-3xl font-black text-amber-950">{dueThisYearCount}</p>
              <p className="text-[11px] text-amber-900/90 font-medium mt-0.5 line-clamp-1">
                {dueThisYearCount > 0
                  ? `Surveys & validities in ${CURRENT_YEAR}`
                  : `No surveys due in ${CURRENT_YEAR}`}
              </p>
            </div>

            {/* Prominent Action Banner for Due This Year */}
            <div className="mt-3.5 pt-2.5 border-t border-amber-200/80">
              <div
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                  overviewFilter === 'due-this-year'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 border border-amber-300/70'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{overviewFilter === 'due-this-year' ? `Active: Due in ${CURRENT_YEAR}` : `View ${CURRENT_YEAR} Action Roster`}</span>
                </span>
                <span className="font-extrabold text-sm ml-1 shrink-0">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="mb-5 panel p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search program by name, campus, certificate, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="input h-9 text-xs py-0 w-auto"
            >
              <option value="all">All Campuses (7)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={
                ['level-1', 'level-2', 'level-3', 'level-4', 'candidate'].includes(overviewFilter)
                  ? overviewFilter === 'level-1'
                    ? 'Level 1'
                    : overviewFilter === 'level-2'
                    ? 'Level 2'
                    : overviewFilter === 'level-3'
                    ? 'Level 3'
                    : overviewFilter === 'level-4'
                    ? 'Level 4'
                    : 'Candidate'
                  : selectedStatus
              }
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                if (['level-1', 'level-2', 'level-3', 'level-4', 'candidate', 'accredited'].includes(overviewFilter)) {
                  setOverviewFilter('none');
                }
              }}
              className="input h-9 text-xs py-0 w-auto"
            >
              <option value="all">All Levels</option>
              <option value="Candidate">Candidate</option>
              <option value="Level 1">Level 1</option>
              <option value="Level 2">Level 2</option>
              <option value="Level 3">Level 3</option>
              <option value="Level 4">Level 4</option>
              <option value="Not Accreditable">Not Accreditable</option>
            </select>
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="input h-9 text-xs py-0 w-auto"
            >
              <option value="all">All Degrees</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
            </select>

            <select
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value as 'all' | 'expiring' | 'active' | 'expired')}
              className="input h-9 text-xs py-0 w-auto"
            >
              <option value="all">All Validity</option>
              <option value="expiring">Expiring Soon (Within 1 Year)</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={higherLevelFilter}
              onChange={(e) => setHigherLevelFilter(e.target.value as HigherLevelFilter)}
              className="input h-9 text-xs py-0 w-auto"
              title={`Accreditation level achieved by end of ${TARGET_YEAR}, based on recorded level history`}
            >
              <option value="all">All Higher Levels</option>
              <option value="Level 1">Level I by {TARGET_YEAR}</option>
              <option value="Level 2">Level II by {TARGET_YEAR}</option>
              <option value="Level 3">Level III by {TARGET_YEAR}</option>
              <option value="Level 4">Level IV by {TARGET_YEAR}</option>
              <option value="improved">Moved Up Since {BASELINE_YEAR}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-ink-muted border-t border-line pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>
              Showing <strong className="text-ink">{filtered.length}</strong> of{' '}
              <strong className="text-ink">{totalProgramsScoped}</strong> programs
              {selectedCampus !== 'all' ? ` in ${selectedCampusObj?.shortName}` : ' across all campuses'}
            </span>
            {selectedCampus !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded bg-brand-50 text-brand-800 border border-brand-200 px-1.5 py-0.2 text-[10.5px] font-bold">
                Campus: {selectedCampusObj?.shortName}
              </span>
            )}
            {overviewFilter !== 'none' && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.2 text-[10.5px] font-bold">
                Filter: {getOverviewFilterLabel(overviewFilter)}
              </span>
            )}
          </div>
          {(overviewFilter !== 'none' || selectedCampus !== 'all' || selectedStatus !== 'all' || selectedDegree !== 'all' || search.trim() || validityFilter !== 'all' || higherLevelFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setOverviewFilter('none');
                setSelectedCampus('all');
                setSelectedStatus('all');
                setSelectedDegree('all');
                setSearch('');
                setValidityFilter('all');
                setHigherLevelFilter('all');
              }}
              className="text-xs text-brand-700 hover:text-brand-900 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcwIcon className="h-3 w-3" /> Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Primary Accreditation Status Table (matching PDF Structure) */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-canvas border-b border-line text-ink-muted">
              <tr>
                <th className="th py-3 min-w-[240px]">Programs Offered</th>
                <th className="th py-3">Campus</th>
                <th className="th py-3">Initial OP.</th>
                <th className="th py-3">Accreditation Status</th>
                <th className="th py-3 min-w-[150px]">
                  {overviewFilter === 'due-this-year' ? (
                    <span className="flex items-center gap-1 text-amber-900 font-bold">
                      <ClockIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      Validity & Due ({CURRENT_YEAR})
                    </span>
                  ) : (
                    'Validity Period'
                  )}
                </th>
                <th className="th py-3">AACCUP Certification</th>
                <th className="th py-3">AACCUP Technical Review</th>
                <th className="th py-3 min-w-[160px]">Board Action</th>
                <th className="th py-3 min-w-[170px]">Summary of Findings & Recommendation</th>
                <th className="th py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="td py-8 text-center text-ink-muted">
                    No programs matched the selected search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((prog) => {
                  const hasFindingsText = !!(prog.findingsSummary || prog.recommendations);
                  return (
                    <tr key={prog.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="td py-3">
                        <div className="font-semibold text-ink leading-snug">{prog.programName}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
                          <span className="rounded bg-canvas px-1.5 py-0.5 border border-line">
                            {prog.degreeLevel}
                          </span>
                          {prog.borRes && <span>BOR: {prog.borRes}</span>}
                          {prog.cmoNo && <span>CMO: {prog.cmoNo}</span>}
                          {prog.scheduleForAccreditation && (
                            <span className="font-semibold text-brand-700">Survey: {prog.scheduleForAccreditation}</span>
                          )}
                          {overviewFilter === 'due-this-year' && !prog.scheduleForAccreditation && (
                            <span className="font-semibold text-amber-800 bg-amber-50 px-1 rounded">Action Due: {CURRENT_YEAR}</span>
                          )}
                        </div>
                      </td>

                      <td className="td py-3 whitespace-nowrap text-ink-muted">
                        <span className="font-medium text-ink">{prog.campusName.replace(' Campus', '')}</span>
                      </td>

                      <td className="td py-3 whitespace-nowrap text-ink-muted">
                        {prog.yearOfInitialOperation || '—'}
                      </td>

                      <td className="td py-3 whitespace-nowrap">
                        <Badge
                          tone={
                            prog.status.includes('Level 4')
                              ? 'gold'
                              : prog.status.includes('Level 3')
                              ? 'success'
                              : prog.status.includes('Level 2')
                              ? 'brand'
                              : prog.status.includes('Level 1')
                              ? 'gold'
                              : prog.status === 'Not Accreditable'
                              ? 'danger'
                              : 'warning'
                          }
                          dot
                        >
                          {prog.status}
                        </Badge>
                      </td>

                      <td className="td py-3 whitespace-nowrap text-xs text-ink">
                        {prog.validityStart && prog.validityEnd ? (
                          <div>
                            <div className="font-medium">{prog.validityStart}</div>
                            <div className="text-ink-muted">to {prog.validityEnd}</div>
                          </div>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                        <ExpiryIndicator program={prog} />
                        {overviewFilter === 'due-this-year' && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold">
                              <ClockIcon className="h-3 w-3 shrink-0" /> Due in {CURRENT_YEAR}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="td py-3 text-xs">
                        {prog.certificationFile && isUrl(prog.certificationFile) ? (
                          <a
                            href={prog.certificationFile}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-success-50 px-2 py-0.5 font-medium text-success-700 text-[11.5px] border border-success-100 hover:border-success-300 whitespace-nowrap"
                            title="Open AACCUP certificate"
                          >
                            <FileCheckIcon className="h-3 w-3 shrink-0" />
                            View Certificate
                          </a>
                        ) : prog.certificationFile ? (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-success-50 px-2 py-0.5 font-medium text-success-700 text-[11.5px] border border-success-100"
                            title={prog.certificationFile}
                          >
                            <FileCheckIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[110px]">{prog.certificationFile}</span>
                          </span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>

                      <td className="td py-3 text-xs whitespace-nowrap">
                        {prog.technicalReviewLink ? (
                          <a
                            href={prog.technicalReviewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-2 py-0.5 font-medium text-brand-700 hover:border-brand-300"
                            title="Open AACCUP Technical Review"
                          >
                            <CheckCircle2Icon className="h-3.5 w-3.5" /> View
                          </a>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>

                      <td className="td py-3 text-xs text-ink max-w-[220px]">
                        <p className="line-clamp-2" title={prog.boardAction}>
                          {prog.boardAction || <span className="text-ink-subtle">—</span>}
                        </p>
                      </td>

                      <td className="td py-3 text-xs whitespace-nowrap">
                        {prog.findingsLink ? (
                          <a
                            href={prog.findingsLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-2 py-0.5 font-medium text-brand-700 hover:border-brand-300"
                            title="Open Summary of Findings & Recommendation"
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" /> View
                          </a>
                        ) : hasFindingsText ? (
                          <button
                            type="button"
                            onClick={() => setFindingsProgramId(prog.id)}
                            className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-2 py-0.5 font-medium text-brand-700 hover:border-brand-300"
                            title="View recorded Summary of Findings & Recommendation"
                          >
                            <FileCheckIcon className="h-3.5 w-3.5" /> View
                          </button>
                        ) : null}
                      </td>

                      <td className="td py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setFindingsProgramId(prog.id)}
                            className="btn btn-ghost btn-sm h-7 w-7 p-0"
                            title="Print Summary of Findings & Recommendation"
                          >
                            <PrinterIcon className="h-3.5 w-3.5 text-ink-muted" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailsModalProgram(prog)}
                            className="btn btn-secondary btn-sm h-7 px-2 text-xs"
                            title="View AACCUP survey areas and evidence portfolio"
                          >
                            Areas ({prog.requirements?.length || 10})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProgram(prog);
                              setFormModalOpen(true);
                            }}
                            className="btn btn-ghost btn-sm h-7 w-7 p-0"
                            title="Edit Program Details"
                          >
                            <PencilIcon className="h-3.5 w-3.5 text-ink-muted" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(prog.id, prog.programName)}
                              className="btn btn-ghost btn-sm h-7 w-7 p-0 text-danger-600 hover:bg-danger-50"
                              title="Delete program"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Detail / 10 Survey Areas Modal */}
      {detailsModalProgram && (
        <Modal
          open={!!detailsModalProgram}
          onClose={() => setDetailsModalProgram(null)}
          title={detailsModalProgram.programName}
          description={`${detailsModalProgram.campusName} · ${detailsModalProgram.status} · Initial Operation: ${detailsModalProgram.yearOfInitialOperation || 'N/A'}`}
          size="xl"
          footer={
            <div className="flex w-full items-center justify-between">
              <span className="text-xs text-ink-muted">
                Schedule: <strong>{detailsModalProgram.scheduleForAccreditation || 'No survey scheduled'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setDetailsModalProgram(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Portfolio
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Quick Header Summary */}
            <div className="grid gap-3 sm:grid-cols-3 rounded-lg border border-line bg-canvas p-3 text-xs">
              <div>
                <span className="text-ink-muted">Validity Range</span>
                <p className="font-semibold text-ink">
                  {detailsModalProgram.validityStart} to {detailsModalProgram.validityEnd || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-ink-muted">Accreditation Certificate</span>
                <p className="font-semibold text-ink truncate">
                  {detailsModalProgram.certificationFile && isUrl(detailsModalProgram.certificationFile) ? (
                    <a
                      href={detailsModalProgram.certificationFile}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 hover:underline"
                    >
                      View Certificate
                    </a>
                  ) : (
                    detailsModalProgram.certificationFile || 'No file registered'
                  )}
                </p>
              </div>
              <div>
                <span className="text-ink-muted">COPC Certificate</span>
                <p className="font-semibold text-ink">
                  {detailsModalProgram.copcCertificateNumber || detailsModalProgram.copcStatus}
                </p>
              </div>
              {detailsModalProgram.remarks && (
                <div className="sm:col-span-3">
                  <span className="text-ink-muted">Remarks</span>
                  <p className="text-ink">{detailsModalProgram.remarks}</p>
                </div>
              )}
            </div>

            {/* Accreditation Level History */}
            <div className="rounded-lg border border-line p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Accreditation Level History
              </h4>
              {getLevelHistory(detailsModalProgram).length === 0 ? (
                <p className="text-xs text-ink-muted">No accreditation results recorded yet.</p>
              ) : (
                <ol className="space-y-1.5 text-xs">
                  {getLevelHistory(detailsModalProgram)
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <li key={entry.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono font-semibold text-ink">{entry.year}</span>
                        <span className="font-semibold text-ink">{formatLevel(entry.level)}</span>
                        <Badge tone={entry.result === 'Passed' ? 'success' : entry.result === 'Failed' ? 'danger' : 'warning'}>
                          {entry.result}
                        </Badge>
                        {entry.boardAction && <span className="text-ink-muted">· {entry.boardAction}</span>}
                        {entry.remarks && <span className="text-ink-subtle">· {entry.remarks}</span>}
                      </li>
                    ))}
                </ol>
              )}
            </div>

            {/* 10 AACCUP Survey Areas Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                10 AACCUP Program Survey Areas Checklist
              </h4>

              <div className="panel divide-y divide-line overflow-hidden max-h-80 overflow-y-auto">
                {(detailsModalProgram.requirements || []).map((req) => {
                  const repo = areaRepositoryStats[req.id];
                  return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 text-xs hover:bg-canvas/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{req.areaName}</span>
                        {req.verified ? (
                          <Badge tone="success" dot>
                            Verified
                          </Badge>
                        ) : (
                          <Badge tone="warning" dot>
                            Pending Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {repo ? (
                          <span className="inline-flex items-center gap-1 font-medium text-brand-700">
                            <FolderOpenIcon className="h-3 w-3" />
                            {repo.files} file{repo.files === 1 ? '' : 's'}
                            {repo.folders > 0 && ` · ${repo.folders} folder${repo.folders === 1 ? '' : 's'}`}
                          </span>
                        ) : req.documentName ? (
                          <span className="font-medium text-brand-700">{req.documentName}</span>
                        ) : (
                          'No document uploaded yet'
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRepositoryReqId(req.id)}
                        className="btn btn-secondary btn-sm h-7 px-2"
                      >
                        <UploadIcon className="h-3.5 w-3.5" /> Upload / Verify
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Program Create/Edit Form Modal */}
      <ProgramFormModal
        open={formModalOpen}
        program={editingProgram}
        onClose={() => setFormModalOpen(false)}
      />

      <ProgramReportPrintModal
        open={reportModal.open}
        initialType={reportModal.type}
        defaultCampus={selectedCampus}
        defaultFromYear={reportModal.fromYear}
        defaultTargetYear={reportModal.targetYear}
        onClose={() => setReportModal((prev) => ({ ...prev, open: false }))}
      />

      <FindingsPrintModal
        open={!!findingsProgramId}
        programId={findingsProgramId}
        onClose={() => setFindingsProgramId(null)}
      />

      {/* Program Area Evidence Repository */}
      <ProgramAreaRepositoryModal
        open={!!repositoryRequirement}
        program={detailsModalProgram}
        requirement={repositoryRequirement}
        onClose={() => setRepositoryReqId(null)}
      />
    </>
  );
}
