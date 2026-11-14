import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  DownloadIcon,
  EyeIcon,
  FileSearchIcon,
  FolderOpenIcon,
  HelpCircleIcon
} from 'lucide-react';

const faqs = [
  {
    q: 'Do I need an account?',
    a: 'Yes. The Faculty & Staff Resource Center requires a signed-in institutional account. Sign in from the ACCREVIA login page to use /open routes.'
  },
  {
    q: 'Are all QA documents available here?',
    a: 'No. Only documents that are eligible for faculty/staff viewing appear here. Restricted Technical Review materials require a demo access request and never expose Drive filenames or links in this portal.'
  },
  {
    q: 'Why can’t I find a document?',
    a: 'It may be unpublished, confidential, still awaiting approval, archived, or outside the filters you applied. Try clearing filters or browsing by area or program.'
  },
  {
    q: 'Can I download documents?',
    a: 'Yes, when a published document has an original file stored and remains publicly eligible. A listed document may still lack a downloadable file if the original is missing.'
  },
  {
    q: 'What should I do if a preview fails?',
    a: 'Some formats cannot be shown inline in the browser. Try Download when available, or return later if the file is temporarily unavailable.'
  },
  {
    q: 'What is the difference between Search and Browse?',
    a: 'Search focuses on keywords and filters. Browse emphasizes exploring the collection through categories such as accreditation areas and academic programs.'
  },
  {
    q: 'How are Recently Published documents ordered?',
    a: 'They are ordered by the public publication date (`publicPublishedAt`), newest first by default.'
  },
  {
    q: 'How are Featured Documents selected?',
    a: 'This prototype automatically highlights recently published eligible documents. There is no separate manual featured designation yet, so Featured is not a QA-curated shortlist.'
  }
] as const;

export function OpenHelp() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section
        aria-labelledby="open-help-heading"
        className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-canvas px-5 py-7 sm:px-8 sm:py-9"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">About & Help</p>
          <h1
            id="open-help-heading"
            className="mt-2 font-sans text-[24px] font-extrabold tracking-tight text-ink xs:text-[28px] sm:text-[32px]"
          >
            Help & Guidelines
          </h1>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink-muted sm:text-[15px]">
            Practical guidance for searching, browsing, previewing, and downloading documents in the Faculty &amp;
            Staff Accreditation Resource Center.
          </p>
        </div>
      </section>

      <HelpSection
        id="help-search"
        icon={FileSearchIcon}
        title="How to Search Documents"
        steps={[
          'Open Search Documents from the sidebar or Home.',
          'Enter keywords related to the document title, description, or topic.',
          'Optionally apply accreditation area, academic program, document type, publication date, and sort filters.',
          'Open Preview to inspect a result, or Download when a public file is available.',
          'Use Clear all to reset your search and filters.'
        ]}
        action={{ to: '/open/search', label: 'Go to Search Documents' }}
      />

      <HelpSection
        id="help-browse"
        icon={FolderOpenIcon}
        title="How to use the Accreditation Repository"
        steps={[
          'Open Accreditation Repository from the sidebar or dashboard resource cards.',
          'Switch between AACCUP Certificates, Technical Reviews, and COPC Records tabs.',
          'For certificates, browse by campus folders and use search or filters as needed.',
          'Switch between Grid and List views on the certificates catalog.',
          'Open document details or preview when a local sample file is available.'
        ]}
        action={{ to: '/open/browse', label: 'Go to Accreditation Repository' }}
      />

      <HelpSection
        id="help-preview"
        icon={EyeIcon}
        title="How to Preview Documents"
        steps={[
          'Select Preview on any public document card.',
          'Review public-safe details such as type, area, program, and publication date.',
          'View the file in the preview modal when the format is supported (for example PDF or common images).',
          'If inline preview is unsupported or the file is missing, follow the on-screen message and use Download when available.'
        ]}
      />

      <HelpSection
        id="help-download"
        icon={DownloadIcon}
        title="How to Download Documents"
        steps={[
          'Select Download on a document card or inside the preview modal.',
          'Downloads succeed only for currently eligible published documents with a stored original file.',
          'The portal does not guarantee that every listed document has a downloadable file.',
          'If a download fails, the document may have been unpublished, archived, or may no longer have a stored file.'
        ]}
      />

      <section aria-labelledby="help-faq-heading" className="space-y-4">
        <div>
          <h2 id="help-faq-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-1 text-[13px] font-medium text-ink-muted">
            Answers reflect the current prototype behavior.
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="panel group p-4 sm:p-5">
              <summary className="cursor-pointer list-none text-[14px] font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start gap-2">
                  <HelpCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <span>{item.q}</span>
                </span>
              </summary>
              <p className="mt-3 pl-6 text-[13px] font-medium leading-relaxed text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="help-guidelines-heading" className="space-y-3">
        <h2 id="help-guidelines-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          Public Access Guidelines
        </h2>
        <div className="panel p-5 sm:p-6">
          <p className="text-[14px] font-medium leading-relaxed text-ink-muted">
            This portal is intended for accessing accreditation documents that the Quality Assurance Office has
            explicitly published for public use. It is not a substitute for internal QA systems, private sharing, or
            confidential records.
          </p>
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-ink-muted">
            For more about the portal’s purpose, see{' '}
            <Link to="/open/about" className="font-semibold text-brand-700 hover:underline">
              About the Quality Assurance Office
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function HelpSection({
  id,
  icon: Icon,
  title,
  steps,
  action
}: {
  id: string;
  icon: typeof BookOpenIcon;
  title: string;
  steps: string[];
  action?: { to: string; label: string };
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 id={id} className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          {title}
        </h2>
      </div>
      <div className="panel p-5 sm:p-6">
        <ol className="space-y-2.5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-[14px] font-medium leading-relaxed text-ink-muted">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {action ? (
          <div className="mt-5">
            <Link to={action.to} className="btn btn-secondary btn-sm">
              {action.label}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
