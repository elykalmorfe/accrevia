import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Building2Icon,
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
  ArrowLeftIcon,
  CalendarIcon,
  Share2Icon
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

export function IAFolderManager({ campusId, campusName, iaRequirements, onRequirementUpdated }: IAFolderManagerProps) {
  const { folders, saveFolder, deleteFolder, documents, addDocument, deleteDocument, updateDocument } = usePortal();

  // Active view tab: 'areas' | 'folders'
  const [activeTab, setActiveTab] = useState<'folders' | 'areas'>('areas');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Area Navigation (null = viewing all 9 area cards; 'AREA-I' = viewing inside Area 1)
  const [selectedAreaCode, setSelectedAreaCode] = useState<string | null>(null);

  // Folder Drill-down Navigation (null = root level; string = folder ID)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Inside-Folder Filtering and Sorting
  const [repoFilter, setRepoFilter] = useState<'all' | 'folders' | 'files'>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  // Modal to upload / transfer a Custom Folder to a Specific Area
  const [uploadingCustomFolder, setUploadingCustomFolder] = useState<EvidenceFolder | null>(null);
  const [targetAreaForCustomFolder, setTargetAreaForCustomFolder] = useState<string>('AREA-I');

  // Folder Form Modal States
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [folderFormParentId, setFolderFormParentId] = useState<string | undefined>(undefined);
  const [folderFormAreaId, setFolderFormAreaId] = useState<string | undefined>(undefined);
  const [folderFormInitialName, setFolderFormInitialName] = useState<string | undefined>(undefined);
  const [folderFormInitialCode, setFolderFormInitialCode] = useState<string | undefined>(undefined);
  const [editingFolder, setEditingFolder] = useState<EvidenceFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<EvidenceFolder | null>(null);

  // Upload Modal States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'files' | 'folder' | 'from-custom'>('files');
  const [selectedCustomFolderToUpload, setSelectedCustomFolderToUpload] = useState<string>('');
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileList, setUploadedFileList] = useState<Array<{ name: string; size: number; path?: string }>>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // States for Top Upload Button (beside search bar)
  const [isTopUploadSource, setIsTopUploadSource] = useState(false);
  const [topUploadTargetAreaCode, setTopUploadTargetAreaCode] = useState<string>('AREA-I');
  const [topUploadTargetFolderId, setTopUploadTargetFolderId] = useState<string>('');

  // Hidden File and Folder Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Reset folder and area selection whenever switching campuses
  useEffect(() => {
    setActiveFolderId(null);
    setSelectedAreaCode(null);
    setSelectedTargetFolder('');
    setSearchQuery('');
  }, [campusId]);

  // STRICT CAMPUS & FRAMEWORK ISOLATION:
  // Each campus (Tandag, Cantilan, San Miguel, etc.) has its own isolated folders for Areas 1–9.
  const iaFolders = useMemo(() => {
    return folders.filter((f) => {
      const isIA =
        f.frameworkId === 'ia' ||
        f.category === 'Accreditation' ||
        f.category === 'General / Custom' ||
        f.id.startsWith('folder-ia');
      if (!isIA) return false;

      // Match folder strictly by campus:
      if (f.campusId) {
        return f.campusId === campusId;
      }
      if (f.campus) {
        const cNorm = f.campus.toLowerCase();
        const idNorm = campusId.toLowerCase();
        if (idNorm === 'tandag' && (cNorm.includes('tandag') || cNorm.includes('main campus'))) {
          return true;
        }
        return cNorm.includes(idNorm) || f.campus === campusName;
      }
      // For legacy/initial mock folders without campus metadata, associate them with default 'tandag'
      return campusId === 'tandag';
    });
  }, [folders, campusId, campusName]);

  // Documents mapped strictly to this campus and IA framework
  const campusIADocs = useMemo(() => {
    return documents.filter((d) => {
      const isIA = d.frameworkId === 'ia';
      if (!isIA) return false;

      // Match document strictly by campus:
      if (d.campusId) {
        return d.campusId === campusId;
      }
      if (d.campus) {
        const cNorm = d.campus.toLowerCase();
        const idNorm = campusId.toLowerCase();
        if (idNorm === 'tandag' && (cNorm.includes('tandag') || cNorm.includes('main campus'))) {
          return true;
        }
        return cNorm.includes(idNorm) || d.campus === campusName;
      }
      return campusId === 'tandag';
    });
  }, [documents, campusId, campusName]);

  // Target folder for upload modal (prioritizes active drilled-down folder, or selected card target)
  const modalTargetFolder = useMemo(() => {
    const id = activeFolderId || selectedTargetFolder;
    if (!id) return null;
    return iaFolders.find((f) => f.id === id) || null;
  }, [activeFolderId, selectedTargetFolder, iaFolders]);

  // Current active Area object if selected
  const currentArea = useMemo(() => {
    if (!selectedAreaCode) return null;
    return OFFICIAL_IA_AREAS.find((a) => a.code === selectedAreaCode) || null;
  }, [selectedAreaCode]);

  // Destination helpers for the Top Upload Button beside search bar:
  const topUploadTargetAreaObj = useMemo(() => {
    return OFFICIAL_IA_AREAS.find((a) => a.code === topUploadTargetAreaCode) || OFFICIAL_IA_AREAS[0];
  }, [topUploadTargetAreaCode]);

  const foldersInTopUploadArea = useMemo(() => {
    const areaIdStr = topUploadTargetAreaCode.toLowerCase();
    return iaFolders.filter((f) => (f.areaId || '').toLowerCase() === areaIdStr);
  }, [iaFolders, topUploadTargetAreaCode]);

  const topUploadTargetFolderObj = useMemo(() => {
    if (!topUploadTargetFolderId) return null;
    return iaFolders.find((f) => f.id === topUploadTargetFolderId) || null;
  }, [iaFolders, topUploadTargetFolderId]);

  // Active folder object if drilled down
  const currentActiveFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return iaFolders.find((f) => f.id === activeFolderId) || null;
  }, [activeFolderId, iaFolders]);

  // Parent folder of currentActiveFolder (for breadcrumbs)
  const parentFolder = useMemo(() => {
    if (!currentActiveFolder?.parentId) return null;
    return iaFolders.find((f) => f.id === currentActiveFolder.parentId) || null;
  }, [currentActiveFolder, iaFolders]);

  // STRICT FILE ISOLATION: A document belongs to a folder IF AND ONLY IF doc.folderId === folder.id
  // (or if unassigned initial doc in the default system folder-ia)
  const isDocInFolder = (doc: EvidenceDocument, folder: EvidenceFolder) => {
    if (doc.folderId === folder.id) return true;
    if (!doc.folderId && folder.id === 'folder-ia') return true;
    return false;
  };

  // Document count per folder
  const getFolderDocCount = (folder: EvidenceFolder) => {
    return campusIADocs.filter((d) => isDocInFolder(d, folder)).length;
  };

  // Subfolder count inside a specific folder
  const getFolderSubfolderCount = (folderId: string) => {
    return iaFolders.filter((f) => f.parentId === folderId).length;
  };

  // STRICT AREA ISOLATION: Folders created inside an Area ONLY appear in that Area
  const areaFolders = useMemo(() => {
    if (!selectedAreaCode) return [];
    const areaCodeLower = selectedAreaCode.toLowerCase();
    return iaFolders.filter((f) => !f.parentId && f.areaId === areaCodeLower);
  }, [selectedAreaCode, iaFolders]);

  // STRICT CUSTOM ISOLATION: Custom Folders ONLY contain folders with !f.areaId.
  // Any folder created inside an Area or uploaded to an Area CANNOT appear here!
  const rootCustomFolders = useMemo(() => {
    let list = iaFolders.filter((f) => !f.parentId && !f.areaId);
    if (searchQuery.trim() && activeTab === 'folders' && !activeFolderId) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [iaFolders, searchQuery, activeTab, activeFolderId]);

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
    if (!currentActiveFolder) return [];
    let list = campusIADocs.filter((d) => isDocInFolder(d, currentActiveFolder));
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
  }, [campusIADocs, currentActiveFolder, searchQuery, sortDirection]);

  // Click handler for Area cards (Areas 1–9)
  const handleSelectArea = (areaCode: string) => {
    setSelectedAreaCode(areaCode);
    setActiveFolderId(null);
    setSearchQuery('');

    // Check if a folder already exists strictly for this Area
    const existing = iaFolders.filter(
      (f) => !f.parentId && f.areaId === areaCode.toLowerCase()
    );

    // If no folder exists yet, immediately prompt to create the first folder for this Area
    if (existing.length === 0) {
      const area = OFFICIAL_IA_AREAS.find((a) => a.code === areaCode);
      setEditingFolder(null);
      setFolderFormParentId(undefined);
      setFolderFormAreaId(areaCode.toLowerCase());
      setFolderFormInitialName(area ? `${area.name} Evidence Portfolio` : `Area ${areaCode} Portfolio`);
      setFolderFormInitialCode(areaCode);
      setFolderFormOpen(true);
    }
  };

  // Helper to render start date & expired date badge
  const renderFolderDatesBadge = (folder: EvidenceFolder) => {
    if (folder.hasNoDeadline) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 shadow-2xs">
          <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
          <span>Start: {folder.startDate || folder.createdAt} · No Deadline</span>
        </span>
      );
    }
    if (folder.expiredDate) {
      const isExpired = new Date(folder.expiredDate) < new Date();
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium border shadow-2xs ${
            isExpired
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
          <span>
            {folder.startDate || folder.createdAt} → {folder.expiredDate}
            {isExpired && ' (Expired)'}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-[11px] text-ink-subtle border border-line shadow-2xs">
        <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
        <span>Created: {folder.createdAt}</span>
      </span>
    );
  };

  // Handle uploading / transferring a Custom Folder to a Specific Area or into a Specific Folder
  const handleExecuteUploadCustomFolderToArea = (
    folderToUpload: EvidenceFolder,
    targetAreaCode: string,
    targetParentFolderId?: string
  ) => {
    const targetAreaObj = OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaCode) || OFFICIAL_IA_AREAS[0];
    const targetAreaId = targetAreaCode.toLowerCase();

    // Collect all descendant folder IDs (custom folder + all nested subfolders)
    const folderIdsToUpdate = new Set<string>([folderToUpload.id]);
    let addedMore = true;
    while (addedMore) {
      addedMore = false;
      iaFolders.forEach((f) => {
        if (f.parentId && folderIdsToUpdate.has(f.parentId) && !folderIdsToUpdate.has(f.id)) {
          folderIdsToUpdate.add(f.id);
          addedMore = true;
        }
      });
    }

    // 1. Move the folder (and all nested subfolders) to the specific Area in this campus
    iaFolders.forEach((f) => {
      if (folderIdsToUpdate.has(f.id)) {
        if (f.id === folderToUpload.id) {
          saveFolder({
            ...f,
            areaId: targetAreaId,
            category: 'Accreditation',
            parentId: targetParentFolderId ? targetParentFolderId : undefined,
            campusId: campusId,
            campus: campusName
          });
        } else {
          saveFolder({
            ...f,
            areaId: targetAreaId,
            category: 'Accreditation',
            campusId: campusId,
            campus: campusName
          });
        }
      }
    });

    // 2. Move any documents in this folder and descendant folders to the target Area and campus
    campusIADocs.forEach((d) => {
      if (d.folderId && folderIdsToUpdate.has(d.folderId)) {
        updateDocument(d.id, { areaId: targetAreaId, campus: campusName, campusId: campusId });
      }
    });

    const targetParentFolder = targetParentFolderId ? iaFolders.find((f) => f.id === targetParentFolderId) : null;
    const destinationName = targetParentFolder
      ? '"' + targetParentFolder.name + '" in Area ' + targetAreaObj.number
      : 'Area ' + targetAreaObj.number + ': ' + targetAreaObj.name;

    toast.success(`Folder "${folderToUpload.name}" successfully uploaded into ${destinationName}!`);
    setUploadingCustomFolder(null);

    // If user was viewing that folder in Custom, exit to root since it moved
    if (activeFolderId === folderToUpload.id) {
      setActiveFolderId(null);
    }
  };

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
    // Mode 1: Custom Folder upload into an Area or active folder
    if (uploadMode === 'from-custom') {
      if (!selectedCustomFolderToUpload) {
        toast.error('Please select a custom folder to upload.');
        return;
      }
      const customFolder = rootCustomFolders.find((f) => f.id === selectedCustomFolderToUpload);
      if (!customFolder) return;

      const targetAreaCode = isTopUploadSource ? topUploadTargetAreaCode : (selectedAreaCode || 'AREA-I');
      const targetParentFolderId = isTopUploadSource
        ? (topUploadTargetFolderId || undefined)
        : (activeFolderId || undefined);

      handleExecuteUploadCustomFolderToArea(customFolder, targetAreaCode, targetParentFolderId);
      setUploadModalOpen(false);
      setIsTopUploadSource(false);
      setSelectedCustomFolderToUpload('');
      return;
    }

    if (uploadedFileList.length === 0) {
      toast.error('Please select files or an entire folder first.');
      return;
    }

    setIsProcessingUpload(true);
    setTimeout(() => {
      // Determine target Area and Area ID
      const targetAreaCode = isTopUploadSource
        ? topUploadTargetAreaCode
        : (selectedAreaCode || currentActiveFolder?.areaId?.toUpperCase() || 'AREA-I');
      const targetAreaId = targetAreaCode.toLowerCase();
      const targetAreaObj = OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaCode) || OFFICIAL_IA_AREAS[0];

      let effectiveFolderId = activeFolderId;
      if (isTopUploadSource) {
        effectiveFolderId = topUploadTargetFolderId || '';
      } else if (!effectiveFolderId && selectedAreaCode) {
        if (selectedTargetFolder && areaFolders.some((f) => f.id === selectedTargetFolder)) {
          effectiveFolderId = selectedTargetFolder;
        } else if (areaFolders.length > 0) {
          effectiveFolderId = areaFolders[0].id;
        }
      }

      let destinationFolderId = effectiveFolderId;
      let targetFolder = iaFolders.find((f) => f.id === effectiveFolderId);

      // Mode 2: Entire Folder upload from computer
      if (uploadMode === 'folder' && uploadedFileList[0]?.path) {
        const rootFolderName = uploadedFileList[0].path.split('/')[0];
        if (rootFolderName && rootFolderName !== uploadedFileList[0].name) {
          const effectiveParentId = isTopUploadSource
            ? (topUploadTargetFolderId || undefined)
            : ((modalTargetFolder?.id || activeFolderId) || undefined);
          const effectiveAreaId = targetAreaId;

          const existingSub = iaFolders.find(
            (f) => f.name === rootFolderName && f.parentId === effectiveParentId && f.areaId === effectiveAreaId
          );
          if (existingSub) {
            destinationFolderId = existingSub.id;
            targetFolder = existingSub;
          } else {
            const newSubId = 'folder-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
            const createdSub: EvidenceFolder = {
              id: newSubId,
              name: rootFolderName,
              code: rootFolderName.slice(0, 4).toUpperCase(),
              frameworkId: 'ia',
              category: 'Accreditation',
              description: 'Uploaded directory containing ' + uploadedFileList.length + ' file(s).',
              color: 'amber',
              createdAt: new Date().toISOString().slice(0, 10),
              startDate: new Date().toISOString().slice(0, 10),
              hasNoDeadline: true,
              parentId: effectiveParentId,
              areaId: effectiveAreaId,
              campusId: campusId,
              campus: campusName
            };
            saveFolder(createdSub);
            destinationFolderId = newSubId;
            targetFolder = createdSub;
          }
        }
      } else if (uploadMode === 'files') {
        // Mode 3: Individual Files upload
        if (isTopUploadSource) {
          if (topUploadTargetFolderId) {
            targetFolder = iaFolders.find((f) => f.id === topUploadTargetFolderId);
            destinationFolderId = topUploadTargetFolderId;
          } else {
            // Area root selected: check if any folder exists in this area for this campus
            const existingInArea = iaFolders.filter((f) => (f.areaId || '').toLowerCase() === targetAreaId);
            if (existingInArea.length > 0) {
              targetFolder = existingInArea[0];
              destinationFolderId = targetFolder.id;
            } else {
              // Auto-create initial portfolio folder for this Area
              const newAreaFolderId = 'folder-ia-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
              const initialAreaFolder: EvidenceFolder = {
                id: newAreaFolderId,
                name: targetAreaObj.name + ' Evidence Portfolio',
                code: targetAreaCode,
                frameworkId: 'ia',
                category: 'Accreditation',
                description: 'Official evidence portfolio for ' + targetAreaObj.name + '.',
                color: 'blue',
                createdAt: new Date().toISOString().slice(0, 10),
                startDate: new Date().toISOString().slice(0, 10),
                hasNoDeadline: true,
                areaId: targetAreaId,
                campusId: campusId,
                campus: campusName
              };
              saveFolder(initialAreaFolder);
              destinationFolderId = newAreaFolderId;
              targetFolder = initialAreaFolder;
            }
          }
        } else {
          // Standard in-area / in-folder upload
          if (!effectiveFolderId && selectedAreaCode && areaFolders.length === 0) {
            const newAreaFolderId = 'folder-ia-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
            const initialAreaFolder: EvidenceFolder = {
              id: newAreaFolderId,
              name: currentArea ? currentArea.name + ' Portfolio' : 'Area ' + selectedAreaCode + ' Evidence Portfolio',
              code: selectedAreaCode,
              frameworkId: 'ia',
              category: 'Accreditation',
              description: 'Official evidence portfolio for ' + (currentArea?.name || selectedAreaCode) + '.',
              color: 'blue',
              createdAt: new Date().toISOString().slice(0, 10),
              startDate: new Date().toISOString().slice(0, 10),
              hasNoDeadline: true,
              areaId: selectedAreaCode.toLowerCase(),
              campusId: campusId,
              campus: campusName
            };
            saveFolder(initialAreaFolder);
            destinationFolderId = newAreaFolderId;
            targetFolder = initialAreaFolder;
          } else if (!targetFolder) {
            targetFolder = iaFolders.find((f) => f.id === effectiveFolderId) || iaFolders[0];
            destinationFolderId = targetFolder?.id || 'folder-ia';
          }
        }
      }

      uploadedFileList.forEach((file, idx) => {
        const newDoc: EvidenceDocument = {
          id: 'doc-ia-' + Date.now() + '-' + idx,
          title: file.path ? file.path.split('/')[0] + ': ' + file.name : file.name,
          description: 'Uploaded evidence document for Institutional Accreditation (' + (targetFolder?.name || targetAreaObj.name) + ').',
          keywords: ['IA Evidence', targetFolder?.name || targetAreaObj.name, campusName],
          frameworkId: 'ia',
          areaId: targetFolder?.areaId || targetAreaId,
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
          campusId: campusId,
          documentDate: new Date().toISOString().slice(0, 10),
          confidentiality: 'Internal',
          status: 'Indexed',
          dateAdded: new Date().toISOString().slice(0, 10),
          fileType: file.name.endsWith('.docx') ? 'DOCX' : file.name.endsWith('.xlsx') ? 'XLSX' : 'PDF',
          pages: Math.max(1, Math.round(file.size / 50000)),
          sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10 || 1.2,
          uploadedBy: 'Current User',
          passages: ['Institutional evidence registered under ' + (targetFolder?.name || targetAreaObj.name)],
          folderId: destinationFolderId
        };
        addDocument(newDoc);
      });

      setIsProcessingUpload(false);
      setUploadModalOpen(false);
      setIsTopUploadSource(false);
      setUploadedFileList([]);

      const destinationTitle = targetFolder
        ? '"' + targetFolder.name + '" in Area ' + targetAreaObj.number
        : 'Area ' + targetAreaObj.number + ': ' + targetAreaObj.name;

      toast.success(
        uploadMode === 'folder'
          ? 'Successfully uploaded entire folder into ' + destinationTitle + ' (' + uploadedFileList.length + ' files)!'
          : 'Successfully uploaded ' + uploadedFileList.length + ' document(s) into ' + destinationTitle + '!'
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

  // PROFESSIONAL FOLDER HEADER COMPONENT (Redesigned from the user's provided image)
  const renderProfessionalFolderHeader = () => {
    if (!currentActiveFolder) return null;

    const backLabel = currentActiveFolder.parentId && parentFolder
      ? parentFolder.name
      : selectedAreaCode && currentArea
      ? `Area ${currentArea.number}: ${currentArea.name}`
      : 'Custom Folders Repository';

    return (
      <div className="rounded-xl border border-line bg-white p-4 shadow-xs space-y-3">
        {/* Top: Breadcrumb Navigation & Optional Transfer Action */}
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (currentActiveFolder.parentId) {
                  setActiveFolderId(currentActiveFolder.parentId);
                } else {
                  setActiveFolderId(null);
                }
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800 transition-colors"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>{backLabel}</span>
            </button>

            <ChevronRightIcon className="h-3.5 w-3.5 text-ink-subtle" />
            <span className="font-medium text-ink truncate max-w-[240px] sm:max-w-none">
              {currentActiveFolder.name}
            </span>
          </div>

          {/* If inside a Custom Folder, provide direct action to upload/move it to a Specific Area */}
          {!currentActiveFolder.areaId && (
            <button
              type="button"
              onClick={() => setUploadingCustomFolder(currentActiveFolder)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
              title="Upload and transfer this custom folder to an official Area"
            >
              <Share2Icon className="h-3.5 w-3.5" />
              <span>Upload to Area 1–9 →</span>
            </button>
          )}
        </div>

        {/* Main Row: Folder Identity on Left, Action Buttons on Right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2.5 border-t border-line/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 shadow-2xs">
              <FolderOpenIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-ink truncate">
                  {currentActiveFolder.name}
                </h3>
                {renderFolderDatesBadge(currentActiveFolder)}
              </div>
              {currentActiveFolder.description && (
                <p className="text-xs text-ink-muted truncate max-w-xl mt-0.5">
                  {currentActiveFolder.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons on the Right Row: Upload Files / Folder & New Subfolder */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                setIsTopUploadSource(false);
                setSelectedTargetFolder(currentActiveFolder.id);
                setUploadModalOpen(true);
              }}
              className="btn btn-primary btn-sm h-9 px-3.5 text-xs gap-1.5 shadow-xs"
              title="Upload individual files or an entire folder"
            >
              <UploadIcon className="h-3.5 w-3.5" />
              <span>Upload Files / Folder</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingFolder(null);
                setFolderFormParentId(currentActiveFolder.id);
                setFolderFormAreaId(currentActiveFolder.areaId);
                setFolderFormInitialName('');
                setFolderFormInitialCode('');
                setFolderFormOpen(true);
              }}
              className="btn btn-secondary btn-sm h-9 px-3.5 text-xs gap-1.5 shadow-2xs"
              title="Create a subfolder inside this folder"
            >
              <FolderPlusIcon className="h-3.5 w-3.5 text-brand-600" />
              <span>New Subfolder</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="panel mb-6 overflow-hidden">
      {/* Header */}
      <div className="border-b border-line bg-canvas/40 p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink">IA Document & Folder Management</h3>
            <Badge tone="brand">Official Areas 1–9</Badge>
            <span className="font-semibold text-xs text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Building2Icon className="h-3 w-3 text-brand-600" />
              <span>{campusName}</span>
            </span>
          </div>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          Official institutional evidence portfolios strictly organized for <strong className="text-ink font-semibold">{campusName}</strong> across Areas 1–9.
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
              setSelectedAreaCode(null);
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
            onClick={() => {
              setActiveTab('folders');
              setSelectedAreaCode(null);
              setActiveFolderId(null);
            }}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'folders'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FolderIcon className="h-3.5 w-3.5 text-amber-600" />
            <span>Custom Folders ({rootCustomFolders.length})</span>
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
                activeFolderId && currentActiveFolder
                  ? `Search inside ${currentActiveFolder.name}...`
                  : selectedAreaCode && currentArea
                  ? `Search inside ${currentArea.name}...`
                  : activeTab === 'areas'
                  ? 'Search areas 1–9...'
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
              setIsTopUploadSource(true);
              const initialArea = selectedAreaCode || 'AREA-I';
              setTopUploadTargetAreaCode(initialArea);
              const foldersInInitArea = iaFolders.filter(
                (f) => (f.areaId || '').toLowerCase() === initialArea.toLowerCase()
              );
              if (activeFolderId && foldersInInitArea.some((f) => f.id === activeFolderId)) {
                setTopUploadTargetFolderId(activeFolderId);
              } else if (foldersInInitArea.length > 0) {
                setTopUploadTargetFolderId(foldersInInitArea[0].id);
              } else {
                setTopUploadTargetFolderId('');
              }
              setUploadMode('files');
              setUploadedFileList([]);
              setSelectedCustomFolderToUpload('');
              setUploadModalOpen(true);
            }}
            className="btn btn-primary btn-sm h-8 shrink-0 text-xs gap-1.5"
            title="Upload individual files, an entire folder, or custom folders into specific Areas"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            <span>Upload Files / Folder</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OFFICIAL IA AREAS 1–9 DISPLAY */}
      {activeTab === 'areas' && (
        <div className="p-4 space-y-4">
          {/* LEVEL 1: ALL 9 AREAS GRID (When no area is clicked yet) */}
          {!selectedAreaCode && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Official AACCUP Institutional Accreditation Areas 1–9
                </span>
                <span className="text-xs text-ink-subtle">
                  Click any Area to create/open its evidence folders with timeline & deadlines
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAreas.map((area) => {
                  const req = iaRequirements.find((r) => r.areaCode === area.code);
                  const isApproved = req?.status === 'Approved';
                  const isUnderReview = req?.status === 'Under Review';
                  const isDeficient = req?.status === 'Deficient';

                  // Count folders created strictly inside this specific area
                  const existingAreaFolders = iaFolders.filter(
                    (f) => !f.parentId && f.areaId === area.code.toLowerCase()
                  );

                  return (
                    <div
                      key={area.code}
                      onClick={() => handleSelectArea(area.code)}
                      className="group relative cursor-pointer rounded-lg border border-line bg-white p-3.5 shadow-xs transition-all hover:border-brand-400 hover:shadow-sm"
                      title={`Click to view and manage folders for Area ${area.number}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded group-hover:bg-brand-100 transition-colors">
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

                      <h4 className="mt-2 text-sm font-bold text-ink leading-tight group-hover:text-brand-700 transition-colors">
                        {area.name}
                      </h4>
                      <p className="mt-1 text-xs text-ink-muted line-clamp-2">{area.shortDesc}</p>

                      <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-xs">
                        <span className="text-[11px] text-ink-subtle">
                          {existingAreaFolders.length > 0 ? (
                            <span className="font-semibold text-brand-700">
                              📁 {existingAreaFolders.length} folder{existingAreaFolders.length === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium">+ Click to create folder</span>
                          )}
                        </span>
                        <span className="text-[11px] font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Open Area →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 2: INSIDE A SELECTED AREA (Viewing its folders or prompt to create first folder) */}
          {selectedAreaCode && currentArea && !activeFolderId && (
            <div className="space-y-4">
              {/* Breadcrumb Header for Area */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-3.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAreaCode(null);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    <span>IA Areas 1–9</span>
                  </button>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-brand-400" />
                  <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                    <span className="font-mono bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded text-[11px]">
                      Area {currentArea.number}
                    </span>
                    <span>{currentArea.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTopUploadSource(false);
                      setSelectedTargetFolder(areaFolders[0]?.id || '');
                      setUploadModalOpen(true);
                    }}
                    className="btn btn-primary btn-xs text-xs gap-1.5 shadow-xs"
                    title="Upload individual files, an entire folder, or a custom folder into this Area"
                  >
                    <UploadIcon className="h-3.5 w-3.5" />
                    <span>Upload Files / Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFolder(null);
                      setFolderFormParentId(undefined);
                      setFolderFormAreaId(currentArea.code.toLowerCase());
                      setFolderFormInitialName(`${currentArea.name} Portfolio`);
                      setFolderFormInitialCode(currentArea.code);
                      setFolderFormOpen(true);
                    }}
                    className="btn btn-secondary btn-xs text-xs gap-1"
                  >
                    <FolderPlusIcon className="h-3.5 w-3.5 text-brand-600" />
                    <span>Create Folder</span>
                  </button>
                </div>
              </div>

              {/* Area Folders Display */}
              {areaFolders.length === 0 ? (
                /* Prompt to create first folder if none exists */
                <div className="rounded-xl border border-dashed border-brand-300 bg-white p-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <FolderPlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">
                      No Folder Created for Area {currentArea.number} Yet
                    </h4>
                    <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
                      Create an evidence folder with a start date and optional deadline (or set to no deadline) to organize portfolios for {currentArea.name}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(null);
                        setFolderFormParentId(undefined);
                        setFolderFormAreaId(currentArea.code.toLowerCase());
                        setFolderFormInitialName(`${currentArea.name} Evidence Portfolio`);
                        setFolderFormInitialCode(currentArea.code);
                        setFolderFormOpen(true);
                      }}
                      className="btn btn-primary btn-sm text-xs gap-1.5"
                    >
                      <FolderPlusIcon className="h-4 w-4" />
                      <span>Create First Folder with Start & Expired Date</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTopUploadSource(false);
                        setSelectedTargetFolder('');
                        setUploadModalOpen(true);
                      }}
                      className="btn btn-secondary btn-sm text-xs gap-1.5"
                    >
                      <UploadIcon className="h-4 w-4 text-brand-600" />
                      <span>Upload Files / Folder</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Grid of Folders for this Area */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Area {currentArea.number} Evidence Folders ({areaFolders.length})
                    </span>
                    <span className="text-[11px] text-ink-subtle">Click a folder to view and upload files</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {areaFolders.map((folder) => {
                      const docCount = getFolderDocCount(folder);
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
                              <div className="p-1.5 rounded-md bg-blue-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                                <FolderIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-ink group-hover:text-brand-700 transition-colors">
                                  {folder.name}
                                </h4>
                                <span className="text-[10px] text-ink-subtle">{folder.code}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsTopUploadSource(false);
                                  setSelectedTargetFolder(folder.id);
                                  setUploadModalOpen(true);
                                }}
                                className="p-1 text-ink-subtle hover:text-brand-600 rounded"
                                title="Upload into folder"
                              >
                                <UploadIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFolder(folder);
                                  setFolderFormOpen(true);
                                }}
                                className="p-1 text-ink-subtle hover:text-brand-600 rounded"
                                title="Edit folder"
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

                          <div className="mt-2.5">{renderFolderDatesBadge(folder)}</div>

                          <p className="mt-2 text-[11px] text-ink-muted line-clamp-2">
                            {folder.description || 'No description provided.'}
                          </p>

                          <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-subtle">
                            <span className="font-medium text-ink-muted">
                              {docCount} document{docCount === 1 ? '' : 's'}
                              {subCount > 0 && ` · ${subCount} subfolder${subCount === 1 ? '' : 's'}`}
                            </span>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsTopUploadSource(false);
                                  setSelectedTargetFolder(folder.id);
                                  setUploadModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded transition-colors"
                                title="Upload files or folders into this folder"
                              >
                                <UploadIcon className="h-3 w-3" />
                                <span>+ Upload</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveFolderId(folder.id);
                                  setRepoFilter('all');
                                  setSearchQuery('');
                                }}
                                className="font-semibold text-brand-600 hover:underline"
                              >
                                Open Folder →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: INSIDE A FOLDER OF AN AREA */}
          {selectedAreaCode && currentActiveFolder && (
            <div className="space-y-4">
              {/* Professional Redesigned Folder Header */}
              {renderProfessionalFolderHeader()}

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
                <div className="rounded-xl border border-dashed border-line bg-canvas p-8 text-center">
                  <FolderOpenIcon className="mx-auto h-9 w-9 text-ink-subtle mb-2" />
                  <p className="text-xs font-semibold text-ink">No files or subfolders found</p>
                  <p className="text-[11px] text-ink-muted mt-1">
                    {searchQuery
                      ? `No items matching "${searchQuery}" inside ${currentActiveFolder.name}.`
                      : `"${currentActiveFolder.name}" is currently empty.`}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTopUploadSource(false);
                        setSelectedTargetFolder(currentActiveFolder.id);
                        setUploadModalOpen(true);
                      }}
                      className="btn btn-primary btn-xs text-xs gap-1"
                    >
                      <UploadIcon className="h-3 w-3" /> Upload Files Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(null);
                        setFolderFormParentId(currentActiveFolder.id);
                        setFolderFormAreaId(currentActiveFolder.areaId);
                        setFolderFormOpen(true);
                      }}
                      className="btn btn-secondary btn-xs text-xs gap-1"
                    >
                      <FolderPlusIcon className="h-3 w-3 text-brand-600" /> Create Subfolder
                    </button>
                  </div>
                </div>
              )}

              {/* SUBFOLDERS SECTION */}
              {(repoFilter === 'all' || repoFilter === 'folders') && insideSubfolders.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Subfolders ({insideSubfolders.length})
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {insideSubfolders.map((sub) => {
                      const count = getFolderDocCount(sub);
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
                          <div className="mt-2">{renderFolderDatesBadge(sub)}</div>
                          <div className="mt-2 pt-2 border-t border-line text-[11px] text-ink-muted flex items-center justify-between">
                            <span>{count} files inside</span>
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsTopUploadSource(false);
                                  setSelectedTargetFolder(sub.id);
                                  setUploadModalOpen(true);
                                }}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-1.5 py-0.5 rounded transition-colors"
                                title="Upload files into this subfolder"
                              >
                                <UploadIcon className="h-2.5 w-2.5" />
                                <span>+ Upload</span>
                              </button>
                              <span className="text-brand-600 font-semibold group-hover:underline">Open →</span>
                            </div>
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

      {/* TAB 2: IA EVIDENCE CUSTOM FOLDERS REPOSITORY */}
      {activeTab === 'folders' && (
        <div className="p-4 space-y-4">
          {/* LEVEL 1: ROOT REPOSITORY VIEW */}
          {!currentActiveFolder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    IA Evidence Folders Repository (Custom)
                  </span>
                  <p className="text-[11px] text-ink-subtle mt-0.5">
                    Create custom folders and portfolios. Folders can be uploaded directly to specific IA Areas 1–9.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderFormParentId(undefined);
                    setFolderFormAreaId(undefined);
                    setFolderFormInitialName('');
                    setFolderFormInitialCode('');
                    setFolderFormOpen(true);
                  }}
                  className="btn btn-secondary btn-xs gap-1"
                >
                  <FolderPlusIcon className="h-3.5 w-3.5 text-brand-600" />
                  <span>New Folder</span>
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {rootCustomFolders.map((folder) => {
                  const docCount = getFolderDocCount(folder);
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

                      <div className="mt-2.5">{renderFolderDatesBadge(folder)}</div>

                      <p className="mt-2 text-[11px] text-ink-muted line-clamp-2">
                        {folder.description || 'No description provided.'}
                      </p>

                      <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-subtle">
                        <span className="font-medium text-ink-muted">
                          {docCount} document{docCount === 1 ? '' : 's'} inside
                          {subCount > 0 && ` · ${subCount} subfolder${subCount === 1 ? '' : 's'}`}
                        </span>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setUploadingCustomFolder(folder)}
                            className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                            title="Upload and transfer this folder into an official IA Area"
                          >
                            <Share2Icon className="h-3 w-3" />
                            <span>Upload to Area</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsTopUploadSource(false);
                              setSelectedTargetFolder(folder.id);
                              setUploadModalOpen(true);
                            }}
                            className="font-semibold text-brand-600 hover:underline"
                          >
                            + Upload
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 2: INSIDE A CLICKED CUSTOM FOLDER */}
          {currentActiveFolder && (
            <div className="space-y-4">
              {/* Professional Redesigned Folder Header */}
              {renderProfessionalFolderHeader()}

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
                <div className="rounded-xl border border-dashed border-line bg-canvas p-8 text-center">
                  <FolderOpenIcon className="mx-auto h-9 w-9 text-ink-subtle mb-2" />
                  <p className="text-xs font-semibold text-ink">No files or subfolders found</p>
                  <p className="text-[11px] text-ink-muted mt-1">
                    {searchQuery
                      ? `No items matching "${searchQuery}" inside ${currentActiveFolder.name}.`
                      : `"${currentActiveFolder.name}" is currently empty.`}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTopUploadSource(false);
                        setSelectedTargetFolder(currentActiveFolder.id);
                        setUploadModalOpen(true);
                      }}
                      className="btn btn-primary btn-xs text-xs gap-1"
                    >
                      <UploadIcon className="h-3 w-3" /> Upload Files Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolder(null);
                        setFolderFormParentId(currentActiveFolder.id);
                        setFolderFormAreaId(currentActiveFolder.areaId);
                        setFolderFormOpen(true);
                      }}
                      className="btn btn-secondary btn-xs text-xs gap-1"
                    >
                      <FolderPlusIcon className="h-3 w-3 text-brand-600" /> Create Subfolder
                    </button>
                  </div>
                </div>
              )}

              {/* SUBFOLDERS SECTION */}
              {(repoFilter === 'all' || repoFilter === 'folders') && insideSubfolders.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Subfolders ({insideSubfolders.length})
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {insideSubfolders.map((sub) => {
                      const count = getFolderDocCount(sub);
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
                          <div className="mt-2">{renderFolderDatesBadge(sub)}</div>
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

      {/* MODAL: UPLOAD A CUSTOM FOLDER TO AN OFFICIAL IA AREA */}
      {uploadingCustomFolder && (
        <Modal
          open={!!uploadingCustomFolder}
          onClose={() => setUploadingCustomFolder(null)}
          title={`Upload "${uploadingCustomFolder.name}" to Area`}
          description="Transfer this folder and all its files into an official IA Area. Once uploaded, it will be moved to that Area and removed from Custom Folders."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                className="btn btn-secondary btn-sm text-xs"
                onClick={() => setUploadingCustomFolder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm text-xs gap-1.5"
                onClick={() => handleExecuteUploadCustomFolderToArea(uploadingCustomFolder, targetAreaForCustomFolder)}
              >
                <UploadIcon className="h-3.5 w-3.5" />
                <span>Confirm Upload to Area</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-slate-50 p-3 text-xs">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-amber-600" />
                <span className="font-bold text-ink">{uploadingCustomFolder.name}</span>
                <span className="text-ink-subtle">·</span>
                <span className="text-ink-muted">{getFolderDocCount(uploadingCustomFolder)} document(s)</span>
              </div>
            </div>

            <div>
              <label className="label">Select Target IA Area (Areas 1–9)</label>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {OFFICIAL_IA_AREAS.map((a) => {
                  const isSelected = targetAreaForCustomFolder === a.code;
                  return (
                    <div
                      key={a.code}
                      onClick={() => setTargetAreaForCustomFolder(a.code)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/70 shadow-xs'
                          : 'border-line hover:border-brand-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="targetAreaForCustomFolder"
                        checked={isSelected}
                        onChange={() => setTargetAreaForCustomFolder(a.code)}
                        className="mt-0.5 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-brand-700 bg-brand-100 px-1.5 py-0.2 rounded">
                            Area {a.number}
                          </span>
                          <span className="text-xs font-bold text-ink">{a.name}</span>
                        </div>
                        <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">{a.shortDesc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* UPLOAD INDIVIDUAL FILES, ENTIRE FOLDERS & CUSTOM FOLDERS MODAL */}
      {uploadModalOpen && (
        <Modal
          open={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setIsTopUploadSource(false);
            setUploadedFileList([]);
            setSelectedCustomFolderToUpload('');
            setTopUploadTargetFolderId('');
          }}
          title={
            isTopUploadSource
              ? 'Upload into Accreditation Areas & Folders'
              : modalTargetFolder
              ? 'Upload into "' + modalTargetFolder.name + '"'
              : currentArea
              ? 'Upload into Area ' + currentArea.number + ': ' + currentArea.name
              : 'Upload Evidence Files or Folders'
          }
          description={
            isTopUploadSource
              ? 'Select a target Area (Areas 1–9) and existing folder for ' + campusName + ', then upload individual files, an entire folder, or a custom folder.'
              : 'Select individual documents, an entire folder from computer, or an existing custom folder.'
          }
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setUploadModalOpen(false);
                  setIsTopUploadSource(false);
                  setUploadedFileList([]);
                  setSelectedCustomFolderToUpload('');
                  setSelectedTargetFolder('');
                  setTopUploadTargetFolderId('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  uploadMode === 'from-custom'
                    ? !selectedCustomFolderToUpload
                    : uploadedFileList.length === 0 || isProcessingUpload
                }
                onClick={handleExecuteUpload}
                className="btn btn-primary btn-sm"
              >
                {isProcessingUpload
                  ? 'Processing & Indexing...'
                  : uploadMode === 'from-custom'
                  ? isTopUploadSource
                    ? 'Upload to Area ' + topUploadTargetAreaObj.number + (topUploadTargetFolderObj ? ' / ' + topUploadTargetFolderObj.name : '')
                    : 'Upload Custom Folder'
                  : uploadMode === 'folder'
                  ? 'Upload Entire Folder (' + uploadedFileList.length + ' files)'
                  : 'Upload Individual Files (' + uploadedFileList.length + ' files)'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* When opened from Top Upload Button: Interactive Target Selector (Area + Existing Folder in Campus) */}
            {isTopUploadSource ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpenIcon className="h-4 w-4 text-brand-600 shrink-0" />
                    <span className="text-xs font-bold text-brand-900">Upload Target Destination</span>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-700 bg-white border border-brand-200 px-2 py-0.5 rounded-full">
                    🏛️ Campus: {campusName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Target Area (Areas 1–9) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink flex items-center justify-between">
                      <span>1. Target Area (Areas 1–9) <span className="text-brand-600">*</span></span>
                    </label>
                    <select
                      value={topUploadTargetAreaCode}
                      onChange={(e) => {
                        const nextArea = e.target.value;
                        setTopUploadTargetAreaCode(nextArea);
                        const foldersInNext = iaFolders.filter(
                          (f) => (f.areaId || '').toLowerCase() === nextArea.toLowerCase()
                        );
                        setTopUploadTargetFolderId(foldersInNext.length > 0 ? foldersInNext[0].id : '');
                      }}
                      className="input text-xs w-full bg-white font-medium border-brand-200 focus:border-brand-500"
                    >
                      {OFFICIAL_IA_AREAS.map((a) => {
                        const count = iaFolders.filter((f) => (f.areaId || '').toLowerCase() === a.code.toLowerCase()).length;
                        return (
                          <option key={a.code} value={a.code}>
                            Area {a.number}: {a.name} ({count} folder{count === 1 ? '' : 's'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* 2. Target Folder inside that Area */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-ink flex items-center justify-between">
                      <span>2. Target Folder in Area {topUploadTargetAreaObj.number}</span>
                      <span className="text-[10px] text-ink-subtle font-normal">Optional hierarchy</span>
                    </label>
                    <select
                      value={topUploadTargetFolderId}
                      onChange={(e) => setTopUploadTargetFolderId(e.target.value)}
                      className="input text-xs w-full bg-white font-medium border-brand-200 focus:border-brand-500"
                    >
                      <option value="">
                        {foldersInTopUploadArea.length === 0
                          ? '📁 (Area Root / Auto-create Folder)'
                          : '📁 (Area Root - No subfolder)'}
                      </option>
                      {foldersInTopUploadArea.map((f) => {
                        const parent = f.parentId ? iaFolders.find((p) => p.id === f.parentId) : null;
                        const docCount = getFolderDocCount(f);
                        return (
                          <option key={f.id} value={f.id}>
                            {parent ? '  ↳ 📁 ' + f.name + ' (inside ' + parent.name + ')' : '📁 ' + f.name} ({docCount} files)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Path preview */}
                <div className="text-[11px] text-brand-800 flex flex-wrap items-center gap-1.5 pt-1 border-t border-brand-200/60">
                  <span className="font-semibold text-brand-900">Destination:</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-brand-200 font-mono text-[11px] text-brand-900">
                    {campusName} &gt; Area {topUploadTargetAreaObj.number} ({topUploadTargetAreaObj.name})
                    {topUploadTargetFolderObj ? ' &gt; ' + topUploadTargetFolderObj.name : ''}
                    {uploadMode === 'files' ? ' &gt; [Files]' : uploadMode === 'folder' ? ' &gt; [New Folder]' : ' &gt; [Custom Folder]'}
                  </span>
                </div>
              </div>
            ) : modalTargetFolder ? (
              <div className="rounded-lg border border-brand-200 bg-brand-50/70 p-2.5 text-xs text-brand-900 flex items-center gap-2">
                <FolderOpenIcon className="h-4 w-4 text-brand-600 shrink-0" />
                <span>
                  Destination: <strong className="font-bold">{modalTargetFolder.name}</strong>
                  {currentArea && <span className="text-brand-700 font-normal"> (Area {currentArea.number})</span>}
                  <span className="text-brand-600 font-medium"> · {campusName}</span>
                </span>
              </div>
            ) : currentArea ? (
              <div className="rounded-lg border border-brand-200 bg-brand-50/70 p-2.5 text-xs text-brand-900 flex items-center gap-2">
                <FolderOpenIcon className="h-4 w-4 text-brand-600 shrink-0" />
                <span>
                  Destination: <strong className="font-bold">Area {currentArea.number}: {currentArea.name}</strong>
                  <span className="text-brand-600 font-medium"> · {campusName}</span>
                </span>
              </div>
            ) : null}

            {/* Mode Selector - 3 options when opened from top upload button or inside an Area */}
            <div className={'grid gap-2 rounded-lg border border-line bg-canvas p-1 text-xs ' + (
              isTopUploadSource || selectedAreaCode ? 'grid-cols-3' : 'grid-cols-2'
            )}>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('files');
                  setUploadedFileList([]);
                }}
                className={'flex items-center justify-center gap-1.5 py-1.5 font-semibold rounded-md transition-all ' + (
                  uploadMode === 'files' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted hover:text-ink'
                )}
              >
                <FileTextIcon className="h-3.5 w-3.5" />
                <span>Individual Files</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('folder');
                  setUploadedFileList([]);
                }}
                className={'flex items-center justify-center gap-1.5 py-1.5 font-semibold rounded-md transition-all ' + (
                  uploadMode === 'folder' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted hover:text-ink'
                )}
              >
                <FolderArchiveIcon className="h-3.5 w-3.5" />
                <span>Entire Folder</span>
              </button>

              {/* In Area mode or Top Upload mode: option to upload a folder from Custom Folders */}
              {(isTopUploadSource || selectedAreaCode) && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('from-custom');
                    setUploadedFileList([]);
                  }}
                  className={'flex items-center justify-center gap-1.5 py-1.5 font-semibold rounded-md transition-all ' + (
                    uploadMode === 'from-custom' ? 'bg-white text-brand-700 shadow-xs' : 'text-ink-muted hover:text-ink'
                  )}
                >
                  <FolderIcon className="h-3.5 w-3.5 text-amber-600" />
                  <span>Custom Folder</span>
                </button>
              )}
            </div>

            {uploadMode === 'from-custom' ? (
              /* Custom Folder Picker */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">
                    Select a Custom Folder to upload into{' '}
                    {isTopUploadSource
                      ? topUploadTargetFolderObj
                        ? '"' + topUploadTargetFolderObj.name + '" in Area ' + topUploadTargetAreaObj.number
                        : 'Area ' + topUploadTargetAreaObj.number + ': ' + topUploadTargetAreaObj.name
                      : currentActiveFolder
                      ? '"' + currentActiveFolder.name + '"'
                      : currentArea
                      ? 'Area ' + currentArea.number
                      : 'this Area'}
                  </label>
                  <span className="text-[11px] text-ink-subtle">
                    {rootCustomFolders.length} folder{rootCustomFolders.length === 1 ? '' : 's'} available ({campusName})
                  </span>
                </div>

                {rootCustomFolders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line bg-slate-50 p-6 text-center text-xs text-ink-muted space-y-1.5">
                    <FolderIcon className="mx-auto h-8 w-8 text-slate-400 mb-1" />
                    <p className="font-semibold text-ink">No Custom Folders Available</p>
                    <p className="text-[11px] text-ink-subtle max-w-sm mx-auto">
                      All custom folders have been uploaded or none have been created yet. You can create new folders under the &quot;Custom Folders&quot; tab.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {rootCustomFolders.map((f) => {
                      const isSelected = selectedCustomFolderToUpload === f.id;
                      const docCount = getFolderDocCount(f);
                      const subCount = getFolderSubfolderCount(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => setSelectedCustomFolderToUpload(f.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/70 shadow-xs ring-1 ring-brand-500'
                              : 'border-line hover:border-brand-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="selectedCustomFolderToUpload"
                              checked={isSelected}
                              onChange={() => setSelectedCustomFolderToUpload(f.id)}
                              className="text-brand-600 focus:ring-brand-500"
                            />
                            <div>
                              <span className="text-xs font-bold text-ink block">{f.name}</span>
                              <span className="text-[10px] text-ink-subtle">{f.code} · Created {f.createdAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {subCount > 0 && (
                              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {subCount} subfolder{subCount === 1 ? '' : 's'}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                              {docCount} file{docCount === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Normal Drag and Drop and File Inputs */
              <>
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

                {/* Optional folder selector when at Area root with multiple folders (contextual modal) */}
                {!isTopUploadSource && selectedAreaCode && !modalTargetFolder && areaFolders.length > 0 && uploadMode === 'files' && (
                  <div className="space-y-1.5 rounded-lg border border-line bg-canvas/60 p-2.5">
                    <label className="text-xs font-semibold text-ink flex items-center justify-between">
                      <span>Target Evidence Folder in Area {currentArea?.number}:</span>
                      <span className="text-[10px] text-ink-subtle font-normal">Choose destination</span>
                    </label>
                    <select
                      value={selectedTargetFolder || areaFolders[0]?.id || ''}
                      onChange={(e) => setSelectedTargetFolder(e.target.value)}
                      className="input text-xs w-full bg-white"
                    >
                      {areaFolders.map((af) => (
                        <option key={af.id} value={af.id}>
                          {af.name} ({getFolderDocCount(af)} files)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
              </>
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
        initialAreaId={folderFormAreaId}
        initialName={folderFormInitialName}
        initialCode={folderFormInitialCode}
        onClose={() => {
          setFolderFormOpen(false);
          setEditingFolder(null);
          setFolderFormParentId(undefined);
          setFolderFormAreaId(undefined);
          setFolderFormInitialName(undefined);
          setFolderFormInitialCode(undefined);
        }}
        onSave={(f) => {
          const assignedAreaId = f.areaId || folderFormAreaId || undefined;
          const finalFolder: EvidenceFolder = {
            ...f,
            frameworkId: 'ia',
            category: assignedAreaId ? 'Accreditation' : 'General / Custom',
            areaId: assignedAreaId,
            campusId: editingFolder?.campusId || campusId,
            campus: editingFolder?.campus || campusName
          };
          saveFolder(finalFolder);
          toast.success(editingFolder ? 'Folder updated successfully' : 'New evidence folder created');
        }}
      />

      {/* DELETE FOLDER MODAL */}
      <DeleteFolderModal
        open={!!deletingFolder}
        folder={deletingFolder}
        documentCount={deletingFolder ? getFolderDocCount(deletingFolder) : 0}
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
