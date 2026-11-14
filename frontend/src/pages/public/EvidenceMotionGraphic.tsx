import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { FileText, Search, TrendingUp } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';

const CARD_COUNT = 4;
const DISPLAY_MS = 5000;
const TRANSITION_MS = 900;
const EXIT_BEHIND_AT = 0.55;

type Metrics = {
  certified: number;
  programCount: number;
  certifiedPct: number;
  copcRate: number;
  campuses: number;
  indexed: number;
  total: number;
  pending: number;
  isoReady: number;
};

type DocRow = { title: string; area: string };

type Pose = {
  x: number;
  y: number;
  scale: number;
  rotateY: number;
  rotateZ: number;
};

/* -------------------------------------------------------------------------- */
/* Existing interface cards — content/layout only (no animation logic).       */
/* -------------------------------------------------------------------------- */

function CardFace({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="hero-stack-face">
      <div className="hero-panel-chrome">
        <span />
        <span />
        <span />
        <p>{title}</p>
        {badge ? <small>{badge}</small> : null}
      </div>
      <div className="hero-panel-body">{children}</div>
    </div>
  );
}

function AccreditationOverview({ metrics }: { metrics: Metrics }) {
  return (
    <CardFace title="Accreditation Overview" badge="NEMSU · AY 2025–2026">
      <div className="hero-kpi-grid">
        <div className="hero-kpi">
          <span>AACCUP Programs</span>
          <strong>
            {metrics.certified}
            <small>/{metrics.programCount}</small>
          </strong>
          <em>{metrics.certifiedPct}% certified</em>
        </div>
        <div className="hero-kpi hero-kpi-emerald">
          <span>CHED COPC</span>
          <strong>{metrics.copcRate}%</strong>
          <em>Statutory compliance</em>
        </div>
        <div className="hero-kpi hero-kpi-amber">
          <span>Documents</span>
          <strong>{metrics.indexed.toLocaleString()}</strong>
          <em>{metrics.pending} pending review</em>
        </div>
        <div className="hero-kpi hero-kpi-indigo">
          <span>ISO &amp; Campuses</span>
          <strong>{metrics.isoReady}%</strong>
          <em>{metrics.campuses} campuses monitored</em>
        </div>
      </div>
      <div className="hero-status-strip">
        <span className="is-live" />
        Live QA metrics · {metrics.total.toLocaleString()} records indexed
      </div>
    </CardFace>
  );
}

function AccreditationAnalytics({ metrics }: { metrics: Metrics }) {
  const chartBars = [
    { year: '22', a: 52, b: 78 },
    { year: '23', a: 48, b: 62 },
    { year: '24', a: 58, b: 70 },
    { year: '25', a: 72, b: 80 },
    { year: '26', a: 86, b: 88 }
  ];

  return (
    <CardFace title="Accreditation Analytics">
      <div className="hero-analytics-head">
        <div>
          <p className="hero-panel-title">Attainment</p>
          <p className="hero-panel-sub">2022–2026 cycles</p>
        </div>
        <span className="hero-pill">
          <TrendingUp className="h-3 w-3" />
          +12%
        </span>
      </div>
      <div className="hero-chart" aria-hidden="true">
        {chartBars.map((bar) => (
          <div key={bar.year} className="hero-chart-col">
            <div className="hero-chart-bars">
              <i style={{ height: `${bar.a}%` }} />
              <i style={{ height: `${bar.b}%` }} />
            </div>
            <span>{bar.year}</span>
          </div>
        ))}
      </div>
      <div className="hero-progress-row">
        <span>Program readiness</span>
        <strong>{metrics.certifiedPct}%</strong>
      </div>
      <div className="hero-progress-track">
        <div className="hero-progress-fill" style={{ width: `${Math.min(metrics.certifiedPct, 100)}%` }} />
      </div>
    </CardFace>
  );
}

