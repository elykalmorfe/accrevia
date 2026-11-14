import { ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  FileStackIcon,
  InboxIcon,
  LucideIcon,
  ShieldCheckIcon,
  SparklesIcon
} from 'lucide-react';
import { usePublicDocuments } from '../../hooks/usePublicDocuments';
import { EvidenceDocument } from '../../types/evidence';
import { selectFeaturedDocuments } from '../../utils/publicDocuments';
import { EmptyState } from '../../components/ui/EmptyState';
import { PublicDocumentCard } from '../../components/open/PublicDocumentCard';
import { PublicDocumentPreviewModal } from '../../components/open/PublicDocumentPreviewModal';
import { GlobalSearch } from '../../components/layout/GlobalSearch';
import { FACULTY_ACCESS_VISIBILITY_NOTE } from '../../services/repository/facultyAccessVisibility';

const FEATURED_LIMIT = 4;
const RECENT_LIMIT = 4;

const dashboardQuickSearches = ['Research Publications', 'Area III – Research', 'Faculty Development'];

type ResourceCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  to: string;
};

const resourceCards: ResourceCard[] = [
  {
    id: 'accreditation',
    title: 'Accreditation',
    description: 'Institutional, program, COPC, PQA, and ISO views aligned with the System Administrator portal.',
    icon: ShieldCheckIcon,
    actionLabel: 'Open Accreditation',
    to: '/open/frameworks/ia'
  },
  {
    id: 'requests',
    title: 'My Requests',
    description: 'Track document requests you submitted to the QA Office.',
    icon: InboxIcon,
    actionLabel: 'View requests',
    to: '/open/requests'
  },
  {
    id: 'samples',
    title: 'Sample Documents',
    description: 'Approved demonstration PDFs clearly labeled as samples for preview.',
    icon: FileStackIcon,
    actionLabel: 'Browse samples',
    to: '/open/browse?tab=sample-documents'
  }
];

export function OpenHome() {
  const { documents: publishedSorted, totalPublished } = usePublicDocuments({ sort: 'published-desc' });
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);

  const featured = useMemo(
    () => selectFeaturedDocuments(publishedSorted, FEATURED_LIMIT),
    [publishedSorted]
  );

  const recent = useMemo(() => publishedSorted.slice(0, RECENT_LIMIT), [publishedSorted]);

  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
          NEMSU · ACCREVIA
        </p>
        <h1 className="mt-1.5 font-sans text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px] lg:text-[28px]">
          Faculty &amp; Staff Portal
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-relaxed text-ink-muted sm:text-[14px]">
          Access publicly published accreditation materials, authorized shares, and labeled demonstration samples.
        </p>
      </header>

      {/* Same featured search chrome as System Administrator Dashboard */}
      <section
        aria-labelledby="faculty-evidence-search-heading"
        className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5"
      >
        <h2
          id="faculty-evidence-search-heading"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink"
        >
          <SparklesIcon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          Find the document you need, faster.
        </h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Search publicly published documents, materials shared with you, and labeled demonstration samples.
        </p>

        <div className="mt-3.5">
          <GlobalSearch
            className="max-w-none"
            variant="featured"
            placeholder="Search accreditation documents, criteria, or keywords..."
            quickSearches={dashboardQuickSearches}
            matchInputWidth
            portalMode="faculty"
            searchPath="/open/search"
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-subtle">{FACULTY_ACCESS_VISIBILITY_NOTE}</p>
      </section>

      <section aria-labelledby="open-resources-heading" className="space-y-3">
        <div>
          <h2 id="open-resources-heading" className="text-base font-extrabold tracking-tight text-ink sm:text-lg">
            Quick links
          </h2>
          <p className="mt-1 text-[13px] font-medium text-ink-muted">
            Navigate the same Accreditation structure as the System Administrator portal with Faculty/Staff visibility rules.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
          {resourceCards.map((card) => (
            <ResourceCardItem key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section aria-labelledby="open-featured-heading" className="space-y-3">
        <SectionHeading
          id="open-featured-heading"
          title="Featured Documents"
          description={
            totalPublished > 0
              ? 'Latest documents published by the Quality Assurance Office.'
              : 'Featured picks will appear here once documents are published.'
          }
          action={
            totalPublished > 0 ? (
              <Link to="/open/featured" className="btn btn-ghost btn-sm text-brand-700">
                View featured
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            ) : null
          }
        />
        {featured.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
            {featured.map((doc) => (
              <PublicDocumentCard key={doc.id} doc={doc} onPreview={setPreview} />
            ))}
          </div>
        ) : (
          <div className="panel">
            <EmptyState
              icon={FileStackIcon}
              title="No published documents yet"
              description="The Quality Assurance Office has not published documents for faculty and staff access yet."
            />
          </div>
        )}
      </section>

      <section aria-labelledby="open-recent-heading" className="space-y-3">
        <SectionHeading
          id="open-recent-heading"
          title="Recently Published"
          description="Newest publicly released accreditation documents."
          action={
            <Link to="/open/recent" className="btn btn-ghost btn-sm text-brand-700">
              View all
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {recent.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {recent.map((doc) => (
              <PublicDocumentCard key={doc.id} doc={doc} onPreview={setPreview} />
            ))}
          </div>
        ) : (
          <div className="panel">
            <EmptyState
              icon={FileStackIcon}
              title="No recently published documents"
              description="When the QA Office publishes documents, the newest releases will appear here."
            />
          </div>
        )}
      </section>

      <footer className="border-t border-line-subtle pt-6 pb-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">ACCREVIA</p>
            <p className="mt-0.5 text-[13px] font-medium text-ink-muted">
              North Eastern Mindanao State University
            </p>
            <p className="mt-0.5 text-[12px] text-ink-subtle">
              Quality Assurance Office · Faculty &amp; Staff Portal
            </p>
          </div>
          <nav aria-label="Portal information" className="flex flex-wrap gap-2 sm:justify-end">
            <Link to="/open/about" className="btn btn-ghost btn-sm">
              About
            </Link>
            <Link to="/open/help" className="btn btn-ghost btn-sm">
              Help
            </Link>
          </nav>
        </div>
      </footer>

      <PublicDocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function ResourceCardItem({ card }: { card: ResourceCard }) {
  const Icon = card.icon;
  return (
    <Link to={card.to} className="panel panel-hover flex h-full flex-col p-4 no-underline transition sm:p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-[14px] font-bold text-ink">{card.title}</h3>
      <p className="mt-1.5 flex-1 text-[12px] font-medium leading-relaxed text-ink-muted">{card.description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700">
        {card.actionLabel}
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function SectionHeading({
  id,
  title,
  description,
  action
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-extrabold tracking-tight text-ink sm:text-lg">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] font-medium text-ink-muted">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
