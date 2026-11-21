import React, { useCallback, useId, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type FeatureId = 'search' | 'repository' | 'organization' | 'accessibility' | 'ranked';

type FeatureItem = {
  id: FeatureId;
  icon: typeof Search;
  title: string;
  description: string;
  previewLabel: string;
};

const FEATURES: FeatureItem[] = [
  {
    id: 'search',
    icon: Search,
    title: 'Intelligent Document Search',
    description: 'Find relevant accreditation documents through natural-language queries.',
    previewLabel: 'Accrevia intelligent search interface'
  },
  {
    id: 'ranked',
    icon: ShieldCheck,
    title: 'Ranked Search Results',
    description: 'Prioritize documents by relevance so quality assurance teams can act faster and with more clarity.',
    previewLabel: 'Accrevia ranked search results interface'
  },
  {
    id: 'repository',
    icon: FileText,
    title: 'Centralized Document Repository',
    description: 'Access and retrieve accreditation documents from a centralized institutional repository.',
    previewLabel: 'Accrevia document repository interface'
  },
  {
    id: 'organization',
    icon: Building2,
    title: 'Accreditation-Based Organization',
    description: 'Organize institutional evidence according to accreditation areas, criteria, and requirements.',
    previewLabel: 'Accrevia accreditation organization interface'
  },
  {
    id: 'accessibility',
    icon: Users,
    title: 'Document Accessibility',
    description: 'Provide authorized users with convenient access to institutional accreditation documents.',
    previewLabel: 'Accrevia document accessibility interface'
  }
];

const SEARCH_QUICK_CHIPS = [
  'Research Publications',
  'Area III – Research',
  'Faculty Development'
] as const;

const SEARCH_PREVIEW_QUERY = 'Faculty development activities';

type SearchResultDoc = {
  title: string;
  category: string;
  description: string;
  relevance: number;
};

const SEARCH_PREVIEW_RESULTS: SearchResultDoc[] = [
  {
    title: 'Faculty Qualifications and Credentials Summary',
    category: 'Area II · Faculty · Accreditation Evidence',
    description:
      'Compiled faculty credentials, degrees, and professional licenses supporting qualification criteria.',
    relevance: 96
  },
  {
    title: 'Faculty Development and Training Records',
    category: 'Area II · Faculty · Professional Development',
    description:
      'Training participation and faculty development activities aligned with accreditation standards.',
    relevance: 95
  }
];

const RANKED_PREVIEW_RESULTS: SearchResultDoc[] = [
  ...SEARCH_PREVIEW_RESULTS,
  {
    title: 'Faculty Professional Development Accomplishment Report',
    category: 'Area II · Faculty · Performance Documentation',
    description:
      'Records of faculty seminars, workshops, professional development activities, and accomplishments.',
    relevance: 92
  },
  {
    title: 'Faculty Training and Seminar Participation Report',
    category: 'Area II · Faculty · Training Documentation',
    description:
      'Documentation of faculty participation in institutional training, seminars, and capacity-building programs.',
    relevance: 89
  }
];

const REPO_PREVIEW_KPIS = [
  {
    label: 'Active Repository',
    value: 46,
    description: 'Excludes 2 archived',
    icon: FileText,
    tone: 'is-blue'
  },
  {
    label: 'Approved Documents',
    value: 32,
    description: '66.7% of active documents',
    icon: CheckCircle2,
    tone: 'is-green'
  },
  {
    label: 'Pending Review',
    value: 10,
    description: '22% of active documents',
    icon: Clock3,
    tone: 'is-blue'
  },
  {
    label: 'Needs Revision',
    value: 4,
    description: '9% of active documents',
    icon: AlertTriangle,
    tone: 'is-amber'
  }
] as const;

const REPO_PREVIEW_DOCS = [
  {
    title: 'Faculty Qualifications and Credentials',
    meta: 'AACCUP Area II · PDF · Nov 12, 2025',
    status: 'Verified'
  },
  {
    title: 'Vision, Mission, Goals and Objectives',
    meta: 'AACCUP Area I · PDF · Nov 10, 2025',
    status: 'Verified'
  },
  {
    title: 'Curriculum and Syllabi Compilation',
    meta: 'AACCUP Area III · DOCX · Nov 8, 2025',
    status: 'Verified'
  },
  {
    title: 'Research Accomplishment Report',
    meta: 'AACCUP Area IV · PDF · Nov 6, 2025',
    status: 'Pending Review'
  },
  {
    title: 'Community Extension Report',
    meta: 'AACCUP Area VI · PDF · Nov 3, 2025',
    status: 'Verified'
  }
] as const;

function PreviewChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="feature-preview-chrome">
      <div className="feature-preview-toolbar">
        <span />
        <span />
        <span />
        <p>{title}</p>
      </div>
      <div className="feature-preview-body">{children}</div>
    </div>
  );
}

