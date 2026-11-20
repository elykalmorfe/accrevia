import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Files,
  FileText,
  GraduationCap,
  HelpCircle,
  Award,
  Search,
  Sparkles
} from 'lucide-react';
import { evidenceSearchExamples } from '../../data/options';

const CARD_COUNT = 3;
/** How long each dashboard stays readable in the foreground. */
const DISPLAY_MS = 5200;
/** Forward/back layered transition duration. */
const TRANSITION_MS = 1000;
/** Keep outgoing above incoming until it has clearly retreated. */
const STACK_SWAP_AT = 0.58;

/** Snapshot values aligned with the live dashboard reference screens. */
const PREVIEW = {
  aaccupCertified: 71,
  aaccupTotal: 82,
  aaccupPct: 86.6,
  copcRate: 92.7,
  iaLevel: 'Level III',
  iaCampuses: 7,
  isoRate: 86,
  instAttainment: 43,
  progAttainment: 87,
  cycle: '2025–2026'
} as const;

/**
 * Landing-only sample repository counts. Not connected to portal data, APIs, or storage.
 * 32 verified + 10 pending + 4 needs revision + 2 archived = 48 total.
 */
const SAMPLE_DOC_STATS = {
  total: 48,
  verified: 32,
  pending: 10,
  needsRevision: 4,
  archived: 2,
  /** Active repository excludes archived. */
  active: 46,
  verificationRate: 66.7
} as const;

type SampleDocStatus = 'Verified' | 'Pending Review' | 'Needs Revision';

type SampleDocument = {
  title: string;
  category: string;
  status: SampleDocStatus;
  uploaded: string;
  type: string;
};

/** Representative rows from the sample collection of 48 documents (landing preview only). */
const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    title: 'Faculty Qualifications and Credentials',
    category: 'AACCUP Area II',
    status: 'Verified',
    uploaded: 'Nov 12, 2025',
    type: 'PDF'
  },
  {
    title: 'Vision, Mission, Goals and Objectives',
    category: 'AACCUP Area I',
    status: 'Verified',
    uploaded: 'Nov 10, 2025',
    type: 'PDF'
  },
  {
    title: 'Curriculum and Syllabi Compilation',
    category: 'AACCUP Area III',
    status: 'Verified',
    uploaded: 'Nov 8, 2025',
    type: 'DOCX'
  },
  {
    title: 'Research Accomplishment Report',
    category: 'AACCUP Area IV',
    status: 'Pending Review',
    uploaded: 'Nov 6, 2025',
    type: 'PDF'
  },
  {
    title: 'Community Extension Report',
    category: 'AACCUP Area VI',
    status: 'Verified',
    uploaded: 'Nov 3, 2025',
    type: 'PDF'
  },
  {
    title: 'Certificate of Program Compliance',
    category: 'CHED COPC',
    status: 'Verified',
    uploaded: 'Oct 28, 2025',
    type: 'PDF'
  },
  {
    title: 'Internal Quality Audit Report',
    category: 'ISO 9001',
    status: 'Pending Review',
    uploaded: 'Oct 22, 2025',
    type: 'DOCX'
  },
  {
    title: 'Institutional Self-Survey Report',
    category: 'Institutional QA',
    status: 'Needs Revision',
    uploaded: 'Oct 18, 2025',
    type: 'PDF'
  }
];

const SAMPLE_DOCS_VISIBLE = SAMPLE_DOCUMENTS.slice(0, 5);

const ATTAINMENT_BARS = [
  { year: '2021', inst: 14, prog: 48 },
  { year: '2022', inst: 28, prog: 58 },
  { year: '2023', inst: 28, prog: 66 },
  { year: '2024', inst: 43, prog: 74 },
  { year: '2025', inst: 43, prog: 81 },
  { year: '2026', inst: 43, prog: 87 }
] as const;

function statusTone(status: SampleDocStatus) {
  if (status === 'Verified') return 'is-verified';
  if (status === 'Pending Review') return 'is-pending';
  return 'is-revision';
}

type Pose = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotateY: number;
  rotateZ: number;
  opacity: number;
};

