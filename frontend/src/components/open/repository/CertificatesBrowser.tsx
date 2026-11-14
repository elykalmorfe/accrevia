import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  FolderOpenIcon,
  HardDriveIcon,
  LayoutGridIcon,
  ListIcon,
  Loader2Icon
} from 'lucide-react';
import { EmptyState } from '../../ui/EmptyState';
import {
  browseCertificates,
  listCampuses,
  listDemoProgramOptions,
  searchCertificates
} from '../../../services/repository/repositoryService';
import { matchesCampusFilter } from '../../../services/repository/verifiedCatalogSearch';
import type {
  CertificateBrowseResult,
  RepositoryFilters,
  RepoDocumentItem,
  RepoFolderNode
} from '../../../types/accreditationRepository';
import { RepoBreadcrumb } from './RepoBreadcrumb';
import { RepoDocumentCard } from './RepoDocumentCard';
import { RepoDocumentDetailsModal } from './RepoDocumentDetailsModal';
import { RepoDocumentList } from './RepoDocumentList';
import { RepoDocumentPreviewModal } from './RepoDocumentPreviewModal';
import { RepoFolderGrid } from './RepoFolderGrid';
import { RepositorySearchFilters } from './RepositorySearchFilters';

type CertificatesBrowserProps = {
  pathIds: string[];
  onPathChange: (pathIds: string[]) => void;
  filters: RepositoryFilters;
  onFiltersChange: (next: RepositoryFilters) => void;
  onClearFilters: () => void;
  /** Optional catalog document id to open in the details modal after load. */
  focusDocumentId?: string;
};

type LoadState = 'loading' | 'ready' | 'error';
type ViewMode = 'grid' | 'list';

const VIEW_KEY = 'accrevia_repo_cert_view';

