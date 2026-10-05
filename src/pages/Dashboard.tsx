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
  SparklesIcon
} from 'lucide-react';
import { usePortal } from '../contexts/PortalContext';
import { useLookup } from '../hooks/useLookup';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { FrameworkTag } from '../components/ui/FrameworkTag';
import { PermissionIndicator } from '../components/sharing/PermissionIndicator';
import { repositoryStats } from '../data/analytics';
import { formatDate, formatNumber } from '../utils/format';

export function Dashboard() {
  const {
    documents,
    pending,
    shares,
    programAccreditations,
  } = usePortal();
  const lookup = useLookup();

  const [activeLegendBar, setActiveLegendBar] = useState<'all' | 'inst' | 'prog'>('all');
  const [graphFilter, setGraphFilter] = useState('All Campuses');

  const s = {
    total: repositoryStats.total,
    processing: repositoryStats.processing,
    pending: pending.length,
    indexed: repositoryStats.total - repositoryStats.processing - pending.length
  };



  const compliantCopc = programAccreditations.filter((p) => p.copcStatus === 'Compliant').length;
  const copcRate = programAccreditations.length > 0
    ? ((compliantCopc / programAccreditations.length) * 100).toFixed(1)
    : '96.9';

  const recent = useMemo(
    () => [...documents].filter((d) => d.status !== 'Archived').sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 6),
    [documents]
  );
  const recentShares = useMemo(() => [...shares].sort((a, b) => b.sharedAt.localeCompare(a.sharedAt)).slice(0, 4), [shares]);

  // Dual Series Bar Chart Data (Reference: "Last Ratio" 2012 - 2017)
  const barChartYears = [
    { year: '2021', inst: 88, prog: 70 },
    { year: '2022', inst: 52, prog: 78 },
    { year: '2023', inst: 48, prog: 22 },
    { year: '2024', inst: 38, prog: 66 },
    { year: '2025', inst: 72, prog: 55 },
    { year: '2026', inst: 92, prog: 85 }
  ];

  // Dual Series Line Chart Coordinates (Reference: "Combined Ratio")
  // Years 2021 - 2026 with targets and actuals mapped into percentage heights
  const linePointsTarget = [
    { x: 30, y: 75, val: '25%' },
    { x: 110, y: 65, val: '45%' },
    { x: 190, y: 28, val: '80%' },
    { x: 270, y: 48, val: '60%' },
    { x: 350, y: 15, val: '95%' },
    { x: 430, y: 55, val: '50%' }
  ];
  const linePointsActual = [
    { x: 30, y: 78, val: '22%' },
    { x: 110, y: 38, val: '70%' },
    { x: 190, y: 12, val: '98%' },
    { x: 270, y: 22, val: '88%' },
    { x: 350, y: 42, val: '68%' },
    { x: 430, y: 15, val: '95%' }
  ];

  const svgTargetPath = `M ${linePointsTarget.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const svgActualPath = `M ${linePointsActual.map((p) => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Dashboard"
        eyebrow="NEMSU Accreditation Evidence System"
        description="Comprehensive quality assurance, multi-campus accreditation monitoring, and verified institutional evidence metrics."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/evidence/pending" className="btn btn-secondary">
              Review Pending ({s.pending})
            </Link>
            <Link to="/evidence/upload" className="btn btn-primary">
              <UploadIcon className="h-4 w-4" /> Upload Evidence
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
              <span className="text-sm font-bold tracking-tight text-white/90">Institutional Quality</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                Primary Core
              </span>
            </div>
            <Link to="/frameworks/ia" className="rounded-full bg-white/15 p-1 text-white hover:bg-white/30 transition-colors">
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 flex items-center gap-6">
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
            <span>7 Campuses Monitored</span>
            <Link to="/frameworks" className="font-semibold text-white hover:underline flex items-center gap-1">
              Open Hub →
            </Link>
          </div>
        </div>

        {/* CARD 2: WHITE FLOATING CARD (Reference: "Fund 2") */}
        <div className="panel p-6 flex flex-col justify-between hover:border-slate-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Program Accreditation</h3>
            <Link to="/frameworks/pa" className="rounded-full bg-slate-50 p-1 text-ink-subtle hover:text-brand-600 transition-colors">
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="my-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <GraduationCapIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-subtle uppercase">Programs</p>
                <p className="text-xl font-extrabold text-ink">{programAccreditations.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <AwardIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-ink-subtle uppercase">Level III/IV</p>
                <p className="text-xl font-extrabold text-ink">
                  {programAccreditations.filter((p) => p.status === 'Level 3' || p.status === 'Level 4').length}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-ink-muted">AACCUP Validated Programs</span>
            <span className="font-bold text-emerald-700">96.8% Certified</span>
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
                <p className="text-xl font-extrabold text-emerald-700">0 Major</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-ink-muted">PQA Scorecard</span>
            <span className="font-bold text-brand-600">Level II Recognized</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2: DUAL-SERIES CHARTS (Matches reference "Last Ratio" & "Combined Ratio")
          ───────────────────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* LEFT CHART: "Last Ratio" - DUAL-SERIES BAR CHART WITH DIAGONAL HATCH PATTERN */}
        <div className="panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Accreditation Ratio</h3>
              <p className="text-xs text-ink-muted">Institutional vs Academic Programs Coverage</p>
            </div>

            {/* Reference Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveLegendBar(activeLegendBar === 'inst' ? 'all' : 'inst')}
                className="flex items-center gap-1.5 text-ink hover:text-brand-600"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                <span>Institutional</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLegendBar(activeLegendBar === 'prog' ? 'all' : 'prog')}
                className="flex items-center gap-1.5 text-ink hover:text-brand-600"
              >
                <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-400 bg-white" />
                <span>Programs</span>
              </button>
            </div>
          </div>

          {/* Bar Chart Canvas with Dotted Y-Axis Guidelines */}
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

            {/* Bars Container */}
            <div className="absolute bottom-6 left-10 right-2 top-2 flex items-end justify-between px-2">
              {barChartYears.map((d) => (
                <div key={d.year} className="group relative flex flex-col items-center">
                  <div className="flex items-end gap-1.5 h-44">
                    {/* Series 1: Solid Royal Blue Bar */}
                    {(activeLegendBar === 'all' || activeLegendBar === 'inst') && (
                      <div
                        style={{ height: `${d.inst}%` }}
                        className="w-3.5 sm:w-4 rounded-t-sm bg-brand-600 transition-all duration-300 hover:brightness-110 group-hover:scale-y-[1.02] origin-bottom shadow-sm"
                        title={`Institutional: ${d.inst}%`}
                      />
                    )}

                    {/* Series 2: Diagonal-Hatched Sky Blue Bar (SIGNATURE REFERENCE STYLING) */}
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
          SECTION 3: PREMIUM FULL-WIDTH METRIC GRAPH (Matches reference "Premium Graph")
          ───────────────────────────────────────────────────────────────── */}
      <section className="panel overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-ink tracking-tight">Institutional Performance Metrics</h3>
            <p className="text-xs text-ink-muted">Verified quality indicators across all campus units</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={graphFilter}
              onChange={(e) => setGraphFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option>All Campuses</option>
              <option>Tandag (Main)</option>
              <option>Cantilan Campus</option>
              <option>Lianga Campus</option>
              <option>Tagbina Campus</option>
            </select>
          </div>
        </div>

        {/* 5 Column Metric Summary (Matches Reference: "ABC 123 / 256.2K", "XYZ_OLD / 224.6K", etc.) */}
        <div className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-5 border-b border-slate-100">
          <div className="px-2">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">AACCUP Level IV</p>
            <p className="mt-1 text-2xl font-black text-ink">94.2%</p>
            <span className="text-[11px] font-semibold text-emerald-600">Highest standard</span>
          </div>

          <div className="px-2 border-l border-slate-100">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">COPC Compliance</p>
            <p className="mt-1 text-2xl font-black text-ink">{copcRate}%</p>
            <span className="text-[11px] font-semibold text-brand-600">CHED Certified</span>
          </div>

          <div className="px-2 border-l border-slate-100">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">ISO Surveillance</p>
            <p className="mt-1 text-2xl font-black text-ink">100%</p>
            <span className="text-[11px] font-semibold text-emerald-600">Zero Major CARs</span>
          </div>

          <div className="px-2 border-l border-slate-100">
            <p className="text-xs font-bold text-ink-subtle uppercase tracking-wider">PQA Scorecard</p>
            <p className="mt-1 text-2xl font-black text-ink">480 pts</p>
            <span className="text-[11px] font-semibold text-amber-600">Level II Recognized</span>
          </div>

          <div className="px-2 border-l border-slate-100">
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
              <h3 className="panel-title">Recent Evidence Records</h3>
              <p className="text-xs text-ink-muted">Recently indexed compliance artifacts</p>
            </div>
            <Link to="/evidence" className="link text-xs">
              View all evidence →
            </Link>
          </div>

          <div className="overflow-x-auto">
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
        </div>

        {/* Sharing Activity */}
        <div className="panel p-5 flex flex-col justify-between">
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
      </section>
    </div>
  );
}