import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Search, ShieldCheck, Sparkles, Users, Building2, MapPin, Mail, Phone, CalendarClock, Menu, X, FileStack, FileSearch, GraduationCap, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EvidenceMotionGraphic } from './EvidenceMotionGraphic';

const features = [
  {
    icon: Search,
    title: 'Intelligent Document Search',
    description: 'Retrieve relevant accreditation evidence using keywords, criteria, and natural-language queries in seconds.'
  },
  {
    icon: Sparkles,
    title: 'Hybrid Information Retrieval',
    description: 'Combine lexical and semantic search to surface the most relevant records with high confidence.'
  },
  {
    icon: FileText,
    title: 'Centralized Document Repository',
    description: 'Keep all institutional evidence, reports, and supporting files in one secure, searchable workspace.'
  },
  {
    icon: Building2,
    title: 'Accreditation-Based Organization',
    description: 'Group evidence by standards, indicators, programs, and accreditation areas for easier review.'
  },
  {
    icon: Users,
    title: 'Document Accessibility',
    description: 'Provide authorized users with quick access to the materials they need for governance and review.'
  },
  {
    icon: ShieldCheck,
    title: 'Ranked Search Results',
    description: 'Prioritize documents by relevance so quality assurance teams can act faster and with more clarity.'
  }
];

const activities = [
  {
    title: 'ISO Quality Management Training',
    date: 'July 30, 2026',
    location: 'Academic Building',
    status: 'Completed',
    description: 'A workshop focused on process documentation, records maintenance, and evidence traceability.',
    tag: 'Training'
  },
  {
    title: 'Program Accreditation Preparation',
    date: 'August 25, 2026',
    location: 'College of Engineering',
    status: 'Completed',
    description: 'Faculty and program coordinators completed evidence consolidation and standards mapping activities.',
    tag: 'Program'
  },
  {
    title: 'Internal Quality Assurance Audit',
    date: 'September 12, 2026',
    location: 'Quality Assurance Office',
    status: 'Ongoing',
    description: 'Cross-functional review of documentation, compliance records, and institutional evidence alignment.',
    tag: 'Audit'
  },
  {
    title: 'Accreditation Survey Visit',
    date: 'October 18, 2026',
    location: 'NEMSU Main Campus',
    status: 'Upcoming',
    description: 'Preparation and walkthrough for the upcoming external accreditation survey and evidentiary review.',
    tag: 'Survey'
  }
];

type Activity = (typeof activities)[number];

const chronologicalActivities = [...activities].sort(
  (first, second) => Date.parse(first.date) - Date.parse(second.date)
);

