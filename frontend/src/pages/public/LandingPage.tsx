import React, { useState } from 'react';
import {
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Menu,
  X,
  ClipboardCheck,
  FolderOpen,
  SearchCheck
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { EvidenceMotionGraphic } from './EvidenceMotionGraphic';
import { FeatureShowcase } from './FeatureShowcase';
import { ActivitiesShowcase, type LandingActivity } from './ActivitiesShowcase';

const activities: LandingActivity[] = [
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

const aboutHighlights = [
  {
    icon: FolderOpen,
    title: 'Centralized Documents',
    description: 'Organize institutional accreditation documents within one structured platform.'
  },
  {
    icon: SearchCheck,
    title: 'Intelligent Retrieval',
    description: 'Find relevant documents using intelligent search capabilities.'
  },
  {
    icon: ClipboardCheck,
    title: 'Quality Assurance Support',
    description: 'Support organized document preparation and institutional quality assurance activities.'
  }
] as const;

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'NEMSU QA Office', href: '#qa-office' },
  { label: 'Contact', href: '#contact' }
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="landing-page min-h-screen bg-[#f4f7fc] text-slate-900">
      <header className="landing-header sticky top-0 z-40 border-b backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-3" aria-label="Accrevia home">
            <img src="/nemsu-logo.png" alt="NEMSU logo" className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11" />
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
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500">
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
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 pb-20 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-20 lg:pb-24 lg:px-8 xl:gap-12">
            <div className="z-10 flex flex-col justify-center lg:col-span-5">
              <p className="hero-eyebrow text-sm font-semibold uppercase tracking-[0.24em] text-blue-200">
                Accreditation Management
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.15rem] xl:text-6xl leading-[1.1]">
                Every Document. Organized. Easier to Find.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-blue-50/95 sm:text-lg">
                Accrevia helps NEMSU centralize accreditation documents, organize institutional records, and intelligently retrieve relevant documents through a unified quality assurance platform.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-400"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-white/45 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:border-white/75 hover:bg-white/20"
                >
                  Explore Features
                </a>
              </div>
            </div>

            <div className="relative z-10 flex w-full items-center justify-center lg:col-span-7 lg:justify-end">
              <EvidenceMotionGraphic />
            </div>
          </div>
        </section>

        <section id="about" className="landing-about" aria-labelledby="about-heading">
          <div className="landing-about-inner">
            <motion.div
              className="landing-about-intro"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="landing-about-eyebrow">About Accrevia</p>
              <h2 id="about-heading" className="landing-about-heading">
                Simplifying Accreditation Document Management.
              </h2>
              <p className="landing-about-copy">
                Accrevia is a centralized document management and intelligent retrieval platform designed to support
                NEMSU&apos;s accreditation and quality assurance processes.
              </p>
            </motion.div>

            <ul className="landing-about-highlights">
              {aboutHighlights.map(({ icon: Icon, title, description }, index) => (
                <motion.li
                  key={title}
                  className="landing-about-highlight"
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.45,
                    delay: reduceMotion ? 0 : 0.08 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <span className="landing-about-icon" aria-hidden="true">
                    <Icon strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        <section id="features" className="landing-features" aria-labelledby="features-heading">
          <div className="landing-features-inner">
            <div className="landing-features-header">
              <p className="landing-features-eyebrow">Platform Capabilities</p>
              <h2 id="features-heading" className="landing-features-heading">
                Powerful Tools for Smarter Document Management.
              </h2>
              <p className="landing-features-copy">
                Explore the capabilities that help NEMSU organize, manage, and retrieve accreditation documents.
              </p>
            </div>

            <FeatureShowcase />
          </div>
        </section>

        <section id="qa-office" className="landing-activities" aria-labelledby="activities-heading">
          <div className="landing-activities-inner">
            <motion.div
              className="landing-activities-header"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="landing-activities-eyebrow">NEMSU Quality Assurance Office</p>
              <h2 id="activities-heading" className="landing-activities-heading">
                Accreditation in Action.
              </h2>
              <p className="landing-activities-copy">
                Explore accreditation-related activities, institutional preparations, evaluations, and quality
                assurance initiatives involving NEMSU&apos;s QA personnel and academic community.
              </p>
            </motion.div>

            <ActivitiesShowcase activities={activities} />
          </div>
        </section>

        <section id="contact" className="bg-slate-900 text-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex items-center gap-3">
                  <img src="/nemsu-logo.png" alt="NEMSU logo" className="h-10 w-10 shrink-0 object-contain" />
                  <div>
                    <div className="text-lg font-bold text-white">Accrevia</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Quality Assurance Office</div>
                  </div>
                </div>
                <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                  A modern digital platform designed to support accreditation documents retrieval, institutional records management, and quality assurance operations across NEMSU.
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
