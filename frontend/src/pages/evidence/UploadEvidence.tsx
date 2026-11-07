import React, { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  Building2Icon,
  CheckCircle2Icon,
  CheckIcon,
  CloudUploadIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderArchiveIcon,
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
  UploadIcon,
  XIcon
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Badge, BadgeTone } from '../../components/ui/Badge';
import { usePortal } from '../../contexts/PortalContext';
import { DocumentType, EvidenceDocument, EvidenceFolder, FolderColor } from '../../types/evidence';
import { CampusId } from '../../types/accreditation';
import { initialFolders, isRootFrameworkFolder } from '../../data/folders';
import { FolderFormModal } from '../../components/folders/FolderFormModal';
import { DeleteFolderModal } from '../../components/folders/DeleteFolderModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { FolderAction, FolderCard } from '../../components/folders/FolderCard';
import { persistUpload } from '../../utils/fileStore';
import { fileTypeFromName } from '../../utils/fileTypes';
import { formatDate, pluralize } from '../../utils/format';
import { applyNamingPattern, filterAllowedUploads, uploadAcceptAttribute } from '../../utils/uploadRules';
import { usePortalSettings } from '../../settings/portalSettings';
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

interface PreparedUploadItem {
  name: string;
  size: number;
  path?: string;
  file?: File;
}