function ActivityTimelineItem({ activity }: { activity: Activity }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasMounted = useRef(false);
  const frontButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const ActivityIcon = activity.tag === 'Training'
    ? GraduationCap
    : activity.tag === 'Audit'
      ? ClipboardCheck
      : Building2;
  const badgeColor =
    activity.status === 'Upcoming' ? 'border-amber-200 bg-amber-50 text-amber-700' :
    activity.status === 'Ongoing' ? 'border-cyan-200 bg-cyan-50 text-cyan-700' :
      'border-emerald-200 bg-emerald-50 text-emerald-700';
  const markerColor =
    activity.status === 'Upcoming' ? 'bg-amber-400 ring-amber-100' :
    activity.status === 'Ongoing' ? 'bg-cyan-400 ring-cyan-100' :
      'bg-emerald-400 ring-emerald-100';

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    (isFlipped ? backButtonRef : frontButtonRef).current?.focus();
  }, [isFlipped]);

  return (
    <article className="activity-timeline-item group relative min-w-0" data-status={activity.status.toLowerCase()}>
      <div className="activity-flip-scene">
        <div className={`activity-flip-card${isFlipped ? ' is-flipped' : ''}`}>
          <div
            className="activity-flip-face activity-flip-front"
            aria-hidden={isFlipped}
          >
            <span className="activity-card-image">
              <img src="/nemsu-background.png" alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-slate-900/10" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-slate-950/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                <ActivityIcon className="h-3.5 w-3.5" />
                {activity.tag}
              </span>
              <span className={`absolute right-4 top-4 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ${badgeColor}`}>
                {activity.status}
              </span>
              <span className="absolute bottom-4 left-4 right-4 text-left text-xs font-semibold text-white/85">
                NEMSU Quality Assurance Office
              </span>
            </span>
            <span className="flex min-h-0 flex-1 flex-col items-start p-4 text-left">
              <span className="text-base font-bold leading-snug text-slate-900">{activity.title}</span>
              <span className="mt-3 flex flex-col gap-2.5 text-xs text-slate-600">
                <span className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span>{activity.date}</span>
                </span>
                <span className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span>{activity.location}</span>
                </span>
              </span>
              <button
                type="button"
                ref={frontButtonRef}
                className="activity-view-details mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-blue-700"
                onClick={() => setIsFlipped(true)}
                aria-label={`View details for ${activity.title}`}
                tabIndex={isFlipped ? -1 : 0}
              >
                View Details
                <ArrowRight className="h-4 w-4" />
              </button>
            </span>
          </div>

          <div
            className="activity-flip-face activity-flip-back"
            aria-hidden={!isFlipped}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                <ActivityIcon className="h-3.5 w-3.5" />
                {activity.tag}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeColor}`}>
                {activity.status}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">{activity.title}</h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">Activity overview</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{activity.description}</p>
            <div className="mt-auto border-t border-slate-100 pt-4">
              <button
                type="button"
                ref={backButtonRef}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                onClick={() => setIsFlipped(false)}
                tabIndex={isFlipped ? 0 : -1}
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                Back to Overview
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="activity-timeline-marker">
        <span className={`activity-timeline-marker-dot relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 shadow-sm ${markerColor}`}>
          <span className="h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="activity-timeline-date text-xs font-semibold tracking-wide text-slate-500">
          {activity.date}
        </span>
      </div>
    </article>
  );
}

const benefitPoints = [
  'Centralize accreditation evidence documents and related records.',
  'Organize institutional records and supporting documentation effectively.',
  'Retrieve relevant evidence using keywords, criteria, and natural language.',
  'Improve accessibility and retrieval efficiency for QA personnel and accreditors.',
  'Support faculty, staff, and institutional evaluators with a single source of truth.'
];

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'NEMSU QA Office', href: '#qa-office' },
  { label: 'Contact', href: '#contact' }
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page min-h-screen bg-[#f4f7fc] text-slate-900">
      <header className="landing-header sticky top-0 z-40 border-b backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-3" aria-label="Accrevia home">
            <img src="/nemsu-landing-logo.png" alt="NEMSU logo" className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11" />
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900">Accrevia</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quality Assurance Management</div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-blue-600">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 sm:inline-flex">
              Login
            </Link>
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden shadow-lg">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 border-t border-slate-100 pt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="home">
        <section className="landing-hero relative overflow-hidden flex items-center">
          {/* Centered highlights bar — absolutely pinned to the bottom of the hero */}
          <div className="absolute bottom-8 left-0 right-0 z-10 hero-highlights-entrance">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-3 sm:flex-row sm:gap-10 sm:px-6 sm:py-4 lg:px-8">
              <div className="flex items-center gap-2.5">
                <FileStack className="h-5 w-5 shrink-0 text-blue-400" strokeWidth={2} />
                <span className="text-sm font-medium text-white">Centralized Evidence Management</span>
              </div>
              <div className="hidden h-4 w-px bg-white/20 sm:block" />
              <div className="flex items-center gap-2.5">
                <FileSearch className="h-5 w-5 shrink-0 text-blue-400" strokeWidth={2} />
                <span className="text-sm font-medium text-white">Intelligent Document Retrieval</span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 pb-24 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-20 lg:pb-28 lg:px-8 xl:gap-12">
            <div className="z-10 flex flex-col justify-center lg:col-span-5">
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-5xl xl:text-6xl leading-[1.12]">
                Making Every Evidence Accessible, Organized, and Accountable.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-blue-50/90">
                Accrevia provides NEMSU with a smarter way to manage accreditation documentation, ensuring that institutional evidence is organized, accessible, and easier to retrieve whenever needed.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-blue-400">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#about" className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:border-white/70 hover:bg-white/20">
                  Learn More
                </a>
              </div>
            </div>

            <div className="relative flex w-full items-center justify-center lg:col-span-7 lg:justify-end -mt-16 lg:-mt-28">
              {/* Subtle ambient 3D backlight glow */}
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-cyan-400/25 blur-3xl opacity-75" />
              <EvidenceMotionGraphic />
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">About Accrevia</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              A streamlined, intelligent platform for institutional accreditation evidence management.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-lg leading-8 text-slate-600">
                Accrevia centralizes accreditation evidence, organizes institutional records, and makes relevant files easier to locate using keywords, criteria, and natural-language queries. It supports the day-to-day demands of quality assurance offices while helping faculty, administrators, and accreditors work from a single source of truth.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefitPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <p className="mt-4 text-base leading-7 text-slate-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-gradient-to-br from-[#102b56] to-[#071a38] py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">Key Features</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Built to support evidence retrieval and quality assurance workflows.</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <div className="inline-flex rounded-2xl bg-blue-600/20 p-3 text-blue-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="qa-office" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Quality Assurance Activities</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Quality Assurance Activities &amp; Accreditation Updates</h2>
          </div>

          <div className="activity-timeline-grid">
            {chronologicalActivities.map((activity) => (
              <ActivityTimelineItem key={activity.title} activity={activity} />
            ))}
          </div>
        </section>

        <section id="contact" className="bg-slate-900 text-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex items-center gap-3">
                  <img src="/nemsu-landing-logo.png" alt="NEMSU logo" className="h-10 w-10 shrink-0 object-contain" />
                  <div>
                    <div className="text-lg font-bold text-white">Accrevia</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Quality Assurance Office</div>
                  </div>
                </div>
                <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                  A modern digital platform designed to support accreditation evidence retrieval, institutional records management, and quality assurance operations across NEMSU.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Contact Information</h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-300" /> qa-office@nemsu.edu.ph</li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-300" /> +63 (88) 555-0101</li>
                  <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-300" /> NEMSU Main Campus, Quality Assurance Office</li>
                </ul>
              </div>

            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Accrevia. All rights reserved.</p>
              <div className="flex items-center gap-5">
                <a href="#" className="transition hover:text-white">Privacy Policy</a>
                <a href="#" className="transition hover:text-white">Terms and Conditions</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