function DocumentSearchResults({
  query,
  results
}: {
  query: string;
  results: readonly SearchResultDoc[];
}) {
  return (
    <div className="feature-search-results">
      <div className="feature-search-results-head">
        <p>
          Results for <strong>{query}</strong>
        </p>
        <span>
          {results.length} document{results.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul>
        {results.map((doc) => (
          <li key={doc.title}>
            <div className="feature-search-result-score">
              <strong>{doc.relevance}%</strong>
              <span>Match</span>
            </div>
            <div className="feature-search-result-body">
              <div className="feature-search-result-title">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <h4>{doc.title}</h4>
              </div>
              <p className="feature-search-result-meta">{doc.category}</p>
              <p className="feature-search-result-copy">{doc.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchPreview() {
  return (
    <PreviewChrome title="Intelligent Document Search">
      <div className="feature-search-preview" aria-hidden="false">
        <div className="feature-search-header">
          <h3>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Find the document you need, faster.
          </h3>
          <p>Search accreditation documents, criteria, and supporting evidence across your institution.</p>
        </div>

        <div className="feature-search-row">
          <div className="feature-search-field-wrap">
            <div className="feature-search-field is-readonly" aria-label="Search query demonstration">
              <Search className="feature-search-icon" aria-hidden="true" />
              <span className="feature-search-query">{SEARCH_PREVIEW_QUERY}</span>
            </div>
          </div>

          <div className="feature-search-guide" aria-hidden="true">
            <HelpCircle className="h-4 w-4" />
            QA Guide
          </div>
        </div>

        <div className="feature-search-chips" aria-hidden="true">
          <span>Try:</span>
          {SEARCH_QUICK_CHIPS.map((chip) => (
            <span key={chip} className="feature-search-chip">
              {chip}
            </span>
          ))}
        </div>

        <DocumentSearchResults query={SEARCH_PREVIEW_QUERY} results={SEARCH_PREVIEW_RESULTS} />
      </div>
    </PreviewChrome>
  );
}

function RepositoryPreview() {
  return (
    <PreviewChrome title="All Documents">
      <div className="feature-repo-preview">
        <div className="feature-repo-kpis" aria-hidden="true">
          {REPO_PREVIEW_KPIS.map(({ label, value, description, icon: Icon, tone }) => (
            <div key={label} className={`feature-repo-kpi ${tone}`}>
              <div className="feature-repo-kpi-top">
                <span>{label}</span>
                <em>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </em>
              </div>
              <strong>{value}</strong>
              <p>{description}</p>
            </div>
          ))}
        </div>

        <div className="feature-repo-panel">
          <div className="feature-repo-toolbar">
            <p>
              Showing <strong>5</strong> of <strong>46</strong> active documents
            </p>
            <span>Sorted by latest upload date</span>
          </div>

          <div className="feature-repo-filters" aria-hidden="true">
            <div className="feature-repo-search">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Search by title, keyword, office, or campus...</span>
            </div>
            <span className="feature-repo-select">Accreditation</span>
            <span className="feature-repo-select">Campus</span>
            <span className="feature-repo-select">Document type</span>
          </div>

          <ul className="feature-repo-list">
            {REPO_PREVIEW_DOCS.map((doc) => (
              <li key={doc.title}>
                <span className="feature-repo-doc-icon" aria-hidden="true">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <div className="feature-repo-doc-copy">
                  <strong>{doc.title}</strong>
                  <span>{doc.meta}</span>
                </div>
                <em
                  className={`feature-repo-badge${
                    doc.status === 'Pending Review' ? ' is-pending' : ' is-verified'
                  }`}
                >
                  {doc.status}
                </em>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PreviewChrome>
  );
}

function OrganizationPreview() {
  return (
    <PreviewChrome title="Accreditation Areas">
      <div className="feature-preview-org">
        {[
          { code: 'Area I', name: 'Vision, Mission, Goals', docs: 42 },
          { code: 'Area II', name: 'Faculty', docs: 68, active: true },
          { code: 'Area III', name: 'Curriculum & Instruction', docs: 55 },
          { code: 'Area IV', name: 'Research', docs: 37 }
        ].map((area) => (
          <div key={area.code} className={area.active ? 'is-active' : undefined}>
            <div>
              <strong>{area.code}</strong>
              <span>{area.name}</span>
            </div>
            <em>{area.docs} docs</em>
          </div>
        ))}
      </div>
      <div className="feature-preview-org-detail">
        <p className="feature-preview-label">Area II · Linked criteria</p>
        <ul>
          <li>Criterion 1 · Faculty qualifications</li>
          <li>Criterion 2 · Professional development</li>
          <li>Criterion 3 · Teaching assignment</li>
        </ul>
      </div>
    </PreviewChrome>
  );
}

function AccessibilityPreview() {
  return (
    <PreviewChrome title="Access & Sharing">
      <div className="feature-preview-access-hero">
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        <div>
          <strong>Authorized access only</strong>
          <span>Permissions follow role and sharing rights</span>
        </div>
      </div>
      <ul className="feature-preview-access-list">
        {[
          { role: 'QA Officer', access: 'Full repository access' },
          { role: 'Program Chair', access: 'Program evidence access' },
          { role: 'Faculty Contributor', access: 'Owned uploads + shared files' }
        ].map((row) => (
          <li key={row.role}>
            <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <div>
              <strong>{row.role}</strong>
              <span>{row.access}</span>
            </div>
          </li>
        ))}
      </ul>
    </PreviewChrome>
  );
}

function RankedPreview() {
  return (
    <PreviewChrome title="Ranked Results">
      <div className="feature-ranked-preview">
        <DocumentSearchResults query={SEARCH_PREVIEW_QUERY} results={RANKED_PREVIEW_RESULTS} />
      </div>
    </PreviewChrome>
  );
}

function FeaturePreview({ id }: { id: FeatureId }) {
  switch (id) {
    case 'search':
      return <SearchPreview />;
    case 'repository':
      return <RepositoryPreview />;
    case 'organization':
      return <OrganizationPreview />;
    case 'accessibility':
      return <AccessibilityPreview />;
    case 'ranked':
      return <RankedPreview />;
    default:
      return null;
  }
}

/**
 * Interactive Key Features showcase: left navigation + right interface preview.
 * Preserves five landing-page capabilities with subtle transitions.
 */
export function FeatureShowcase() {
  const [activeId, setActiveId] = useState<FeatureId>('search');
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const active = FEATURES.find((feature) => feature.id === activeId) ?? FEATURES[0];

  const selectFeature = useCallback((id: FeatureId) => {
    setActiveId(id);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = FEATURES.findIndex((feature) => feature.id === activeId);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % FEATURES.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + FEATURES.length) % FEATURES.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = FEATURES.length - 1;
    } else {
      return;
    }

    setActiveId(FEATURES[nextIndex].id);
    const nextButton = document.getElementById(`${baseId}-tab-${FEATURES[nextIndex].id}`);
    nextButton?.focus();
  };

  const switchTransition = {
    duration: reduceMotion ? 0 : 0.28,
    ease: [0.4, 0, 0.2, 1] as const
  };

  return (
    <div className="feature-showcase">
      <div className="feature-showcase-nav" role="tablist" aria-label="Platform capabilities" onKeyDown={onKeyDown}>
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const selected = feature.id === activeId;
          return (
            <button
              key={feature.id}
              id={`${baseId}-tab-${feature.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              className={`feature-nav-item${selected ? ' is-active' : ''}`}
              onClick={() => selectFeature(feature.id)}
            >
              <motion.span
                className="feature-nav-body"
                layout={!reduceMotion}
                transition={{ layout: switchTransition }}
              >
                <motion.span
                  className="feature-nav-icon"
                  aria-hidden="true"
                  layout={!reduceMotion}
                  transition={{ layout: switchTransition }}
                >
                  <Icon strokeWidth={1.75} />
                </motion.span>
                <motion.span
                  className="feature-nav-copy"
                  layout={!reduceMotion}
                  transition={{ layout: switchTransition }}
                >
                  <motion.strong layout={!reduceMotion} transition={{ layout: switchTransition }}>
                    {feature.title}
                  </motion.strong>
                  <span
                    className={`feature-nav-description-slot${selected ? ' is-open' : ''}`}
                    aria-hidden={!selected}
                  >
                    <span className="feature-nav-description-clip">
                      <span className="feature-nav-description">{feature.description}</span>
                    </span>
                  </span>
                </motion.span>
              </motion.span>
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active.id}`}
        className="feature-showcase-preview"
      >
        <div className="feature-preview-frame" aria-live="polite">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={active.id}
              className="feature-preview-motion"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={switchTransition}
            >
              <FeaturePreview id={active.id} />
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">{active.previewLabel}</span>
        </div>
      </div>
    </div>
  );
}
