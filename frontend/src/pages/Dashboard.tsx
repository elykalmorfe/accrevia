import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UploadIcon,
  ShieldCheckIcon,
  AwardIcon,
  GraduationCapIcon,
  Building2Icon,
  FileCheck2Icon,
  CheckCircle2Icon,
  FileTextIcon,
  HelpCircleIcon,
  PrinterIcon,
  CopyIcon,
  EyeIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  SearchIcon
} from 'lucide-react';
import { usePortal } from '../contexts/PortalContext';
import { useLookup } from '../hooks/useLookup';
import { StatusBadge } from '../components/ui/StatusBadge';
import { FrameworkTag } from '../components/ui/FrameworkTag';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatDate, formatNumber } from '../utils/format';
import { isAccreditedLevel, levelAsOf } from '../utils/programAccreditation';
import { PendingAccessRequestsModal } from '../components/sharing/PendingAccessRequestsModal';
import { AccreditationReportModal } from '../components/accreditation/AccreditationReportModal';

const campusOptions = [
  'All Campuses',
  'Main Campus (Tandag)',
  'Cantilan Campus',
  'Lianga Campus',
  'Tagbina Campus',
  'San Miguel Campus',
  'Bislig Campus',
  'Cagwait Campus'
];

const campusNameToId: Record<string, string> = {
  'Main Campus (Tandag)': 'tandag',
  'Cantilan Campus': 'cantilan',
  'Lianga Campus': 'lianga',
  'Tagbina Campus': 'tagbina',
  'San Miguel Campus': 'san-miguel',
  'Bislig Campus': 'bislig',
  'Cagwait Campus': 'cagwait'
};

