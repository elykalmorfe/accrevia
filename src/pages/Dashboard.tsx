import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadIcon,
  ShieldCheckIcon,
  AwardIcon,
  GraduationCapIcon,
  Building2Icon,
  FileCheck2Icon,
  ArrowUpRightIcon,
  SparklesIcon,
  CheckCircle2Icon
} from 'lucide-react';
import { usePortal } from '../contexts/PortalContext';
import { useLookup } from '../hooks/useLookup';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { FrameworkTag } from '../components/ui/FrameworkTag';
import { Badge } from '../components/ui/Badge';
import { PermissionIndicator } from '../components/sharing/PermissionIndicator';
import { repositoryStats } from '../data/analytics';
import { formatDate, formatNumber } from '../utils/format';
import { PendingAccessRequestsModal } from '../components/sharing/PendingAccessRequestsModal';
import { campusHistoricalRatios, getCampusLineCoordinates } from '../utils/campus';
import { CampusId } from '../types/accreditation';

export function Dashboard() {
  const {
    documents,
    pending,
    shares,
    accessRequests,
    programAccreditations,
    campuses,
    iaRecords,
    pqaRecords,
    isoRecords,
    selectedCampus,
    setSelectedCampus,
    selectedCampusObj,
    isCampusMatch
  } = usePortal();
  const lookup = useLookup();

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [activeLegendBar, setActiveLegendBar] = useState<'all' | 'inst' | 'prog'>('all');
  const [ratioChartMode, setRatioChartMode] = useState<'campuses' | 'years'>('campuses');
  const [hoveredCampus, setHoveredCampus] = useState<CampusId | null>(null);

  // Filtered collections based on the selected campus
  const filteredPrograms = useMemo(() => {
    if (selectedCampus === 'all') return programAccreditations;
    return programAccreditations.filter((p) => p.campusId === selectedCampus);
  }, [programAccreditations, selectedCampus]);

  const filteredDocs = useMemo(() => {
    if (selectedCampus === 'all') return documents;
    return documents.filter((d) => isCampusMatch(d.campus, selectedCampus));
  }, [documents, selectedCampus, isCampusMatch]);

  const campusIso = useMemo(() => {
    if (selectedCampus === 'all') return isoRecords;
    return isoRecords.filter((r) => r.campusId === selectedCampus);
  }, [isoRecords, selectedCampus]);

  const currentPqa = useMemo(() => {
    if (selectedCampus === 'all') return pqaRecords[0];
    return pqaRecords.find((r) => r.campusId === selectedCampus) || pqaRecords[0];
  }, [pqaRecords, selectedCampus]);

  const currentIA = useMemo(() => {
    if (selectedCampus === 'all') return iaRecords[0];
    return iaRecords.find((r) => r.campusId === selectedCampus) || iaRecords[0];
  }, [iaRecords, selectedCampus]);

  // Statistics calculation for the active campus
  const totalPrograms = filteredPrograms.length;
  const compliantCopc = filteredPrograms.filter((p) => p.copcStatus === 'Compliant').length;
  const copcRate = totalPrograms > 0
    ? ((compliantCopc / totalPrograms) * 100).toFixed(1)
    : '100.0';

  const accreditedProgramsCount = filteredPrograms.filter((p) =>
    ['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(p.status)
  ).length;
  const accreditedRate = totalPrograms > 0
    ? ((accreditedProgramsCount / totalPrograms) * 100).toFixed(1)
    : '100.0';

  // All Applicable Accreditation Levels Counts
  const level4Count = filteredPrograms.filter((p) => p.status === 'Level 4').length;
  const level3Count = filteredPrograms.filter((p) => p.status === 'Level 3').length;
  const level2Count = filteredPrograms.filter((p) => p.status === 'Level 2').length;
  const level1Count = filteredPrograms.filter((p) => p.status === 'Level 1').length;
  const candidateCount = filteredPrograms.filter((p) => p.status === 'Candidate').length;
  const candidateGradCount = filteredPrograms.filter((p) => p.status === 'Candidate for Graduation').length;

  const level34Count = level3Count + level4Count;
  const level34Pct = totalPrograms > 0
    ? ((level34Count / totalPrograms) * 100).toFixed(1)
    : '0';

  // Per-Campus Institutional Accreditation Statistics
  const campusStatsList = useMemo(() => {
    return campuses.map((c) => {
      const rec = iaRecords.find((r) => r.campusId === c.id);
      const approvedCount = (rec?.requirements || []).filter((r) => r.status === 'Approved').length;
      const totalReqs = rec?.requirements?.length || 9;
      const iaCompliance = Math.round((approvedCount / totalReqs) * 100);

      const progs = programAccreditations.filter((p) => p.campusId === c.id);
      const accProgs = progs.filter((p) => ['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(p.status)).length;
      const progRate = progs.length > 0 ? Math.round((accProgs / progs.length) * 100) : 100;

      let succeedingLevel = 'Level IV Institutional';
      if (rec?.status === 'Level III Re-accredited') succeedingLevel = 'Level IV Institutional Accreditation';
      else if (rec?.status === 'Level II Re-accredited') succeedingLevel = 'Level III Re-accredited';
      else if (rec?.status === 'Level I Accredited') succeedingLevel = 'Level II Re-accredited';
      else succeedingLevel = 'Level I Accredited';

      return {
        campus: c,
        rec,
        approvedCount,
        totalReqs,
        iaCompliance,
        totalProgs: progs.length,
        accProgs,
        progRate,
        succeedingLevel
      };
    });
  }, [campuses, iaRecords, programAccreditations]);

  // Percentage of Campuses with Higher vs Succeeding Accreditation Levels
  const higherLevelCount = campusStatsList.filter(
    (c) => c.rec?.status === 'Level III Re-accredited' || c.rec?.status === 'Level IV Institutional Accreditation'
  ).length;
  const level2CountCampuses = campusStatsList.filter((c) => c.rec?.status === 'Level II Re-accredited').length;
  const level1CountCampuses = campusStatsList.filter((c) => c.rec?.status === 'Level I Accredited').length;
  const candidateCountCampuses = campusStatsList.filter((c) => c.rec?.status === 'Candidate').length;

  const higherLevelPct = ((higherLevelCount / campuses.length) * 100).toFixed(1);
  const level2Pct = ((level2CountCampuses / campuses.length) * 100).toFixed(1);
  const level1Pct = ((level1CountCampuses / campuses.length) * 100).toFixed(1);
  const candidatePct = ((candidateCountCampuses / campuses.length) * 100).toFixed(1);

  const openCars = campusIso.flatMap((r) =>
    (r.correctiveActions || []).filter((c) => c.status !== 'Closed / Verified')
  ).length;

  const openMajorCars = campusIso.reduce((acc, r) => acc + (r.findingsCount?.majorNC || 0), 0);
  const openMinorCars = campusIso.reduce((acc, r) => acc + (r.findingsCount?.minorNC || 0), 0);

  const totalIndexedDocs = filteredDocs.filter((d) => d.status === 'Indexed').length;
  const totalCampusDocsCount = filteredDocs.length;

  const s = {
    total: selectedCampus === 'all' ? repositoryStats.total : totalCampusDocsCount,
    processing: selectedCampus === 'all' ? repositoryStats.processing : filteredDocs.filter((d) => d.status === 'Processing').length,
    pending: selectedCampus === 'all' ? pending.length : pending.filter((p) => isCampusMatch(p.fileName, selectedCampus)).length,
    indexed: selectedCampus === 'all' ? repositoryStats.total - repositoryStats.processing - pending.length : totalIndexedDocs
  };

  const pendingAccessRequests = useMemo(
    () => accessRequests.filter((r) => r.status === 'Pending'),
    [accessRequests]
  );

  const recent = useMemo(
    () => [...filteredDocs].filter((d) => d.status !== 'Archived').sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 6),
    [filteredDocs]
  );

  const recentShares = useMemo(
    () => shares
      .filter((s) => filteredDocs.some((d) => d.id === s.documentId))
      .sort((a, b) => b.sharedAt.localeCompare(a.sharedAt))
      .slice(0, 4),
    [shares, filteredDocs]
  );

  // Dual Series Bar Chart Data (Dynamic per campus)
  const barChartYears = campusHistoricalRatios[selectedCampus] || campusHistoricalRatios.all;

  // Dual Series Line Chart Coordinates (Dynamic per campus)
  const { target: linePointsTarget, actual: linePointsActual } = useMemo(
    () => getCampusLineCoordinates(selectedCampus),
    [selectedCampus]
  );

  const svgTargetPath = `M ${linePointsTarget.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const svgActualPath = `M ${linePointsActual.map((p) => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Dashboard"
        eyebrow="NEMSU Accreditation Management System"
        description="Comprehensive quality assurance, multi-campus accreditation monitoring, and verified institutional compliance metrics."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {pendingAccessRequests.length > 0 && (
              <button
                type="button"
                onClick={() => setAccessModalOpen(true)}
                className="btn btn-secondary relative gap-2 border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100/90 shadow-xs"
              >
                <ShieldCheckIcon className="h-4 w-4 text-amber-700" />
                <span>Access Requests</span>
                <span className="rounded-full bg-amber-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {pendingAccessRequests.length}
                </span>
              </button>
            )}
            <Link to="/evidence/pending" className="btn btn-secondary">
              Review Pending ({s.pending})
            </Link>
            <Link to="/evidence/upload" className="btn btn-primary">
              <UploadIcon className="h-4 w-4" /> Upload Documents
            </Link>
          </div>
        }
      />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 1: TOP 3 KPI CARDS (Matches reference Fund 1, Fund 2, Fund 3)
          ───────────────────────────────────────────────────────────────── */}
      <section aria-label="Key Performance Indicators" className="grid gap-5 md:grid-cols-3">
        {/* CARD 1: FEATURED SOLID BLUE HIGHLIGHT CARD (Reference: "Fund 1") */}
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 p-6 text-white shadow-brand transition-all hover:shadow-lg hover:shadow-brand-500/30">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white/90">
                {selectedCampus === 'all' ? 'Institutional Quality' : `${selectedCampusObj?.shortName || ''} Quality`}
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                {selectedCampus === 'all' ? 'Primary Core' : currentIA?.status || 'Active Campus'}
              </span>
            </div>
            <Link to="/frameworks/ia" className="rounded-full bg-white/15 p-1 text-white hover:bg-white/30 transition-colors">
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6">
            {/* Metric 1: Circular Translucent Badge */}
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur-md shadow-sm">
                <ShieldCheckIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-white/75 uppercase">COPC Rate</p>
                <p className="text-xl font-extrabold tracking-tight text-white">{copcRate}%</p>
              </div>
            </div>

            {/* Metric 2: Circular Translucent Badge */}
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur-md shadow-sm">
                <FileCheck2Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-white/75 uppercase">Indexed</p>
                <p className="text-xl font-extrabold tracking-tight text-white">{formatNumber(s.indexed)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
            <span>
              {selectedCampus === 'all'
                ? '7 Campuses Monitored'
                : `${selectedCampusObj?.name || 'Campus'} Active Monitoring`}
            </span>
            <Link to="/frameworks/ia" className="font-semibold text-white hover:underline flex items-center gap-1">
              {selectedCampus === 'all' ? 'Open Hub →' : 'Campus IA Portfolio →'}
            </Link>
          </div>
        </div>

        {/* CARD 2: PROGRAM ACCREDITATION (ALL APPLICABLE ACCREDITATION LEVELS) */}
        <div className="panel p-6 flex flex-col justify-between hover:border-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Program Accreditation</h3>
              <p className="text-[11px] text-ink-muted">All Applicable Accreditation Levels</p>
            </div>
            <Link to="/frameworks/pa" className="rounded-full bg-slate-50 p-1 text-ink-subtle hover:text-brand-600 transition-colors" title="View Program Accreditation">
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-ink-muted font-medium">Accreditation Coverage</span>
              <span className="text-xs font-bold text-emerald-700">
                {accreditedProgramsCount} of {totalPrograms} ({accreditedRate}%)
              </span>
            </div>

            {/* Grid of all applicable accreditation levels */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="rounded border border-indigo-100 bg-indigo-50/50 p-1.5">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Level IV</span>
                <p className="text-sm font-extrabold text-indigo-900">{level4Count}</p>
              </div>
              <div className="rounded border border-blue-100 bg-blue-50/50 p-1.5">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Level III</span>
                <p className="text-sm font-extrabold text-blue-900">{level3Count}</p>
              </div>
              <div className="rounded border border-cyan-100 bg-cyan-50/50 p-1.5">
                <span className="text-[10px] font-bold text-cyan-700 uppercase">Level II</span>
                <p className="text-sm font-extrabold text-cyan-900">{level2Count}</p>
              </div>
              <div className="rounded border border-emerald-100 bg-emerald-50/50 p-1.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Level I</span>
                <p className="text-sm font-extrabold text-emerald-900">{level1Count}</p>
              </div>
              <div className="rounded border border-amber-100 bg-amber-50/50 p-1.5">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Candidate</span>
                <p className="text-sm font-extrabold text-amber-900">{candidateCount}</p>
              </div>
              <div className="rounded border border-purple-100 bg-purple-50/50 p-1.5" title="Candidate for Graduation">
                <span className="text-[10px] font-bold text-purple-700 uppercase truncate block">Cand. Grad</span>
                <p className="text-sm font-extrabold text-purple-900">{candidateGradCount}</p>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-ink-muted">High Levels (III & IV)</span>
            <span className="font-bold text-brand-700">
              {level34Count} Programs ({level34Pct}%)
            </span>
          </div>
        </div>

        {/* CARD 3: WHITE FLOATING CARD (Reference: "Fund 3") */}
        <div className="panel p-6 flex flex-col justify-between hover:border-slate-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">ISO 9001 & PQA Standard</h3>
            <Link to="/frameworks/iso" className="rounded-full bg-slate-50 p-1 text-ink-subtle hover:text-brand-600 transition-colors">
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="my-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-subtle uppercase">ISO QMS</p>
                <p className="text-xl font-extrabold text-ink">100%</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Building2Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-subtle uppercase">Open CARs</p>
                <p className="text-xl font-extrabold text-emerald-700">
                  {openMajorCars === 0 ? '0 Major' : `${openMajorCars} Major`}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-ink-muted">PQA Scorecard</span>
            <span className="font-bold text-brand-600">
              {currentPqa.recognitionLevel.split(':')[0]} ({currentPqa.overallScore} pts)
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2: ACCREDITATION RATIO & INTERACTIVE MULTI-CAMPUS CHARTS
          ───────────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* LEFT CHART: ACCREDITATION RATIO - INTERACTIVE HOVER BAR CHART & LEVEL PROPORTIONS */}
        <div className="panel p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink">Accreditation Ratio</h3>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  Multi-Campus Stats
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                {ratioChartMode === 'campuses'
                  ? 'Interactive Campus Comparison (Hover over any bar to view data)'
                  : 'Institutional vs Academic Programs Coverage (Historical)'}
              </p>
            </div>

            {/* Toggle Modes and Legends */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-line bg-canvas p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRatioChartMode('campuses')}
                  className={`rounded-md px-2 py-1 text-[11px] transition-all ${
                    ratioChartMode === 'campuses' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted'
                  }`}
                >
                  By Campus
                </button>
                <button
                  type="button"
                  onClick={() => setRatioChartMode('years')}
                  className={`rounded-md px-2 py-1 text-[11px] transition-all ${
                    ratioChartMode === 'years' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted'
                  }`}
                >
                  By Year
                </button>
              </div>

              {/* Series Legend */}
              <div className="flex items-center gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveLegendBar(activeLegendBar === 'inst' ? 'all' : 'inst')}
                  className="flex items-center gap-1.5 text-ink hover:text-brand-600"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                  <span className="text-[11px]">Institutional</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLegendBar(activeLegendBar === 'prog' ? 'all' : 'prog')}
                  className="flex items-center gap-1.5 text-ink hover:text-brand-600"
                >
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-400 bg-white" />
                  <span className="text-[11px]">Programs</span>
                </button>
              </div>
            </div>
          </div>

          {/* HIGHER VS SUCCEEDING ACCREDITATION LEVELS PERCENTAGES */}
          <div className="my-4 rounded-lg border border-line bg-canvas/60 p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-ink">Campus Institutional Accreditation Levels Ratio</span>
              <span className="text-ink-subtle text-[11px]">7 Campuses Total</span>
            </div>

            {/* Multi-segmented distribution progress bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-line text-[10px]">
              <div
                style={{ width: `${higherLevelPct}%` }}
                className="bg-indigo-600 transition-all duration-300"
                title={`Higher Levels (Level III/IV): ${higherLevelPct}% (${higherLevelCount} campus)`}
              />
              <div
                style={{ width: `${level2Pct}%` }}
                className="bg-brand-500 transition-all duration-300"
                title={`Succeeding Level II: ${level2Pct}% (${level2CountCampuses} campuses)`}
              />
              <div
                style={{ width: `${level1Pct}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Level I Baseline: ${level1Pct}% (${level1CountCampuses} campuses)`}
              />
              <div
                style={{ width: `${candidatePct}%` }}
                className="bg-amber-400 transition-all duration-300"
                title={`Candidate Advancing: ${candidatePct}% (${candidateCountCampuses} campus)`}
              />
            </div>

            {/* Breakdown Badges */}
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                  <span>Higher Levels (III/IV)</span>
                </span>
                <span className="font-extrabold text-indigo-900 text-xs mt-0.5">
                  {higherLevelPct}% <span className="font-normal text-ink-subtle">({higherLevelCount}/7)</span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                  <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                  <span>Succeeding L-II</span>
                </span>
                <span className="font-extrabold text-brand-900 text-xs mt-0.5">
                  {level2Pct}% <span className="font-normal text-ink-subtle">({level2CountCampuses}/7)</span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Succeeding L-I</span>
                </span>
                <span className="font-extrabold text-emerald-900 text-xs mt-0.5">
                  {level1Pct}% <span className="font-normal text-ink-subtle">({level1CountCampuses}/7)</span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                  <span>Candidate Advancing</span>
                </span>
                <span className="font-extrabold text-amber-900 text-xs mt-0.5">
                  {candidatePct}% <span className="font-normal text-ink-subtle">({candidateCountCampuses}/7)</span>
                </span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE BAR CHART CANVAS WITH HOVER TOOLTIP */}
          <div className="relative mt-2 h-60 w-full">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] font-semibold text-ink-subtle">
              {['100%', '80%', '50%', '20%', '0%'].map((val) => (
                <div key={val} className="flex items-center w-full">
                  <span className="w-8 shrink-0">{val}</span>
                  <div className="h-[1px] w-full border-b border-dashed border-slate-200" />
                </div>
              ))}
            </div>

            {/* BARS: BY CAMPUS (Default & Primary Mode) */}
            {ratioChartMode === 'campuses' ? (
              <div className="absolute bottom-6 left-10 right-2 top-2 flex items-end justify-between px-1">
                {campusStatsList.map((item) => {
                  const isHovered = hoveredCampus === item.campus.id;
                  const isFiltered = selectedCampus === item.campus.id;

                  return (
                    <div
                      key={item.campus.id}
                      onMouseEnter={() => setHoveredCampus(item.campus.id)}
                      onMouseLeave={() => setHoveredCampus(null)}
                      onClick={() => setSelectedCampus(selectedCampus === item.campus.id ? 'all' : item.campus.id)}
                      className="group relative flex flex-col items-center cursor-pointer"
                    >
                      {/* HOVER TOOLTIP DISPLAYED ON HOVER */}
                      {isHovered && (
                        <div className="absolute -top-32 z-30 w-56 -translate-x-1/2 left-1/2 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-white shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1.5">
                            <span className="font-bold text-xs truncate">{item.campus.name}</span>
                            {item.campus.isMain && <span className="text-amber-400 text-xs">★</span>}
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Institutional Level:</span>
                              <span className="font-semibold text-brand-300">{item.rec?.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">IA Compliance:</span>
                              <span className="font-bold text-emerald-400">
                                {item.iaCompliance}% ({item.approvedCount}/{item.totalReqs} Areas)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Programs Accredited:</span>
                              <span className="font-bold text-sky-400">
                                {item.progRate}% ({item.accProgs}/{item.totalProgs})
                              </span>
                            </div>
                            <div className="border-t border-slate-700 pt-1 text-[10px] text-amber-300">
                              Target: {item.succeedingLevel}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-end gap-1 h-44">
                        {/* Series 1: Solid Brand Bar (Institutional Compliance %) */}
                        {(activeLegendBar === 'all' || activeLegendBar === 'inst') && (
                          <div
                            style={{ height: `${item.iaCompliance}%` }}
                            className={`w-3 sm:w-4 rounded-t-sm bg-brand-600 transition-all duration-200 origin-bottom shadow-sm ${
                              isHovered ? 'scale-y-[1.04] brightness-125' : ''
                            } ${isFiltered ? 'ring-2 ring-brand-400' : ''}`}
                            title={`${item.campus.shortName} IA: ${item.iaCompliance}%`}
                          />
                        )}

                        {/* Series 2: Diagonal Striped Bar (Programs Accredited %) */}
                        {(activeLegendBar === 'all' || activeLegendBar === 'prog') && (
                          <div
                            style={{ height: `${item.progRate}%` }}
                            className={`w-3 sm:w-4 rounded-t-sm pattern-diagonal-stripes border border-brand-400/80 bg-brand-50 transition-all duration-200 origin-bottom ${
                              isHovered ? 'scale-y-[1.04] brightness-110' : ''
                            }`}
                            title={`${item.campus.shortName} Programs: ${item.progRate}%`}
                          />
                        )}
                      </div>

                      <span
                        className={`mt-2 text-[11px] font-semibold transition-colors ${
                          isHovered || isFiltered ? 'text-brand-700 font-bold' : 'text-ink-muted'
                        }`}
                      >
                        {item.campus.shortName}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* BARS: BY YEAR HISTORICAL TREND */
              <div className="absolute bottom-6 left-10 right-2 top-2 flex items-end justify-between px-2">
                {barChartYears.map((d) => (
                  <div key={d.year} className="group relative flex flex-col items-center">
                    <div className="flex items-end gap-1.5 h-44">
                      {(activeLegendBar === 'all' || activeLegendBar === 'inst') && (
                        <div
                          style={{ height: `${d.inst}%` }}
                          className="w-3.5 sm:w-4 rounded-t-sm bg-brand-600 transition-all duration-300 hover:brightness-110 group-hover:scale-y-[1.02] origin-bottom shadow-sm"
                          title={`Institutional: ${d.inst}%`}
                        />
                      )}
                      {(activeLegendBar === 'all' || activeLegendBar === 'prog') && (
                        <div
                          style={{ height: `${d.prog}%` }}
                          className="w-3.5 sm:w-4 rounded-t-sm pattern-diagonal-stripes border border-brand-400/80 bg-brand-50 transition-all duration-300 hover:brightness-105 group-hover:scale-y-[1.02] origin-bottom"
                          title={`Programs: ${d.prog}%`}
                        />
                      )}
                    </div>
                    <span className="mt-2 text-xs font-semibold text-ink-muted group-hover:text-brand-600 transition-colors">
                      {d.year}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-xs text-ink-subtle">
            <span>Hover over any campus bar to view statistics · Click to filter</span>
            <Link to="/frameworks/ia" className="font-semibold text-brand-600 hover:underline">
              Institutional Accreditation View →
            </Link>
          </div>
        </div>

        {/* RIGHT CHART: "Combined Ratio" - CRISP DUAL-LINE SVG GRAPH */}
        <div className="panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Combined Compliance Ratio</h3>
              <p className="text-xs text-ink-muted">Standard Target vs Actual Attainment Index</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-ink">
                <span className="h-2 w-2 rounded-full bg-brand-700" />
                <span>Target</span>
              </span>
              <span className="flex items-center gap-1.5 text-ink">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Attained</span>
              </span>
            </div>
          </div>

          {/* Line Chart Canvas */}
          <div className="relative mt-6 h-56 w-full">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] font-semibold text-ink-subtle">
              {['100%', '80%', '50%', '20%', '0%'].map((val) => (
                <div key={val} className="flex items-center w-full">
                  <span className="w-8 shrink-0">{val}</span>
                  <div className="h-[1px] w-full border-b border-dashed border-slate-200" />
                </div>
              ))}
            </div>

            {/* SVG Lines */}
            <div className="absolute bottom-6 left-10 right-2 top-2">
              <svg viewBox="0 0 460 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                {/* Target Line */}
                <path
                  d={svgTargetPath}
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 hover:stroke-width-3"
                />
                {/* Attained Line */}
                <path
                  d={svgActualPath}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 hover:stroke-width-3"
                />

                {/* Data Points */}
                {linePointsActual.map((p, i) => (
                  <circle
                    key={`actual-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    className="fill-white stroke-sky-500 stroke-2 hover:r-5 transition-all"
                  />
                ))}
                {linePointsTarget.map((p, i) => (
                  <circle
                    key={`target-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    className="fill-brand-700 stroke-white stroke-1 hover:r-5 transition-all"
                  />
                ))}
              </svg>

              {/* X-Axis labels */}
              <div className="flex justify-between pt-2 px-1 text-xs font-semibold text-ink-muted">
                {['2021', '2022', '2023', '2024', '2025', '2026'].map((year) => (
                  <span key={year}>{year}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2B: INSTITUTIONAL ACCREDITATION STATISTICS PER CAMPUS
          ───────────────────────────────────────────────────────────────── */}
      <section className="panel overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-line bg-canvas/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">Institutional Accreditation Statistics Per Campus</h3>
              <Badge tone="brand">Official IA Metrics</Badge>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Verified campus-level institutional status, IA Area compliance (out of 9 areas), program coverage, and succeeding accreditation targets.
            </p>
          </div>
          {selectedCampus !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCampus('all')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Reset Campus Filter (View All 7)
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-line text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Campus</th>
                <th className="px-4 py-3 font-semibold">Institutional Level</th>
                <th className="px-4 py-3 font-semibold">IA Compliance (Areas 1–9)</th>
                <th className="px-4 py-3 font-semibold">Programs Accredited</th>
                <th className="px-4 py-3 font-semibold">Succeeding Level Target</th>
                <th className="px-4 py-3 font-semibold">Next Scheduled Survey</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {campusStatsList.map((item) => {
                const isSelected = selectedCampus === item.campus.id;
                return (
                  <tr
                    key={item.campus.id}
                    onClick={() => setSelectedCampus(isSelected ? 'all' : item.campus.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50/70 font-medium' : 'hover:bg-canvas/50'
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{item.campus.name}</span>
                        {item.campus.isMain && <Badge tone="gold">Main</Badge>}
                      </div>
                      <span className="text-[11px] text-ink-subtle">{item.campus.director}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        tone={
                          item.rec?.status.includes('Level III')
                            ? 'purple'
                            : item.rec?.status.includes('Level II')
                            ? 'brand'
                            : item.rec?.status.includes('Level I')
                            ? 'success'
                            : 'warning'
                        }
                        dot
                      >
                        {item.rec?.status || 'Candidate'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-line overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${item.iaCompliance}%` }}
                          />
                        </div>
                        <span className="font-bold text-ink">{item.iaCompliance}%</span>
                        <span className="text-ink-subtle text-[11px]">({item.approvedCount}/9)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-700">{item.progRate}%</span>
                        <span className="text-ink-subtle text-[11px]">({item.accProgs}/{item.totalProgs})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-brand-700 font-medium">
                      {item.succeedingLevel}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {item.rec?.nextScheduledEvaluation || '2026-06-01'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link
                        to="/frameworks/ia"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampus(item.campus.id);
                        }}
                        className="text-brand-600 hover:underline font-semibold"
                      >
                        View IA →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 3: PREMIUM FULL-WIDTH METRIC GRAPH (Matches reference "Premium Graph")
          ───────────────────────────────────────────────────────────────── */}
      <section className="panel overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-ink tracking-tight">Institutional Performance Metrics</h3>
            <p className="text-xs text-ink-muted">Verified quality indicators across all campus units</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted hidden sm:inline">Select Campus:</span>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Campuses (Consolidated)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5 Column Metric Summary (Matches Reference: "ABC 123 / 256.2K", "XYZ_OLD / 224.6K", etc.) */}
        <div className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-3 lg:grid-cols-5 border-b border-slate-100">
          <div className="px-2">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">AACCUP Level III/IV</p>
            <p className="mt-1 text-2xl font-black text-ink">{level34Pct}%</p>
            <span className="text-[11px] font-semibold text-emerald-600">{level34Count} of {totalPrograms} Programs</span>
          </div>

          <div className="px-2 border-l border-slate-100">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">COPC Compliance</p>
            <p className="mt-1 text-2xl font-black text-ink">{copcRate}%</p>
            <span className="text-[11px] font-semibold text-brand-600">{compliantCopc} of {totalPrograms} Certified</span>
          </div>

          <div className="px-2 border-t pt-3 sm:pt-0 sm:border-t-0 sm:border-l border-slate-100">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">ISO Surveillance</p>
            <p className="mt-1 text-2xl font-black text-ink">100%</p>
            <span className="text-[11px] font-semibold text-emerald-600">
              {openMajorCars === 0 ? 'Zero Major CARs' : `${openMajorCars} Major CARs`}
            </span>
          </div>

          <div className="px-2 border-t pt-3 sm:pt-0 sm:border-t-0 lg:border-l border-slate-100">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">PQA Scorecard</p>
            <p className="mt-1 text-2xl font-black text-ink">{currentPqa.overallScore} pts</p>
            <span className="text-[11px] font-semibold text-amber-600">
              {currentPqa.recognitionLevel.split(':')[0]}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 px-2 border-t pt-3 sm:pt-0 sm:border-t-0 sm:border-l border-slate-100">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">Total Evidence</p>
            <p className="mt-1 text-2xl font-black text-ink">{formatNumber(s.total)}</p>
            <span className="text-[11px] font-semibold text-brand-600">{formatNumber(s.indexed)} indexed</span>
          </div>
        </div>

        {/* WAVY AREA CHART WITH GRADIENT & HATCHED ACCENT (Directly from reference image) */}
        <div className="relative mt-4 h-32 w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 flex">
            {/* Left 65%: Solid Electric Blue Area Curve */}
            <div className="relative w-[65%] h-full">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="blueWave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,20 Q 25,5 50,25 T 100,20 L 100,50 L 0,50 Z"
                  fill="url(#blueWave)"
                />
                <path
                  d="M 0,20 Q 25,5 50,25 T 100,20"
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Right 35%: Diagonal Hatched Striped Area Curve (REFERENCE SIGNATURE FEATURE) */}
            <div className="relative w-[35%] h-full">
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <pattern id="hatchArea" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#60A5FA" strokeWidth="2.5" />
                  </pattern>
                </defs>
                <path
                  d="M 0,20 Q 50,15 100,25 L 100,50 L 0,50 Z"
                  fill="url(#hatchArea)"
                />
                <path
                  d="M 0,20 Q 50,15 100,25"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 4: RECENT EVIDENCE & SHARING ACTIVITY (Modern Floating Cards)
          ───────────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Table of Recent Evidence */}
        <div className="panel lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="panel-title">Recent Documents</h3>
              <p className="text-xs text-ink-muted">Recently indexed compliance artifacts</p>
            </div>
            <Link to="/evidence" className="link text-xs">
              View all documents →
            </Link>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-ink-muted">
                <tr>
                  <th className="th py-3">Document Title</th>
                  <th className="th py-3">Framework</th>
                  <th className="th py-3">Area</th>
                  <th className="th py-3">Date Added</th>
                  <th className="th py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="td py-3.5 max-w-[280px]">
                      <Link to={`/documents/${d.id}`} className="font-semibold text-ink hover:text-brand-600 truncate block">
                        {d.title}
                      </Link>
                    </td>
                    <td className="td py-3.5">
                      <FrameworkTag frameworkId={d.frameworkId} />
                    </td>
                    <td className="td py-3.5 text-ink-muted whitespace-nowrap">
                      {lookup.area(d.areaId)?.shortName || 'General'}
                    </td>
                    <td className="td py-3.5 text-ink-muted whitespace-nowrap">
                      {formatDate(d.dateAdded)}
                    </td>
                    <td className="td py-3.5">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="divide-y divide-slate-100 sm:hidden">
            {recent.map((d) => (
              <div key={d.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                <Link to={`/documents/${d.id}`} className="font-semibold text-xs text-ink hover:text-brand-600 line-clamp-2 block leading-snug">
                  {d.title}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <FrameworkTag frameworkId={d.frameworkId} />
                  <StatusBadge status={d.status} />
                  <span className="text-[11px] text-ink-muted font-medium ml-auto">
                    {formatDate(d.dateAdded)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-ink-subtle">
                  <span>Area: {lookup.area(d.areaId)?.shortName || 'General'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Access Governance Widget & Active Shares */}
        <div className="space-y-5 flex flex-col">
          {/* PENDING DOCUMENT ACCESS REQUESTS WIDGET */}
          <div className="panel p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/20 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-600" />
                  </span>
                  <h3 className="panel-title text-ink font-bold">Access Requests</h3>
                </div>
                <Badge tone={pendingAccessRequests.length > 0 ? 'warning' : 'success'}>
                  {pendingAccessRequests.length} Pending
                </Badge>
              </div>

              {pendingAccessRequests.length > 0 ? (
                <>
                  <p className="mt-2 text-xs text-ink-muted">
                    Faculty and staff awaiting QA authorization to access compliance documents.
                  </p>

                  <ul className="mt-3 divide-y divide-slate-100">
                    {pendingAccessRequests.slice(0, 2).map((req) => (
                      <li key={req.id} className="py-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-ink truncate">{req.requesterName}</span>
                          <Badge tone={req.requestedPermission === 'View and Download' ? 'success' : 'brand'}>
                            {req.requestedPermission}
                          </Badge>
                        </div>
                        <p className="text-xs text-brand-700 font-medium truncate mt-0.5">
                          {req.documentTitle}
                        </p>
                        <p className="text-[11px] text-ink-muted italic line-clamp-1 mt-0.5">
                          "{req.reason}"
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-ink-muted">
                  <CheckCircle2Icon className="mx-auto h-6 w-6 text-emerald-600 mb-1" />
                  All document access requests processed. Zero pending.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAccessModalOpen(true)}
                className="btn btn-primary btn-sm w-full gap-1.5 bg-brand-700 hover:bg-brand-800 text-xs font-semibold shadow-xs"
              >
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                {pendingAccessRequests.length > 0
                  ? `Review ${pendingAccessRequests.length} Requests`
                  : 'Open Requests Modal'}
              </button>
            </div>
          </div>

          {/* Active Shares Activity */}
          <div className="panel p-5 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="panel-title">Active Shares</h3>
                <Link to="/evidence/shared" className="link text-xs">
                  Manage
                </Link>
              </div>

              <ul className="mt-3 divide-y divide-slate-100">
                {recentShares.map((x) => {
                  const doc = documents.find((d) => d.id === x.documentId);
                  return (
                    <li key={x.id} className="py-3">
                      <Link to={`/documents/${x.documentId}`} className="block truncate text-xs font-semibold text-ink hover:text-brand-600">
                        {doc?.title}
                      </Link>
                      <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                        Shared with <span className="font-medium text-ink">{x.recipientName}</span>
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-subtle">
                        <PermissionIndicator canDownload={x.canDownload} />
                        <span>{formatDate(x.sharedAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                to="/frameworks"
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 p-2.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>Launch QA Command Center</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ENHANCED PENDING DOCUMENT ACCESS REQUESTS MODAL */}
      <PendingAccessRequestsModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
      />
    </div>
  );
}