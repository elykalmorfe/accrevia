import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  CheckCircle2Icon,
  CircleCheckIcon,
  CloudUploadIcon,
  CopyIcon,
  CpuIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  HardDriveIcon,
  LayoutGridIcon,
  ListIcon,
  PencilIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon
} from 'lucide-react';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { processingStages } from '../../data/processing';
import { Switch } from '../../components/ui/Switch';
import { Badge, BadgeTone } from '../../components/ui/Badge';
import { ProcessingPipeline } from '../../components/processing/ProcessingPipeline';
import { usePortal } from '../../contexts/PortalContext';
import { EvidenceDocument, EvidenceFolder, FolderColor } from '../../types/evidence';
import { FolderFormModal } from '../../components/folders/FolderFormModal';
import { DeleteFolderModal } from '../../components/folders/DeleteFolderModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { RowActionsMenu } from '../../components/ui/RowActionsMenu';
import { formatDate } from '../../utils/format';
import { toast } from 'sonner';

const FOLDER_THEMES: Record<FolderColor, { iconBg: string; iconColor: string; tagBg: string; tagText: string; borderHover: string }> = {
  blue: { iconBg: 'bg-blue-50 text-blue-600 border border-blue-100', iconColor: 'text-blue-600', tagBg: 'bg-blue-50/80', tagText: 'text-blue-700', borderHover: 'hover:border-blue-300' },
  purple: { iconBg: 'bg-purple-50 text-purple-600 border border-purple-100', iconColor: 'text-purple-600', tagBg: 'bg-purple-50/80', tagText: 'text-purple-700', borderHover: 'hover:border-purple-300' },
  emerald: { iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', iconColor: 'text-emerald-600', tagBg: 'bg-emerald-50/80', tagText: 'text-emerald-700', borderHover: 'hover:border-emerald-300' },
  amber: { iconBg: 'bg-amber-50 text-amber-600 border border-amber-100', iconColor: 'text-amber-600', tagBg: 'bg-amber-50/80', tagText: 'text-amber-700', borderHover: 'hover:border-amber-300' },
  indigo: { iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100', iconColor: 'text-indigo-600', tagBg: 'bg-indigo-50/80', tagText: 'text-indigo-700', borderHover: 'hover:border-indigo-300' },
  rose: { iconBg: 'bg-rose-50 text-rose-600 border border-rose-100', iconColor: 'text-rose-600', tagBg: 'bg-rose-50/80', tagText: 'text-rose-700', borderHover: 'hover:border-rose-300' },
  cyan: { iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100', iconColor: 'text-cyan-600', tagBg: 'bg-cyan-50/80', tagText: 'text-cyan-700', borderHover: 'hover:border-cyan-300' },
  slate: { iconBg: 'bg-slate-100 text-slate-600 border border-slate-200', iconColor: 'text-slate-600', tagBg: 'bg-slate-100', tagText: 'text-slate-700', borderHover: 'hover:border-slate-300' }
};

export function UploadEvidence() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderParam = searchParams.get('folder');

  const { folders, saveFolder, deleteFolder, documents, pending } = usePortal();
  const { items, selected, setSelectedId, addFiles, removeItem, forceOcr, setForceOcr, lastStage } = useUploadQueue();

  const [dragging, setDragging] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [editingFolder, setEditingFolder] = useState<EvidenceFolder | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<EvidenceFolder | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  // Inside folder state: tabs, search, filter, sort, and floating dock
  const [folderTab, setFolderTab] = useState<'documents' | 'upload'>('documents');
  const [docSearch, setDocSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [docSort, setDocSort] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'size-desc'>('newest');
  const [dismissFloatingDock, setDismissFloatingDock] = useState(false);

  // Active folder
  const currentFolder = useMemo(() => {
    if (!folderParam) return null;
    return folders.find((f) => f.id === folderParam) || null;
  }, [folderParam, folders]);

  const setFolder = (id: string | null) => {
    if (id) {
      setSearchParams({ folder: id });
    } else {
      setSearchParams({});
    }
  };

  // Compute document count and size for each folder
  const folderStats = useMemo(() => {
    const stats: Record<string, { count: number; sizeMb: number }> = {};
    folders.forEach((f) => {
      const docs = documents.filter((d) => d.frameworkId === f.frameworkId || d.folderId === f.id);
      const size = docs.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);
      stats[f.id] = { count: docs.length, sizeMb: Math.round(size * 10) / 10 };
    });
    return stats;
  }, [folders, documents]);

  // Overall totals
  const totalStats = useMemo(() => {
    const totalDocs = documents.length;
    const totalSize = documents.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);
    return {
      folderCount: folders.length,
      docCount: totalDocs,
      totalSizeMb: Math.round(totalSize * 10) / 10,
      pendingCount: pending.length
    };
  }, [folders, documents, pending]);

  // Filter folders in directory view
  const filteredFolders = useMemo(() => {
    return folders.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(folderSearch.toLowerCase()) ||
        f.code.toLowerCase().includes(folderSearch.toLowerCase()) ||
        f.description.toLowerCase().includes(folderSearch.toLowerCase());
      const matchCategory = categoryFilter === 'All' || f.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [folders, folderSearch, categoryFilter]);

  // Documents inside currently selected folder (filtered & sorted)
  const docsInFolder = useMemo(() => {
    if (!currentFolder) return [];
    const list = documents.filter((d) => {
      const belongs = d.frameworkId === currentFolder.frameworkId || d.folderId === currentFolder.id;
      if (!belongs) return false;
      const matchSearch =
        !docSearch ||
        d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.docType.toLowerCase().includes(docSearch.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(docSearch.toLowerCase())) ||
        (d.keywords && d.keywords.some((k) => k.toLowerCase().includes(docSearch.toLowerCase())));
      const matchType = !docTypeFilter || d.docType === docTypeFilter;
      return matchSearch && matchType;
    });

    return [...list].sort((a, b) => {
      if (docSort === 'newest') {
        const da = new Date(a.dateAdded || a.documentDate || 0).getTime();
        const db = new Date(b.dateAdded || b.documentDate || 0).getTime();
        return db - da;
      }
      if (docSort === 'oldest') {
        const da = new Date(a.dateAdded || a.documentDate || 0).getTime();
        const db = new Date(b.dateAdded || b.documentDate || 0).getTime();
        return da - db;
      }
      if (docSort === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (docSort === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      if (docSort === 'size-desc') {
        return (b.sizeMb || 0) - (a.sizeMb || 0);
      }
      return 0;
    });
  }, [currentFolder, documents, docSearch, docTypeFilter, docSort]);

  // Total size for current folder
  const currentFolderSizeMb = useMemo(() => {
    if (!currentFolder) return 0;
    const docs = documents.filter((d) => d.frameworkId === currentFolder.frameworkId || d.folderId === currentFolder.id);
    const size = docs.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);
    return Math.round(size * 10) / 10;
  }, [currentFolder, documents]);

  // Queue items in current folder
  const folderQueueItems = useMemo(() => {
    if (!currentFolder) return items;
    return items.filter((i) => !i.folderId || i.folderId === currentFolder.id);
  }, [items, currentFolder]);

  const inProgressCount = folderQueueItems.filter((i) => i.stage < lastStage).length;

  const handleCreateOrEditFolder = (f: EvidenceFolder) => {
    saveFolder(f);
    toast.success(editingFolder ? `Updated folder: ${f.name}` : `Created folder: ${f.name}`);
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    if (folderParam === folderId) {
      setFolder(null);
    }
    toast.success('Folder removed successfully.');
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!currentFolder) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;
    addFiles(droppedFiles, {
      folderId: currentFolder.id,
      folderName: currentFolder.name,
      frameworkId: currentFolder.frameworkId
    });
    setFolderTab('upload');
    setDismissFloatingDock(false);
    toast.success(`Uploading ${droppedFiles.length} file(s) into ${currentFolder.name}`);
  };

  const handleBrowseFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentFolder) return;
    const pickedFiles = Array.from(e.target.files ?? []);
    if (pickedFiles.length === 0) return;
    addFiles(pickedFiles, {
      folderId: currentFolder.id,
      folderName: currentFolder.name,
      frameworkId: currentFolder.frameworkId
    });
    setFolderTab('upload');
    setDismissFloatingDock(false);
    toast.success(`Uploading ${pickedFiles.length} file(s) into ${currentFolder.name}`);
    e.target.value = '';
  };

  const getCategoryBadgeTone = (category: string): BadgeTone => {
    if (category === 'Accreditation') return 'brand';
    if (category === 'Compliance') return 'success';
    if (category === 'Quality Excellence') return 'gold';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL UNIFIED HEADER                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
              Document Management
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-slate-500">
              {currentFolder ? currentFolder.name : 'Accreditation Repositories'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {currentFolder ? currentFolder.name : 'Upload Documents'}
          </h1>
          <p className="mt-1 text-xs sm:text-[13px] text-ink-muted max-w-2xl leading-relaxed">
            {currentFolder
              ? currentFolder.description
              : 'Organize and upload accreditation files into their designated category folders for automatic OCR, chunking, and compliance indexing.'}
          </p>
        </div>

        {/* Action Header Button */}
        {!currentFolder ? (
          <button
            type="button"
            onClick={() => {
              setEditingFolder(null);
              setIsFolderModalOpen(true);
            }}
            className="btn btn-primary self-start sm:self-auto shrink-0 shadow-sm"
          >
            <FolderPlusIcon className="h-4 w-4" />
            <span>Create Folder</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFolder(null)}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>All Folders</span>
            </button>
            {folderTab === 'documents' ? (
              <button
                type="button"
                onClick={() => setFolderTab('upload')}
                className="btn btn-primary btn-sm shadow-sm"
              >
                <CloudUploadIcon className="h-4 w-4" />
                <span>+ Upload New Files</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFolderTab('documents')}
                className="btn btn-secondary btn-sm"
              >
                <FileTextIcon className="h-4 w-4" />
                <span>Repository Documents ({docsInFolder.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. OVERVIEW STRIP (Sleek, Minimalist, Enterprise KPIs)                     */}
      {/* ========================================================================= */}
      {!currentFolder && (
        <section aria-label="System Overview" className="space-y-4">
          {/* Refined KPI Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted">Evidence Folders</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <FolderIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{totalStats.folderCount}</p>
              <p className="text-[11px] text-ink-subtle">Core & custom directories</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted">Indexed Documents</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FileTextIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{totalStats.docCount}</p>
              <p className="text-[11px] text-ink-subtle">Searchable across university</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted">Storage Volume</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-purple-50 text-purple-600">
                  <HardDriveIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{totalStats.totalSizeMb} <span className="text-sm font-normal text-ink-muted">MB</span></p>
              <p className="text-[11px] text-ink-subtle">Total indexed files</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted">Pending Review</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <SparklesIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{totalStats.pendingCount}</p>
              <p className="text-[11px] text-ink-subtle">Awaiting criteria sign-off</p>
            </div>
          </div>

          {/* Clean Guidance Callout */}
          <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3.5 text-xs text-brand-950">
            <ShieldCheckIcon className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-brand-900">Folder-Specific Evidence Policy: </span>
              Every accreditation document must be placed into its specific category folder (
              <span className="font-medium text-ink">Institutional Accreditation</span>,{' '}
              <span className="font-medium text-ink">Program Accreditation</span>,{' '}
              <span className="font-medium text-ink">COPC</span>,{' '}
              <span className="font-medium text-ink">PQA</span>, or{' '}
              <span className="font-medium text-ink">ISO</span>
              ). Click any folder below to view its files or begin uploading.
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. FOLDERS DIRECTORY VIEW (Grid & List View)                              */}
      {/* ========================================================================= */}
      {!currentFolder ? (
        <section className="space-y-4" aria-label="Folder Directory">
          {/* Controls Bar: Search, Category Tabs, Grid/List Switcher */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                placeholder="Search folders by name or code..."
                className="input pl-8.5 h-8.5 text-xs bg-slate-50/50 border-slate-200 rounded-lg focus:bg-white"
              />
            </div>

            {/* Category Filter Pills & View Switcher */}
            <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-xs">
                {['All', 'Accreditation', 'Compliance', 'Quality Excellence', 'Quality Management'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-md px-2.5 py-1 font-medium transition-all text-xs ${
                      categoryFilter === cat
                        ? 'bg-white text-ink font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-ink'
                    }`}
                  >
                    {cat === 'Quality Excellence' ? 'PQA' : cat === 'Quality Management' ? 'ISO' : cat}
                  </button>
                ))}
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-md p-1.5 transition-all ${
                    viewMode === 'grid' ? 'bg-white text-brand-600 shadow-xs font-semibold' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Grid View"
                >
                  <LayoutGridIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-md p-1.5 transition-all ${
                    viewMode === 'list' ? 'bg-white text-brand-600 shadow-xs font-semibold' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="List View"
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* GRID VIEW */}
          {viewMode === 'grid' ? (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFolders.map((folder) => {
                const theme = FOLDER_THEMES[folder.color] || FOLDER_THEMES.blue;
                const stats = folderStats[folder.id] || { count: 0, sizeMb: 0 };

                return (
                  <div
                    key={folder.id}
                    onClick={() => setFolder(folder.id)}
                    className={`group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${theme.borderHover}`}
                  >
                    <div>
                      {/* Top Row: Icon + Code + 3-dots Menu */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`grid h-10 w-10 place-items-center rounded-xl shadow-xs transition-transform group-hover:scale-105 ${theme.iconBg}`}>
                            <FolderIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <span className="inline-block rounded px-1.5 py-0.2 bg-slate-100 text-[11px] font-bold text-slate-700">
                              {folder.code}
                            </span>
                            <Badge tone={getCategoryBadgeTone(folder.category)}>
                              {folder.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <RowActionsMenu
                            label={`Options for ${folder.name}`}
                            actions={[
                              {
                                label: 'Edit Folder',
                                icon: PencilIcon,
                                onSelect: () => {
                                  setEditingFolder(folder);
                                  setIsFolderModalOpen(true);
                                }
                              },
                              {
                                label: folder.isSystem ? 'System Info' : 'Delete Folder',
                                icon: Trash2Icon,
                                tone: folder.isSystem ? undefined : 'danger',
                                onSelect: () => setDeletingFolder(folder)
                              }
                            ]}
                          />
                        </div>
                      </div>

                      {/* Folder Name & Description */}
                      <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-brand-600 transition-colors">
                        {folder.name}
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {folder.description}
                      </p>
                    </div>

                    {/* Bottom Stats Footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-ink-muted">
                      <span className="font-medium text-slate-700">
                        {stats.count} files · {stats.sizeMb} MB
                      </span>
                      <span className="text-[11px] font-medium text-brand-600 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        Open folder →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
              <table className="table">
                <thead>
                  <tr>
                    <th>Folder Name</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Documents</th>
                    <th>Storage</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFolders.map((folder) => {
                    const theme = FOLDER_THEMES[folder.color] || FOLDER_THEMES.blue;
                    const stats = folderStats[folder.id] || { count: 0, sizeMb: 0 };

                    return (
                      <tr
                        key={folder.id}
                        onClick={() => setFolder(folder.id)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <span className={`grid h-8 w-8 place-items-center rounded-lg shrink-0 ${theme.iconBg}`}>
                              <FolderIcon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink text-xs sm:text-[13px] truncate">{folder.name}</p>
                              <p className="text-[11px] text-ink-muted truncate max-w-sm">{folder.description}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                            {folder.code}
                          </span>
                        </td>
                        <td>
                          <Badge tone={getCategoryBadgeTone(folder.category)}>
                            {folder.category}
                          </Badge>
                        </td>
                        <td className="text-xs text-ink font-medium">
                          {stats.count} files
                        </td>
                        <td className="text-xs text-ink-muted">
                          {stats.sizeMb} MB
                        </td>
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setFolder(folder.id)}
                              className="btn btn-secondary btn-sm"
                            >
                              Open
                            </button>
                            <RowActionsMenu
                              label={`Options for ${folder.name}`}
                              actions={[
                                {
                                  label: 'Edit Folder',
                                  icon: PencilIcon,
                                  onSelect: () => {
                                    setEditingFolder(folder);
                                    setIsFolderModalOpen(true);
                                  }
                                },
                                {
                                  label: folder.isSystem ? 'System Info' : 'Delete Folder',
                                  icon: Trash2Icon,
                                  tone: folder.isSystem ? undefined : 'danger',
                                  onSelect: () => setDeletingFolder(folder)
                                }
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredFolders.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <FolderIcon className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-ink">No folders matched your query</h3>
              <p className="mt-1 text-xs text-ink-muted">Try searching for another keyword or switch category filters.</p>
              <button
                type="button"
                onClick={() => {
                  setFolderSearch('');
                  setCategoryFilter('All');
                }}
                className="btn btn-secondary btn-sm mt-3"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      ) : (
        /* ========================================================================= */
        /* 4. INSIDE FOLDER VIEW (TARGETED UPLOAD & EVIDENCE REPOSITORY)             */
        /* ========================================================================= */
        <div
          className="space-y-5"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDropFiles}
        >
          {/* Active Folder Sub-header Banner */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-4.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <span className={`grid h-12 w-12 place-items-center rounded-xl shadow-xs shrink-0 ${FOLDER_THEMES[currentFolder.color]?.iconBg || 'bg-brand-50 text-brand-600'}`}>
                <FolderOpenIcon className="h-6 w-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-ink">{currentFolder.name}</span>
                  <Badge tone={getCategoryBadgeTone(currentFolder.category)}>{currentFolder.category}</Badge>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                    {currentFolder.code}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mt-1">
                  <span>Target Framework ID: <strong className="uppercase text-slate-800">{currentFolder.frameworkId}</strong></span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-700">{docsInFolder.length} documents indexed</span>
                  <span className="text-slate-300">·</span>
                  <span>{currentFolderSizeMb} MB total volume</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-400">Jump to:</span>
              <select
                value={currentFolder.id}
                onChange={(e) => setFolder(e.target.value)}
                className="input h-8.5 text-xs py-1 pr-7 w-48 bg-slate-50 border-slate-200 rounded-lg"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setEditingFolder(currentFolder);
                  setIsFolderModalOpen(true);
                }}
                className="btn btn-ghost btn-icon h-8.5 w-8.5 text-ink-muted hover:text-ink"
                title="Edit Folder"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Segmented View Tabs inside folder */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFolderTab('documents')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  folderTab === 'documents'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-ink hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <FileTextIcon className="h-4 w-4" />
                <span>Repository Documents</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  folderTab === 'documents' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {docsInFolder.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFolderTab('upload')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  folderTab === 'upload'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-ink hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <CloudUploadIcon className="h-4 w-4" />
                <span>Upload Studio & Pipeline</span>
                {folderQueueItems.length > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    folderTab === 'upload'
                      ? 'bg-white/20 text-white'
                      : inProgressCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {inProgressCount > 0 ? `${inProgressCount} active` : `${folderQueueItems.length} ready`}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <HardDriveIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>{currentFolderSizeMb} MB stored</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5 text-brand-500" />
                <span>Auto-Chunking & Retrieval</span>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: FULL-WIDTH REPOSITORY DOCUMENTS TABLE                              */}
          {/* ========================================================================= */}
          {folderTab === 'documents' && (
            <div className="space-y-4">
              {/* Filter & Action Toolbar */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder={`Search within ${currentFolder.name}...`}
                    className="input pl-8.5 h-8.5 text-xs w-full bg-slate-50/70 border-slate-200 rounded-lg focus:bg-white"
                  />
                  {docSearch && (
                    <button
                      type="button"
                      onClick={() => setDocSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters, Sorting & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Filter */}
                  <select
                    value={docTypeFilter}
                    onChange={(e) => setDocTypeFilter(e.target.value)}
                    className="input h-8.5 text-xs pr-7 py-1 bg-slate-50 border-slate-200 rounded-lg"
                  >
                    <option value="">All Document Types</option>
                    <option value="Report">Report</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Policy">Policy</option>
                    <option value="Manual">Manual</option>
                    <option value="Faculty Record">Faculty Record</option>
                    <option value="Statistical Report">Statistical Report</option>
                    <option value="Accomplishment Report">Accomplishment Report</option>
                    <option value="Plan">Plan</option>
                    <option value="Other">Other</option>
                  </select>

                  {/* Sort Order */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDownIcon className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
                    <select
                      value={docSort}
                      onChange={(e) => setDocSort(e.target.value as any)}
                      className="input h-8.5 text-xs pr-7 py-1 bg-slate-50 border-slate-200 rounded-lg"
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="title-asc">Sort: Title (A–Z)</option>
                      <option value="title-desc">Sort: Title (Z–A)</option>
                      <option value="size-desc">Sort: File Size (Largest)</option>
                    </select>
                  </div>

                  {/* Quick Jump to Upload */}
                  <button
                    type="button"
                    onClick={() => setFolderTab('upload')}
                    className="btn btn-primary btn-sm h-8.5 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <CloudUploadIcon className="h-3.5 w-3.5" />
                    <span>Upload Files</span>
                  </button>

                  {/* Pipeline Quick Indicator Button */}
                  {folderQueueItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFolderTab('upload')}
                      className={`btn btn-sm h-8.5 inline-flex items-center gap-1.5 ${
                        inProgressCount > 0 ? 'btn-secondary text-amber-700 bg-amber-50 border-amber-200' : 'btn-secondary text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <SparklesIcon className="h-3.5 w-3.5" />
                      <span>Pipeline ({folderQueueItems.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Full-Width Documents Table */}
              {docsInFolder.length === 0 ? (
                <div className="rounded-xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
                  <FileTextIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-ink text-sm">
                    {docSearch || docTypeFilter ? 'No documents match your query' : 'No documents in this folder yet'}
                  </p>
                  <p className="mt-1 max-w-sm mx-auto text-xs text-ink-muted">
                    {docSearch || docTypeFilter
                      ? 'Try clearing the search text or selecting another document type filter.'
                      : `Upload evidence documents directly into ${currentFolder.name} to begin AI text extraction and compliance matching.`}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {(docSearch || docTypeFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setDocSearch('');
                          setDocTypeFilter('');
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Reset Filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFolderTab('upload')}
                      className="btn btn-primary btn-sm"
                    >
                      <CloudUploadIcon className="h-3.5 w-3.5" />
                      <span>Upload to {currentFolder.code}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th className="min-w-[320px]">Document Title & Description</th>
                          <th className="whitespace-nowrap">Document Type</th>
                          <th className="whitespace-nowrap">Pages & Size</th>
                          <th className="whitespace-nowrap">Date Uploaded</th>
                          <th className="whitespace-nowrap">Index Status</th>
                          <th className="text-right min-w-[150px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {docsInFolder.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Document Title & Description */}
                            <td>
                              <div className="flex items-start gap-3 py-1">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 shrink-0 font-bold text-[10px] uppercase mt-0.5">
                                  {doc.fileType || 'DOC'}
                                </span>
                                <div className="min-w-0 max-w-xl">
                                  <Link
                                    to={`/documents/${doc.id}`}
                                    className="font-semibold text-xs sm:text-[13px] text-ink hover:text-brand-600 transition-colors line-clamp-1"
                                    title={doc.title}
                                  >
                                    {doc.title}
                                  </Link>
                                  <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                                    {doc.description || 'Institutional compliance record'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Document Type */}
                            <td className="whitespace-nowrap">
                              <Badge tone="neutral">{doc.docType}</Badge>
                            </td>

                            {/* Pages & Size */}
                            <td className="text-xs text-ink-muted whitespace-nowrap">
                              <span className="font-medium text-slate-700">{doc.pages}p</span> · {doc.sizeMb} MB
                            </td>

                            {/* Date Uploaded */}
                            <td className="text-xs text-ink-muted whitespace-nowrap">
                              {formatDate(doc.dateAdded || doc.documentDate)}
                            </td>

                            {/* Index Status */}
                            <td className="whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                                <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                                {doc.status || 'Indexed'}
                              </span>
                            </td>

                            {/* Action Buttons: Full Preview and Row Actions */}
                            <td className="text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 font-medium shadow-2xs"
                                >
                                  <EyeIcon className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Preview</span>
                                </button>

                                <RowActionsMenu
                                  label={`Options for ${doc.title}`}
                                  actions={[
                                    {
                                      label: 'Preview Document',
                                      icon: EyeIcon,
                                      onSelect: () => setPreviewDoc(doc)
                                    },
                                    {
                                      label: 'View Full Details',
                                      icon: ExternalLinkIcon,
                                      onSelect: () => navigate(`/documents/${doc.id}`)
                                    },
                                    {
                                      label: 'Download File',
                                      icon: DownloadIcon,
                                      onSelect: () => toast.success(`Downloading ${doc.title}`)
                                    },
                                    {
                                      label: 'Copy Reference Link',
                                      icon: CopyIcon,
                                      onSelect: () => {
                                        navigator.clipboard?.writeText(window.location.origin + `/documents/${doc.id}`);
                                        toast.success('Document link copied to clipboard');
                                      }
                                    }
                                  ]}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs text-ink-muted">
                    <span>
                      Showing <strong>{docsInFolder.length}</strong> of <strong>{documents.filter((d) => d.frameworkId === currentFolder.frameworkId || d.folderId === currentFolder.id).length}</strong> documents in this repository
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Drag and drop files anywhere to upload directly into {currentFolder.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Floating Upload Mini-Dock when background uploads exist */}
              {folderQueueItems.length > 0 && !dismissFloatingDock && (
                <div className="fixed bottom-6 right-6 z-40 max-w-sm rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`grid h-8 w-8 place-items-center rounded-lg shrink-0 ${
                        inProgressCount > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {inProgressCount > 0 ? <CpuIcon className="h-4 w-4" /> : <CheckCircle2Icon className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-ink">
                          {inProgressCount > 0
                            ? `Processing ${inProgressCount} Document${inProgressCount > 1 ? 's' : ''}`
                            : `Upload Complete (${folderQueueItems.length} Ready)`}
                        </p>
                        <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                          {selected?.name || folderQueueItems[0]?.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissFloatingDock(true)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      title="Dismiss"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-[11px] font-medium text-slate-500">
                      {inProgressCount > 0 ? processingStages[selected?.stage ?? 0]?.label : 'Vector Indexed'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFolderTab('upload')}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                    >
                      <span>View Pipeline</span>
                      <ArrowRightIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DEDICATED UPLOAD STUDIO & PROCESSING PIPELINE                      */}
          {/* ========================================================================= */}
          {folderTab === 'upload' && (
            <div className="space-y-5">
              {/* Target Guidance Banner */}
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-xs text-brand-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-brand-950">Active Upload Destination: </span>
                    Files uploaded here are assigned directly to <strong>{currentFolder.name}</strong> (Target Framework: <strong className="uppercase">{currentFolder.frameworkId}</strong>) and automatically indexed for accreditation compliance retrieval.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFolderTab('documents')}
                  className="btn btn-secondary btn-sm shrink-0 self-start sm:self-auto bg-white"
                >
                  <FileTextIcon className="h-3.5 w-3.5" />
                  <span>View Documents ({docsInFolder.length})</span>
                </button>
              </div>

              {/* Two-Column Studio Layout */}
              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Left Column (7 cols): Dropzone, OCR Switch & Queue */}
                <div className="space-y-5 lg:col-span-7">
                  {/* Upload Dropzone */}
                  <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-ink-muted flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <CloudUploadIcon className="h-3.5 w-3.5 text-brand-600" />
                        <span>Upload evidence directly into <strong>{currentFolder.name}</strong></span>
                      </span>
                      <span className="text-[11px] text-ink-subtle">
                        Max file size: 50 MB
                      </span>
                    </div>

                    <label
                      htmlFor="folder-evidence-files"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDropFiles}
                      className={`flex cursor-pointer flex-col items-center justify-center p-10 text-center transition-colors duration-150 ${
                        dragging ? 'bg-brand-50/70 border-brand-500' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs mb-3">
                        <CloudUploadIcon className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-semibold text-ink">
                        Drag and drop evidence files here
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        or <span className="text-brand-600 font-semibold underline underline-offset-2">browse computer files</span>
                      </p>
                      <p className="mt-2.5 text-[11px] text-slate-400">
                        PDF, DOCX, XLSX, PPTX, JPG, PNG, TIFF
                      </p>
                      <input
                        id="folder-evidence-files"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.jpg,.jpeg,.png,.tif,.tiff"
                        className="sr-only"
                        onChange={handleBrowseFiles}
                      />
                    </label>

                    {/* OCR Switch Strip */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-ink">Run OCR text extraction on this batch</p>
                        <p className="text-[11px] text-ink-muted">Enable optical character recognition for scanned documents or certificates</p>
                      </div>
                      <Switch checked={forceOcr} onChange={setForceOcr} label="Run OCR" />
                    </div>
                  </div>

                  {/* Upload Queue List */}
                  {folderQueueItems.length > 0 && (
                    <section className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50/60">
                        <span className="text-xs font-semibold text-ink">Folder Upload Queue ({folderQueueItems.length})</span>
                        <span className="text-[11px] text-ink-muted font-medium">
                          {inProgressCount ? `${inProgressCount} in progress` : 'All items processed'}
                        </span>
                      </div>

                      <ul className="divide-y divide-slate-100">
                        {folderQueueItems.map((item) => {
                          const done = item.stage === lastStage;
                          const isSelected = selected?.id === item.id;
                          return (
                            <li key={item.id} className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-brand-50/40' : ''}`}>
                              <button
                                type="button"
                                onClick={() => setSelectedId(item.id)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                aria-pressed={isSelected}
                              >
                                <FileTextIcon className="h-4 w-4 shrink-0 text-slate-400" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-xs font-medium text-ink">{item.name}</span>
                                    {item.ocr && <Badge tone="gold">OCR</Badge>}
                                  </div>
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <span className="block h-1.5 w-36 overflow-hidden rounded-full bg-slate-100">
                                      <span
                                        className={`block h-full rounded-full transition-all duration-300 ${done ? 'bg-emerald-500' : 'bg-brand-600'}`}
                                        style={{ width: `${((item.stage + (done ? 0 : 0.5)) / lastStage) * 100}%` }}
                                      />
                                    </span>
                                    <span className="text-[11px] text-ink-muted">
                                      {done ? <span className="text-emerald-700 font-semibold">Ready for Retrieval</span> : processingStages[item.stage].label}
                                    </span>
                                  </div>
                                </div>
                              </button>
                              {done && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="btn btn-ghost btn-icon h-7 w-7 text-slate-400 hover:text-slate-600"
                                  title="Dismiss"
                                >
                                  <XIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </div>

                {/* Right Column (5 cols): Processing Pipeline Inspector */}
                <div className="lg:col-span-5">
                  <section className="rounded-xl border border-slate-200/90 bg-white p-4.5 shadow-xs" aria-labelledby="pipeline-heading">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 id="pipeline-heading" className="text-sm font-bold text-ink">
                          Processing Pipeline
                        </h2>
                        <p className="text-[11px] text-ink-muted mt-0.5">Real-time AI Ingestion & Vector Indexing</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                        <SparklesIcon className="h-3 w-3" /> Auto-Indexing
                      </span>
                    </div>

                    {selected ? (
                      <>
                        <div className="mt-3.5 rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs">
                          <p className="font-semibold text-ink truncate" title={selected.name}>
                            {selected.name}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-ink-muted">
                            <span>Target: <strong>{selected.folderName || currentFolder.name}</strong></span>
                            <span>{selected.fileType} · {selected.sizeMb} MB</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <ProcessingPipeline stage={selected.stage} ocr={selected.ocr} />
                        </div>

                        {selected.stage === lastStage && (
                          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs">
                            <p className="flex items-center gap-1.5 font-bold text-emerald-800">
                              <CircleCheckIcon className="h-4 w-4" /> Ready for Retrieval
                            </p>
                            <p className="mt-1 text-slate-600">
                              Stored in <strong>{selected.folderName || currentFolder.name}</strong> and vector indexed into the global university knowledge store.
                            </p>
                            <div className="mt-3 flex flex-col gap-2">
                              <Link
                                to="/evidence/pending"
                                className="btn btn-primary btn-sm w-full justify-center shadow-xs"
                              >
                                Review in Pending Classification
                              </Link>
                              <button
                                type="button"
                                onClick={() => setFolderTab('documents')}
                                className="btn btn-secondary btn-sm w-full justify-center bg-white"
                              >
                                Return to Documents Repository
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-12 text-center text-xs text-ink-muted">
                        <CloudUploadIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="font-medium text-slate-700">No active uploads selected</p>
                        <p className="mt-1 text-slate-400 max-w-xs mx-auto">
                          Drop files into the upload box on the left to monitor live OCR extraction, passage chunking, and embedding generation.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      <FolderFormModal
        open={isFolderModalOpen}
        folder={editingFolder}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleCreateOrEditFolder}
      />

      <DeleteFolderModal
        open={!!deletingFolder}
        folder={deletingFolder}
        documentCount={deletingFolder ? folderStats[deletingFolder.id]?.count || 0 : 0}
        onClose={() => setDeletingFolder(null)}
        onConfirm={handleDeleteFolder}
      />

      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}