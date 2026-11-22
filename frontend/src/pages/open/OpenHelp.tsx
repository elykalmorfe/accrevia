import { Link } from 'react-router-dom';
import { DownloadIcon, EyeIcon, FileSearchIcon, HelpCircleIcon, InboxIcon, ShieldCheckIcon } from 'lucide-react';

const faqs = [
  {
    q: 'Why is a document missing?',
    a: 'It may still be in review, confidential, or archived. Clear the search parameters, or open the matching framework and campus.'
  },
  {
    q: 'Can I upload or edit a file?',
    a: 'No. Faculty and staff can browse, preview, and download when a file is available. Send a request if you need something that is not listed.'
  },
  {
    q: 'Can I download every document?',
    a: 'Download is available when the Quality Assurance Office stored the original file. If preview is not supported, use Download.'
  },
  {
    q: 'What do I need to send a request?',
    a: 'Request type, subject, and message are required. Priority, the program or campus, and an attachment are optional.'
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
            How to search, open a framework, preview a file, and ask the Quality Assurance Office for a document.
          </p>
        </div>
      </section>

      <HelpSection
        id="help-search"
        icon={FileSearchIcon}
        title="Search"
        steps={[
          'Open Search from the dashboard, or type in the search box on the home page.',
          'Enter a keyword from the title or topic.',
          'Use only these parameters when you need to narrow the list: document type, program, and academic year.',
          'Open Preview, then Download when the file is available.'
        ]}
        action={{ to: '/open/search', label: 'Open search' }}
      />

      <HelpSection
        id="help-frameworks"
        icon={ShieldCheckIcon}
        title="Accreditation frameworks"
        steps={[
          'Choose Institutional (IA), Program (AACCUP), CHED COPC, PQA, or ISO 9001 in the sidebar.',
          'Select the campus or program the page asks for.',
          'Open an area or record to preview and download files that are available to you.',
          'These pages are read-only. Use Requests when you need a file that is not listed.'
        ]}
        action={{ to: '/open/frameworks/ia', label: 'Open Institutional (IA)' }}
      />

      <HelpSection
        id="help-preview"
        icon={EyeIcon}
        title="Preview and download"
        steps={[
          'Choose Preview on a document.',
          'Check the document type, program, and academic year shown with the file.',
          'Use Download when the original file is stored.',
          'If the browser cannot show the file, download it and open it on your computer.'
        ]}
      />

      <HelpSection
        id="help-requests"
        icon={InboxIcon}
        title="Requests"
        steps={[
          'Open Requests and choose New Request.',
          'Required: request type, subject, and message.',
          'Optional: priority, the program or campus, and a supporting file.',
          'The reply from the QA Office stays in the same request.'
        ]}
        action={{ to: '/open/requests', label: 'Open requests' }}
      />

      <section aria-labelledby="help-faq-heading" className="space-y-4">
        <h2 id="help-faq-heading" className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          Common questions
        </h2>
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

      <section className="panel p-5 sm:p-6">
        <p className="text-[14px] font-medium leading-relaxed text-ink-muted">
          For a short map of each feature, see{' '}
          <Link to="/open/about" className="font-semibold text-brand-700 hover:underline">
            About the Quality Assurance Office
          </Link>
          .
        </p>
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
  icon: typeof DownloadIcon;
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
