import React, { useEffect, useMemo, useState } from 'react';
import { usePortal } from '../../contexts/PortalContext';

const chartYears = [
  { year: '2021', institutional: 88, programs: 70 },
  { year: '2022', institutional: 52, programs: 78 },
  { year: '2023', institutional: 48, programs: 22 },
  { year: '2024', institutional: 38, programs: 66 },
  { year: '2025', institutional: 72, programs: 55 },
  { year: '2026', institutional: 92, programs: 85 }
];

function GraduationCapIconSvg({ color = '#2563eb' }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </g>
  );
}

function FileCheck2IconSvg({ color = '#059669' }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m3 15 2 2 4-4" />
    </g>
  );
}

function ShieldCheckIconSvg({ color = '#d97706' }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </g>
  );
}

function AwardIconSvg({ color = '#4f46e5' }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
    </g>
  );
}

function Building2IconSvg({ color = '#2563eb' }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </g>
  );
}

function DashboardMetric({
  value,
  denominator,
  format,
  delay
}: {
  value: number;
  denominator?: number;
  format: 'fraction' | 'percent' | 'integer';
  delay: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }

    let frame = 0;
    let interval = 0;
    const countUp = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const nextProgress = Math.min((now - start) / 700, 1);
        setProgress(nextProgress);
        if (nextProgress < 1) frame = window.requestAnimationFrame(tick);
      };
      setProgress(0);
      frame = window.requestAnimationFrame(tick);
    };

    const timeout = window.setTimeout(() => {
      countUp();
      interval = window.setInterval(countUp, 16000);
    }, 350 + delay);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.cancelAnimationFrame(frame);
    };
  }, [delay, value]);

  const easedProgress = 1 - Math.pow(1 - progress, 3);
  const animatedValue = value * easedProgress;

  if (format === 'fraction') {
    return <>{Math.round(animatedValue)}</>;
  }
  if (format === 'percent') {
    return <>{animatedValue.toFixed(1)}%</>;
  }
  return <>{Math.round(animatedValue).toLocaleString()}</>;
}

function ScreenHeader({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      {/* Outer Window Canvas Card */}
      <rect x="20" y="16" width="840" height="456" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Section View Banner */}
      <text x="44" y="58" fill="#0f172a" fontSize="18" fontWeight="800">{title}</text>
      <text x="44" y="80" fill="#64748b" fontSize="12" fontWeight="500">{subtitle}</text>

      {/* Academic Year Tag */}
      <rect x="672" y="46" width="168" height="30" rx="8" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="756" y="65" textAnchor="middle" fill="#475569" fontSize="10.5" fontWeight="600">NEMSU · AY 2025–2026</text>

      {/* Divider */}
      <path d="M44 96h796" stroke="#f1f5f9" strokeWidth="1" />
    </>
  );
}