function DocumentManagement({ rows }: { rows: DocRow[] }) {
  return (
    <CardFace title="Evidence Repository">
      <div className="hero-doc-layout">
        <aside className="hero-doc-folders">
          <p className="hero-mini-label">Areas</p>
          {['AACCUP Programs', 'CHED COPC', 'Institutional QA'].map((folder, i) => (
            <div key={folder} className={`hero-folder${i === 0 ? ' is-active' : ''}`}>
              <FileText className="h-3 w-3" />
              <span>{folder}</span>
            </div>
          ))}
        </aside>
        <div className="hero-doc-list">
          <p className="hero-mini-label">Recent documents</p>
          {rows.map((row) => (
            <div key={row.title} className="hero-doc-row">
              <span className="hero-doc-icon">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div>
                <p>{row.title}</p>
                <span>{row.area}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardFace>
  );
}

function IntelligentSearch({ rows }: { rows: DocRow[] }) {
  return (
    <CardFace title="Intelligent Search">
      <div className="hero-search-box">
        <Search className="h-3.5 w-3.5 text-blue-600" />
        <span className="hero-search-query">Faculty credentials &amp; qualifications</span>
      </div>
      <p className="hero-mini-label mt-3">Ranked evidence</p>
      {rows.map((row, i) => (
        <div key={`search-${row.title}`} className="hero-search-result">
          <div>
            <p>{row.title}</p>
            <span>{row.area}</span>
          </div>
          <em>{98 - i * 4}%</em>
        </div>
      ))}
    </CardFace>
  );
}

/* -------------------------------------------------------------------------- */
/* Animation helpers — wrappers only.                                         */
/* -------------------------------------------------------------------------- */

function depthFor(cardIndex: number, active: number) {
  return (cardIndex - active + CARD_COUNT) % CARD_COUNT;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

function easeOutCubic(t: number) {
  const p = clamp01(t);
  return 1 - (1 - p) ** 3;
}

function easeInOutCubic(t: number) {
  const p = clamp01(t);
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    scale: lerp(a.scale, b.scale, t),
    rotateY: lerp(a.rotateY, b.rotateY, t),
    rotateZ: lerp(a.rotateZ, b.rotateZ, t)
  };
}

function restPose(depth: number, compact: boolean): Pose {
  const step = compact ? 7 : 10;
  const scaleStep = compact ? 0.025 : 0.03;
  return {
    x: 0,
    y: -depth * step,
    scale: 1 - depth * scaleStep,
    rotateY: 0,
    rotateZ: 0
  };
}

/** lift → exit sideways → reorder behind → settle */
function sampleExit(progress: number, compact: boolean, finalDepth: number): Pose {
  const t = clamp01(progress);
  const final = restPose(finalDepth, compact);
  const side = compact ? 32 : 44;
  const liftY = compact ? -16 : -22;
  const exitY = compact ? -36 : -48;

  const p0: Pose = { x: 0, y: 0, scale: 1, rotateY: 0, rotateZ: 0 };
  const p1: Pose = { x: 6, y: liftY, scale: 1, rotateY: -6, rotateZ: -1.5 };
  const p2: Pose = { x: side, y: exitY, scale: 0.97, rotateY: -7, rotateZ: -2.5 };

  if (t <= 0.22) return lerpPose(p0, p1, easeOutCubic(t / 0.22));
  if (t <= 0.58) return lerpPose(p1, p2, easeInOutCubic((t - 0.22) / 0.36));
  return lerpPose(p2, final, easeInOutCubic((t - 0.58) / 0.42));
}

function poseToTransform(pose: Pose) {
  return `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.scale}) rotateY(${pose.rotateY}deg) rotateZ(${pose.rotateZ}deg)`;
}

function stackZ(cardIndex: number, active: number, next: number | null, exitBehind: boolean) {
  if (next !== null) {
    if (cardIndex === active) return exitBehind ? 1 : 40;
    return 20 - depthFor(cardIndex, next);
  }
  return CARD_COUNT - depthFor(cardIndex, active);
}

/**
 * Automatic 3D card-deck slideshow.
 * Animation applies only to outer wrappers; interface cards stay unchanged.
 */
export function EvidenceMotionGraphic() {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [compact, setCompact] = useState(false);
  const [inView, setInView] = useState(true);

  const activeRef = useRef(0);
  const busyRef = useRef(false);
  const compactRef = useRef(false);
  const reducedRef = useRef(!!reducedMotion);
  const tickRef = useRef<number | null>(null);
  const autoTimer = useRef<number | null>(null);

  compactRef.current = compact;
  reducedRef.current = !!reducedMotion;

  const { documents, pending, programAccreditations, iaRecords, copcRecords } = usePortal();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.3),
      { threshold: [0, 0.3, 0.6] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const metrics = useMemo<Metrics>(() => {
    const certifiedPrograms = programAccreditations.filter((program) =>
      ['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(program.status)
    ).length;
    const compliantCopc = copcRecords.filter((record) => record.copcStatus === 'Compliant').length;
    const indexedDocuments = documents.filter((document) => document.status === 'Indexed').length;
    const programCount = programAccreditations.length || 82;
    const certified = certifiedPrograms || 71;
    const copcCount = copcRecords.length || 82;
    const copcCompliant = compliantCopc || 76;

    return {
      certified,
      programCount,
      certifiedPct: Math.round((certified / programCount) * 1000) / 10,
      copcRate: Math.round((copcCompliant / Math.max(copcCount, 1)) * 1000) / 10,
      campuses: iaRecords.length || 7,
      indexed: indexedDocuments || documents.length || 460,
      total: documents.length + pending.length || 468,
      pending: pending.length || 5,
      isoReady: 86
    };
  }, [copcRecords, documents, iaRecords, pending, programAccreditations]);

  const documentRows = useMemo<DocRow[]>(() => {
    const indexed = documents.filter((d) => d.status === 'Indexed').slice(0, 3);
    if (indexed.length >= 3) {
      return indexed.map((d, i) => ({
        title: d.title.length > 36 ? `${d.title.slice(0, 34)}…` : d.title,
        area: i === 0 ? 'Area II · Faculty' : i === 1 ? 'Area III · Research' : 'Area I · Governance'
      }));
    }
    return [
      { title: 'Faculty Qualifications Summary', area: 'Area II · Faculty' },
      { title: 'Research & Extension Audit', area: 'Area III · Research' },
      { title: 'Curriculum & Board Performance', area: 'Area IV · Instruction' }
    ];
  }, [documents]);

  const interfaces = useMemo(
    () =>
      [
        <AccreditationOverview key="overview" metrics={metrics} />,
        <AccreditationAnalytics key="analytics" metrics={metrics} />,
        <DocumentManagement key="documents" rows={documentRows} />,
        <IntelligentSearch key="search" rows={documentRows} />
      ] as const,
    [documentRows, metrics]
  );

  const paint = useCallback(
    (opts: {
      from: number;
      to: number | null;
      progress: number;
      reduced: boolean;
      compactMode: boolean;
    }) => {
      const { from, to, progress, reduced, compactMode } = opts;
      const exitBehind = to !== null && progress >= EXIT_BEHIND_AT;
      const shown = to !== null ? (exitBehind ? to : from) : from;

      for (let i = 0; i < CARD_COUNT; i += 1) {
        const el = cardRefs.current[i];
        if (!el) continue;

        let pose: Pose;
        let opacity = 1;

        if (reduced) {
          pose = restPose(0, compactMode);
          opacity = i === from ? 1 : 0;
        } else if (to === null) {
          pose = restPose(depthFor(i, from), compactMode);
        } else if (i === from) {
          pose = sampleExit(progress, compactMode, depthFor(i, to));
        } else {
          pose = lerpPose(
            restPose(depthFor(i, from), compactMode),
            restPose(depthFor(i, to), compactMode),
            easeInOutCubic(progress)
          );
        }

        const outgoing = to !== null && i === from;
        const isFront = i === shown && !(outgoing && exitBehind);
        const isObscured = !reduced && !(i === shown || (outgoing && !exitBehind));

        el.style.transform = poseToTransform(pose);
        el.style.opacity = String(opacity);
        el.style.zIndex = String(
          reduced ? (i === from ? CARD_COUNT : 0) : stackZ(i, from, to, exitBehind)
        );
        el.classList.toggle('is-front', isFront);
        el.classList.toggle('is-exiting', outgoing);
        el.classList.toggle('is-obscured', isObscured);
        el.setAttribute('aria-hidden', isFront ? 'false' : 'true');
      }
    },
    []
  );

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const clearAuto = useCallback(() => {
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    autoTimer.current = null;
  }, []);

  const advance = useCallback(() => {
    if (busyRef.current) return;

    const from = activeRef.current;
    const next = (from + 1) % CARD_COUNT;

    if (reducedRef.current) {
      activeRef.current = next;
      paint({
        from: next,
        to: null,
        progress: 1,
        reduced: true,
        compactMode: compactRef.current
      });
      return;
    }

    busyRef.current = true;
    clearTick();
    const startedAt = performance.now();

    tickRef.current = window.setInterval(() => {
      const progress = clamp01((performance.now() - startedAt) / TRANSITION_MS);
      paint({
        from,
        to: next,
        progress,
        reduced: false,
        compactMode: compactRef.current
      });

      if (progress >= 1) {
        clearTick();
        activeRef.current = next;
        paint({
          from: next,
          to: null,
          progress: 1,
          reduced: false,
          compactMode: compactRef.current
        });
        busyRef.current = false;
      }
    }, 16);
  }, [clearTick, paint]);

  // Initial resting paint + idle re-paint when compact / reduced-motion changes.
  useEffect(() => {
    if (busyRef.current) return;
    paint({
      from: activeRef.current,
      to: null,
      progress: 1,
      reduced: !!reducedMotion,
      compactMode: compact
    });
  }, [compact, paint, reducedMotion]);

  // Automatic continuous loop while Hero is visible.
  useEffect(() => {
    clearAuto();
    if (reducedMotion || !inView) return;

    let first = true;
    const run = () => {
      const delay = first ? DISPLAY_MS : DISPLAY_MS + TRANSITION_MS;
      first = false;
      autoTimer.current = window.setTimeout(() => {
        if (!busyRef.current) advance();
        run();
      }, delay);
    };
    run();

    return clearAuto;
  }, [advance, clearAuto, inView, reducedMotion]);

  useEffect(
    () => () => {
      clearAuto();
      clearTick();
    },
    [clearAuto, clearTick]
  );

  return (
    <div
      ref={rootRef}
      className="hero-showcase"
      role="img"
      aria-label="Accrevia product interface showcase cycling through Overview, Analytics, Document Management, and Intelligent Search"
    >
      <div className="hero-stack-viewport">
        <div className="hero-stack-stage">
          {interfaces.map((panel, cardIndex) => (
            <div
              key={panel.key}
              ref={(node) => {
                cardRefs.current[cardIndex] = node;
              }}
              className="hero-stack-card"
              style={{ transformOrigin: '50% 50%' }}
              aria-hidden={cardIndex !== 0}
            >
              {panel}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