export function UploadEvidence() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderParam = searchParams.get('folder');

  const {
    folders,
    saveFolder,
    deleteFolder,
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    campuses,
    selectedCampus,
    setSelectedCampus,
    selectedCampusObj,
    isCampusMatch,
    currentUser
  } = usePortal();
  const settings = usePortalSettings();
  const uploadDefaults = { academicYear: settings.general.defaultAcademicYear, status: settings.uploads.newUploadStatus };

  // Root directory view states
  const [folderSearch, setFolderSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [editingFolder, setEditingFolder] = useState<EvidenceFolder | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<EvidenceFolder | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  // Edit / Rename Document Modal state
  const [editingDoc, setEditingDoc] = useState<EvidenceDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocType, setEditDocType] = useState<DocumentType>('Report');
  const [editDocDescription, setEditDocDescription] = useState('');
  const [editDocAcademicYear, setEditDocAcademicYear] = useState('');
  const [editDocFolderId, setEditDocFolderId] = useState('');

  // Inside folder state: filter mode ('all' | 'folders' | 'files')
  const [repoFilter, setRepoFilter] = useState<'all' | 'folders' | 'files'>('all');
  const [docSearch, setDocSearch] = useState('');
  const [subfolderSearch, setSubfolderSearch] = useState('');
  const [docSort, setDocSort] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'size-desc'>('newest');
  const [activeSubfolderFilter, setActiveSubfolderFilter] = useState<string>('all');

  // Dedicated Upload Modal state (Dual-mode: Individual Files & Entire Folder)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileList, setUploadedFileList] = useState<PreparedUploadItem[]>([]);
  const [selectedDestinationFolderId, setSelectedDestinationFolderId] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // File & Folder input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Active folder object
  const currentFolder = useMemo(() => {
    if (!folderParam) return null;
    return folders.find((f) => f.id === folderParam) || null;
  }, [folderParam, folders]);

  const setFolder = (id: string | null) => {
    setActiveSubfolderFilter('all');
    setSubfolderSearch('');
    setRepoFilter('all');
    setDocSearch('');
    if (id) {
      setSearchParams({ folder: id });
    } else {
      setSearchParams({});
    }
  };

  // Campus Isolation Matchers (Strictly isolates Tandag to Tandag, Cantilan to Cantilan, etc.)
  const isDocCampusMatch = (doc: EvidenceDocument, target: CampusId | 'all') => {
    if (target === 'all') return true;
    if (doc.campusId) return doc.campusId === target;
    if (doc.campus) {
      const cNorm = doc.campus.toLowerCase();
      const idNorm = target.toLowerCase();
      if (idNorm === 'tandag' && (cNorm.includes('tandag') || cNorm.includes('main campus'))) {
        return true;
      }
      return cNorm.includes(idNorm) || isCampusMatch(doc.campus, target);
    }
    return target === 'tandag';
  };

  const isFolderCampusMatch = (folder: EvidenceFolder, target: CampusId | 'all') => {
    if (target === 'all') return true;
    if (isRootFrameworkFolder(folder)) return true;
    if (folder.campusId) return folder.campusId === target;
    if (folder.campus) {
      const cNorm = folder.campus.toLowerCase();
      const idNorm = target.toLowerCase();
      if (idNorm === 'tandag' && (cNorm.includes('tandag') || cNorm.includes('main campus'))) {
        return true;
      }
      return cNorm.includes(idNorm) || isCampusMatch(folder.campus, target);
    }
    // Shared starter subfolders for non-IA frameworks (PA, COPC, PQA, ISO)
    if (folder.frameworkId && folder.frameworkId !== 'ia') {
      return true;
    }
    return target === 'tandag';
  };

  // The 5 Canonical Framework Root Repositories: IA, PA, COPC, PQA, ISO ONLY (EXACTLY 5 AT ALL CAMPUSES AND AT EACH CAMPUS)
  const rootFrameworkFolders = useMemo(() => {
    return initialFolders.map((initF) => {
      const match = folders.find(
        (f) => f.id === initF.id || (f.code?.toUpperCase() === initF.code?.toUpperCase() && isRootFrameworkFolder(f))
      );
      return match || initF;
    });
  }, [folders]);

  // Overall root folders: strictly and ONLY the 5 canonical frameworks (IA, PA, COPC, PQA, ISO)
  const allRootFolders = useMemo(() => {
    return rootFrameworkFolders;
  }, [rootFrameworkFolders]);

  // Determine current framework identity and parent root folder
  const isCurrentRoot = useMemo(() => isRootFrameworkFolder(currentFolder), [currentFolder]);
  const currentFrameworkId = useMemo(() => currentFolder?.frameworkId || 'ia', [currentFolder]);
  const parentFrameworkFolder = useMemo(() => {
    if (!currentFolder) return null;
    if (isCurrentRoot) return currentFolder;
    return rootFrameworkFolders.find((rf) => rf.frameworkId === currentFolder.frameworkId) || currentFolder;
  }, [currentFolder, isCurrentRoot, rootFrameworkFolders]);

  // Strictly isolated subfolders belonging to this framework AND matching selectedCampus
  const insideSubfolders = useMemo(() => {
    if (!currentFolder) return [];
    return folders.filter((f) => {
      if (isRootFrameworkFolder(f)) return false;
      if (f.frameworkId !== currentFrameworkId) return false;
      if (isCurrentRoot) {
        if (f.parentId && f.parentId !== currentFolder.id) return false;
      } else {
        if (f.parentId !== currentFolder.id) return false;
      }
      return isFolderCampusMatch(f, selectedCampus);
    });
  }, [currentFolder, folders, currentFrameworkId, isCurrentRoot, selectedCampus]);

  // All sibling subfolders belonging to this framework (for quick-switching within a subfolder view)
  const siblingSubfolders = useMemo(() => {
    if (!parentFrameworkFolder) return [];
    return folders.filter((f) => {
      if (isRootFrameworkFolder(f)) return false;
      if (f.frameworkId !== currentFrameworkId) return false;
      return isFolderCampusMatch(f, selectedCampus);
    });
  }, [parentFrameworkFolder, folders, currentFrameworkId, selectedCampus]);

  // Filtered subfolders by live subfolder search input
  const filteredInsideSubfolders = useMemo(() => {
    if (!subfolderSearch.trim()) return insideSubfolders;
    const q = subfolderSearch.toLowerCase().trim();
    return insideSubfolders.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [insideSubfolders, subfolderSearch]);

  // Compute document count and size for each root folder filtered by selectedCampus
  const folderStats = useMemo(() => {
    const stats: Record<string, { count: number; sizeMb: number }> = {};
    allRootFolders.forEach((f) => {
      const docs = documents.filter(
        (d) =>
          (d.folderId === f.id || (isRootFrameworkFolder(f) && d.frameworkId === f.frameworkId)) &&
          isDocCampusMatch(d, selectedCampus)
      );
      const size = docs.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);
      stats[f.id] = { count: docs.length, sizeMb: Math.round(size * 10) / 10 };
    });

    folders.forEach((f) => {
      if (!stats[f.id]) {
        const docs = documents.filter(
          (d) => d.folderId === f.id && isDocCampusMatch(d, selectedCampus)
        );
        const size = docs.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);
        stats[f.id] = { count: docs.length, sizeMb: Math.round(size * 10) / 10 };
      }
    });

    return stats;
  }, [allRootFolders, folders, documents, selectedCampus]);

  // Overall totals filtered by selectedCampus
  const totalStats = useMemo(() => {
    const campusDocs = documents.filter((d) => isDocCampusMatch(d, selectedCampus));
    const totalSize = campusDocs.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);
    return {
      folderCount: allRootFolders.length,
      docCount: campusDocs.length,
      totalSizeMb: Math.round(totalSize * 10) / 10,
      campusesCount: campuses.length
    };
  }, [allRootFolders, documents, selectedCampus, campuses]);

  // Filter root folders in directory view
  const filteredFolders = useMemo(() => {
    return allRootFolders.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(folderSearch.toLowerCase()) ||
        f.code.toLowerCase().includes(folderSearch.toLowerCase()) ||
        f.description.toLowerCase().includes(folderSearch.toLowerCase());
      return matchSearch;
    });
  }, [allRootFolders, folderSearch]);

  // Base list of documents in active framework & campus (for count calculation)
  const baseFrameworkDocs = useMemo(() => {
    if (!currentFolder) return [];
    return documents.filter((d) => {
      if (d.frameworkId !== currentFrameworkId) return false;
      if (!isDocCampusMatch(d, selectedCampus)) return false;
      if (!isCurrentRoot) {
        return d.folderId === currentFolder.id;
      }
      if (activeSubfolderFilter !== 'all') {
        return d.folderId === activeSubfolderFilter;
      }
      return true;
    });
  }, [currentFolder, documents, currentFrameworkId, selectedCampus, isCurrentRoot, activeSubfolderFilter]);

  // Filtered & sorted documents inside currently selected folder (search & sort)
  const docsInFolder = useMemo(() => {
    let list = [...baseFrameworkDocs];

    // Filter by search text
    list = list.filter((d) => {
      const matchSearch =
        !docSearch ||
        d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.docType.toLowerCase().includes(docSearch.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(docSearch.toLowerCase())) ||
        (d.keywords && d.keywords.some((k) => k.toLowerCase().includes(docSearch.toLowerCase())));
      return matchSearch;
    });

    return list.sort((a, b) => {
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
  }, [baseFrameworkDocs, docSearch, docSort]);

  // Total size for current folder
  const currentFolderSizeMb = useMemo(() => {
    if (!currentFolder) return 0;
    const size = baseFrameworkDocs.reduce((acc, curr) => acc + (curr.sizeMb || 0), 0);
    return Math.round(size * 10) / 10;
  }, [currentFolder, baseFrameworkDocs]);

  // Subfolder file count helper (strictly campus-isolated)
  const getSubfolderDocCount = (sub: EvidenceFolder) => {
    return documents.filter(
      (d) => d.frameworkId === currentFrameworkId && isDocCampusMatch(d, selectedCampus) && d.folderId === sub.id
    ).length;
  };

  // Folder creation/update handler
  const handleCreateOrEditFolder = (f: EvidenceFolder) => {
    const targetCampusId = selectedCampus !== 'all' ? selectedCampus : 'tandag';
    const targetCampusName = selectedCampus !== 'all' ? (selectedCampusObj?.name || 'Tandag (Main Campus)') : 'Tandag (Main Campus)';
    const folderToSave: EvidenceFolder = {
      ...f,
      frameworkId: f.frameworkId || currentFrameworkId || 'ia',
      parentId: f.parentId || (currentFolder ? currentFolder.id : 'folder-ia'),
      campusId: f.campusId || targetCampusId,
      campus: f.campus || targetCampusName
    };
    saveFolder(folderToSave);
    toast.success(editingFolder ? `Updated folder: ${f.name}` : `Created folder: ${f.name}`);
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    if (folderParam === folderId) {
      setFolder(null);
    }
    toast.success('Folder removed successfully.');
  };

  // --- RENAME / EDIT DOCUMENT HANDLERS ---
  const handleOpenEditDoc = (doc: EvidenceDocument) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
    setEditDocType(doc.docType || 'Report');
    setEditDocDescription(doc.description || '');
    setEditDocAcademicYear(doc.academicYear || '2024–2025');
    setEditDocFolderId(doc.folderId || currentFolder?.id || '');
  };

  const handleSaveEditDocument = () => {
    if (!editingDoc) return;
    if (!editDocTitle.trim()) {
      toast.error('Document title cannot be empty.');
      return;
    }
    updateDocument(editingDoc.id, {
      title: editDocTitle.trim(),
      docType: editDocType,
      description: editDocDescription.trim(),
      academicYear: editDocAcademicYear.trim() || undefined,
      folderId: editDocFolderId || editingDoc.folderId
    });
    toast.success(`Updated "${editDocTitle.trim()}"`);
    setEditingDoc(null);
  };

  const handleDeleteDocument = (doc: EvidenceDocument) => {
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      deleteDocument(doc.id);
      toast.success(`Deleted "${doc.title}"`);
    }
  };

  // --- DUAL-MODE UPLOAD HANDLING (Individual Files & Entire Folder) ---
  const handleFilesInputSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list: PreparedUploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      list.push({
        name: files[i].name,
        size: files[i].size,
        file: files[i]
      });
    }
    const allowed = filterAllowedUploads(list, (f) => f);
    e.target.value = '';
    if (allowed.length === 0) return;
    setUploadedFileList(allowed);
    toast.success(`Selected ${allowed.length} file(s) for upload`);
  };

  const handleFolderInputSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list: PreparedUploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      list.push({
        name: file.name,
        size: file.size,
        path: file.webkitRelativePath || file.name,
        file: file
      });
    }
    const allowed = filterAllowedUploads(list, (f) => f);
    e.target.value = '';
    if (allowed.length === 0) return;
    setUploadedFileList(allowed);
    toast.success(`Selected directory containing ${allowed.length} file(s)`);
  };

  const handleDropUpload = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const collected: PreparedUploadItem[] = [];

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
              path: path + file.name,
              file
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

    const allowed = filterAllowedUploads(collected, (f) => f);
    if (allowed.length > 0) {
      setUploadedFileList(allowed);
      toast.success(`Prepared ${allowed.length} file(s) from drop`);
    }
  };

  const handleConfirmUpload = () => {
    if (!currentFolder) return;
    if (uploadedFileList.length === 0) {
      toast.error('Please choose files or select a folder to upload.');
      return;
    }

    setIsProcessingUpload(true);
    setTimeout(() => {
      let targetFolderId = selectedDestinationFolderId || currentFolder.id;
      let targetFolderName = currentFolder.name;

      // Mode: Entire Folder upload from directory input
      if (uploadMode === 'folder' && uploadedFileList[0]?.path) {
        const rootDirName = uploadedFileList[0].path.split('/')[0];
        if (rootDirName && rootDirName !== uploadedFileList[0].name) {
          const existingSub = insideSubfolders.find(
            (f) => f.name.toLowerCase() === rootDirName.toLowerCase()
          );

          if (existingSub) {
            targetFolderId = existingSub.id;
            targetFolderName = existingSub.name;
          } else {
            const newSubId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const newFolder: EvidenceFolder = {
              id: newSubId,
              name: rootDirName,
              code: rootDirName.slice(0, 4).toUpperCase(),
              frameworkId: currentFrameworkId,
              category: currentFolder.category,
              description: `Imported directory containing ${uploadedFileList.length} evidence file(s).`,
              color: 'amber',
              createdAt: new Date().toISOString().slice(0, 10),
              startDate: new Date().toISOString().slice(0, 10),
              hasNoDeadline: true,
              parentId: currentFolder.id,
              campusId: selectedCampus !== 'all' ? selectedCampus : 'tandag',
              campus: selectedCampus !== 'all' ? (selectedCampusObj?.name || 'Tandag (Main Campus)') : 'Tandag (Main Campus)'
            };
            saveFolder(newFolder);
            targetFolderId = newSubId;
            targetFolderName = rootDirName;
          }
        }
      }

      // Commit each file into documents store strictly mapped to this framework and campus
      const campusTag = selectedCampus !== 'all' ? (selectedCampusObj?.name || 'Tandag (Main Campus)') : 'Tandag (Main Campus)';
      const campusIdTag = selectedCampus !== 'all' ? selectedCampus : 'tandag';
      const today = new Date().toISOString().slice(0, 10);

      uploadedFileList.forEach((item) => {
        const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const sizeMb = Math.max(0.1, Math.round((item.size / 1024 / 1024) * 10) / 10);
        const pages = Math.max(1, Math.round(sizeMb * 6));

        persistUpload(docId, item.file);
        addDocument({
          id: docId,
          title: applyNamingPattern(item.name, { campus: campusTag, area: currentFolder.code, year: uploadDefaults.academicYear }).replace(/[_-]+/g, ' '),
          description: `Evidence document stored in ${targetFolderName} for ${currentFolder.code} accreditation compliance.`,
          fileType: fileTypeFromName(item.name),
          pages,
          sizeMb,
          frameworkId: currentFrameworkId,
          areaId: currentFolder.areaId || 'area-1',
          criterionId: 'c1',
          indicatorId: 'i1',
          folderId: targetFolderId,
          campusId: campusIdTag,
          campus: campusTag,
          docType: 'Report',
          academicYear: uploadDefaults.academicYear,
          cycle: '3rd Cycle',
          program: 'Institutional Portfolio',
          college: 'University System',
          department: 'Quality Assurance Office',
          office: 'Quality Assurance Office',
          status: 'Indexed',
          approvalStatus: uploadDefaults.status,
          documentDate: today,
          dateAdded: today,
          uploadedBy: currentUser.name,
          confidentiality: 'Internal',
          keywords: [item.name.toLowerCase().replace(/\.[^.]+$/, ''), currentFolder.code.toLowerCase()],
          passages: [`Stored in ${targetFolderName} for ${currentFolder.code} compliance.`]
        });
      });

      setIsProcessingUpload(false);
      setUploadModalOpen(false);
      setUploadedFileList([]);
      toast.success(
        `Successfully uploaded ${uploadedFileList.length} document(s) into ${targetFolderName} (${currentFolder.code})!`
      );
    }, 450);
  };

  const renderFileIcon = (fileType?: string) => {
    const t = (fileType || '').toLowerCase();
    if (t.includes('pdf')) {
      return (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 font-bold text-[10px] uppercase border border-rose-100 shrink-0">
          PDF
        </span>
      );
    }
    if (t.includes('xls') || t.includes('csv') || t.includes('sheet')) {
      return (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase border border-emerald-100 shrink-0">
          XLSX
        </span>
      );
    }
    if (t.includes('doc') || t.includes('word')) {
      return (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 font-bold text-[10px] uppercase border border-blue-100 shrink-0">
          DOCX
        </span>
      );
    }
    if (t.includes('ppt') || t.includes('presentation')) {
      return (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 font-bold text-[10px] uppercase border border-amber-100 shrink-0">
          PPTX
        </span>
      );
    }
    return (
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border border-slate-200 shrink-0">
        FILE
      </span>
    );
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
          {/* Breadcrumb Navigation */}
          {!currentFolder ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                Document Management
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-medium text-slate-500">
                Accreditation Repositories
              </span>
            </div>
          ) : isCurrentRoot ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFolder(null)}
                className="text-[11px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-800 hover:underline"
              >
                Document Management
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-700">
                {currentFolder.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
              <button
                type="button"
                onClick={() => setFolder(null)}
                className="hover:text-brand-600 font-medium transition-colors"
              >
                Document Management
              </button>
              <span className="text-slate-300">/</span>
              <button
                type="button"
                onClick={() => setFolder(parentFrameworkFolder?.id || null)}
                className="hover:text-brand-600 font-semibold text-brand-700 transition-colors"
              >
                {parentFrameworkFolder?.name || 'Framework'}
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-800">{currentFolder.name}</span>
            </div>
          )}

          {/* Heading */}
          <div className="mt-1">
            {!currentFolder ? (
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Upload Documents
              </h1>
            ) : isCurrentRoot ? (
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {currentFolder.name}
              </h1>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {currentFolder.name}
                </h1>
                {currentFolder.code && (
                  <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 border border-brand-200">
                    {currentFolder.code}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                  <FolderIcon className="h-3 w-3 text-amber-600" />
                  <span>Subfolder</span>
                </span>
              </div>
            )}
          </div>

          <p className="mt-1 text-xs sm:text-[13px] text-ink-muted max-w-2xl leading-relaxed">
            {!currentFolder
              ? 'Organize and upload accreditation files into their designated category folders for automatic OCR, chunking, and compliance indexing.'
              : isCurrentRoot
              ? currentFolder.description
              : currentFolder.description || `Evidence documents inside ${currentFolder.name} for ${parentFrameworkFolder?.name || 'accreditation'}.`}
          </p>
        </div>

        {/* Action Header Button */}
        {!currentFolder ? (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Link
              to="/evidence"
              className="btn btn-secondary shrink-0 shadow-2xs text-xs font-semibold gap-1.5"
            >
              <FileTextIcon className="h-4 w-4 text-slate-500" />
              <span>View All Documents</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setEditingFolder(null);
                setIsFolderModalOpen(true);
              }}
              className="btn btn-primary shrink-0 shadow-xs text-xs font-semibold gap-1.5"
              title="Create new folder"
            >
              <FolderPlusIcon className="h-4 w-4" />
              <span>+ New Folder</span>
            </button>
          </div>
        ) : isCurrentRoot ? (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveSubfolderFilter('all');
                setFolder(null);
              }}
              className="btn btn-secondary btn-sm gap-1.5 shadow-2xs"
            >
              <ArrowLeftIcon className="h-4 w-4 text-slate-500" />
              <span>All Repositories</span>
            </button>

            {/* ONE UPLOAD BUTTON ONLY - STRICTLY FOR THIS FRAMEWORK */}
            <button
              type="button"
              onClick={() => {
                setUploadedFileList([]);
                setSelectedDestinationFolderId(activeSubfolderFilter !== 'all' ? activeSubfolderFilter : currentFolder.id);
                setUploadModalOpen(true);
              }}
              className="btn btn-primary btn-sm shadow-xs font-semibold gap-1.5"
              title={`Upload individual files or entire folder into ${currentFolder.code}`}
            >
              <CloudUploadIcon className="h-4 w-4" />
              <span>Upload Files / Folder</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setFolder(parentFrameworkFolder?.id || null)}
              className="btn btn-secondary btn-sm gap-1.5 font-semibold text-slate-700 shadow-2xs"
            >
              <ArrowLeftIcon className="h-4 w-4 text-slate-500" />
              <span>Back to {parentFrameworkFolder?.code || 'Framework'} Folders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadedFileList([]);
                setSelectedDestinationFolderId(currentFolder.id);
                setUploadModalOpen(true);
              }}
              className="btn btn-primary btn-sm shadow-xs font-semibold gap-1.5"
              title={`Upload files directly to ${currentFolder.name}`}
            >
              <CloudUploadIcon className="h-4 w-4" />
              <span>Upload to {currentFolder.code || currentFolder.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. OVERVIEW STRIP (Root Framework Directory View)                         */}
      {/* ========================================================================= */}
      {!currentFolder && (
        <section aria-label="System Overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4.5">
            {/* Card 1: Evidence Folders (Strictly 5 Root Canonical Repositories) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence Folders</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/70 shadow-2xs">
                  <FolderIcon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                {totalStats.folderCount}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 truncate" title="IA, PA, COPC, PQA, ISO">
                IA, PA, COPC, PQA, ISO
              </p>
            </div>

            {/* Card 2: Indexed Documents (Reactive to Campus Filter) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Indexed Documents</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/70 shadow-2xs">
                  <FileTextIcon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                {totalStats.docCount}
              </p>
              <p
                className="mt-1 text-xs font-medium text-slate-500 truncate"
                title={selectedCampus === 'all' ? 'Across all 7 university campuses' : `Filtered to ${selectedCampusObj?.name || selectedCampus}`}
              >
                {selectedCampus === 'all'
                  ? 'Across all 7 campuses'
                  : `Filtered to ${selectedCampusObj?.name || selectedCampus}`}
              </p>
            </div>

            {/* Card 3: Storage Volume (Reactive to Campus Filter) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Storage Volume</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100/70 shadow-2xs">
                  <HardDriveIcon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                {totalStats.totalSizeMb}{' '}
                <span className="text-xs sm:text-sm font-semibold text-slate-400">MB</span>
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 truncate">
                {selectedCampus === 'all'
                  ? 'Indexed system files size'
                  : `${selectedCampusObj?.shortName || 'Campus'} evidence size`}
              </p>
            </div>

            {/* Card 4: Campuses Active / Target Campus (Reactive to Campus Filter) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {selectedCampus === 'all' ? 'Campuses Active' : 'Active Campus'}
                </span>
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl border shadow-2xs ${
                    selectedCampus === 'all'
                      ? 'bg-amber-50 text-amber-600 border-amber-100/70'
                      : 'bg-brand-50 text-brand-600 border-brand-100/70'
                  }`}
                >
                  <Building2Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink truncate">
                {selectedCampus === 'all'
                  ? totalStats.campusesCount
                  : (selectedCampusObj?.shortName || selectedCampusObj?.name || selectedCampus)}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 truncate">
                {selectedCampus === 'all'
                  ? 'University system campuses'
                  : 'Isolated campus repository'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. FOLDERS DIRECTORY VIEW (5 CANONICAL FRAMEWORK FOLDERS)                  */}
      {/* ========================================================================= */}
      {!currentFolder ? (
        <section className="space-y-4" aria-label="Folder Directory">
          {/* Controls Bar: Search, Campus Filter Pills, Grid/List Switcher */}
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

            {/* Campus Filter Pills (All Campuses + 7 Campuses) */}
            <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 text-xs overflow-x-auto no-scrollbar max-w-full border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedCampus('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCampus === 'all'
                      ? 'bg-white text-ink shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-ink hover:bg-white/60'
                  }`}
                >
                  <Building2Icon className="h-3.5 w-3.5 text-slate-500" />
                  <span>All Campuses</span>
                </button>

                {campuses.map((camp) => {
                  const isSelected = selectedCampus === camp.id;
                  return (
                    <button
                      key={camp.id}
                      type="button"
                      onClick={() => setSelectedCampus(camp.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                        isSelected
                          ? 'bg-brand-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-ink hover:bg-white/60'
                      }`}
                      title={camp.name}
                    >
                      <span>{camp.shortName || camp.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-1 text-slate-500 transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-brand-600 shadow-2xs' : 'hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGridIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded p-1 text-slate-500 transition-colors ${
                    viewMode === 'list' ? 'bg-white text-brand-600 shadow-2xs' : 'hover:text-slate-800'
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
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFolders.map((folder) => {
                const stats = folderStats[folder.id] || { count: 0, sizeMb: 0 };

                return (
                  <FolderCard
                    key={folder.id}
                    onOpen={() => setFolder(folder.id)}
                    title={folder.description || `Open ${folder.name}`}
                    eyebrow={folder.category ? `${folder.code} · ${folder.category}` : folder.code}
                    name={folder.name}
                    meta={`${pluralize(stats.count, 'file')} · ${stats.sizeMb} MB`}
                    status={stats.count === 0 ? { label: 'No files yet', tone: 'neutral' } : null}
                    actions={
                      <FolderAction
                        icon={PencilIcon}
                        label="Edit folder"
                        onClick={() => {
                          setEditingFolder(folder);
                          setIsFolderModalOpen(true);
                        }}
                      />
                    }
                  />
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
              <div className="overflow-x-auto">
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
                      const stats = folderStats[folder.id] || { count: 0, sizeMb: 0 };

                      return (
                        <tr
                          key={folder.id}
                          onClick={() => setFolder(folder.id)}
                          className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                        >
                          <td>
                            <div className="flex items-center gap-3">
                              <FolderIcon className="h-7 w-7 shrink-0 fill-amber-100 text-amber-400" strokeWidth={1.5} />
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
                            <button
                              type="button"
                              onClick={() => setFolder(folder.id)}
                              className="btn btn-secondary btn-sm"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredFolders.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <FolderIcon className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-ink">No folders matched your query</h3>
              <p className="mt-1 text-xs text-ink-muted">Try searching for another keyword or switch campuses.</p>
              <button
                type="button"
                onClick={() => {
                  setFolderSearch('');
                  setSelectedCampus('all');
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
        /* 4. INSIDE FOLDER VIEW (CLEAN VIEW & RENAME/EDIT ACTION WORKFLOW)          */
        /* ========================================================================= */
        <div className="space-y-5">
          {/* ========================================================================= */}
          {/* ACTIVE FOLDER / SUBFOLDER CONTEXT BANNER                                  */}
          {/* ========================================================================= */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3.5">
              <span className={`grid h-12 w-12 place-items-center rounded-xl shadow-xs shrink-0 ${FOLDER_THEMES[currentFolder.color]?.iconBg || 'bg-brand-50 text-brand-600'}`}>
                <FolderOpenIcon className="h-6 w-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-ink">{currentFolder.name}</span>
                  <Badge tone={getCategoryBadgeTone(currentFolder.category)}>{currentFolder.category}</Badge>
                  {currentFolder.code && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                      {currentFolder.code}
                    </span>
                  )}
                  {isCurrentRoot ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                      <span>Active Repository</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                      <FolderIcon className="h-3 w-3 text-amber-600" />
                      <span>Subfolder</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
                  {currentFolder.description || (isCurrentRoot ? 'Designated framework repository for evidence files.' : 'Dedicated subfolder guidelines')}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mt-1.5">
                  {!isCurrentRoot && parentFrameworkFolder && (
                    <>
                      <span>
                        Subfolder of:{' '}
                        <button
                          type="button"
                          onClick={() => setFolder(parentFrameworkFolder.id)}
                          className="font-bold text-brand-600 hover:underline"
                        >
                          {parentFrameworkFolder.name} ({parentFrameworkFolder.code})
                        </button>
                      </span>
                      <span className="text-slate-300">·</span>
                    </>
                  )}
                  <span>
                    Target Framework: <strong className="uppercase text-slate-800">{currentFolder.frameworkId}</strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-700">{baseFrameworkDocs.length} documents indexed</span>
                  <span className="text-slate-300">·</span>
                  <span>{currentFolderSizeMb} MB volume</span>
                  {currentFolder.campus && currentFolder.campus !== 'All Campuses' && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1 text-brand-700 font-medium">
                        <Building2Icon className="h-3 w-3" />
                        <span>{currentFolder.campus}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Switchers: Campus & Framework/Subfolder Jump */}
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {/* Quick Campus Switcher inside folder */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                <Building2Icon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400 hidden md:inline">Campus:</span>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">All Campuses</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jump Switcher: Root Frameworks vs Sibling Subfolders */}
              {isCurrentRoot ? (
                <>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">Jump:</span>
                  <select
                    value={parentFrameworkFolder?.id || currentFolder.id}
                    onChange={(e) => {
                      setActiveSubfolderFilter('all');
                      setFolder(e.target.value);
                    }}
                    className="input h-8.5 text-xs py-1 pr-7 w-52 bg-slate-50 border-slate-200 rounded-lg font-medium"
                  >
                    {rootFrameworkFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </>
              ) : siblingSubfolders.length > 1 ? (
                <>
                  <span className="text-xs text-slate-400 font-medium hidden md:inline">Switch Subfolder:</span>
                  <select
                    value={currentFolder.id}
                    onChange={(e) => setFolder(e.target.value)}
                    className="input h-8.5 text-xs py-1 pr-7 w-48 sm:w-56 bg-slate-50 border-slate-200 rounded-lg font-medium"
                  >
                    {siblingSubfolders.map((sib) => (
                      <option key={sib.id} value={sib.id}>
                        {sib.code ? `[${sib.code}] ` : ''}{sib.name} ({getSubfolderDocCount(sib)})
                      </option>
                    ))}
                  </select>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setEditingFolder(currentFolder);
                  setIsFolderModalOpen(true);
                }}
                className="btn btn-ghost btn-icon h-8.5 w-8.5 text-ink-muted hover:text-ink"
                title={isCurrentRoot ? 'Edit Repository' : 'Edit Subfolder'}
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ITEM FILTERING BAR (All Items | Folders Only | Files Only) - Root Only    */}
          {/* ========================================================================= */}
          {isCurrentRoot && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-3">
              {/* Tri-Mode Item Filter Pills */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 text-xs border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRepoFilter('all')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    repoFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>All Items</span>
                  <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                    {insideSubfolders.length + baseFrameworkDocs.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRepoFilter('folders')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    repoFilter === 'folders'
                      ? 'bg-amber-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <FolderIcon className="h-3.5 w-3.5" />
                  <span>Folders Only</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    repoFilter === 'folders' ? 'bg-white/30 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {insideSubfolders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRepoFilter('files')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    repoFilter === 'files'
                      ? 'bg-brand-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <FileTextIcon className="h-3.5 w-3.5" />
                  <span>Files Only</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    repoFilter === 'files' ? 'bg-white/30 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {baseFrameworkDocs.length}
                  </span>
                </button>
              </div>

              {/* Scope / Summary Status Indicator on the right */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-lg">
                  <SparklesIcon className="h-3.5 w-3.5 text-brand-600" />
                  <span>
                    Repository: <strong>{currentFolder.code}</strong> · {baseFrameworkDocs.length} {baseFrameworkDocs.length === 1 ? 'file' : 'files'}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Subfolder active filter pill indicator (if filtered into a specific subfolder) */}
          {isCurrentRoot && activeSubfolderFilter !== 'all' && (
            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/60 p-2.5 text-xs text-brand-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-brand-600" />
                <span>
                  Filtering by subfolder:{' '}
                  <strong>
                    {folders.find((f) => f.id === activeSubfolderFilter)?.name || activeSubfolderFilter}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubfolderFilter('all')}
                className="text-brand-700 hover:underline font-semibold flex items-center gap-1 text-[11px]"
              >
                <XIcon className="h-3.5 w-3.5" />
                <span>Show All in {currentFolder.code}</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: SUBFOLDERS (RENDERED ONLY IN ROOT WHEN repoFilter !== 'files') */}
          {/* ========================================================================= */}
          {isCurrentRoot && (repoFilter === 'all' || repoFilter === 'folders') && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Subfolders in {parentFrameworkFolder?.code || currentFolder.code} ({insideSubfolders.length})
                  </span>
                  {selectedCampus !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      <Building2Icon className="h-3 w-3" />
                      {selectedCampusObj?.name || selectedCampus}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {insideSubfolders.length > 3 && (
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={subfolderSearch}
                        onChange={(e) => setSubfolderSearch(e.target.value)}
                        placeholder="Search subfolders..."
                        className="input pl-7.5 pr-2 h-7.5 text-xs w-44 bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                      />
                      {subfolderSearch && (
                        <button
                          type="button"
                          onClick={() => setSubfolderSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingFolder(null);
                      setIsFolderModalOpen(true);
                    }}
                    className="btn btn-secondary btn-sm text-xs font-semibold gap-1 text-brand-600 hover:text-brand-700"
                  >
                    <FolderPlusIcon className="h-3.5 w-3.5" />
                    <span>+ Add Subfolder</span>
                  </button>
                </div>
              </div>

              {insideSubfolders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-ink-muted">
                  <FolderIcon className="mx-auto h-7 w-7 text-slate-300 mb-1.5" />
                  <p className="font-semibold text-slate-700">No subfolders yet in {currentFolder.code}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click &quot;+ Add Subfolder&quot; or upload an entire folder to automatically create subdirectories.
                  </p>
                </div>
              ) : filteredInsideSubfolders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-ink-muted">
                  <p className="font-semibold text-slate-700">No subfolders match &quot;{subfolderSearch}&quot;</p>
                  <button
                    type="button"
                    onClick={() => setSubfolderSearch('')}
                    className="btn btn-secondary btn-xs mt-2"
                  >
                    Clear Subfolder Search
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredInsideSubfolders.map((sub) => {
                    const count = getSubfolderDocCount(sub);

                    return (
                      <FolderCard
                        key={sub.id}
                        onOpen={() => setFolder(sub.id)}
                        title={sub.description || `Open ${sub.name}`}
                        eyebrow={[sub.code, sub.campus && sub.campus !== 'All Campuses' ? sub.campus : null].filter(Boolean).join(' · ') || undefined}
                        name={sub.name}
                        meta={pluralize(count, 'file')}
                        status={count === 0 ? { label: 'No files yet', tone: 'neutral' } : null}
                        actions={
                          <>
                            <FolderAction
                              icon={PencilIcon}
                              label="Edit subfolder"
                              onClick={() => {
                                setEditingFolder(sub);
                                setIsFolderModalOpen(true);
                              }}
                            />
                            <FolderAction icon={Trash2Icon} label="Delete subfolder" danger onClick={() => setDeletingFolder(sub)} />
                          </>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: EVIDENCE DOCUMENTS (VIEW AND RENAME / EDIT ONLY)               */}
          {/* ========================================================================= */}
          {(!isCurrentRoot || repoFilter === 'all' || repoFilter === 'files') && (
            <div className="space-y-3 pt-2">
              {/* Search & Sorting Toolbar */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
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

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <ArrowUpDownIcon className="h-3.5 w-3.5 text-slate-400 hidden sm:inline shrink-0" />
                  <select
                    value={docSort}
                    onChange={(e) => setDocSort(e.target.value as any)}
                    className="input h-8.5 text-xs pr-7 py-1 w-full sm:w-48 bg-slate-50 border-slate-200 rounded-lg shrink-0 font-medium"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="title-asc">Sort: Title (A–Z)</option>
                    <option value="title-desc">Sort: Title (Z–A)</option>
                    <option value="size-desc">Sort: File Size (Largest)</option>
                  </select>
                </div>
              </div>

              {/* Header label for Files section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Files ({docsInFolder.length} of {baseFrameworkDocs.length})
                  </span>
                  {!isCurrentRoot && (
                    <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                      Inside {currentFolder.code || currentFolder.name}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-ink-subtle">
                  {selectedCampus === 'all'
                    ? 'Showing evidence files across All Campuses'
                    : `Showing evidence files for ${selectedCampusObj?.name || selectedCampus}`}
                </span>
              </div>

              {/* Files List / Cards */}
              {docsInFolder.length === 0 ? (
                <div className="rounded-xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
                  <FileTextIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-ink text-sm">
                    {docSearch
                      ? 'No documents match your search query'
                      : `No evidence documents in ${currentFolder.name} yet`}
                  </p>
                  <p className="mt-1 max-w-sm mx-auto text-xs text-ink-muted">
                    {docSearch
                      ? 'Try clearing the search query to view all documents.'
                      : `Upload individual files or an entire folder directly into ${currentFolder.name} (${currentFolder.code || 'evidence'}).`}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {docSearch && (
                      <button
                        type="button"
                        onClick={() => setDocSearch('')}
                        className="btn btn-secondary btn-sm"
                      >
                        Reset Search
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileList([]);
                        setSelectedDestinationFolderId(currentFolder.id);
                        setUploadModalOpen(true);
                      }}
                      className="btn btn-primary btn-sm gap-1.5"
                    >
                      <CloudUploadIcon className="h-3.5 w-3.5" />
                      <span>Upload Files to {currentFolder.code || currentFolder.name}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {docsInFolder.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      {/* File Details (Left) */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {renderFileIcon(doc.fileType)}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="text-left font-bold text-xs sm:text-[13px] text-ink hover:text-brand-600 hover:underline truncate max-w-lg"
                              title={doc.title}
                            >
                              {doc.title}
                            </button>

                            {doc.docType && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">
                                {doc.docType}
                              </span>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
                            <span className="font-semibold text-slate-700">{doc.fileType || 'PDF'}</span>
                            <span>·</span>
                            <span>{doc.sizeMb || 1.2} MB</span>
                            <span>·</span>
                            <span>{formatDate(doc.dateAdded || doc.documentDate)}</span>
                            {doc.academicYear && (
                              <>
                                <span>·</span>
                                <span>{doc.academicYear}</span>
                              </>
                            )}
                            {doc.campus && (
                              <>
                                <span>·</span>
                                <span className="text-brand-700 font-medium">{doc.campus}</span>
                              </>
                            )}
                          </div>

                          {doc.description && (
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions (Right) - Icon-Only: View, Rename/Edit, Delete (Download removed) */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {/* View Icon Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-brand-300 hover:bg-slate-50 hover:text-brand-600 transition-all"
                          title="View / Preview Document"
                          aria-label="View Document"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {/* Rename / Edit Icon Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditDoc(doc)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 transition-all"
                          title="Rename and edit document details"
                          aria-label="Rename / Edit Document"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>

                        {/* Delete Icon Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-2xs hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 transition-all"
                          title="Delete File"
                          aria-label="Delete File"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DUAL-MODE UPLOAD MODAL (Individual Files & Entire Folder)              */}
      {/* ========================================================================= */}
      {currentFolder && (
        <Modal
          open={uploadModalOpen}
          onClose={() => {
            if (!isProcessingUpload) {
              setUploadModalOpen(false);
              setUploadedFileList([]);
            }
          }}
          size="lg"
          title={`Upload Documents to ${currentFolder.name}`}
          description={`Upload individual files or import an entire directory hierarchy into ${currentFolder.code}.`}
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadedFileList([]);
                }}
                disabled={isProcessingUpload}
                className="btn btn-secondary w-full sm:w-auto text-xs font-semibold h-9 px-4"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isProcessingUpload || uploadedFileList.length === 0}
                className="btn btn-primary w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isProcessingUpload ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Processing Upload...</span>
                  </>
                ) : (
                  <>
                    <CloudUploadIcon className="h-3.5 w-3.5" />
                    <span>
                      Upload to {currentFolder.code} ({uploadedFileList.length} items)
                    </span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Campus & Target Framework Scope Tag */}
            <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-brand-600" />
                <span>
                  Feature Scope: <strong>{currentFolder.name} ({currentFolder.code})</strong>
                </span>
              </div>
              <span className="font-semibold text-brand-700 bg-white px-2 py-0.5 rounded-md border border-brand-200">
                {selectedCampusObj?.name || 'All Campuses'}
              </span>
            </div>

            {/* Upload Mode Selector (Individual Files vs Entire Folder) */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('files');
                  setUploadedFileList([]);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  uploadMode === 'files'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileTextIcon className="h-4 w-4 text-brand-600" />
                <span>Individual Files</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUploadMode('folder');
                  setUploadedFileList([]);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  uploadMode === 'folder'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderArchiveIcon className="h-4 w-4 text-amber-600" />
                <span>Entire Folder</span>
              </button>
            </div>

            {/* Destination Subfolder Selector (Optional) */}
            {insideSubfolders.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Destination Subfolder in {currentFolder.code}:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Choose target</span>
                </label>
                <select
                  value={selectedDestinationFolderId}
                  onChange={(e) => setSelectedDestinationFolderId(e.target.value)}
                  className="input text-xs w-full bg-white border-slate-300"
                >
                  <option value={currentFolder?.id || ''}>
                    Root {currentFolder?.name || 'Framework Repository'} (General Repository)
                  </option>
                  {insideSubfolders.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name} ({getSubfolderDocCount(sub)} files)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hidden native inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={uploadAcceptAttribute()}
              className="hidden"
              onChange={handleFilesInputSelection}
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error webkitdirectory standard on modern browsers
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleFolderInputSelection}
            />

            {/* Interactive Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropUpload}
              onClick={() => {
                if (uploadMode === 'folder') {
                  folderInputRef.current?.click();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className={`group border-2 border-dashed rounded-xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-400/30'
                  : 'border-slate-300 hover:border-brand-400 bg-slate-50/40 hover:bg-brand-50/20'
              }`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-2xs group-hover:scale-105 group-hover:border-brand-200 transition-all duration-200 mb-2.5">
                {uploadMode === 'folder' ? (
                  <FolderArchiveIcon className="h-6 w-6 text-amber-600" />
                ) : (
                  <UploadIcon className="h-6 w-6 text-brand-600" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {uploadMode === 'folder' ? (
                  <>
                    <span className="text-brand-600 group-hover:underline">Choose a folder</span> or drag directory here
                  </>
                ) : (
                  <>
                    <span className="text-brand-600 group-hover:underline">Choose files</span> or drag and drop here
                  </>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {uploadMode === 'folder'
                  ? 'Imports entire directory structure and indexes all nested evidence files.'
                  : 'Supports PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), and images up to 50 MB.'}
              </p>
            </div>

            {/* Selected Files Preview List */}
            {uploadedFileList.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 max-h-44 overflow-y-auto space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Ready for upload ({uploadedFileList.length} items)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFileList([])}
                    className="text-danger-600 hover:underline text-[11px] font-semibold"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1 pr-1">
                  {uploadedFileList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[420px]">
                        {item.name.endsWith('.xlsx') || item.name.endsWith('.csv') ? (
                          <FileSpreadsheetIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : item.name.endsWith('.docx') ? (
                          <FileTextIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <FileTextIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="truncate font-medium text-slate-800">
                          {item.path || item.name}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-2">
                        {(item.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. CREATE / EDIT SUBFOLDER MODAL (SIMPLIFIED: NAME, CODE, DESCRIPTION)    */}
      {/* ========================================================================= */}
      <FolderFormModal
        open={isFolderModalOpen}
        folder={editingFolder}
        simplified={true}
        parentId={currentFolder ? currentFolder.id : undefined}
        frameworkId={currentFrameworkId}
        category={currentFolder ? currentFolder.category : 'Accreditation'}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={(f) => {
          const finalFolder: EvidenceFolder = {
            ...f,
            frameworkId: currentFrameworkId,
            category: currentFolder ? currentFolder.category : 'Accreditation',
            parentId: currentFolder ? currentFolder.id : undefined,
            campusId: selectedCampus !== 'all' ? selectedCampus : 'tandag',
            campus: selectedCampus !== 'all' ? (selectedCampusObj?.name || 'Tandag (Main Campus)') : 'Tandag (Main Campus)'
          };
          handleCreateOrEditFolder(finalFolder);
        }}
      />

      {/* ========================================================================= */}
      {/* 7. RENAME / EDIT DOCUMENT MODAL (Title, Doc Type, Description, Year)       */}
      {/* ========================================================================= */}
      {editingDoc && (
        <Modal
          open={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          size="md"
          title="Rename / Edit Document"
          description="Update the document title, type, and guidelines for this evidence file."
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="btn btn-secondary w-full sm:w-auto text-xs font-semibold h-9 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditDocument}
                className="btn btn-primary w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* File Info Header */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              {renderFileIcon(editingDoc.fileType)}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 truncate">{editingDoc.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {editingDoc.fileType} · {editingDoc.sizeMb} MB · {editingDoc.campus || selectedCampusObj?.name || 'Main Campus'}
                </p>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Document Title <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                value={editDocTitle}
                onChange={(e) => setEditDocTitle(e.target.value)}
                placeholder="e.g. Campus Strategic Plan 2024-2028 Final"
                className="input text-xs w-full bg-white font-medium"
                required
              />
            </div>

            {/* Document Type & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Document Type
                </label>
                <select
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value as DocumentType)}
                  className="input text-xs w-full bg-white"
                >
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
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={editDocAcademicYear}
                  onChange={(e) => setEditDocAcademicYear(e.target.value)}
                  placeholder="e.g. 2024–2025"
                  className="input text-xs w-full bg-white"
                />
              </div>
            </div>

            {/* Destination Subfolder in Framework */}
            {insideSubfolders.length > 0 && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Folder Location
                </label>
                <select
                  value={editDocFolderId}
                  onChange={(e) => setEditDocFolderId(e.target.value)}
                  className="input text-xs w-full bg-white"
                >
                  <option value={currentFolder?.id || editingDoc?.folderId || ''}>
                    Root {currentFolder?.name || 'Framework Repository'} (General Repository)
                  </option>
                  {insideSubfolders.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Description & Compliance Notes (Optional)
              </label>
              <textarea
                value={editDocDescription}
                onChange={(e) => setEditDocDescription(e.target.value)}
                rows={3}
                className="textarea text-xs w-full bg-white"
                placeholder="Brief summary of document content and compliance relevance..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Folder Modal */}
      <DeleteFolderModal
        open={!!deletingFolder}
        folder={deletingFolder}
        documentCount={deletingFolder ? folderStats[deletingFolder.id]?.count || 0 : 0}
        onClose={() => setDeletingFolder(null)}
        onConfirm={handleDeleteFolder}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
