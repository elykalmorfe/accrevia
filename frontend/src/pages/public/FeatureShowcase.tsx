import React, { useCallback, useId, useState } from 'react';
import {
  Building2,
  FileText,
  FolderTree,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type FeatureId =
  | 'search'
  | 'hybrid'
  | 'repository'
  | 'organization'
  | 'accessibility'
  | 'ranked';

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
    id: 'hybrid',
    icon: Sparkles,
    title: 'Hybrid Information Retrieval',
    description: 'Combine complementary search techniques to retrieve relevant documents.',
    previewLabel: 'Accrevia hybrid retrieval results interface'
  },
  {
    id: 'repository',
    icon: FileText,
    title: 'Centralized Document Repository',
    description: 'Store and organize accreditation documents in a structured environment.',
    previewLabel: 'Accrevia document repository interface'
  },
  {
    id: 'organization',
    icon: Building2,
    title: 'Accreditation-Based Organization',
    description: 'Keep documents arranged according to accreditation areas and institutional requirements.',
    previewLabel: 'Accrevia accreditation organization interface'
  },
  {
    id: 'accessibility',
    icon: Users,
    title: 'Document Accessibility',
    description: 'Provide authorized users with quick access to the materials they need for governance and review.',
    previewLabel: 'Accrevia document accessibility interface'
  },
  {
    id: 'ranked',
    icon: ShieldCheck,
    title: 'Ranked Search Results',
    description: 'Prioritize documents by relevance so quality assurance teams can act faster and with more clarity.',
    previewLabel: 'Accrevia ranked search results interface'
  }
];

const DEMO_DOCS = [
  { title: 'Faculty Qualifications Summary', area: 'Area II · Faculty', type: 'Summary Report' },
  { title: 'Research & Extension Audit', area: 'Area III · Research', type: 'Audit Record' },
  { title: 'Curriculum & Board Performance', area: 'Area IV · Instruction', type: 'Program Evidence' }
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

function SearchPreview() {
  return (
    <PreviewChrome title="Intelligent Search">
      <div className="feature-preview-searchbox">
        <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
        <span>Faculty credentials and qualifications for Area II</span>
      </div>
      <p className="feature-preview-label">Natural-language query</p>
      <div className="feature-preview-chips">
        <span>keywords</span>
        <span>criteria</span>
        <span>Area II</span>
      </div>
      <ul className="feature-preview-list">
        {DEMO_DOCS.map((doc) => (
          <li key={doc.title}>
            <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <div>
              <strong>{doc.title}</strong>
              <span>{doc.area}</span>
            </div>
          </li>
        ))}
      </ul>
    </PreviewChrome>
  );
}

function HybridPreview() {
  return (
    <PreviewChrome title="Hybrid Retrieval">
      <div className="feature-preview-searchbox">
        <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
        <span>professional development qualifications</span>
      </div>
      <div className="feature-preview-hybrid">
        <article>
          <p>Lexical match</p>
          <strong>Direct terms</strong>
          <span>qualification · development</span>
        </article>
        <article>
          <p>Related terms</p>
          <strong>Expanded signals</strong>
          <span>credentials · training · profile</span>
        </article>
      </div>
      <ul className="feature-preview-list">
        <li>
          <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <div>
            <strong>Faculty Development Program Accomplishment</strong>
            <span>Matched keywords + related terms</span>
          </div>
        </li>
        <li>
          <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <div>
            <strong>Faculty Qualifications Summary</strong>
            <span>Title and keyword field weighting</span>
          </div>
        </li>
      </ul>
    </PreviewChrome>
  );
}

function RepositoryPreview() {
  return (
    <PreviewChrome title="Evidence Repository">
      <div className="feature-preview-repo">
        <aside>
          <p className="feature-preview-label">Collections</p>
          {['AACCUP Programs', 'CHED COPC', 'Institutional QA'].map((folder, index) => (
            <div key={folder} className={index === 0 ? 'is-active' : undefined}>
              <FolderTree className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{folder}</span>
            </div>
          ))}
        </aside>
        <div>
          <p className="feature-preview-label">Recent documents</p>
          <ul className="feature-preview-list">
            {DEMO_DOCS.map((doc) => (
              <li key={doc.title}>
                <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <div>
                  <strong>{doc.title}</strong>
                  <span>
                    {doc.type} · {doc.area}
                  </span>
                </div>
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
      <p className="feature-preview-label">Sorted by relevance score</p>
      <ul className="feature-preview-ranked">
        {[
          { title: 'Faculty Qualifications Summary', area: 'Area II · Faculty', score: 98 },
          { title: 'Faculty Development Program Accomplishment', area: 'Area II · Faculty', score: 94 },
          { title: 'BSIT Area III Curriculum Evidence', area: 'Area III · Instruction', score: 90 }
        ].map((row, index) => (
          <li key={row.title}>
            <span className="feature-preview-rank">{index + 1}</span>
            <div>
              <strong>{row.title}</strong>
              <span>{row.area}</span>
            </div>
            <em>{row.score}%</em>
          </li>
        ))}
      </ul>
    </PreviewChrome>
  );
}

function FeaturePreview({ id }: { id: FeatureId }) {
  switch (id) {
    case 'search':
      return <SearchPreview />;
    case 'hybrid':
      return <HybridPreview />;
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
 * Preserves all six landing-page capabilities with subtle transitions.
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
              <span className="feature-nav-icon" aria-hidden="true">
                <Icon strokeWidth={1.75} />
              </span>
              <span className="feature-nav-copy">
                <strong>{feature.title}</strong>
                <span className={selected ? 'is-visible' : undefined}>{feature.description}</span>
              </span>
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              className="feature-preview-motion"
              initial={reduceMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -14 }}
              transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
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