/* -------------------------------------------------------------------------- */
/* Dashboard faces — miniature ACCREVIA UI previews                           */
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

function AttainmentChart() {
  return (
    <div className="hero-av-chart" aria-hidden="true">
      <div className="hero-av-chart-grid">
        {['100%', '50%', '0%'].map((label) => (
          <div key={label}>
            <span>{label}</span>
            <i />
          </div>
        ))}
      </div>
      <div className="hero-av-chart-bars">
        {ATTAINMENT_BARS.map((bar, i) => (
          <div key={bar.year} className="hero-av-chart-col">
            <div className="hero-av-pair">
              <b style={{ height: `${bar.inst}%`, transitionDelay: `${70 + i * 40}ms` }} />
              <b
                className="is-prog"
                style={{ height: `${bar.prog}%`, transitionDelay: `${95 + i * 40}ms` }}
              />
            </div>
            <span>{bar.year.slice(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccreditationOverview() {
  const kpis = [
    {
      label: 'AACCUP Programs',
      value: (
        <>
          {PREVIEW.aaccupCertified}
          <small>/{PREVIEW.aaccupTotal}</small>
        </>
      ),
      meta: `${PREVIEW.aaccupPct}% Certified`,
      hint: 'Level I to IV',
      icon: GraduationCap
    },
    {
      label: 'CHED COPC',
      value: `${PREVIEW.copcRate}%`,
      meta: 'Compliant',
      hint: 'Statutory PSGs',
      icon: FileCheck2
    },
    {
      label: 'Institutional (IA)',
      value: PREVIEW.iaLevel,
      meta: `${PREVIEW.iaCampuses} Campuses Monitored`,
      hint: 'Highest level',
      icon: Building2
    },
    {
      label: 'ISO 9001 & PQA',
      value: `${PREVIEW.isoRate}%`,
      meta: '0 Major NCs',
      hint: 'PQA track',
      icon: Award
    }
  ];

  return (
    <CardFace title="Dashboard" badge={`AY ${PREVIEW.cycle}`}>
      <div className="hero-dash hero-dash-overview">
        <div className="hero-av-kpi-row hero-enter-stagger">
          {kpis.map(({ label, value, meta, hint, icon: Icon }) => (
            <div key={label} className="hero-av-kpi">
              <div className="hero-av-kpi-top">
                <span>{label}</span>
                <em>
                  <Icon className="h-3 w-3" />
                </em>
              </div>
              <strong>{value}</strong>
              <div className="hero-av-kpi-meta">
                <span>{meta}</span>
                <span>{hint}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-av-panel hero-av-attainment">
          <div className="hero-av-panel-head">
            <div>
              <p className="hero-av-title">Accreditation Attainment</p>
              <p className="hero-av-sub">2021 – 2026 Academic Cycles</p>
            </div>
            <div className="hero-av-legend">
              <span>
                <i className="is-inst" />
                Institutional
              </span>
              <span>
                <i className="is-prog" />
                Programs
              </span>
            </div>
          </div>
          <div className="hero-av-summary">
            <div>
              <Building2 className="h-3 w-3" />
              <div>
                <span>Institutional Attainment</span>
                <strong>{PREVIEW.instAttainment}%</strong>
              </div>
            </div>
            <div>
              <GraduationCap className="h-3 w-3" />
              <div>
                <span>Program Attainment</span>
                <strong className="is-sky">{PREVIEW.progAttainment}%</strong>
              </div>
            </div>
          </div>
          <AttainmentChart />
          <div className="hero-av-foot">
            <span>
              <CheckCircle2 className="h-3 w-3" />
              {PREVIEW.progAttainment}% of programs accredited as of 2026
            </span>
            <span>
              {SAMPLE_DOC_STATS.verified}/{SAMPLE_DOC_STATS.total} docs verified · {SAMPLE_DOC_STATS.verificationRate}%
            </span>
          </div>
        </div>
      </div>
    </CardFace>
  );
}

function DocumentManagement() {
  const kpis = [
    {
      label: 'Active Repository',
      value: SAMPLE_DOC_STATS.active,
      desc: `Excludes ${SAMPLE_DOC_STATS.archived} archived`,
      icon: FileText,
      tone: ''
    },
    {
      label: 'Approved Documents',
      value: SAMPLE_DOC_STATS.verified,
      desc: `${SAMPLE_DOC_STATS.verificationRate}% of active documents`,
      icon: CheckCircle2,
      tone: 'is-green'
    },
    {
      label: 'Pending Review',
      value: SAMPLE_DOC_STATS.pending,
      desc: `${Math.round((SAMPLE_DOC_STATS.pending / SAMPLE_DOC_STATS.active) * 100)}% of active documents`,
      icon: Clock3,
      tone: 'is-blue'
    },
    {
      label: 'Needs Revision',
      value: SAMPLE_DOC_STATS.needsRevision,
      desc: `${Math.round((SAMPLE_DOC_STATS.needsRevision / SAMPLE_DOC_STATS.active) * 100)}% of active documents`,
      icon: AlertTriangle,
      tone: 'is-amber'
    }
  ];

  return (
    <CardFace title="All Documents">
      <div className="hero-dash hero-dash-docs">
        <div className="hero-av-kpi-row hero-enter-stagger">
          {kpis.map(({ label, value, desc, icon: Icon, tone }) => (
            <div key={label} className={`hero-doc-kpi ${tone}`}>
              <div className="hero-av-kpi-top">
                <span>{label}</span>
                <em>
                  <Icon className="h-3 w-3" />
                </em>
              </div>
              <strong>{value}</strong>
              <p>{desc}</p>
            </div>
          ))}
        </div>

        <div className="hero-doc-panel">
          <div className="hero-doc-toolbar-bar">
            <p>
              Showing <strong>{SAMPLE_DOCS_VISIBLE.length}</strong> of{' '}
              <strong>{SAMPLE_DOC_STATS.active}</strong> active documents
            </p>
            <span>Sorted by latest upload date</span>
          </div>
          <div className="hero-doc-filters">
            <div className="hero-doc-search">
              <Search className="h-3.5 w-3.5" />
              <span>Search by title, keyword, office, or campus...</span>
            </div>
            <span className="hero-doc-select">Accreditation</span>
            <span className="hero-doc-select">Campus</span>
            <span className="hero-doc-select">Document type</span>
          </div>
          <div className="hero-doc-list hero-enter-stagger">
            {SAMPLE_DOCS_VISIBLE.map((doc) => (
              <div key={doc.title} className="hero-sample-doc">
                <span className="hero-sample-doc-icon">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p>{doc.title}</p>
                  <span>
                    {doc.category} · {doc.type} · {doc.uploaded}
                  </span>
                </div>
                <em className={`hero-sample-badge ${statusTone(doc.status)}`}>{doc.status}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardFace>
  );
}

function IntelligentSearch() {
  const suggestions = evidenceSearchExamples;
  const categories = ['AACCUP', 'CHED COPC', 'Institutional QA', 'Evidence'];

  return (
    <CardFace title="Intelligent Document Retrieval">
      <div className="hero-dash hero-dash-search">
        <div className="hero-search-hero">
          <h3>
            <Sparkles className="h-3.5 w-3.5" />
            Find the document you need, faster.
          </h3>
          <p>Search accreditation documents, criteria, and supporting evidence across your institution.</p>
          <div className="hero-search-row">
            <div className="hero-search-field">
              <Search className="h-3.5 w-3.5" />
              <span>Search accreditation documents, criteria, or keywords...</span>
            </div>
            <span className="hero-qa-guide">
              <HelpCircle className="h-3.5 w-3.5" />
              QA Guide
            </span>
          </div>
        </div>

        <div className="hero-search-body">
          <div className="hero-search-suggest hero-enter-stagger">
            <p className="hero-av-mini">Suggested searches</p>
            <ul>
              {suggestions.map((item) => (
                <li key={item}>
                  <Search className="h-3 w-3" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hero-search-side">
            <p className="hero-av-mini">Accreditation categories</p>
            <div className="hero-search-cats">
              {categories.map((cat, i) => (
                <span key={cat} className={i === 0 ? 'is-active' : undefined}>
                  {cat}
                </span>
              ))}
            </div>
            <div className="hero-search-stats">
              <strong>{SAMPLE_DOC_STATS.total}</strong>
              <span>indexed documents · {SAMPLE_DOC_STATS.verificationRate}% verified</span>
            </div>
            <div className="hero-search-nav">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      </div>
    </CardFace>
  );
}

/* -------------------------------------------------------------------------- */
/* Layered 3D carousel helpers                                                */
/* -------------------------------------------------------------------------- */

function depthFor(cardIndex: number, active: number) {
  return (cardIndex - active + CARD_COUNT) % CARD_COUNT;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
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
    z: lerp(a.z, b.z, t),
    scale: lerp(a.scale, b.scale, t),
    rotateY: lerp(a.rotateY, b.rotateY, t),
    rotateZ: lerp(a.rotateZ, b.rotateZ, t),
    opacity: lerp(a.opacity, b.opacity, t)
  };
}

/** Resting layered stack: front card clear, next card visible behind with depth. */
function restPose(depth: number, compact: boolean): Pose {
  if (compact) {
    // Flatter stack on small screens — less 3D exaggeration.
    const scale = [1, 0.96, 0.93, 0.91][depth] ?? 0.91;
    const y = [0, 6, 11, 15][depth] ?? 15;
    const z = [0, -24, -44, -62][depth] ?? -62;
    const opacity = [1, 0.95, 0.8, 0.62][depth] ?? 0.62;
    return { x: 0, y, z, scale, rotateY: 0, rotateZ: 0, opacity };
  }

  // Active scale 1; immediate background ~0.95 for a readable layered deck.
  const scale = [1, 0.95, 0.92, 0.9][depth] ?? 0.9;
  const y = [0, 8, 14, 20][depth] ?? 20;
  const z = [0, -40, -76, -108][depth] ?? -108;
  const opacity = [1, 1, 0.84, 0.66][depth] ?? 0.66;
  return { x: 0, y, z, scale, rotateY: 0, rotateZ: 0, opacity };
}

/**
 * Outgoing front card: gently scales down and retreats on Z with mild yaw,
 * then settles into the back of the new stack (no sideways white-panel exit).
 */
function sampleOutgoing(progress: number, compact: boolean, finalDepth: number): Pose {
  const start = restPose(0, compact);
  const end = restPose(finalDepth, compact);
  const mid: Pose = {
    x: compact ? -2 : -4,
    y: compact ? 5 : 7,
    z: compact ? -28 : -52,
    scale: compact ? 0.965 : 0.955,
    rotateY: compact ? -3.5 : -5,
    rotateZ: compact ? -0.35 : -0.55,
    opacity: 0.98
  };
  const t = easeInOutCubic(progress);
  if (t < 0.5) return lerpPose(start, mid, t / 0.5);
  return lerpPose(mid, end, (t - 0.5) / 0.5);
}

/** Incoming card rises from just behind the front into full focus. */
function sampleIncoming(progress: number, compact: boolean, fromDepth: number): Pose {
  const start = restPose(fromDepth, compact);
  const end = restPose(0, compact);
  const mid: Pose = {
    x: compact ? 1.5 : 2.5,
    y: compact ? 3 : 4,
    z: compact ? -8 : -12,
    scale: compact ? 0.98 : 0.985,
    rotateY: compact ? 2.5 : 4,
    rotateZ: 0.25,
    opacity: 1
  };
  const t = easeInOutCubic(progress);
  if (t < 0.42) return lerpPose(start, mid, t / 0.42);
  return lerpPose(mid, end, (t - 0.42) / 0.58);
}

function poseToTransform(pose: Pose) {
  return `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) scale(${pose.scale}) rotateY(${pose.rotateY}deg) rotateZ(${pose.rotateZ}deg)`;
}

function stackZ(cardIndex: number, active: number, next: number | null, progress: number) {
  if (next === null) return CARD_COUNT - depthFor(cardIndex, active);

  // Keep outgoing above incoming until it has retreated far enough to avoid flicker.
  if (cardIndex === active) return progress < STACK_SWAP_AT ? 40 : 16;
  if (cardIndex === next) return progress < STACK_SWAP_AT ? 28 : 40;
  const relativeTo = progress < STACK_SWAP_AT ? active : next;
  return 12 - depthFor(cardIndex, relativeTo);
}

/**
 * Automatic layered 3D dashboard carousel for the landing hero.
 * Cards stay fully rendered; transitions use Z-depth, scale, and mild yaw.
 */
export function EvidenceMotionGraphic() {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [compact, setCompact] = useState(false);
  const [inView, setInView] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeRef = useRef(0);
  const busyRef = useRef(false);
  const compactRef = useRef(false);
  const reducedRef = useRef(!!reducedMotion);
  const rafRef = useRef<number | null>(null);
  const autoTimer = useRef<number | null>(null);

  compactRef.current = compact;
  reducedRef.current = !!reducedMotion;

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
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.28),
      { threshold: [0, 0.28, 0.55] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const interfaces = useMemo(
    () =>
      [
        <AccreditationOverview key="overview" />,
        <DocumentManagement key="documents" />,
        <IntelligentSearch key="search" />
      ] as const,
    []
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

      for (let i = 0; i < CARD_COUNT; i += 1) {
        const el = cardRefs.current[i];
        if (!el) continue;

        let pose: Pose;

        if (reduced) {
          pose = { ...restPose(0, compactMode), opacity: i === from ? 1 : 0 };
        } else if (to === null) {
          pose = restPose(depthFor(i, from), compactMode);
        } else if (i === from) {
          pose = sampleOutgoing(progress, compactMode, depthFor(i, to));
        } else if (i === to) {
          pose = sampleIncoming(progress, compactMode, depthFor(i, from));
        } else {
          pose = lerpPose(
            restPose(depthFor(i, from), compactMode),
            restPose(depthFor(i, to), compactMode),
            easeInOutCubic(progress)
          );
        }

        const frontIndex = to === null ? from : progress >= STACK_SWAP_AT ? to : from;
        const isFront = i === frontIndex;
        // Hold depth cues stable until swap to avoid brightness flicker mid-transition.
        const depthBase = to === null || progress >= STACK_SWAP_AT ? (to ?? from) : from;
        const depth = depthFor(i, depthBase);
        const dimDepth = to !== null && (i === from || i === to) ? 0 : depth;

        el.style.transform = poseToTransform(pose);
        el.style.opacity = String(pose.opacity);
        el.style.zIndex = String(reduced ? (i === from ? CARD_COUNT : 0) : stackZ(i, from, to, progress));
        el.classList.toggle('is-front', isFront);
        el.classList.toggle('is-exiting', to !== null && i === from);
        el.classList.toggle('is-incoming', to !== null && i === to);
        el.classList.toggle('is-depth-1', dimDepth === 1);
        el.classList.toggle('is-depth-2', dimDepth >= 2);
        el.setAttribute('aria-hidden', isFront ? 'false' : 'true');
      }
    },
    []
  );

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
      setActiveIndex(next);
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
    clearRaf();
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = clamp01((now - startedAt) / TRANSITION_MS);
      paint({
        from,
        to: next,
        progress,
        reduced: false,
        compactMode: compactRef.current
      });

      if (progress >= 1) {
        clearRaf();
        activeRef.current = next;
        setActiveIndex(next);
        paint({
          from: next,
          to: null,
          progress: 1,
          reduced: false,
          compactMode: compactRef.current
        });
        busyRef.current = false;
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }, [clearRaf, paint]);

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
      clearRaf();
    },
    [clearAuto, clearRaf]
  );

  return (
    <div
      ref={rootRef}
      className="hero-showcase"
      role="img"
      aria-label="Accrevia product interface showcase cycling through Overview, Document Management, and Intelligent Search"
      data-active={activeIndex}
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
              style={{ transformOrigin: '50% 55%' }}
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
