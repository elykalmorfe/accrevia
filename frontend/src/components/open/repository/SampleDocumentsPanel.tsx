import { useEffect, useMemo, useState } from 'react';
import { FileTextIcon, SearchIcon, XIcon } from 'lucide-react';
import { EmptyState } from '../../ui/EmptyState';
import {
  getDemoDocumentById,
  listDemoRepoDocuments,
  toRepoDocumentItem,
  type DemoDocumentCategory
} from '../../../data/demoDocuments/demoDocumentCatalog';
import { listDemoCategoryOptions, searchDemoDocuments } from '../../../services/repository/demoDocumentSearch';
import type { RepoDocumentItem } from '../../../types/accreditationRepository';
import { RepoDocumentCard } from './RepoDocumentCard';
import { RepoDocumentDetailsModal } from './RepoDocumentDetailsModal';
import { RepoDocumentList } from './RepoDocumentList';
import { RepoDocumentPreviewModal } from './RepoDocumentPreviewModal';

type SampleDocumentsPanelProps = {
  initialQuery?: string;
  focusDocumentId?: string;
};

export function SampleDocumentsPanel({ initialQuery = '', focusDocumentId }: SampleDocumentsPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailsDoc, setDetailsDoc] = useState<RepoDocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RepoDocumentItem | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!focusDocumentId) return;
    const record = getDemoDocumentById(focusDocumentId);
    if (record) setDetailsDoc(toRepoDocumentItem(record));
  }, [focusDocumentId]);

  const categoryOptions = useMemo(() => listDemoCategoryOptions(), []);

  const documents = useMemo(() => {
    if (!query.trim() && !category) return listDemoRepoDocuments();
    return searchDemoDocuments({
      q: query,
      demoCategory: (category || undefined) as DemoDocumentCategory | undefined
    }).map((h) => h.document);
  }, [query, category]);

  const clearFilters = () => {
    setQuery('');
    setCategory('');
  };

  const hasFilters = Boolean(query.trim() || category);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">Sample Documents</h2>
          <span className="rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
            Demonstration
          </span>
        </div>
        <p className="mt-1.5 max-w-3xl text-[13px] font-medium leading-relaxed text-amber-950/90">
          Fictional PDFs for Faculty/Staff search and preview rehearsals. Every file is labeled{' '}
          <strong>SAMPLE DOCUMENT — FOR DEMONSTRATION ONLY</strong>. These are not authentic institutional records and
          are separate from verified AACCUP / COPC catalogs. Opening a sample is not real authorization.
        </p>
      </div>

      <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
        <div className="min-w-0 flex-1">
          <label htmlFor="sample-doc-search" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
            Search sample documents
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              id="sample-doc-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or category…"
              className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-9 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
            {query ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink-subtle hover:bg-canvas"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="w-full sm:w-56">
          <label htmlFor="sample-doc-category" className="mb-1.5 block text-[12px] font-semibold text-ink-muted">
            Category
          </label>
          <select
            id="sample-doc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink shadow-none hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          >
            <option value="">All sample categories</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          {hasFilters ? (
            <button type="button" className="btn btn-ghost btn-sm text-brand-700" onClick={clearFilters}>
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-[12px] font-medium text-ink-muted">
        <span className="tabular-nums font-semibold text-ink">{documents.length}</span> sample document
        {documents.length === 1 ? '' : 's'}
        {hasFilters ? ' matching your search' : ''}
      </p>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="No sample documents match"
          description="Try a different title keyword or clear the category filter."
          action={
            hasFilters ? (
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <RepoDocumentCard key={doc.id} doc={doc} onDetails={setDetailsDoc} onPreview={setPreviewDoc} />
          ))}
        </div>
      ) : (
        <RepoDocumentList documents={documents} onDetails={setDetailsDoc} onPreview={setPreviewDoc} />
      )}

      <RepoDocumentDetailsModal
        doc={detailsDoc}
        onClose={() => setDetailsDoc(null)}
        onPreview={(doc) => {
          setDetailsDoc(null);
          setPreviewDoc(doc);
        }}
      />
      <RepoDocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