export function Dashboard() {
  const navigate = useNavigate();
  const {
    documents,
    pending,
    accessRequests,
    programAccreditations,
    iaRecords,
    isoRecords,
    pqaRecords
  } = usePortal();
  const lookup = useLookup();

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [qaGuideModalOpen, setQaGuideModalOpen] = useState(false);
  const [activeLegendBar, setActiveLegendBar] = useState<'all' | 'inst' | 'prog'>('all');
  const [selectedCampus, setSelectedCampus] = useState('All Campuses');
  const [hoveredBarYear, setHoveredBarYear] = useState<string | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');

  const s = {
    total: documents.length,
    processing: documents.filter((d) => d.status === 'Processing').length,
    pending: pending.length,
    indexed: documents.filter((d) => d.status === 'Indexed').length
  };
  const awaitingProcessing = s.total - s.indexed + s.pending;

  const pendingAccessRequests = useMemo(
    () => accessRequests.filter((r) => r.status === 'Pending'),
    [accessRequests]
  );

  const activePrograms = useMemo(() => {
    if (selectedCampus === 'All Campuses') {
      return programAccreditations;
    }
    const targetId = campusNameToId[selectedCampus];
    return programAccreditations.filter((p) => {
      if (p.campusId === targetId) return true;
      if (targetId && p.campusName.toLowerCase().includes(targetId.replace('-', ' '))) return true;
      return false;
    });
  }, [programAccreditations, selectedCampus]);

  const compliantCopc = useMemo(() => {
    return activePrograms.filter((p) => p.copcStatus === 'Compliant').length;
  }, [activePrograms]);

  const copcRate = useMemo(() => {
    if (activePrograms.length === 0) return '0';
    return ((compliantCopc / activePrograms.length) * 100).toFixed(1);
  }, [compliantCopc, activePrograms.length]);

  const level1To4Count = useMemo(() => {
    return activePrograms.filter((p) => isAccreditedLevel(p.status)).length;
  }, [activePrograms]);

  const certifiedPercentage = useMemo(() => {
    if (activePrograms.length === 0) return '0';
    return ((level1To4Count / activePrograms.length) * 100).toFixed(1);
  }, [activePrograms.length, level1To4Count]);

  const campusFilterId = selectedCampus === 'All Campuses' ? null : campusNameToId[selectedCampus];
  const activeIa = useMemo(
    () => iaRecords.filter((r) => !campusFilterId || r.campusId === campusFilterId),
    [iaRecords, campusFilterId]
  );
  const highestIaLevel = useMemo(() => {
    const ranked = ['Level IV', 'Level III', 'Level II', 'Level I'];
    return ranked.find((lvl) => activeIa.some((r) => r.status === lvl || r.status.startsWith(`${lvl} `))) ?? 'No record';
  }, [activeIa]);

  const isoSummary = useMemo(() => {
    const latestByCampus = new Map<string, (typeof isoRecords)[number]>();
    isoRecords
      .filter((r) => !r.isHistorical && (!campusFilterId || r.campusId === campusFilterId))
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
  }, [isoRecords, campusFilterId]);

  const highestPqaLevel = useMemo(() => {
    const levels = pqaRecords
      .filter((r) => !campusFilterId || r.campusId === campusFilterId)
      .map((r) => Number(/^Level (\d)/.exec(r.recognitionLevel)?.[1] ?? 0));
    const top = Math.max(0, ...levels);
    return top > 0 ? `PQA Level ${['', 'I', 'II', 'III', 'IV'][top] ?? top}` : 'PQA Candidate';
  }, [pqaRecords, campusFilterId]);

  const recent = useMemo(() => {
    let list = [...documents].filter((d) => d.status !== 'Archived');
    if (frameworkFilter !== 'all') {
      list = list.filter((d) => d.frameworkId.toLowerCase() === frameworkFilter.toLowerCase());
    }
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.frameworkId.toLowerCase().includes(q) ||
          (lookup.area(d.areaId)?.shortName || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 6);
  }, [documents, frameworkFilter, docSearchQuery, lookup]);

  const barChartYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
    return Array.from({ length: 6 }, (_, i) => {
      const year = currentYear - 5 + i;
      const accreditedPrograms = activePrograms.filter((p) => isAccreditedLevel(levelAsOf(p, year))).length;
      const accreditedCampuses = activeIa.filter((r) => {
        const start = Number(r.validityStart?.slice(0, 4));
        const end = Number(r.validityEnd?.slice(0, 4));
        return start > 0 && start <= year && (!end || end >= year);
      }).length;
      return { year: String(year), inst: pct(accreditedCampuses, activeIa.length), prog: pct(accreditedPrograms, activePrograms.length) };
    });
  }, [activePrograms, activeIa]);
  const latestAttainment = barChartYears[barChartYears.length - 1];

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
          EXECUTIVE COMMAND HEADER & QUICK ACTIONS
          ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">
              Dashboard
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-50 border border-brand-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
              AY 2025–2026 Cycle
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Quality assurance, accreditation monitoring, and verified compliance status.
          </p>
        </div>

        {/* CONTROLS & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campus Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              aria-label="Filter by campus"
              className="input select select-sm h-9 w-auto min-w-[9rem] text-xs font-semibold hover:border-brand-300"
            >
              {campusOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* QA Standards Guide */}
          <button
            type="button"
            onClick={() => setQaGuideModalOpen(true)}
            className="btn btn-secondary btn-sm gap-1.5 text-xs"
            title="View QA standards, AACCUP levels, and COPC guide"
          >
            <HelpCircleIcon className="h-3.5 w-3.5 text-brand-600" />
            <span className="hidden sm:inline">QA Guide</span>
          </button>

          {/* Generate Report */}
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="btn btn-secondary btn-sm gap-1.5 text-xs"
            title="Generate QA & Accreditation Report"
          >
            <PrinterIcon className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Report</span>
          </button>

          {/* Upload Documents (Primary) */}
          <Link
            to="/evidence/upload"
            className="btn btn-primary btn-sm gap-1.5 text-xs font-semibold shadow-xs"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            <span>Upload</span>
          </Link>
        </div>
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

        {/* Card 3: Evidence Repository */}
        <Link
          to="/evidence"
          className="panel group p-5 border border-slate-200/90 hover:border-brand-300 hover:shadow-soft transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Evidence Files</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:scale-105 transition-transform">
              <ShieldCheckIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-ink tracking-tight">
              {formatNumber(s.indexed)}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${s.total === 0 || awaitingProcessing > 0 ? 'text-ink-muted' : 'text-brand-700'}`}>
                {s.total === 0 ? 'No uploads yet' : awaitingProcessing > 0 ? `${formatNumber(awaitingProcessing)} awaiting indexing` : 'All indexed'}
              </span>
              <span className="text-ink-subtle">{formatNumber(s.total)} total</span>
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

        {/* RIGHT (5 Cols): CORE QUALITY FRAMEWORKS LIST */}
        <div className="panel p-5 shadow-soft lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-ink">Framework Readiness</h2>
            </div>

            <div className="mt-3 space-y-2.5">
              {/* Pillar 1: AACCUP */}
              <Link
                to="/frameworks/pa"
                className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 border border-blue-100">
                    <GraduationCapIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink group-hover:text-brand-600 transition-colors">
                      AACCUP Programs
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {level1To4Count} Programs Level I to IV
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[10px] font-bold">
                    {certifiedPercentage}% Certified
                  </span>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
                </div>
              </Link>

              {/* Pillar 2: CHED COPC */}
              <Link
                to="/frameworks/copc"
                className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
                    <FileCheck2Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink group-hover:text-brand-600 transition-colors">
                      CHED COPC
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Statutory program compliance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[10px] font-bold">
                    {copcRate}%
                  </span>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
                </div>
              </Link>

              {/* Pillar 3: Institutional Accreditation */}
              <Link
                to="/frameworks/ia"
                className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
                    <Building2Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink group-hover:text-brand-600 transition-colors">
                      Institutional (IA)
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {activeIa.length} {activeIa.length === 1 ? 'Campus' : 'Campuses'} Monitored
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[10px] font-bold">
                    {highestIaLevel}
                  </span>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
                </div>
              </Link>

              {/* Pillar 4: ISO 9001 & PQA */}
              <Link
                to="/frameworks/iso"
                className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
                    <AwardIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink group-hover:text-brand-600 transition-colors">
                      ISO 9001 & PQA
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      QMS surveillance audits
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[10px] font-bold">
                    {isoSummary.conforming}/{isoSummary.campuses} Conforming
                  </span>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-ink-muted">Computed from current accreditation records</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 3: RECENT EVIDENCE & ACTION CENTER
          ───────────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* RECENT EVIDENCE TABLE (8 Cols) */}
        <div className="panel shadow-soft lg:col-span-8 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                  <span>Recent Documents</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                    {recent.length} of {formatNumber(s.indexed)}
                  </span>
                </h2>
              </div>

              {/* Search & Framework Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full xs:w-auto">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-subtle" />
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="h-8 w-full xs:w-44 rounded-lg border border-slate-200 bg-surface pl-8 pr-2 text-xs text-ink placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                  {[
                    { val: 'all', label: 'All' },
                    { val: 'ched', label: 'CHED' },
                    { val: 'aaccup', label: 'AACCUP' },
                    { val: 'iso', label: 'ISO' }
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFrameworkFilter(val)}
                      className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                        frameworkFilter === val
                          ? 'bg-surface text-ink shadow-2xs font-semibold'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ul className="divide-y divide-line-subtle md:hidden">
              {recent.length === 0 && (
                <li className="px-4 py-10 text-center text-xs text-ink-muted">
                  {documents.length === 0 ? 'No documents uploaded yet.' : 'No documents match your filters.'}
                </li>
              )}
              {recent.map((d) => (
                <li key={d.id}>
                  <Link to={`/documents/${d.id}`} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-canvas">
                    <span className="mt-0.5 shrink-0">{getFileIcon(d.title)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{d.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                        <FrameworkTag frameworkId={d.frameworkId} />
                        <span>{lookup.area(d.areaId)?.shortName || 'General'}</span>
                        <span>· {formatDate(d.dateAdded)}</span>
                      </span>
                    </span>
                    <span className="shrink-0">
                      <StatusBadge status={d.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-line-subtle text-ink-muted">
                  <tr>
                    <th className="th py-2.5">Document Title</th>
                    <th className="th py-2.5">Framework</th>
                    <th className="th py-2.5">Area</th>
                    <th className="th py-2.5">Date</th>
                    <th className="th py-2.5">Status</th>
                    <th className="th py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.length === 0 && (
                    <tr>
                      <td colSpan={6} className="td py-10 text-center text-xs text-ink-muted">
                        {documents.length === 0 ? 'No documents uploaded yet.' : 'No documents match your filters.'}
                      </td>
                    </tr>
                  )}
                  {recent.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/documents/${d.id}`)}
                      className="tr-hover cursor-pointer group"
                    >
                      <td className="td py-2.5 max-w-[220px]">
                        <div className="flex items-center gap-2">
                          {getFileIcon(d.title)}
                          <span className="font-medium text-ink group-hover:text-brand-600 truncate transition-colors">
                            {d.title}
                          </span>
                        </div>
                      </td>
                      <td className="td py-2.5" onClick={(e) => e.stopPropagation()}>
                        <FrameworkTag frameworkId={d.frameworkId} />
                      </td>
                      <td className="td py-2.5 text-ink-muted whitespace-nowrap">
                        {lookup.area(d.areaId)?.shortName || 'General'}
                      </td>
                      <td className="td py-2.5 text-ink-muted whitespace-nowrap">
                        {formatDate(d.dateAdded)}
                      </td>
                      <td className="td py-2.5">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="td py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/documents/${d.id}`}
                            className="btn btn-ghost btn-sm text-[11px] font-semibold text-brand-600 hover:bg-brand-50"
                          >
                            <EyeIcon className="h-3 w-3" />
                            <span>View</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/documents/${d.id}`);
                              toast.success('Link copied');
                            }}
                            className="btn btn-ghost btn-sm text-[11px] p-1 text-ink-muted hover:text-ink"
                            title="Copy link"
                          >
                            <CopyIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs">
            <span className="text-ink-muted">
              Showing {recent.length} recent files
            </span>
            <Link to="/evidence" className="font-semibold text-brand-600 hover:underline flex items-center gap-1">
              <span>View full registry</span>
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* RIGHT (4 Cols): ACTION CENTER & ACCESS REQUESTS */}
        <div className="space-y-4 lg:col-span-4 flex flex-col">
          {/* ACCESS REQUESTS */}
          <div className="panel p-4 shadow-soft border-l-4 border-l-brand-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  <h3 className="text-xs font-bold text-ink">Access Requests</h3>
                </div>
                <Badge tone={pendingAccessRequests.length > 0 ? 'warning' : 'success'}>
                  {pendingAccessRequests.length} Pending
                </Badge>
              </div>

              {pendingAccessRequests.length > 0 ? (
                <ul className="mt-2.5 divide-y divide-slate-100">
                  {pendingAccessRequests.slice(0, 2).map((req) => (
                    <li
                      key={req.id}
                      onClick={() => setAccessModalOpen(true)}
                      className="py-2 hover:bg-brand-50/50 rounded-lg px-1.5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-ink truncate">{req.requesterName}</span>
                        <span className="text-brand-600 font-semibold">{req.requestedPermission}</span>
                      </div>
                      <p className="text-xs text-brand-700 truncate mt-0.5">
                        {req.documentTitle}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center text-xs text-ink-muted">
                  <CheckCircle2Icon className="h-5 w-5 mx-auto text-brand-600 mb-1" />
                  <p className="font-semibold text-ink">All Clear</p>
                  <p className="text-[11px] text-ink-subtle">No pending authorization requests.</p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAccessModalOpen(true)}
                className="btn btn-secondary btn-sm w-full text-xs font-semibold"
              >
                {pendingAccessRequests.length > 0
                  ? `Review ${pendingAccessRequests.length} Requests`
                  : 'View Requests Log'}
              </button>
            </div>
          </div>

          {/* QUICK SHORTCUTS CARD */}
          <div className="panel p-4 shadow-soft flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-ink pb-2.5 border-b border-slate-100">
                Quick Shortcuts
              </h3>
              <div className="mt-3 space-y-2">
                <Link
                  to="/evidence/upload"
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-brand-50 text-ink hover:text-brand-700 text-xs font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UploadIcon className="h-3.5 w-3.5 text-brand-600" />
                    <span>Upload New Evidence</span>
                  </span>
                  <ChevronRightIcon className="h-3 w-3 text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="btn btn-primary btn-sm w-full gap-1.5 text-xs font-semibold"
              >
                <PrinterIcon className="h-3.5 w-3.5" />
                <span>Export Master Report</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODALS */}
      <PendingAccessRequestsModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
      />

      <AccreditationReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

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