export function EvidenceMotionGraphic() {
  const { documents, pending, programAccreditations, iaRecords, copcRecords, isoRecords, pqaRecords } = usePortal();

  const metrics = useMemo(() => {
    const certifiedPrograms = programAccreditations.filter((program) =>
      ['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(program.status)
    ).length;
    const compliantCopc = copcRecords.filter((record) => record.copcStatus === 'Compliant').length;
    const activeIsoRecords = isoRecords.filter((record) => !record.isHistorical);
    const compliantIso = activeIsoRecords.filter(
      (record) => record.complianceStatus === 'Certified' || record.complianceStatus === 'Compliant'
    ).length;
    const openCorrectiveActions = activeIsoRecords.reduce(
      (count, record) => count + record.correctiveActions.filter((action) => action.status !== 'Closed / Verified').length,
      0
    );
    const indexedDocuments = documents.filter((document) => document.status === 'Indexed').length;
    const primaryPqa = pqaRecords.find((record) => record.campusId === 'tandag') ?? pqaRecords[0];

    return {
      certifiedPrograms: certifiedPrograms || 68,
      programCount: programAccreditations.length || 81,
      certifiedPercentage: programAccreditations.length
        ? ((certifiedPrograms / programAccreditations.length) * 100).toFixed(1)
        : '96.8',
      compliantCopc: compliantCopc || 78,
      copcCount: copcRecords.length || 81,
      copcRate: copcRecords.length ? ((compliantCopc / copcRecords.length) * 100).toFixed(1) : '96.3',
      campusCount: iaRecords.length || 7,
      indexedDocuments: indexedDocuments || 1217,
      uploadedDocuments: (documents.length + pending.length) || 1248,
      isoRate: activeIsoRecords.length
        ? ((compliantIso / activeIsoRecords.length) * 100).toFixed(1)
        : '100.0',
      openCorrectiveActions,
      pqaLevel: primaryPqa?.recognitionLevel.split(':')[0] ?? 'Level II'
    };
  }, [documents, iaRecords, copcRecords, isoRecords, pending, pqaRecords, programAccreditations]);

  const kpis = [
    {
      label: 'AACCUP Programs',
      value: metrics.certifiedPrograms,
      denominator: metrics.programCount,
      format: 'fraction' as const,
      detailLeft: `${metrics.certifiedPercentage}% Certified`,
      detailRight: 'Level I to IV',
      detailColor: '#047857',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#e2e8f0',
      icon: 'programs'
    },
    {
      label: 'CHED COPC',
      value: Number(metrics.copcRate),
      format: 'percent' as const,
      detailLeft: `${metrics.compliantCopc} Compliant`,
      detailRight: 'Statutory PSCs',
      detailColor: '#047857',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#e2e8f0',
      icon: 'copc'
    },
    {
      label: 'Evidence Files',
      value: metrics.indexedDocuments,
      format: 'integer' as const,
      detailLeft: '8 pending review',
      detailRight: `${metrics.uploadedDocuments.toLocaleString()} total`,
      detailColor: '#d97706',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      icon: 'evidence'
    },
    {
      label: 'ISO 9001 & PQA',
      value: Number(metrics.isoRate),
      format: 'percent' as const,
      detailLeft: `${metrics.openCorrectiveActions} Major CARs`,
      detailRight: `PQA ${metrics.pqaLevel}`,
      detailColor: '#047857',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#e2e8f0',
      icon: 'iso'
    }
  ];

  const frameworks = [
    {
      label: 'AACCUP Programs',
      subtitle: `${metrics.certifiedPrograms} Programs Level I to IV`,
      value: `${Math.round(Number(metrics.certifiedPercentage))}% Certified`,
      color: '#2563eb',
      bg: '#eff6ff',
      icon: 'programs',
      progress: Number(metrics.certifiedPercentage)
    },
    {
      label: 'CHED COPC',
      subtitle: 'Statutory program compliance',
      value: `${metrics.copcRate}%`,
      color: '#059669',
      bg: '#ecfdf5',
      icon: 'copc',
      progress: Number(metrics.copcRate)
    },
    {
      label: 'Institutional (IA)',
      subtitle: `${metrics.campusCount} Campuses Monitored`,
      value: 'Level III',
      color: '#2563eb',
      bg: '#eff6ff',
      icon: 'ia',
      progress: 75
    },
    {
      label: 'ISO 9001 & PQA',
      subtitle: 'QMS Surveillance Certified',
      value: 'Validated',
      color: '#4f46e5',
      bg: '#eef2ff',
      icon: 'iso',
      progress: 100
    }
  ];

  const documentRows = useMemo(() => {
    const indexed = documents.filter((document) => document.status === 'Indexed');
    const preferred = [
      indexed.find((document) => /faculty.*credential|faculty.*profile/i.test(document.title)),
      indexed.find((document) => /research/i.test(document.title)),
      indexed.find((document) => /institutional|accreditation/i.test(document.title))
    ].filter((document): document is (typeof indexed)[number] => Boolean(document));
    const unique = Array.from(new Map(preferred.map((document) => [document.title, document])).values());

    const result = (unique.length ? unique : indexed).slice(0, 3).map((document, index) => ({
      title: document.title,
      category: index === 0 ? 'Area II · Faculty Qualifications & Service Records' : index === 1 ? 'Area III · Research & Community Extension' : 'Area I · Governance, Management & Quality',
      type: document.title.toLowerCase().includes('report') ? 'REPORT' : 'PDF'
    }));

    if (result.length < 3) {
      return [
        { title: 'Faculty Qualifications & Service Records Summary', category: 'Area II · Faculty Development & Records', type: 'PDF' },
        { title: 'Institutional Research & Extension Annual Audit', category: 'Area III · Research & Community Extension', type: 'REPORT' },
        { title: 'Academic Curriculum Syllabi & Board Performance Report', category: 'Area IV · Instruction & Quality Assurance', type: 'PDF' }
      ];
    }
    return result;
  }, [documents]);

  return (
    <div
      className="dashboard-motion-scene"
      role="img"
      aria-label="Accrevia interactive 3D motion graphic showcasing live accreditation KPIs, analytics attainment, evidence repository, and intelligent search"
    >
      <svg
        className="dashboard-motion-art"
        viewBox="0 0 880 488"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        textRendering="geometricPrecision"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <filter id="featureScreenShadow" x="-20%" y="-20%" width="150%" height="160%">
            <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#061632" floodOpacity=".28" />
          </filter>
          <linearGradient id="featureFolder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
          <clipPath id="featureKpiClip">
            <rect x="20" y="16" width="840" height="456" rx="18" />
          </clipPath>
          <clipPath id="featureSearchQueryClip">
            <rect x="98" y="126" width="270" height="30" className="feature-query-reveal" />
          </clipPath>
        </defs>

        {/* Screen 1: KPIs Matching App Dashboard */}
        <g className="dashboard-feature-screen dashboard-screen-kpis">
          <g className="dashboard-feature-card" filter="url(#featureScreenShadow)">
            <ScreenHeader title="Accreditation Overview" subtitle="Quality assurance and compliance metrics at a glance" />
            <g clipPath="url(#featureKpiClip)">
              {kpis.map((kpi, index) => {
                const x = 44 + index * 202;
                const y = 116 + (index % 2) * 3;
                const ratio = Math.max(0.1, Math.min(1, Number(kpi.format === 'fraction' ? metrics.certifiedPercentage : kpi.value) / (kpi.format === 'integer' ? Math.max(metrics.indexedDocuments, 1) : 100)));
                return (
                  <g key={kpi.label} className={`feature-kpi-card feature-kpi-card-${index + 1}`}>
                    {/* Card Container with subtle amber border on Card 3 */}
                    <rect x={x} y={y} width="186" height="330" rx="14" fill="#ffffff" stroke={kpi.border} strokeWidth="1.5" />

                    {/* Top Row: Title on Left, Official Dashboard Lucide Icon Box on Right */}
                    <text x={x + 16} y={y + 36} fill="#475569" fontSize="12" fontWeight="600">{kpi.label}</text>
                    <rect x={x + 134} y={y + 16} width="36" height="36" rx="9" fill={kpi.bg} />
                    <g transform={`translate(${x + 140}, ${y + 22})`}>
                      {kpi.icon === 'programs' && <GraduationCapIconSvg color={kpi.color} />}
                      {kpi.icon === 'copc' && <FileCheck2IconSvg color={kpi.color} />}
                      {kpi.icon === 'evidence' && <ShieldCheckIconSvg color={kpi.color} />}
                      {kpi.icon === 'iso' && <AwardIconSvg color={kpi.color} />}
                    </g>

                    {/* Middle Row: Large Value */}
                    <text x={x + 16} y={y + 104} fill="#0f172a" fontSize="30" fontWeight="800">
                      <DashboardMetric value={kpi.value} denominator={kpi.denominator} format={kpi.format} delay={index * 220} />
                      {kpi.denominator !== undefined && (
                        <tspan fill="#64748b" fontSize="16" fontWeight="500"> / {kpi.denominator}</tspan>
                      )}
                    </text>

                    {/* Progress Bar Track */}
                    <rect x={x + 16} y={y + 126} width="154" height="5" rx="2.5" fill="#f1f5f9" />
                    <rect x={x + 16} y={y + 126} width={154 * ratio} height="5" rx="2.5" fill={kpi.color} />

                    {/* Bottom Row: Detail Left and Sub-label Right */}
                    <text x={x + 16} y={y + 156} fill={kpi.detailColor} fontSize="11" fontWeight="700">{kpi.detailLeft}</text>
                    <text x={x + 170} y={y + 156} textAnchor="end" fill="#64748b" fontSize="10.5">{kpi.detailRight}</text>

                    {/* Active Compliance Verification Badge */}
                    <rect x={x + 16} y={y + 258} width="154" height="30" rx="8" fill={kpi.bg} />
                    <circle cx={x + 30} cy={y + 273} r="3.5" fill={kpi.color} />
                    <text x={x + 40} y={y + 277} fill={kpi.color} fontSize="10.5" fontWeight="600">Active Compliance</text>
                  </g>
                );
              })}
            </g>
          </g>
        </g>

        {/* Screen 2: Analytics & Framework Readiness Matching Dashboard */}
        <g className="dashboard-feature-screen dashboard-screen-analytics">
          <g className="dashboard-feature-card" filter="url(#featureScreenShadow)">
            <ScreenHeader title="Accreditation Analytics" subtitle="Attainment and framework readiness · 2021–2026" />
            
            {/* Left Chart Card */}
            <rect x="44" y="116" width="428" height="330" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="64" y="148" fill="#0f172a" fontSize="15" fontWeight="700">Accreditation Attainment</text>
            <text x="64" y="167" fill="#64748b" fontSize="11">2021 – 2026 Academic Cycles</text>

            {/* Top Right Legend Pills */}
            <rect x="270" y="133" width="88" height="24" rx="6" fill="#eff6ff" />
            <circle cx="281" cy="145" r="4" fill="#2563eb" />
            <text x="290" y="149" fill="#1e40af" fontSize="10.5" fontWeight="600">Institutional</text>

            <rect x="364" y="133" width="82" height="24" rx="6" fill="#f0f9ff" />
            <circle cx="375" cy="145" r="4" fill="#0284c7" />
            <text x="384" y="149" fill="#0369a1" fontSize="10.5" fontWeight="600">Programs</text>

            {/* Y-Axis Labels & Dotted Grid Lines */}
            {[
              { label: '100%', y: 202 },
              { label: '75%', y: 236 },
              { label: '50%', y: 270 },
              { label: '25%', y: 304 },
              { label: '0%', y: 338 }
            ].map((item) => (
              <g key={item.label}>
                <text x="86" y={item.y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="9.5" fontWeight="500">{item.label}</text>
                <path d={`M94 ${item.y}H446`} stroke="#f1f5f9" strokeDasharray="3 3" />
              </g>
            ))}

            {/* Year Bars */}
            {chartYears.map((year, index) => {
              const x = 112 + index * 54;
              const instH = Math.round(year.institutional * 1.3);
              const progH = Math.round(year.programs * 1.3);
              return (
                <g key={year.year} className="feature-chart-year">
                  <g className="feature-chart-bars" style={{ transformOrigin: `${x + 11}px 338px` }}>
                    <rect x={x} y={338 - instH} width="10" height={instH} rx="2.5" fill="#2563eb" />
                    <rect x={x + 12} y={338 - progH} width="10" height={progH} rx="2.5" fill="#38bdf8" />
                  </g>
                  <text x={x + 11} y="358" textAnchor="middle" fill="#64748b" fontSize="10.5" fontWeight="600">{year.year}</text>
                </g>
              );
            })}

            {/* Bottom Benchmark Callout */}
            <rect x="64" y="388" width="388" height="34" rx="8" fill="#f8fafc" stroke="#edf2f7" />
            <circle cx="80" cy="405" r="7" fill="#ecfdf5" />
            <path d="m77 405 2 2 4-4" fill="none" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <text x="94" y="409" fill="#059669" fontSize="10.5" fontWeight="600">Attainment comfortably exceeds benchmark</text>
            <text x="440" y="409" fill="#2563eb" fontSize="10.5" fontWeight="600" textAnchor="end">View Rosters →</text>

            {/* Right Framework Readiness Card */}
            <rect x="488" y="116" width="348" height="330" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="508" y="150" fill="#0f172a" fontSize="15" fontWeight="700">Framework Readiness</text>
            <text x="818" y="150" fill="#2563eb" fontSize="11" fontWeight="600" textAnchor="end">Hub Overview</text>

            {frameworks.map((framework, index) => {
              const y = 172 + index * 54;
              return (
                <g key={framework.label} className={`feature-framework-row feature-framework-row-${index + 1}`}>
                  {/* Icon Box with Corresponding Lucide Icon */}
                  <rect x="506" y={y} width="36" height="36" rx="9" fill={framework.bg} />
                  <g transform={`translate(${512}, ${y + 6})`}>
                    {framework.icon === 'programs' && <GraduationCapIconSvg color={framework.color} />}
                    {framework.icon === 'copc' && <FileCheck2IconSvg color={framework.color} />}
                    {framework.icon === 'ia' && <Building2IconSvg color={framework.color} />}
                    {framework.icon === 'iso' && <AwardIconSvg color={framework.color} />}
                  </g>

                  {/* Title & Subtitle */}
                  <text x="552" y={y + 14} fill="#0f172a" fontSize="11.5" fontWeight="700">{framework.label}</text>
                  <text x="552" y={y + 29} fill="#64748b" fontSize="10">{framework.subtitle}</text>

                  {/* Status & Chevron Right */}
                  <text x="804" y={y + 21} fill={framework.color} fontSize="11" fontWeight="700" textAnchor="end">{framework.value}</text>
                  <path d={`m812 ${y + 13} 4 4.5-4 4.5`} fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Row Separator */}
                  {index < 3 && <path d={`M506 ${y + 44}H818`} stroke="#f1f5f9" />}
                </g>
              );
            })}

            {/* Frameworks Footer */}
            <path d="M506 392H818" stroke="#f1f5f9" />
            <text x="508" y="415" fill="#64748b" fontSize="10.5">All standards up to date</text>
            <text x="818" y="415" fill="#2563eb" fontSize="10.5" fontWeight="600" textAnchor="end">Criteria Explorer →</text>
          </g>
        </g>

        {/* Screen 3: Documents */}
        <g className="dashboard-feature-screen dashboard-screen-documents">
          <g className="dashboard-feature-card" filter="url(#featureScreenShadow)">
            <ScreenHeader title="Evidence Repository" subtitle="Organized institutional evidence and accreditation records" />
            {/* Left Folders Sidebar */}
            <rect x="44" y="116" width="224" height="330" rx="14" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="64" y="148" fill="#64748b" fontSize="10.5" fontWeight="800" letterSpacing="0.8">FRAMEWORK FOLDERS</text>
            {[
              { label: 'AACCUP Programs', y: 168, count: '48 files', selected: true },
              { label: 'CHED COPC', y: 218, count: '32 files' },
              { label: 'Institutional QA', y: 268, count: '18 files' },
              { label: 'ISO 9001 & PQA', y: 318, count: '24 files' }
            ].map((folder) => (
              <g key={folder.label}>
                <rect x="54" y={folder.y} width="204" height="42" rx="9" fill={folder.selected ? '#eff6ff' : 'transparent'} stroke={folder.selected ? '#bfdbfe' : 'transparent'} strokeWidth="1.2" />
                <path d={`M66 ${folder.y + 14}h8l4 4h12v11h-24z`} fill={folder.selected ? '#2563eb' : '#94a3b8'} />
                <text x="96" y={folder.y + 26} fill={folder.selected ? '#1d4ed8' : '#334155'} fontSize="12" fontWeight={folder.selected ? '700' : '500'}>{folder.label}</text>
                <text x="246" y={folder.y + 26} textAnchor="end" fill={folder.selected ? '#2563eb' : '#94a3b8'} fontSize="10.5">{folder.count}</text>
              </g>
            ))}

            {/* Right Documents List */}
            <text x="288" y="148" fill="#0f172a" fontSize="15" fontWeight="700">Recent Evidence Documents</text>
            <text x="836" y="148" fill="#2563eb" fontSize="12" fontWeight="600" textAnchor="end">{metrics.indexedDocuments.toLocaleString()} indexed files</text>

            {documentRows.map((document, index) => {
              const y = 172 + index * 76;
              return (
                <g key={`${document.title}-${index}`} className={`feature-document-row feature-document-row-${index + 1}`}>
                  <rect x="288" y={y} width="548" height="66" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                  <rect x="304" y={y + 11} width="44" height="44" rx="10" fill="#eff6ff" stroke="#dbeafe" />
                  <g transform={`translate(314, ${y + 21})`}>
                    <FileCheck2IconSvg color="#2563eb" />
                  </g>
                  <text x="362" y={y + 28} fill="#0f172a" fontSize="13" fontWeight="700">{document.title.length > 46 ? `${document.title.slice(0, 44)}...` : document.title}</text>
                  <text x="362" y={y + 48} fill="#64748b" fontSize="11.5">{document.category}</text>
                  <rect x="748" y={y + 19} width="74" height="28" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
                  <text x="785" y={y + 37} fill="#1d4ed8" fontSize="11" textAnchor="middle" fontWeight="700">{document.type}</text>
                </g>
              );
            })}

            {[0, 1, 2].map((index) => (
              <g key={index} className={`feature-moving-document feature-moving-document-${index + 1}`}>
                <rect width="30" height="38" rx="6" fill="#fff" stroke="#93c5fd" strokeWidth="1.5" />
                <path d="M6 10h18M6 17h18M6 24h10" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" />
              </g>
            ))}
          </g>
        </g>

        {/* Screen 4: Search */}
        <g className="dashboard-feature-screen dashboard-screen-search">
          <g className="dashboard-feature-card" filter="url(#featureScreenShadow)">
            <ScreenHeader title="Intelligent Search" subtitle="Find indexed records across frameworks and accreditation areas" />
            {/* Search Input Bar */}
            <rect x="44" y="116" width="792" height="52" rx="13" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
            <circle cx="70" cy="142" r="9" fill="none" stroke="#2563eb" strokeWidth="2.2" />
            <path d="m77 149 6 6" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
            <text x="98" y="148" fill="#0f172a" fontSize="14.5" fontWeight="600" clipPath="url(#featureSearchQueryClip)">Faculty credentials & qualifications</text>
            <path className="feature-search-caret" d="M372 130v24" stroke="#2563eb" strokeWidth="2" />

            <rect x="650" y="126" width="94" height="32" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
            <text x="697" y="147" textAnchor="middle" fill="#1d4ed8" fontSize="11.5" fontWeight="600">All Areas</text>

            <rect x="752" y="126" width="74" height="32" rx="8" fill="#2563eb" />
            <text x="789" y="147" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Find</text>

            {/* Results Header */}
            <rect x="44" y="182" width="792" height="32" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
            <text x="60" y="203" fill="#64748b" fontSize="11" fontWeight="700" letterSpacing="0.8">MATCHING ACCREDITATION EVIDENCE</text>
            <text x="820" y="203" fill="#2563eb" fontSize="11" fontWeight="600" textAnchor="end">High Relevance (98%)</text>

            {documentRows.map((document, index) => {
              const y = 224 + index * 64;
              return (
                <g key={`${document.title}-${index}`} className={`feature-search-result feature-search-result-${index + 1}`}>
                  <rect x="44" y={y} width="792" height="54" rx="11" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                  <rect x="58" y={y + 8} width="38" height="38" rx="8" fill="#eff6ff" stroke="#dbeafe" />
                  <g transform={`translate(65, ${y + 15}) scale(0.9)`}>
                    <FileCheck2IconSvg color="#2563eb" />
                  </g>
                  <text x="108" y={y + 24} fill="#0f172a" fontSize="13.5" fontWeight="700">{document.title.length > 56 ? `${document.title.slice(0, 54)}...` : document.title}</text>
                  <text x="108" y={y + 42} fill="#64748b" fontSize="11.5">{document.category}</text>
                  <rect x="704" y={y + 12} width="118" height="30" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
                  <text x="763" y={y + 31} textAnchor="middle" fill="#1d4ed8" fontSize="11" fontWeight="700">{index === 0 ? 'AACCUP AREA II' : index === 1 ? 'AREA III RESEARCH' : 'INSTITUTIONAL'}</text>
                </g>
              );
            })}
            <text x="48" y="431" fill="#64748b" fontSize="11.5" fontWeight="500">{documentRows.length} matching accreditation evidence records · Full OCR & metadata indexed</text>
          </g>
        </g>
      </svg>
    </div>
  );
}