function readView(): ViewMode {
  try {
    return sessionStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function matchesQuery(name: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

export function CertificatesBrowser({
  pathIds,
  onPathChange,
  filters,
  onFiltersChange,
  onClearFilters,
  focusDocumentId
}: CertificatesBrowserProps) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [browse, setBrowse] = useState<CertificateBrowseResult | null>(null);
  const [searchDocs, setSearchDocs] = useState<RepoDocumentItem[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(() => readView());
  const [detailsDoc, setDetailsDoc] = useState<RepoDocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RepoDocumentItem | null>(null);
  const [campusOptions, setCampusOptions] = useState<Array<{ value: string; label: string }>>([]);

  const atRoot = pathIds.length === 0;
  const programOptions = useMemo(() => listDemoProgramOptions(), []);

  const isDocumentSearch = Boolean(
    filters.query.trim() || filters.program || filters.academicYear || filters.documentType
  );

  useEffect(() => {
    let cancelled = false;
    void listCampuses().then((campuses) => {
      if (cancelled) return;
      setCampusOptions(campuses.map((c) => ({ value: c.id, label: c.name })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      if (isDocumentSearch) {
        const [searchResult, browseResult] = await Promise.all([
          searchCertificates({
            q: filters.query.trim() || undefined,
            campus: filters.campus || undefined,
            academicYear: filters.academicYear || undefined,
            program: filters.program || undefined,
            documentType: filters.documentType || undefined
          }),
          pathIds.length ? browseCertificates(pathIds) : Promise.resolve(null)
        ]);
        setSearchDocs(searchResult.documents);
        setBrowse(browseResult);
      } else {
        const result = await browseCertificates(pathIds);
        setBrowse(result);
        setSearchDocs(null);
      }
      setLoadState('ready');
    } catch {
      setError('Unable to load the verified certificate catalog.');
      setLoadState('error');
      setBrowse(null);
      setSearchDocs(null);
    }
  }, [pathIds, filters, reloadKey, isDocumentSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      sessionStorage.setItem(VIEW_KEY, viewMode);
    } catch {
      // ignore
    }
  }, [viewMode]);

  const folders: RepoFolderNode[] = browse?.current.folders ?? [];
  const documents: RepoDocumentItem[] = browse?.current.documents ?? [];

  useEffect(() => {
    if (!focusDocumentId || loadState !== 'ready') return;
    const pool = searchDocs ?? documents;
    const match = pool.find((d) => d.id === focusDocumentId);
    if (match) setDetailsDoc(match);
  }, [focusDocumentId, loadState, searchDocs, documents]);

  const filteredFolders = useMemo(() => {
    if (isDocumentSearch) return [];
    let list = folders;
    if (atRoot && filters.campus) list = list.filter((f) => f.id === filters.campus);
    if (filters.query.trim()) list = list.filter((f) => matchesQuery(f.name, filters.query));
    return list;
  }, [folders, atRoot, filters.campus, filters.query, isDocumentSearch]);

  const filteredDocuments = useMemo(() => {
    if (searchDocs) return searchDocs;
    let list = documents;
    if (filters.campus) {
      list = list.filter((d) => matchesCampusFilter(d, filters.campus));
    }
    return list;
  }, [documents, searchDocs, filters.campus]);

  const documentTypeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const doc of filteredDocuments) {
      if (doc.documentType) types.add(doc.documentType);
    }
    // Also offer common types from program catalog for filter discovery during search
    for (const t of ['PDF', 'Image']) types.add(t);
    return [...types].sort().map((t) => ({ value: t, label: t }));
  }, [filteredDocuments]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    for (const doc of filteredDocuments) {
      if (doc.academicYear) years.add(doc.academicYear);
    }
    return [...years].sort().map((y) => ({ value: y, label: y }));
  }, [filteredDocuments]);

  const hasContent = isDocumentSearch
    ? filteredDocuments.length > 0
    : filteredFolders.length > 0 || filteredDocuments.length > 0;

  const openPreviewFromDetails = (doc: RepoDocumentItem) => {
    setDetailsDoc(null);
    setPreviewDoc(doc);
  };

  const rootCampusOptions =
    campusOptions.length > 0
      ? campusOptions
      : folders.filter((f) => f.kind === 'campus').map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">AACCUP Certificates</h2>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900">
              Verified source records
            </span>
          </div>
          <p className="mt-1 text-[13px] font-medium text-ink-muted">
            Browse the verified static catalog using the actual folder hierarchy. Records are snapshots for interface
            visualization — not live Google Drive synchronization.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-line bg-canvas p-1" role="group" aria-label="Document view">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
              viewMode === 'grid' ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGridIcon className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
              viewMode === 'list' ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      <RepositorySearchFilters
        filters={filters}
        onChange={onFiltersChange}
        onClear={onClearFilters}
        campusOptions={rootCampusOptions}
        yearOptions={yearOptions}
        programOptions={programOptions}
        documentTypeOptions={documentTypeOptions}
        enableCampus={rootCampusOptions.length > 0}
        enableYear={yearOptions.length > 0 || Boolean(filters.academicYear)}
        enableProgram={programOptions.length > 0}
        enableDocumentType
        searchPlaceholder="Search by title, campus, program, or file type…"
        searchLabel="Search verified catalog"
      />

      <div className="panel space-y-4 overflow-hidden p-4 sm:p-5">
        <RepoBreadcrumb
          items={(browse?.trail ?? []).map((node) => ({ id: node.id, label: node.name }))}
          rootLabel="Campuses"
          onNavigate={onPathChange}
        />

        {loadState === 'ready' ? (
          <p className="text-[12px] font-medium text-ink-muted">
            {isDocumentSearch ? (
              <>
                Showing{' '}
                <span className="tabular-nums font-semibold text-ink">{filteredDocuments.length}</span> verified
                document{filteredDocuments.length === 1 ? '' : 's'}
                {filters.query.trim() || filters.campus || filters.program || filters.documentType
                  ? ' matching your search'
                  : ''}
                . Demonstration fixtures are excluded.
              </>
            ) : (
              <>
                {filteredFolders.length > 0 ? (
                  <>
                    <span className="tabular-nums font-semibold text-ink">{filteredFolders.length}</span> folder
                    {filteredFolders.length === 1 ? '' : 's'}
                  </>
                ) : null}
                {filteredFolders.length > 0 && filteredDocuments.length > 0 ? ' · ' : null}
                {filteredDocuments.length > 0 ? (
                  <>
                    <span className="tabular-nums font-semibold text-ink">{filteredDocuments.length}</span> document
                    {filteredDocuments.length === 1 ? '' : 's'}
                  </>
                ) : null}
                {filteredFolders.length === 0 && filteredDocuments.length === 0 ? 'No items in this location' : null}
              </>
            )}
          </p>
        ) : null}

        {loadState === 'loading' ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <Loader2Icon className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-ink">Loading verified certificate catalog…</p>
          </div>
        ) : null}

        {loadState === 'error' ? (
          <EmptyState
            icon={AlertCircleIcon}
            title="Certificate catalog unavailable"
            description={error}
            action={
              <button type="button" className="btn btn-secondary" onClick={() => setReloadKey((n) => n + 1)}>
                Retry
              </button>
            }
          />
        ) : null}

        {loadState === 'ready' && browse?.missing ? (
          <EmptyState
            icon={FolderOpenIcon}
            title="Folder path not found"
            description="This location is not in the verified catalog. Return to campuses and try again."
            action={
              <button type="button" className="btn btn-secondary" onClick={() => onPathChange([])}>
                Back to campuses
              </button>
            }
          />
        ) : null}

        {loadState === 'ready' && !browse?.missing && !hasContent ? (
          <EmptyState
            icon={atRoot || isDocumentSearch ? FolderOpenIcon : HardDriveIcon}
            title={
              isDocumentSearch
                ? 'No verified documents match your search'
                : atRoot
                  ? 'No campus folders available'
                  : 'This folder is empty'
            }
            description={
              isDocumentSearch
                ? 'Try clearing filters. Search covers verified source records only — not demonstration fixtures.'
                : 'No verified child folders or documents are listed for this location in the static catalog.'
            }
            action={
              filters.query.trim() || filters.campus || filters.academicYear || filters.program || filters.documentType ? (
                <button type="button" className="btn btn-secondary" onClick={onClearFilters}>
                  Clear filters
                </button>
              ) : !atRoot ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onPathChange(pathIds.slice(0, -1))}
                >
                  Go up one level
                </button>
              ) : undefined
            }
          />
        ) : null}

        {loadState === 'ready' && !browse?.missing && hasContent ? (
          <div className="space-y-4">
            {!isDocumentSearch && filteredFolders.length > 0 ? (
              <RepoFolderGrid folders={filteredFolders} onOpen={(folder) => onPathChange([...pathIds, folder.id])} />
            ) : null}

            {filteredDocuments.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
                  {filteredDocuments.map((doc) => (
                    <RepoDocumentCard
                      key={doc.id}
                      doc={doc}
                      onDetails={setDetailsDoc}
                      onPreview={setPreviewDoc}
                    />
                  ))}
                </div>
              ) : (
                <RepoDocumentList
                  documents={filteredDocuments}
                  onDetails={setDetailsDoc}
                  onPreview={setPreviewDoc}
                />
              )
            ) : null}
          </div>
        ) : null}
      </div>

      <RepoDocumentDetailsModal
        doc={detailsDoc}
        onClose={() => setDetailsDoc(null)}
        onPreview={openPreviewFromDetails}
      />
      <RepoDocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
