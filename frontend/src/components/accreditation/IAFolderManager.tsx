import React, { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FolderIcon,
  SearchIcon,
  FolderPlusIcon,
  UploadIcon,
  FileTextIcon,
  PencilIcon,
  Trash2Icon,
  LayersIcon,
  FolderArchiveIcon,
  FolderOpenIcon,
  ArrowUpDownIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  FileIcon,
  EyeIcon,
  DownloadIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { EvidenceFolder, EvidenceDocument } from '../../types/evidence';
import { CampusId, IARequirementItem } from '../../types/accreditation';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { FolderFormModal } from '../folders/FolderFormModal';
import { DeleteFolderModal } from '../folders/DeleteFolderModal';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';

interface IAFolderManagerProps {
  campusId: CampusId;
  campusName: string;
  iaRequirements: IARequirementItem[];
  onRequirementUpdated?: (reqId: string, docName: string, docUrl: string) => void;
}

// 9 Official AACCUP Institutional Accreditation Instrument Areas
const OFFICIAL_IA_AREAS = [
  { code: 'AREA-I', number: 1, name: 'Governance and Management', shortDesc: 'Strategic plans, organizational manuals, BOR resolutions' },
  { code: 'AREA-II', number: 2, name: 'Teaching, Learning, and Evaluation', shortDesc: 'OBE syllabi, curricular approvals, graduation metrics' },
  { code: 'AREA-III', number: 3, name: 'Faculty and Staff', shortDesc: 'Plantilla credentials, FDP plans, QCE/NBC 461 ratings' },
  { code: 'AREA-IV', number: 4, name: 'Research', shortDesc: 'Institutional agenda, Scopus publications, IP disclosures' },
  { code: 'AREA-V', number: 5, name: 'Extension, Consultancy, and Linkages', shortDesc: 'Extension master plan, LGU MOUs, impact assessment' },
  { code: 'AREA-VI', number: 6, name: 'Support to Students', shortDesc: 'SAS operations manual, guidance counseling, scholarships' },
  { code: 'AREA-VII', number: 7, name: 'Library', shortDesc: 'Holdings inventory, electronic databases, OPAC portal' },
  { code: 'AREA-VIII', number: 8, name: 'Infrastructure and Other Learning Resources', shortDesc: 'Physical plant, lab safety audit, IT high-speed network' },
  { code: 'AREA-IX', number: 9, name: 'Quality Assurance Culture', shortDesc: 'QA manual, ISO 9001:2015 QMS, IQA resolutions' }
];

export function IAFolderManager({ campusName, iaRequirements, onRequirementUpdated }: IAFolderManagerProps) {
  const { folders, saveFolder, deleteFolder, documents, addDocument, deleteDocument } = usePortal();

  // Active view tab: 'areas' | 'folders'
  const [activeTab, setActiveTab] = useState<'folders' | 'areas'>('areas');
  const [searchQuery, setSearchQuery] = useState('');

  // Folder Navigation State: null = root repository view; string = drilled-down folder ID
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Inside-Folder Filtering and Sorting
  const [repoFilter, setRepoFilter] = useState<'all' | 'folders' | 'files'>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  // Folder Form Modal
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [folderFormParentId, setFolderFormParentId] = useState<string | undefined>(undefined);
  const [editingFolder, setEditingFolder] = useState<EvidenceFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<EvidenceFolder | null>(null);

  // Upload States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileList, setUploadedFileList] = useState<Array<{ name: string; size: number; path?: string }>>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Hidden File and Folder Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Filter IA folders
  const iaFolders = useMemo(() => {
    return folders.filter((f) => f.frameworkId === 'ia' || f.category === 'Accreditation' || f.id.startsWith('folder-ia'));
  }, [folders]);

  // Documents mapped to this campus or IA framework
  const campusIADocs = useMemo(() => {
    return documents.filter((d) => d.frameworkId === 'ia');
  }, [documents]);

  // Root Folders (folders without a parentId)
  const rootFolders = useMemo(() => {
    return iaFolders.filter((f) => !f.parentId);
  }, [iaFolders]);

  // Active folder object if drilled down
  const currentActiveFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return iaFolders.find((f) => f.id === activeFolderId) || null;
  }, [activeFolderId, iaFolders]);

  // Document count per folder helper (defaulting unassigned IA docs to 'folder-ia')
  const getFolderDocCount = (folderId: string) => {
    return campusIADocs.filter((d) => (d.folderId || 'folder-ia') === folderId).length;
  };

  // Subfolder count inside a specific folder
  const getFolderSubfolderCount = (folderId: string) => {
    return iaFolders.filter((f) => f.parentId === folderId).length;
  };

  // Filtered and Sorted IA Areas
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return OFFICIAL_IA_AREAS;
    const q = searchQuery.toLowerCase();
    return OFFICIAL_IA_AREAS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.shortDesc.toLowerCase().includes(q) ||
        `area ${a.number}`.includes(q)
    );
  }, [searchQuery]);

  // Filtered Root Folders (for Root View)
  const filteredRootFolders = useMemo(() => {
    let list = rootFolders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [rootFolders, searchQuery]);

  // Inside-Folder Subfolders (sorted A to Z)
  const insideSubfolders = useMemo(() => {
    if (!activeFolderId) return [];
    let list = iaFolders.filter((f) => f.parentId === activeFolderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [iaFolders, activeFolderId, searchQuery, sortDirection]);

  // Inside-Folder Files (sorted A to Z)
  const insideFiles = useMemo(() => {
    if (!activeFolderId) return [];
    let list = campusIADocs.filter((d) => (d.folderId || 'folder-ia') === activeFolderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.docType.toLowerCase().includes(q) ||
          d.fileType.toLowerCase().includes(q) ||
          (d.academicYear && d.academicYear.toLowerCase().includes(q)) ||
          (d.keywords && d.keywords.some((k) => k.toLowerCase().includes(q)))
      );
    }
    return [...list].sort((a, b) => {
      const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [campusIADocs, activeFolderId, searchQuery, sortDirection]);

  // Handle Folder Upload from input
  const handleFolderInputSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list: Array<{ name: string; size: number; path?: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      list.push({
        name: file.name,
        size: file.size,
        path: file.webkitRelativePath || file.name
      });
    }
    setUploadedFileList(list);
    toast.success(`Selected folder with ${list.length} file(s)`);
  };

  // Handle Files Upload from input
  const handleFilesInputSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list: Array<{ name: string; size: number }> = [];
    for (let i = 0; i < files.length; i++) {
      list.push({
        name: files[i].name,
        size: files[i].size
      });
    }
    setUploadedFileList(list);
    toast.success(`Selected ${list.length} file(s) for upload`);
  };

  // Drag and Drop Recursive Folder Handler
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const collected: Array<{ name: string; size: number; path?: string }> = [];

    interface FileSystemEntryLike {
      name: string;
      isFile: boolean;
      isDirectory: boolean;
      file?: (callback: (file: File) => void) => void;
      createReader?: () => { readEntries: (callback: (entries: FileSystemEntryLike[]) => void) => void };
    }

    const traverseFileTree = async (item: FileSystemEntryLike, path = '') => {
      if (item.isFile && item.file) {
        const getFile = item.file;
        await new Promise<void>((resolve) => {
          getFile((file: File) => {
            collected.push({
              name: file.name,
              size: file.size,
              path: path + file.name
            });
            resolve();
          });
        });
      } else if (item.isDirectory && item.createReader) {
        const dirReader = item.createReader();
        await new Promise<void>((resolve) => {
          dirReader.readEntries(async (entries: FileSystemEntryLike[]) => {
            for (const entry of entries) {
              await traverseFileTree(entry, path + item.name + '/');
            }
            resolve();
          });
        });
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry?.();
      if (item) {
        await traverseFileTree(item);
      }
    }

    if (collected.length > 0) {
      setUploadedFileList(collected);
      toast.success(`Prepared ${collected.length} file(s) from folder drop`);
    }
  };

  // Execute Upload Commit
  const handleExecuteUpload = () => {
    if (uploadedFileList.length === 0) {
      toast.error('Please select files or an entire folder first.');
      return;
    }

    setIsProcessingUpload(true);
    setTimeout(() => {
      const effectiveFolderId = selectedTargetFolder || activeFolderId || iaFolders[0]?.id || 'folder-ia';
      const targetFolder = iaFolders.find((f) => f.id === effectiveFolderId) || iaFolders[0];

      // If uploading an entire folder, check if we need to auto-create subfolder
      let destinationFolderId = effectiveFolderId;
      if (uploadMode === 'folder' && uploadedFileList[0]?.path) {
        const rootFolderName = uploadedFileList[0].path.split('/')[0];
        if (rootFolderName && rootFolderName !== uploadedFileList[0].name) {
          const existingSub = iaFolders.find((f) => f.name === rootFolderName && f.parentId === effectiveFolderId);
          if (existingSub) {
            destinationFolderId = existingSub.id;
          } else {
            const newSubId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const createdSub: EvidenceFolder = {
              id: newSubId,
              name: rootFolderName,
              code: rootFolderName.slice(0, 4).toUpperCase(),
              frameworkId: 'ia',
              category: 'Accreditation',
              description: `Uploaded directory containing ${uploadedFileList.length} file(s).`,
              color: 'amber',
              createdAt: new Date().toISOString().slice(0, 10),
              parentId: effectiveFolderId
            };
            saveFolder(createdSub);
            destinationFolderId = newSubId;
          }
        }
      }

      uploadedFileList.forEach((file, idx) => {
        const newDoc: EvidenceDocument = {
          id: `doc-ia-${Date.now()}-${idx}`,
          title: file.path ? `${file.path.split('/')[0]}: ${file.name}` : file.name,
          description: `Uploaded evidence document for Institutional Accreditation (${targetFolder?.name || 'IA Repository'}).`,
          keywords: ['IA Evidence', targetFolder?.name || 'Repository', campusName],
          frameworkId: 'ia',
          areaId: 'area-i',
          criterionId: 'c-ia-1',
          indicatorId: 'i-1-1',
          docType: file.name.endsWith('.xlsx') ? 'Statistical Report' : 'Report',
          academicYear: '2024–2025',
          cycle: '2025 Institutional Accreditation',
          program: 'Institution-wide',
          college: 'University-wide',
          department: '—',
          office: 'Quality Assurance Office',
          campus: campusName,
          documentDate: new Date().toISOString().slice(0, 10),
          confidentiality: 'Internal',
          status: 'Indexed',
          dateAdded: new Date().toISOString().slice(0, 10),
          fileType: file.name.endsWith('.docx') ? 'DOCX' : file.name.endsWith('.xlsx') ? 'XLSX' : 'PDF',
          pages: Math.max(1, Math.round(file.size / 50000)),
          sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10 || 1.2,
          uploadedBy: 'Current User',
          passages: [`Institutional evidence registered under ${targetFolder?.name || 'Institutional Accreditation'}`],
          folderId: destinationFolderId
        };
        addDocument(newDoc);
      });

      setIsProcessingUpload(false);
      setUploadModalOpen(false);
      setUploadedFileList([]);
      toast.success(
        uploadMode === 'folder'
          ? `Successfully uploaded folder (${uploadedFileList.length} files)!`
          : `Successfully uploaded ${uploadedFileList.length} document(s)!`
      );
    }, 600);
  };

  // Helper for rendering file type icons
  const renderFileIcon = (fileType?: string) => {
    const ft = (fileType || '').toUpperCase();
    if (ft === 'PDF') {
      return <FileTextIcon className="h-5 w-5 text-red-500 shrink-0" />;
    }
    if (ft === 'XLSX' || ft === 'CSV') {
      return <FileSpreadsheetIcon className="h-5 w-5 text-emerald-600 shrink-0" />;
    }
    if (ft === 'DOCX' || ft === 'DOC') {
      return <FileTextIcon className="h-5 w-5 text-blue-600 shrink-0" />;
    }
    return <FileIcon className="h-5 w-5 text-slate-500 shrink-0" />;
  };

  return (
    <div className="panel mb-6 overflow-hidden">
      {/* Header */}
      <div className="border-b border-line bg-canvas/40 p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-ink">IA Document & Folder Management</h3>
          <Badge tone="brand">Official Areas 1–9</Badge>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          Organize institutional accreditation portfolios, manage custom folders, and upload entire folders or files.
        </p>
      </div>

      {/* Segmented View Tabs & Action Row */}
      <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('areas');
              setActiveFolderId(null);
            }}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'areas'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <LayersIcon className="h-3.5 w-3.5" />
            <span>IA Areas 1–9 ({OFFICIAL_IA_AREAS.length} Areas)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('folders')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'folders'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FolderIcon className="h-3.5 w-3.5 text-amber-600" />
            <span>Custom Folders ({rootFolders.length})</span>
          </button>
        </div>

        {/* Search Bar + Upload Files/Folder Button on the same row */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'areas'
                  ? 'Search areas 1–9...'
                  : currentActiveFolder
                  ? `Search inside ${currentActiveFolder.name}...`
                  : 'Search folders...'
              }
              className="input h-8 pl-8 text-xs w-full bg-slate-50 border-line focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-xs text-ink-subtle hover:text-ink"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedTargetFolder(activeFolderId || iaFolders[0]?.id || 'folder-ia');
              setUploadModalOpen(true);
            }}
            className="btn btn-primary btn-sm h-8 shrink-0 text-xs gap-1.5"
            title="Upload individual files or entire folders"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            <span>Upload Files / Folder</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OFFICIAL IA AREAS 1–9 DISPLAY */}
      {activeTab === 'areas' && (
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Official AACCUP Institutional Accreditation Areas 1–9
            </span>
            <span className="text-xs text-ink-subtle">
              Complete official institutional criteria hierarchy
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area) => {
              const req = iaRequirements.find((r) => r.areaCode === area.code);
              const isApproved = req?.status === 'Approved';
              const isUnderReview = req?.status === 'Under Review';
              const isDeficient = req?.status === 'Deficient';

              return (
                <div
                  key={area.code}
                  className="rounded-lg border border-line bg-white p-3.5 shadow-xs transition-all hover:border-brand-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      Area {area.number}
                    </span>
                    <Badge
                      tone={
                        isApproved
                          ? 'success'
                          : isUnderReview
                          ? 'brand'
                          : isDeficient
                          ? 'danger'
                          : 'warning'
                      }
                      dot
                    >
                      {req?.status || 'Pending'}
                    </Badge>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-ink leading-tight">{area.name}</h4>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-2">{area.shortDesc}</p>

                  <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-[11px] text-ink-subtle">
                      {req?.documentName ? (
                        <span className="text-emerald-700 font-medium truncate max-w-[170px] inline-block align-bottom">
                          ✓ {req.documentName}
                        </span>
                      ) : (
                        'No evidence attached'
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTargetFolder(iaFolders[0]?.id || 'folder-ia');
                        setUploadModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                    >
                      <UploadIcon className="h-3 w-3" /> Upload
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: IA EVIDENCE FOLDERS REPOSITORY */}
      {activeTab === 'folders' && (
        <div className="p-4 space-y-4">
          {/* LEVEL 1: ROOT REPOSITORY VIEW (When user has not clicked a folder yet) */}
          {!currentActiveFolder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  IA Evidence Folders Repository
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderFormParentId(undefined);
                    setFolderFormOpen(true);
                  }}
                  className="btn btn-secondary btn-xs gap-1"
                >
                  <FolderPlusIcon className="h-3.5 w-3.5 text-brand-600" />
                  <span>New Folder</span>
                </button>
              </div>

              {filteredRootFolders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line bg-canvas p-8 text-center text-xs text-ink-muted">
                  No folders matching "{searchQuery}".
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {filteredRootFolders.map((folder) => {
                    const docCount = getFolderDocCount(folder.id);
                    const subCount = getFolderSubfolderCount(folder.id);
                    return (
                      <div
                        key={folder.id}
                        onClick={() => {
                          setActiveFolderId(folder.id);
                          setRepoFilter('all');
                          setSearchQuery('');
                        }}
                        className="group relative cursor-pointer rounded-lg border border-line bg-white p-3.5 shadow-xs transition-all hover:border-brand-400 hover:shadow-sm"
                        title="Click to open this folder"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                              <FolderIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-ink group-hover:text-brand-700 transition-colors">
                                {folder.name}
                              </h4>
                              <span className="text-[10px] text-ink-subtle">{folder.code} · {folder.createdAt}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFolder(folder);
                                setFolderFormOpen(true);
                              }}
                              className="p-1 text-ink-subtle hover:text-brand-600 rounded"
                              title="Rename folder"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            {!folder.isSystem && (
                              <button
                                type="button"
                                onClick={() => setDeletingFolder(folder)}
                                className="p-1 text-ink-subtle hover:text-danger-600 rounded"
                                title="Delete folder"
                              >
                                <Trash2Icon className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-[11px] text-ink-muted line-clamp-2">
                          {folder.description || 'No description provided.'}
                        </p>

                        <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-subtle">
                          <span className="font-medium text-ink-muted">
                            {docCount} document{docCount === 1 ? '' : 's'} inside
                            {subCount > 0 && ` · ${subCount} subfolder${subCount === 1 ? '' : 's'}`}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTargetFolder(folder.id);
                              setUploadModalOpen(true);
                            }}
                            className="font-semibold text-brand-600 hover:underline"
                          >
                            + Upload to folder
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: INSIDE A CLICKED FOLDER (All files and subfolders appear here!) */}
          {currentActiveFolder && (
            <div className="space-y-4">
              {/* Folder Breadcrumb & Action Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50/50 p-3.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFolderId(null);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    <span>IA Evidence Folders Repository</span>
                  </button>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-brand-400" />
                  <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                    <FolderOpenIcon className="h-4 w-4 text-amber-600" />
                    <span>{currentActiveFolder.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFolder(null);
                      setFolderFormParentId(currentActiveFolder.id);
                      setFolderFormOpen(true);
                    }}
                    className="btn btn-secondary btn-xs text-xs gap-1"
                  >
                    <FolderPlusIcon className="h-3 w-3 text-brand-600" />
                    <span>New Subfolder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTargetFolder(currentActiveFolder.id);
                      setUploadModalOpen(true);
                    }}
                    className="btn btn-primary btn-xs text-xs gap-1"
                  >
                    <UploadIcon className="h-3 w-3" />
                    <span>Upload to this Folder</span>
                  </button>
                </div>
              </div>

              {/* Filtering, Counts & A-Z Sorting inside the clicked folder */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
                {/* Filter Pills with Live Counts */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRepoFilter('all')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      repoFilter === 'all'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-canvas text-ink-muted hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    <span>All Items</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        repoFilter === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-ink-muted'
                      }`}
                    >
                      {insideSubfolders.length + insideFiles.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepoFilter('folders')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      repoFilter === 'folders'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-canvas text-ink-muted hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    <FolderIcon className="h-3.5 w-3.5" />
                    <span>Folders Only</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        repoFilter === 'folders' ? 'bg-white/25 text-white' : 'bg-slate-200 text-ink-muted'
                      }`}
                    >
                      {insideSubfolders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepoFilter('files')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      repoFilter === 'files'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-canvas text-ink-muted hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    <FileTextIcon className="h-3.5 w-3.5" />
                    <span>Files Only</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        repoFilter === 'files' ? 'bg-white/25 text-white' : 'bg-slate-200 text-ink-muted'
                      }`}
                    >
                      {insideFiles.length}
                    </span>
                  </button>
                </div>

                {/* Alphabetical A to Z Sorting */}
                <button
                  type="button"
                  onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="btn btn-secondary btn-xs h-7 text-xs gap-1.5 self-start sm:self-auto"
                  title="Toggle alphabetical order (A–Z / Z–A)"
                >
                  <ArrowUpDownIcon className="h-3 w-3 text-brand-600" />
                  <span className="font-semibold text-brand-700">Sort: {sortDirection === 'asc' ? 'A → Z' : 'Z → A'}</span>
                </button>
              </div>

              {/* EMPTY STATE INSIDE THE FOLDER */}
              {insideSubfolders.length === 0 && insideFiles.length === 0 && (
                <div className="rounded-lg border border-dashed border-line bg-canvas p-8 text-center">
                  <FolderOpenIcon className="mx-auto h-9 w-9 text-ink-subtle mb-2" />
                  <p className="text-xs font-semibold text-ink">No files or folders found</p>
                  <p className="text-[11px] text-ink-muted mt-1">
                    {searchQuery
                      ? `No items matching "${searchQuery}" inside ${currentActiveFolder.name}.`
                      : `"${currentActiveFolder.name}" is currently empty.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTargetFolder(currentActiveFolder.id);
                      setUploadModalOpen(true);
                    }}
                    className="btn btn-primary btn-xs mt-3 text-xs gap-1"
                  >
                    <UploadIcon className="h-3 w-3" /> Upload Files Now
                  </button>
                </div>
              )}

              {/* SUBFOLDERS SECTION */}
              {(repoFilter === 'all' || repoFilter === 'folders') && insideSubfolders.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Folders ({insideSubfolders.length})
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {insideSubfolders.map((sub) => {
                      const count = getFolderDocCount(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setActiveFolderId(sub.id);
                            setSearchQuery('');
                          }}
                          className="group relative cursor-pointer rounded-lg border border-line bg-white p-3 shadow-xs transition-all hover:border-brand-400"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded bg-amber-50 text-amber-600 group-hover:bg-amber-100">
                                <FolderIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-ink group-hover:text-brand-700">{sub.name}</h5>
                                <span className="text-[10px] text-ink-subtle">{sub.createdAt}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingFolder(sub);
                              }}
                              className="p-1 text-ink-subtle hover:text-danger-600"
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="mt-2 pt-2 border-t border-line text-[11px] text-ink-muted flex items-center justify-between">
                            <span>{count} files inside</span>
                            <span className="text-brand-600 font-semibold group-hover:underline">Open →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FILES SECTION */}
              {(repoFilter === 'all' || repoFilter === 'files') && insideFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Files ({insideFiles.length})
                    </span>
                    <span className="text-[11px] text-ink-subtle">
                      Sorted A to Z ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xs">
                    <div className="divide-y divide-line">
                      {insideFiles.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex flex-col gap-2 p-3 text-xs transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="mt-0.5">{renderFileIcon(doc.fileType)}</div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="text-left font-bold text-ink hover:text-brand-600 hover:underline truncate block max-w-[340px] sm:max-w-[480px]"
                                title={doc.title}
                              >
                                {doc.title}
                              </button>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-subtle">
                                <span>{doc.fileType || 'PDF'}</span>
                                <span>·</span>
                                <span>{doc.sizeMb || 1.2} MB</span>
                                <span>·</span>
                                <span>{doc.documentDate || '2025-01-15'}</span>
                                {doc.academicYear && (
                                  <>
                                    <span>·</span>
                                    <span>{doc.academicYear}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <Badge tone={doc.status === 'Verified' ? 'success' : 'brand'} dot>
                              {doc.status || 'Indexed'}
                            </Badge>

                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="btn btn-secondary btn-xs h-7 px-2 text-[11px] gap-1"
                              title="Preview document"
                            >
                              <EyeIcon className="h-3 w-3" /> Preview
                            </button>

                            <button
                              type="button"
                              onClick={() => toast.success(`Downloading "${doc.title}"`)}
                              className="btn btn-ghost btn-xs h-7 px-2 text-[11px] text-ink-muted hover:text-ink"
                              title="Download document"
                            >
                              <DownloadIcon className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove "${doc.title}"?`)) {
                                  deleteDocument(doc.id);
                                  toast.success(`Removed "${doc.title}"`);
                                }
                              }}
                              className="btn btn-ghost btn-xs h-7 px-2 text-[11px] text-ink-subtle hover:text-danger-600"
                              title="Delete file"
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD INDIVIDUAL FILES & ENTIRE FOLDERS MODAL (No Target Area or Target Folder dropdowns) */}
      {uploadModalOpen && (
        <Modal
          open={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setUploadedFileList([]);
          }}
          title={uploadMode === 'folder' ? 'Upload Entire Folder' : 'Upload Evidence Files'}
          description="Select individual documents or upload an entire directory structure for Institutional Accreditation."
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadedFileList([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadedFileList.length === 0 || isProcessingUpload}
                onClick={handleExecuteUpload}
                className="btn btn-primary btn-sm"
              >
                {isProcessingUpload
                  ? 'Processing & Indexing...'
                  : `Upload Documents (${uploadedFileList.length} files)`}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-canvas p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('files');
                  setUploadedFileList([]);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 font-semibold rounded-md transition-all ${
                  uploadMode === 'files' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted'
                }`}
              >
                <FileTextIcon className="h-3.5 w-3.5" /> Individual Files
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('folder');
                  setUploadedFileList([]);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 font-semibold rounded-md transition-all ${
                  uploadMode === 'folder' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted'
                }`}
              >
                <FolderArchiveIcon className="h-3.5 w-3.5" /> Entire Folder
              </button>
            </div>

            {/* Hidden HTML5 File / Directory Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesInputSelection}
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error webkitdirectory is standard for folder inputs
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleFolderInputSelection}
            />

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (uploadMode === 'folder') {
                  folderInputRef.current?.click();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/70'
                  : 'border-line hover:border-brand-400 hover:bg-canvas'
              }`}
            >
              {uploadMode === 'folder' ? (
                <FolderOpenIcon className="mx-auto h-10 w-10 text-brand-600 mb-2" />
              ) : (
                <UploadIcon className="mx-auto h-10 w-10 text-brand-600 mb-2" />
              )}
              <p className="text-xs font-semibold text-ink">
                {uploadMode === 'folder'
                  ? 'Click to select an entire folder or drag and drop a folder here'
                  : 'Click to select individual files or drag and drop here'}
              </p>
              <p className="text-[11px] text-ink-subtle mt-1">
                Supports PDF, DOCX, XLSX, PPTX, and image evidence portfolios.
              </p>
            </div>

            {/* Selected Files List Preview */}
            {uploadedFileList.length > 0 && (
              <div className="rounded-md border border-line bg-canvas p-3 max-h-40 overflow-y-auto space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-ink pb-1 border-b border-line">
                  <span>Selected Items ({uploadedFileList.length})</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFileList([])}
                    className="text-danger-600 hover:underline text-[11px]"
                  >
                    Clear All
                  </button>
                </div>
                {uploadedFileList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="truncate max-w-[320px]">📄 {item.path || item.name}</span>
                    <span>{(item.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* CREATE / RENAME FOLDER MODAL */}
      <FolderFormModal
        open={folderFormOpen}
        folder={editingFolder}
        parentId={folderFormParentId}
        onClose={() => {
          setFolderFormOpen(false);
          setEditingFolder(null);
          setFolderFormParentId(undefined);
        }}
        onSave={(f) => {
          saveFolder({ ...f, frameworkId: 'ia', category: 'Accreditation' });
          toast.success(editingFolder ? 'Folder renamed successfully' : 'New IA folder created');
        }}
      />

      {/* DELETE FOLDER MODAL */}
      <DeleteFolderModal
        open={!!deletingFolder}
        folder={deletingFolder}
        documentCount={getFolderDocCount(deletingFolder?.id || '')}
        onClose={() => setDeletingFolder(null)}
        onConfirm={(id) => {
          deleteFolder(id);
          if (activeFolderId === id) {
            setActiveFolderId(null);
          }
          toast.success('Folder deleted');
        }}
      />
    </div>
  );
}
