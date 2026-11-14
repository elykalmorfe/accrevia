import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  FileSearchIcon,
  FolderOpenIcon,
  GraduationCapIcon,
  InfoIcon,
  LayoutGridIcon
} from 'lucide-react';

const exploreLinks = [
  {
    to: '/open/search',
    title: 'Search Documents',
    description: 'Find published documents by keyword and filters.',
    icon: FileSearchIcon
  },
  {
    to: '/open/browse',
    title: 'Accreditation Repository',
    description: 'Browse certificates, technical review access demos, and COPC sample records.',
    icon: FolderOpenIcon
  },
  {
    to: '/open/areas',
    title: 'Accreditation Areas',
    description: 'View documents grouped by accreditation area.',
    icon: LayoutGridIcon
  },
  {
    to: '/open/programs',
    title: 'Academic Programs',
    description: 'View documents associated with academic programs.',
    icon: GraduationCapIcon
  }
] as const;

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
            The Faculty &amp; Staff Accreditation Resource Center provides signed-in access to accreditation documents
            and compliance records curated for NEMSU faculty and staff use.
          </p>
        </div>
      </section>

      <section aria-labelledby="about-intro-heading" className="panel p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
            <InfoIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="about-intro-heading" className="text-lg font-extrabold tracking-tight text-ink">
              Introduction
            </h2>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted">
              Signed-in faculty and staff can use this resource center to discover accreditation evidence released by
              the Quality Assurance Office. Restricted Technical Review materials remain hidden until a separate
              authorized backend integration is available.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-portal-heading" className="space-y-3">
        <h2 id="about-portal-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          About the Faculty &amp; Staff Resource Center
        </h2>
        <div className="panel p-5 sm:p-6">
          <p className="text-[14px] font-medium leading-relaxed text-ink-muted">
            The resource center is designed to improve access to accreditation evidence for institutional users. Faculty
            and staff can search and browse eligible documents, open previews when a format is supported, and follow
            demo workflows for restricted Technical Review access requests.
          </p>
          <ul className="mt-4 space-y-2 text-[14px] font-medium text-ink-muted">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
              Improve access to publicly available accreditation evidence.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
              Support document discovery across areas and programs.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
              Allow visitors to search and browse approved public documents.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
              Provide document previews and downloads where available.
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="about-publication-heading" className="space-y-3">
        <h2 id="about-publication-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          Document Publication
        </h2>
        <div className="panel p-5 sm:p-6">
          <p className="text-[14px] font-medium leading-relaxed text-ink-muted">
            Documents become available on this portal only after the Quality Assurance Office has approved them and
            explicitly published them for public access. Setting a document’s confidentiality to Public alone does not
            publish it. Confidential, unapproved, archived, and unpublished documents are not listed here.
          </p>
        </div>
      </section>

      <section aria-labelledby="about-explore-heading" className="space-y-4">
        <div>
          <h2 id="about-explore-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            Explore the Portal
          </h2>
          <p className="mt-1 text-[13px] font-medium text-ink-muted">
            Start with any of these public discovery tools.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {exploreLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="panel panel-hover flex items-start gap-3 p-4 no-underline sm:p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-[12px] font-medium text-ink-muted">{item.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700">
                    Open
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="about-contact-heading" className="space-y-3">
        <h2 id="about-contact-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          Contact Information
        </h2>
        <div className="panel p-5 sm:p-6">
          <p className="text-[14px] font-medium leading-relaxed text-ink-muted">
            This prototype does not include a verified public contact listing for the Quality Assurance Office. For
            official inquiries, please use North Eastern Mindanao State University’s established communication channels.
          </p>
          <p className="mt-3 text-[13px] font-medium text-ink-subtle">
            Need help using the portal? Visit{' '}
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
