import { Link } from 'react-router-dom';
import {
  AwardIcon,
  FileCheck2Icon,
  FileSpreadsheetIcon,
  GraduationCapIcon,
  InboxIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
  type LucideIcon
} from 'lucide-react';

const features: {
  to: string;
  title: string;
  description: string;
  required: string;
  icon: LucideIcon;
}[] = [
  {
    to: '/open/search',
    title: 'Search',
    description: 'Find a published document or one shared with you.',
    required: 'None. Optional: keyword, document type, program, academic year',
    icon: SearchIcon
  },
  {
    to: '/open/frameworks/ia',
    title: 'Institutional (IA)',
    description: 'Campus institutional accreditation areas and files.',
    required: 'Campus',
    icon: ShieldCheckIcon
  },
  {
    to: '/open/frameworks/pa',
    title: 'Program (AACCUP)',
    description: 'Program accreditation records and evidence.',
    required: 'Program',
    icon: GraduationCapIcon
  },
  {
    to: '/open/frameworks/copc',
    title: 'CHED COPC',
    description: 'Certificate of Program Compliance records.',
    required: 'Program',
    icon: FileCheck2Icon
  },
  {
    to: '/open/frameworks/pqa',
    title: 'PQA',
    description: 'Philippine Quality Award records for the campus.',
    required: 'Campus',
    icon: AwardIcon
  },
  {
    to: '/open/frameworks/iso',
    title: 'ISO 9001',
    description: 'ISO 9001 records for the campus.',
    required: 'Campus',
    icon: FileSpreadsheetIcon
  },
  {
    to: '/open/requests',
    title: 'Requests',
    description: 'Ask the QA Office for a document and follow the reply.',
    required: 'Request type, subject, message. Optional: priority, program or campus, file',
    icon: InboxIcon
  },
  {
    to: '/open/account',
    title: 'Account',
    description: 'Your name, role, office, and email. Appearance is optional.',
    required: 'None',
    icon: UserIcon
  }
];

export function OpenAbout() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section
        aria-labelledby="open-about-heading"
        className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-canvas px-5 py-7 sm:px-8 sm:py-9"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">About & Help</p>
          <h1
            id="open-about-heading"
            className="mt-2 font-sans text-[24px] font-extrabold tracking-tight text-ink xs:text-[28px] sm:text-[32px]"
          >
            About the Quality Assurance Office
          </h1>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted sm:text-[15px]">
            This portal is where NEMSU faculty and staff open accreditation records the Quality Assurance Office has
            released, and where you ask for a document you still need.
          </p>
        </div>
      </section>

      <section aria-labelledby="about-features-heading" className="space-y-4">
        <div>
          <h2 id="about-features-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            What you can use
          </h2>
          <p className="mt-1 text-[13px] font-medium text-ink-muted">
            Each feature asks only for the details it needs.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="panel panel-hover flex items-start gap-3 p-4 no-underline sm:p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-ink-muted">{item.description}</p>
                  <p className="mt-2 text-[12px] font-semibold text-brand-700">Required: {item.required}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="about-publication-heading" className="space-y-3">
        <h2 id="about-publication-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          Which documents appear
        </h2>
        <div className="panel p-5 sm:p-6">
          <p className="text-[14px] font-medium leading-relaxed text-ink-muted">
            A document shows here after the Quality Assurance Office publishes it, or after someone shares it with you.
            Files that are still in review, confidential, or archived stay off this portal.
          </p>
          <p className="mt-3 text-[13px] font-medium text-ink-subtle">
            Framework pages are for reading, preview, and download. Uploading and editing stay with the QA Office.
          </p>
          <p className="mt-4 text-[13px] font-medium text-ink-muted">
            <SettingsIcon className="mr-1 inline h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
            Personal choices such as campus, sidebar, and date format are in{' '}
            <Link to="/open/settings" className="font-semibold text-brand-700 hover:underline">
              Settings
            </Link>
            . For step-by-step help, open{' '}
            <Link to="/open/help" className="font-semibold text-brand-700 hover:underline">
              Help & Guidelines
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
