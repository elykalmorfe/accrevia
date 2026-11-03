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
  Share2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ClockIcon,
  CheckIcon,
  FileEditIcon,
  AlertCircleIcon,
  InfoIcon,
  FilterIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { EvidenceFolder, EvidenceDocument } from '../../types/evidence';
import { CampusId, IARequirementItem } from '../../types/accreditation';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { FolderFormModal } from '../folders/FolderFormModal';
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
  // Inside-Folder Approval Status Filter ('all' | 'approved' | 'pending' | 'needs_revision')
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'all' | 'approved' | 'pending' | 'needs_revision'>('all');

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  // States for Document Revision Modal
  const [revisionModalDoc, setRevisionModalDoc] = useState<EvidenceDocument | null>(null);
  const [revisionRemarks, setRevisionRemarks] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

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
      // ONLY associate initial untagged mock folder-ia with default 'tandag'
      return f.id === 'folder-ia' && campusId === 'tandag';
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

  // Check whether the active folder is a custom folder (outside official Areas 1-9)
  const isCustomFolder = useMemo(() => {
    if (!currentActiveFolder) return false;
    return !currentActiveFolder.areaId || currentActiveFolder.category === 'General / Custom';
  }, [currentActiveFolder]);

  // STRICT FILE ISOLATION: A document belongs to a folder IF AND ONLY IF doc.folderId === folder.id
  // (or if unassigned initial doc in the default system folder-ia)
  const isDocInFolder = (doc: EvidenceDocument, folder: EvidenceFolder) => {
    if (doc.folderId === folder.id) return true;
    if (!doc.folderId && folder.id === 'folder-ia') return true;
    return false;
  };

  // --- DOCUMENT APPROVAL & REVISION WORKFLOW ---
  const handleApproveDocument = (doc: EvidenceDocument) => {
    updateDocument(doc.id, {
      approvalStatus: 'Approved',
      revisionNotes: undefined,
      reviewedBy: 'Accreditation Reviewer',
      reviewedAt: new Date().toISOString()
    });
    toast.success('Approved "' + doc.title + '"');
  };

  const handleOpenRevisionModal = (doc: EvidenceDocument) => {
    setRevisionModalDoc(doc);
    setRevisionRemarks(doc.revisionNotes || '');
  };

  const handleSubmitRevision = () => {
    if (!revisionModalDoc || !revisionRemarks.trim()) return;
    setIsSubmittingRevision(true);
    updateDocument(revisionModalDoc.id, {
      approvalStatus: 'Needs Revision',
      revisionNotes: revisionRemarks.trim(),
      reviewedBy: 'Accreditation Reviewer',
      reviewedAt: new Date().toISOString()
    });
    toast.warning('Revision requested for "' + revisionModalDoc.title + '"');
    setIsSubmittingRevision(false);
    setRevisionModalDoc(null);
    setRevisionRemarks('');
  };

  // Folder Approval Status Rollup
  const getFolderApprovalStatus = (folder: EvidenceFolder) => {
    const folderDocs = campusIADocs.filter((d) => isDocInFolder(d, folder));

    if (folderDocs.length === 0) {
      return {
        status: 'empty' as const,
        label: 'Empty Folder',
        tone: 'neutral' as const,
        badgeText: '0 files',
        hasNeedsRevision: false,
        allApproved: false
      };
    }

    const hasNeedsRevision = folderDocs.some((d) => d.approvalStatus === 'Needs Revision');
    const allApproved = folderDocs.every((d) => d.approvalStatus === 'Approved');
    const approvedCount = folderDocs.filter((d) => d.approvalStatus === 'Approved').length;
    const revisionCount = folderDocs.filter((d) => d.approvalStatus === 'Needs Revision').length;
    const pendingCount = folderDocs.filter((d) => !d.approvalStatus || d.approvalStatus === 'Pending Review').length;

    if (hasNeedsRevision) {
      return {
        status: 'needs_revision' as const,
        label: 'Needs Revision',
        tone: 'danger' as const,
        badgeText: revisionCount + ' file' + (revisionCount === 1 ? '' : 's') + ' need revision',
        hasNeedsRevision: true,
        allApproved: false,
        total: folderDocs.length,
        approvedCount,
        revisionCount,
        pendingCount
      };
    }

    if (allApproved) {
      return {
        status: 'approved' as const,
        label: 'Approved',
        tone: 'success' as const,
        badgeText: 'All ' + folderDocs.length + ' files approved',
        hasNeedsRevision: false,
        allApproved: true,
        total: folderDocs.length,
        approvedCount,
        revisionCount: 0,
        pendingCount: 0
      };
    }

    return {
      status: 'review_required' as const,
      label: 'Review Required',
      tone: 'warning' as const,
      badgeText: pendingCount + ' awaiting review',
      hasNeedsRevision: false,
      allApproved: false,
      total: folderDocs.length,
      approvedCount,
      revisionCount: 0,
      pendingCount
    };
  };

  // Area Approval Status Rollup (Areas 1–9)
  const getAreaApprovalStatus = (areaCode: string) => {
    const areaCodeNorm = areaCode.toLowerCase();
    
    // Find all folders belonging to this area for this campus
    const areaFoldersList = iaFolders.filter(
      (f) =>
        !f.parentId &&
        (f.areaId || '').toLowerCase() === areaCodeNorm &&
        (f.campusId ? f.campusId === campusId : campusId === 'tandag')
    );
    const areaFolderIds = new Set(iaFolders.filter(f => (f.areaId || '').toLowerCase() === areaCodeNorm).map(f => f.id));

    // Find all documents belonging to this area (either directly or via area folders)
    const areaDocs = campusIADocs.filter(
      (d) =>
        (((d.areaId || '').toLowerCase() === areaCodeNorm) ||
          (d.folderId ? areaFolderIds.has(d.folderId) : false))
    );

    if (areaFoldersList.length === 0 && areaDocs.length === 0) {
      return {
        status: 'needs_evidence' as const,
        label: 'Needs Evidence',
        tone: 'neutral' as const,
        folderCount: 0,
        fileCount: 0,
        approvedCount: 0,
        revisionCount: 0,
        pendingCount: 0
      };
    }

    if (areaDocs.length === 0) {
      return {
        status: 'needs_files' as const,
        label: 'Needs Evidence Files',
        tone: 'warning' as const,
        folderCount: areaFoldersList.length,
        fileCount: 0,
        approvedCount: 0,
        revisionCount: 0,
        pendingCount: 0
      };
    }

    const revisionCount = areaDocs.filter((d) => d.approvalStatus === 'Needs Revision').length;
    const approvedCount = areaDocs.filter((d) => d.approvalStatus === 'Approved').length;
    const pendingCount = areaDocs.filter((d) => !d.approvalStatus || d.approvalStatus === 'Pending Review').length;

    if (revisionCount > 0) {
      return {
        status: 'needs_revision' as const,
        label: 'Needs Revision',
        tone: 'danger' as const,
        folderCount: areaFoldersList.length,
        fileCount: areaDocs.length,
        approvedCount,
        revisionCount,
        pendingCount
      };
    }

    if (approvedCount === areaDocs.length && areaDocs.length > 0) {
      return {
        status: 'approved' as const,
        label: 'Approved',
        tone: 'success' as const,
        folderCount: areaFoldersList.length,
        fileCount: areaDocs.length,
        approvedCount,
        revisionCount: 0,
        pendingCount: 0
      };
    }

    return {
      status: 'review_required' as const,
      label: 'Review Required',
      tone: 'warning' as const,
      folderCount: areaFoldersList.length,
      fileCount: areaDocs.length,
      approvedCount,
      revisionCount: 0,
      pendingCount
    };
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

  // Reset approval filter when active folder changes
  useEffect(() => {
    setApprovalStatusFilter('all');
  }, [activeFolderId]);

  // All documents strictly inside currentActiveFolder (before approval status filtering)
  const allFolderDocs = useMemo(() => {
    if (!currentActiveFolder) return [];
    return campusIADocs.filter((d) => isDocInFolder(d, currentActiveFolder));
  }, [campusIADocs, currentActiveFolder]);

  // Counts by approval status for current active folder
  const folderApprovalCounts = useMemo(() => {
    const total = allFolderDocs.length;
    const approved = allFolderDocs.filter((d) => d.approvalStatus === 'Approved').length;
    const revision = allFolderDocs.filter((d) => d.approvalStatus === 'Needs Revision').length;
    const pending = allFolderDocs.filter((d) => !d.approvalStatus || d.approvalStatus === 'Pending Review').length;
    return { total, approved, revision, pending };
  }, [allFolderDocs]);

  // Inside-Folder Files (filtered by search and approval status, sorted A to Z)
  const insideFiles = useMemo(() => {
    if (!currentActiveFolder) return [];
    let list = [...allFolderDocs];

    // Filter by approval status if in official Area folder
    if (!isCustomFolder && currentActiveFolder.areaId && approvalStatusFilter !== 'all') {
      if (approvalStatusFilter === 'approved') {
        list = list.filter((d) => d.approvalStatus === 'Approved');
      } else if (approvalStatusFilter === 'needs_revision') {
        list = list.filter((d) => d.approvalStatus === 'Needs Revision');
      } else if (approvalStatusFilter === 'pending') {
        list = list.filter((d) => !d.approvalStatus || d.approvalStatus === 'Pending Review');
      }
    }

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
  }, [allFolderDocs, currentActiveFolder, isCustomFolder, approvalStatusFilter, searchQuery, sortDirection]);

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
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200 shadow-2xs">
          <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
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
          folderId: destinationFolderId || undefined
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
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200/80 shadow-2xs">
          <FileTextIcon className="h-4 w-4" />
        </div>
      );
    }
    if (ft === 'XLSX' || ft === 'CSV') {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs">
          <FileSpreadsheetIcon className="h-4 w-4" />
        </div>
      );
    }
    if (ft === 'DOCX' || ft === 'DOC') {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs">
          <FileTextIcon className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
        <FileIcon className="h-4 w-4" />
      </div>
    );
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
                {(() => {
                  if (isCustomFolder || !currentActiveFolder.areaId) return null;
                  const fStatus = getFolderApprovalStatus(currentActiveFolder);
                  if (fStatus.status === 'approved') {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300/80 px-2.5 py-1 rounded-lg shadow-2xs">
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Folder Approved</span>
                      </span>
                    );
                  }
                  if (fStatus.status === 'needs_revision') {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300/80 px-2.5 py-1 rounded-lg shadow-2xs">
                        <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-600" />
                        <span>Needs Revision</span>
                      </span>
                    );
                  }
                  if (fStatus.status === 'review_required') {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                        <ClockIcon className="h-3.5 w-3.5 text-brand-600" />
                        <span>Review Required</span>
                      </span>
                    );
                  }
                  return null;
                })()}
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

          {/* Top upload button only appears when outside any area or custom folder to eliminate redundancy */}
          {((activeTab === 'areas' && !selectedAreaCode && !activeFolderId) ||
            (activeTab === 'folders' && !activeFolderId)) && (
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
          )}
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
                  const areaStatus = getAreaApprovalStatus(area.code);

                  // Count folders created strictly inside this specific area
                  const existingAreaFolders = iaFolders.filter(
                    (f) => !f.parentId && (f.areaId || '').toLowerCase() === area.code.toLowerCase()
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
                            areaStatus.status === 'approved'
                              ? 'success'
                              : areaStatus.status === 'needs_revision'
                              ? 'danger'
                              : areaStatus.status === 'review_required'
                              ? 'warning'
                              : 'neutral'
                          }
                          dot
                        >
                          {areaStatus.label}
                        </Badge>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-ink leading-tight group-hover:text-brand-700 transition-colors">
                        {area.name}
                      </h4>
                      <p className="mt-1 text-xs text-ink-muted line-clamp-2">{area.shortDesc}</p>

                      <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-xs">
                        <span className="text-[11px] text-ink-subtle">
                          {existingAreaFolders.length > 0 ? (
                            <span className="font-semibold text-brand-700 flex items-center gap-1.5">
                              <span>📁 {existingAreaFolders.length} folder{existingAreaFolders.length === 1 ? '' : 's'}</span>
                              <span>·</span>
                              <span>{areaStatus.fileCount} file{areaStatus.fileCount === 1 ? '' : 's'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">+ Click to create folder</span>
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

              {/* AREA APPROVAL NOTIFICATION BANNER */}
              {(() => {
                const areaStatus = getAreaApprovalStatus(currentArea.code);
                if (areaStatus.status === 'approved') {
                  return (
                    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 shadow-2xs">
                      <CheckCircle2Icon className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold text-emerald-950">All Area Evidence Approved: </span>
                        <span>
                          All {areaStatus.fileCount} evidence file(s) across {areaStatus.folderCount} folder(s) in Area {currentArea.number} ({currentArea.name}) are officially approved for {campusName}.
                        </span>
                      </div>
                    </div>
                  );
                }
                if (areaStatus.status === 'needs_revision') {
                  return (
                    <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-2xs">
                      <AlertTriangleIcon className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold text-amber-950">Action Required — Revisions Pending: </span>
                        <span>
                          {areaStatus.revisionCount} file(s) in this Area have been returned for revision. Please review feedback remarks and update evidence portfolios.
                        </span>
                      </div>
                    </div>
                  );
                }
                if (areaStatus.status === 'review_required') {
                  return (
                    <div className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 text-xs text-blue-900 shadow-2xs">
                      <ClockIcon className="h-4 w-4 text-brand-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold text-brand-950">Accreditation Review in Progress: </span>
                        <span>
                          {areaStatus.pendingCount} file(s) in Area {currentArea.number} are awaiting review and sign-off ({areaStatus.approvedCount} of {areaStatus.fileCount} approved).
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs text-slate-700 shadow-2xs">
                    <InfoIcon className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900">Area Repository Ready: </span>
                      <span>
                        Upload official accreditation evidence files or create structured subfolders for Area {currentArea.number} ({currentArea.name}) at {campusName}.
                      </span>
                    </div>
                  </div>
                );
              })()}

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
                              
                            </div>
                          </div>

                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {renderFolderDatesBadge(folder)}
                            {(() => {
                              const folderStatus = getFolderApprovalStatus(folder);
                              if (folderStatus.status === 'approved') {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                                    <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                                    <span>Approved</span>
                                  </span>
                                );
                              }
                              if (folderStatus.status === 'needs_revision') {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                                    <AlertTriangleIcon className="h-3 w-3 text-amber-600" />
                                    <span>Needs Revision</span>
                                  </span>
                                );
                              }
                              if (folderStatus.status === 'review_required') {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-2xs">
                                    <ClockIcon className="h-3 w-3 text-brand-600" />
                                    <span>Review Required</span>
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>

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
                {/* Repository Filter: Show subfolder tabs ONLY if subfolders exist */}
                {insideSubfolders.length > 0 ? (
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs self-start">
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
                        {insideSubfolders.length + allFolderDocs.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRepoFilter('folders')}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        repoFilter === 'folders'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <FolderIcon className="h-3.5 w-3.5" />
                      <span>Folders</span>
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
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <FileTextIcon className="h-3.5 w-3.5" />
                      <span>Files</span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        repoFilter === 'files' ? 'bg-white/30 text-white' : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {allFolderDocs.length}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 self-start py-1">
                    <span className="flex h-2 w-2 rounded-full bg-brand-600" />
                    <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                      Evidence Documents
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/70">
                      {allFolderDocs.length} {allFolderDocs.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                )}

                {/* Evidence Approval Status Filter (Replaces Sort A–Z) */}
                {!isCustomFolder && currentActiveFolder?.areaId ? (
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setApprovalStatusFilter('all')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        approvalStatusFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <span>All ({folderApprovalCounts.total})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalStatusFilter('approved')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        approvalStatusFilter === 'approved'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : folderApprovalCounts.approved > 0
                          ? 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                          : 'text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                      title="Filter by approved evidence"
                    >
                      <CheckCircle2Icon className="h-3.5 w-3.5" />
                      <span>Approved ({folderApprovalCounts.approved})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalStatusFilter('pending')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        approvalStatusFilter === 'pending'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : folderApprovalCounts.pending > 0
                          ? 'text-brand-700 hover:bg-blue-50 hover:text-brand-800'
                          : 'text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                      title="Filter by evidence pending review"
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>Pending ({folderApprovalCounts.pending})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalStatusFilter('needs_revision')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        approvalStatusFilter === 'needs_revision'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : folderApprovalCounts.revision > 0
                          ? 'text-amber-800 hover:bg-amber-50 hover:text-amber-900 font-bold'
                          : 'text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                      title="Filter by evidence requiring revision"
                    >
                      <AlertTriangleIcon className="h-3.5 w-3.5" />
                      <span>Needs Revision ({folderApprovalCounts.revision})</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="btn btn-secondary btn-xs h-7.5 px-2.5 text-xs gap-1.5 self-start sm:self-auto shadow-2xs"
                    title="Toggle alphabetical order (A–Z / Z–A)"
                  >
                    <ArrowUpDownIcon className="h-3 w-3 text-brand-600" />
                    <span className="font-semibold text-brand-700">Sort: {sortDirection === 'asc' ? 'A → Z' : 'Z → A'}</span>
                  </button>
                )}
              </div>

              {/* EMPTY STATE INSIDE THE FOLDER */}
              {insideSubfolders.length === 0 && allFolderDocs.length === 0 && (
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
                                setEditingFolder(sub);
                                setFolderFormParentId(activeFolderId || undefined);
                                setFolderFormAreaId(selectedAreaCode?.toLowerCase());
                                setFolderFormOpen(true);
                              }}
                              className="p-1 text-ink-subtle hover:text-brand-600 rounded"
                              title="Rename / Edit subfolder"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
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
              {(repoFilter === 'all' || repoFilter === 'files') && (allFolderDocs.length > 0 || insideFiles.length > 0) && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-line/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Evidence Documents
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                        {insideFiles.length} of {allFolderDocs.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {!isCustomFolder && currentActiveFolder?.areaId ? (
                        approvalStatusFilter !== 'all' ? (
                          <div className="flex items-center gap-1.5">
                            <span>Filtered by:</span>
                            <span className="font-bold text-slate-800">
                              {approvalStatusFilter === 'approved'
                                ? 'Approved'
                                : approvalStatusFilter === 'pending'
                                ? 'Pending Review'
                                : 'Needs Revision'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setApprovalStatusFilter('all')}
                              className="text-brand-600 hover:underline font-semibold ml-1"
                            >
                              (Reset Filter)
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">All evidence in folder</span>
                        )
                      ) : (
                        <span className="text-slate-400">Sorted A to Z ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})</span>
                      )}
                    </div>
                  </div>

                  {insideFiles.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xs">
                      <div className="divide-y divide-line">
                      {insideFiles.map((doc) => {
                        const isOfficialArea = !isCustomFolder && !!currentActiveFolder?.areaId;
                        const isApproved = doc.approvalStatus === 'Approved';
                        const isNeedsRevision = doc.approvalStatus === 'Needs Revision';

                        return (
                          <div
                            key={doc.id}
                            className="flex flex-col gap-2.5 p-3.5 text-xs transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="mt-0.5 shrink-0">{renderFileIcon(doc.fileType)}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDoc(doc)}
                                    className="text-left font-bold text-ink hover:text-brand-600 hover:underline truncate block max-w-[340px] sm:max-w-[480px]"
                                    title={doc.title}
                                  >
                                    {doc.title}
                                  </button>

                                  {/* Approval Status Badge for official Area folders */}
                                  {isOfficialArea && (
                                    <>
                                      {isApproved ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                                          <CheckCircle2Icon className="h-3 w-3 text-emerald-600" />
                                          <span>Approved</span>
                                        </span>
                                      ) : isNeedsRevision ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                                          <AlertTriangleIcon className="h-3 w-3 text-amber-600" />
                                          <span>Needs Revision</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-2xs">
                                          <ClockIcon className="h-3 w-3 text-brand-600" />
                                          <span>Pending Review</span>
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>

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

                                {/* Revision Remarks Callout Box */}
                                {isOfficialArea && isNeedsRevision && doc.revisionNotes && (
                                  <div className="mt-2 flex items-start gap-2.5 rounded-r-lg border-l-4 border-amber-500 bg-amber-50/70 p-2.5 text-xs text-amber-900 shadow-2xs">
                                    <AlertCircleIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                      <span className="font-bold text-amber-950">Revision Feedback: </span>
                                      <span className="text-amber-900">{doc.revisionNotes}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons: View, Review Decisions, Download, Delete */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                              {/* 1. View Button (Clean Primary Discovery Action) */}
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="btn btn-secondary btn-xs h-7.5 px-3 text-xs font-semibold gap-1.5 shadow-2xs hover:bg-slate-100 text-slate-700 border-slate-300"
                                title="Preview document"
                              >
                                <EyeIcon className="h-3.5 w-3.5 text-slate-500" />
                                <span>View</span>
                              </button>

                              {/* 2. Review Decision CTAs */}
                              {isOfficialArea && (
                                <>
                                  {isApproved ? (
                                    /* Already Approved: status is shown on badge; provide clean revision trigger */
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRevisionModal(doc)}
                                      className="btn btn-ghost btn-xs h-7.5 px-2.5 text-xs font-medium text-slate-500 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded-lg gap-1.5 transition-all"
                                      title="Request changes or update revision remarks"
                                    >
                                      <FileEditIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600" />
                                      <span>Request Revision</span>
                                    </button>
                                  ) : isNeedsRevision ? (
                                    /* Needs Revision: Provide Mark Approved or Edit Feedback */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveDocument(doc)}
                                        className="btn btn-xs h-7.5 px-3 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all"
                                        title="Mark this revised document as Approved"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        <span>Mark Approved</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRevisionModal(doc)}
                                        className="btn btn-xs h-7.5 px-2.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg gap-1.5 transition-all"
                                        title="Edit revision instructions"
                                      >
                                        <FileEditIcon className="h-3.5 w-3.5 text-amber-600" />
                                        <span>Edit Notes</span>
                                      </button>
                                    </>
                                  ) : (
                                    /* Pending Review: Primary Decision Buttons */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveDocument(doc)}
                                        className="btn btn-xs h-7.5 px-3 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all"
                                        title="Approve this evidence document"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRevisionModal(doc)}
                                        className="btn btn-xs h-7.5 px-3 text-xs font-semibold gap-1.5 bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300 rounded-lg shadow-2xs transition-all"
                                        title="Request revision with feedback remarks"
                                      >
                                        <FileEditIcon className="h-3.5 w-3.5" />
                                        <span>Revise</span>
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              {/* Subtle Vertical Divider */}
                              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                              {/* 3. Utility Icons: Download & Delete */}
                              <button
                                type="button"
                                onClick={() => toast.success('Downloading "' + doc.title + '"')}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Download document"
                              >
                                <DownloadIcon className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to remove "' + doc.title + '"?')) {
                                    deleteDocument(doc.id);
                                    toast.success('Removed "' + doc.title + '"');
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                title="Delete file"
                              >
                                <Trash2Icon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center space-y-2 shadow-2xs">
                      <p className="text-xs font-bold text-slate-800">
                        No files matching status "{approvalStatusFilter === 'approved' ? 'Approved' : approvalStatusFilter === 'pending' ? 'Pending Review' : 'Needs Revision'}"
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {approvalStatusFilter === 'needs_revision'
                          ? 'Great! There are no files in this folder that require revision.'
                          : approvalStatusFilter === 'pending'
                          ? 'All files in this folder have already been reviewed and signed off.'
                          : 'No evidence files in this folder match this status.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setApprovalStatusFilter('all')}
                        className="btn btn-secondary btn-xs h-7 px-3 text-xs font-semibold"
                      >
                        Show All Evidence Files ({allFolderDocs.length})
                      </button>
                    </div>
                  )}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      IA Evidence Folders Repository (Custom)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                      <Building2Icon className="h-3 w-3 text-brand-600" />
                      <span>{campusName}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-subtle mt-0.5">
                    Custom evidence folders and portfolios strictly isolated to {campusName}. Folders can be uploaded directly to specific IA Areas 1–9.
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

              {rootCustomFolders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-slate-50/70 p-8 text-center space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <FolderIcon className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-ink">No Custom Folders in {campusName}</h4>
                  <p className="text-[11px] text-ink-muted max-w-sm mx-auto">
                    Folders created here belong exclusively to {campusName}. Click &quot;New Folder&quot; above to create a custom evidence portfolio for this campus.
                  </p>
                </div>
              ) : (
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
                            <span className="text-[10px] text-ink-subtle">{folder.code} · {folder.campus || campusName} · {folder.createdAt}</span>
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
              )}
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
                                setEditingFolder(sub);
                                setFolderFormParentId(activeFolderId || undefined);
                                setFolderFormAreaId(selectedAreaCode?.toLowerCase());
                                setFolderFormOpen(true);
                              }}
                              className="p-1 text-ink-subtle hover:text-brand-600 rounded"
                              title="Rename / Edit subfolder"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
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
                            <Badge tone={doc.status === 'Indexed' || doc.approvalStatus === 'Approved' ? 'success' : 'brand'} dot>
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

      {/* MODAL: TRANSFER A CUSTOM FOLDER TO AN OFFICIAL IA AREA */}
      {uploadingCustomFolder && (
        <Modal
          open={!!uploadingCustomFolder}
          onClose={() => setUploadingCustomFolder(null)}
          title="Transfer Custom Folder to Area"
          description={"Transfer folder and attached documents to an official Institutional Accreditation Area in " + campusName + "."}
          size="lg"
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
              <button
                type="button"
                className="btn btn-secondary w-full sm:w-auto text-xs font-semibold h-9 px-4"
                onClick={() => setUploadingCustomFolder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
                onClick={() => handleExecuteUploadCustomFolderToArea(uploadingCustomFolder, targetAreaForCustomFolder)}
              >
                <Share2Icon className="h-3.5 w-3.5" />
                <span>
                  Confirm Transfer to Area {OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaForCustomFolder)?.number || 1}
                </span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Folder Summary Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                    <FolderIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{uploadingCustomFolder.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {uploadingCustomFolder.code || 'CUSTOM'} · Created {uploadingCustomFolder.createdAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <Building2Icon className="h-3 w-3 text-brand-600" />
                    <span>{campusName}</span>
                  </span>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md">
                    {getFolderDocCount(uploadingCustomFolder)} files
                  </span>
                </div>
              </div>
            </div>

            {/* Target Area Selector Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Select Target Accreditation Area (Areas 1–9)
                </label>
                <span className="text-[10px] text-slate-400 font-normal">
                  Folder will move into this Area
                </span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {OFFICIAL_IA_AREAS.map((a) => {
                  const isSelected = targetAreaForCustomFolder === a.code;
                  return (
                    <div
                      key={a.code}
                      onClick={() => setTargetAreaForCustomFolder(a.code)}
                      className={"flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all " + (
                        isSelected
                          ? "border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60"
                      )}
                    >
                      <input
                        type="radio"
                        name="targetAreaForCustomFolder"
                        checked={isSelected}
                        onChange={() => setTargetAreaForCustomFolder(a.code)}
                        className="mt-0.5 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-100 px-1.5 py-0.2 rounded">
                            Area {a.number}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{a.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{a.shortDesc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination Breadcrumb Preview */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 text-[11px]">
              <span className="font-semibold text-slate-500">Resulting Destination:</span>
              <div className="inline-flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-2xs font-medium text-slate-700">
                <span className="text-slate-600">{campusName}</span>
                <ChevronRightIcon className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-brand-700">
                  Area {OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaForCustomFolder)?.number}: {OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaForCustomFolder)?.name}
                </span>
                <ChevronRightIcon className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-amber-700">{uploadingCustomFolder.name}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* UPLOAD INDIVIDUAL FILES, ENTIRE FOLDERS & CUSTOM FOLDERS MODAL */}
      {uploadModalOpen && (
        <Modal
          open={uploadModalOpen}
          size="lg"
          onClose={() => {
            setUploadModalOpen(false);
            setIsTopUploadSource(false);
            setUploadedFileList([]);
            setSelectedCustomFolderToUpload('');
            setTopUploadTargetFolderId('');
          }}
          title={
            isTopUploadSource
              ? 'Upload Evidence Files & Folders'
              : modalTargetFolder
              ? 'Upload into "' + modalTargetFolder.name + '"'
              : currentArea
              ? 'Upload into Area ' + currentArea.number + ': ' + currentArea.name
              : 'Upload Evidence Files & Folders'
          }
          description={
            isTopUploadSource
              ? 'Organize and index accreditation evidence for ' + campusName + '.'
              : 'Upload evidence documents or transfer custom folders for ' + campusName + '.'
          }
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                className="btn btn-secondary btn-sm h-9 px-4 text-xs font-semibold"
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
                className="btn btn-primary btn-sm h-9 px-4 text-xs font-semibold gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingUpload ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing & Indexing...</span>
                  </>
                ) : uploadMode === 'from-custom' ? (
                  <>
                    <FolderIcon className="h-3.5 w-3.5" />
                    <span>
                      {isTopUploadSource
                        ? 'Upload to Area ' + topUploadTargetAreaObj.number + (topUploadTargetFolderObj ? ' / ' + topUploadTargetFolderObj.name : '')
                        : 'Upload Custom Folder'}
                    </span>
                  </>
                ) : uploadMode === 'folder' ? (
                  <>
                    <FolderArchiveIcon className="h-3.5 w-3.5" />
                    <span>Upload Entire Folder ({uploadedFileList.length} files)</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-3.5 w-3.5" />
                    <span>Upload Individual Files ({uploadedFileList.length} files)</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* DESTINATION SELECTOR CARD (WHEN OPENED FROM TOP UPLOAD BUTTON) */}
            {isTopUploadSource ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 space-y-3 shadow-2xs">
                {/* Header: Location icon + Title + Campus Pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-brand-700">
                      <FolderOpenIcon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">Target Location</span>
                      <span className="hidden sm:inline text-[11px] text-slate-400 font-normal ml-1.5">
                        Choose destination area and folder
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs px-2.5 py-0.5 rounded-full">
                    <Building2Icon className="h-3 w-3 text-brand-600" />
                    <span>{campusName}</span>
                  </span>
                </div>

                {/* Grid for Area and Folder Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Target Area */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Accreditation Area
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
                      className="input text-xs w-full bg-white font-medium border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 h-9"
                    >
                      {OFFICIAL_IA_AREAS.map((a) => {
                        const count = iaFolders.filter((f) => (f.areaId || '').toLowerCase() === a.code.toLowerCase()).length;
                        return (
                          <option key={a.code} value={a.code}>
                            Area {a.number}: {a.name} ({count} {count === 1 ? 'folder' : 'folders'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Target Folder */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Folder in Area {topUploadTargetAreaObj.number}
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">Optional hierarchy</span>
                    </div>
                    <select
                      value={topUploadTargetFolderId}
                      onChange={(e) => setTopUploadTargetFolderId(e.target.value)}
                      className="input text-xs w-full bg-white font-medium border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 h-9"
                    >
                      <option value="">
                        {foldersInTopUploadArea.length === 0
                          ? '📁 Area Root (Default Portfolio)'
                          : '📁 Area Root (Directly in Area)'}
                      </option>
                      {foldersInTopUploadArea.map((f) => {
                        const parent = f.parentId ? iaFolders.find((p) => p.id === f.parentId) : null;
                        const docCount = getFolderDocCount(f);
                        return (
                          <option key={f.id} value={f.id}>
                            {parent ? '  ↳ 📁 ' + f.name + ' (in ' + parent.name + ')' : '📁 ' + f.name} ({docCount} {docCount === 1 ? 'file' : 'files'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Professional SVG Breadcrumbs Path Preview */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/70 text-[11px]">
                  <span className="font-semibold text-slate-500">Destination:</span>
                  <div className="inline-flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-0.5 shadow-2xs font-medium text-slate-700">
                    <span className="text-slate-600">{campusName}</span>
                    <ChevronRightIcon className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-brand-700">
                      Area {topUploadTargetAreaObj.number}: {topUploadTargetAreaObj.name}
                    </span>
                    {topUploadTargetFolderObj && (
                      <>
                        <ChevronRightIcon className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {topUploadTargetFolderObj.name}
                        </span>
                      </>
                    )}
                    <ChevronRightIcon className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="text-brand-600 font-semibold bg-brand-50 px-1 py-0.2 rounded text-[10px]">
                      {uploadMode === 'files'
                        ? '[Files]'
                        : uploadMode === 'folder'
                        ? '[New Folder]'
                        : '[Custom Folder]'}
                    </span>
                  </div>
                </div>
              </div>
            ) : modalTargetFolder ? (
              /* CONTEXTUAL DESTINATION PILL (WHEN OPENED FROM INSIDE A FOLDER) */
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-brand-700 shrink-0">
                    <FolderOpenIcon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Destination Folder: </span>
                    <strong className="font-bold text-slate-900">{modalTargetFolder.name}</strong>
                    {currentArea && <span className="text-brand-700 font-normal"> (Area {currentArea.number})</span>}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                  {campusName}
                </span>
              </div>
            ) : currentArea ? (
              /* CONTEXTUAL DESTINATION PILL (WHEN OPENED FROM INSIDE AN AREA) */
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-brand-700 shrink-0">
                    <FolderOpenIcon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Destination Area: </span>
                    <strong className="font-bold text-slate-900">Area {currentArea.number}: {currentArea.name}</strong>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                  {campusName}
                </span>
              </div>
            ) : null}

            {/* MODERN SEGMENTED CONTROL: 3 MODES */}
            <div className={'rounded-xl border border-slate-200 bg-slate-100/90 p-1 grid gap-1 text-xs ' + (
              isTopUploadSource || selectedAreaCode ? 'grid-cols-3' : 'grid-cols-2'
            )}>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('files');
                  setUploadedFileList([]);
                }}
                className={'flex items-center justify-center gap-2 py-2 px-3 font-semibold rounded-lg transition-all ' + (
                  uploadMode === 'files'
                    ? 'bg-white text-brand-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                )}
              >
                <FileTextIcon className="h-4 w-4 shrink-0 text-brand-600" />
                <span>Individual Files</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('folder');
                  setUploadedFileList([]);
                }}
                className={'flex items-center justify-center gap-2 py-2 px-3 font-semibold rounded-lg transition-all ' + (
                  uploadMode === 'folder'
                    ? 'bg-white text-brand-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                )}
              >
                <FolderArchiveIcon className="h-4 w-4 shrink-0 text-amber-600" />
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
                  className={'flex items-center justify-center gap-2 py-2 px-3 font-semibold rounded-lg transition-all ' + (
                    uploadMode === 'from-custom'
                      ? 'bg-white text-brand-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  )}
                >
                  <FolderIcon className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span>Custom Folder</span>
                </button>
              )}
            </div>

            {/* TAB 1 & 2: INDIVIDUAL FILES & ENTIRE FOLDER VIEW */}
            {uploadMode !== 'from-custom' ? (
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
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Target Evidence Folder in Area {currentArea?.number}:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Choose destination</span>
                    </label>
                    <select
                      value={selectedTargetFolder || areaFolders[0]?.id || ''}
                      onChange={(e) => setSelectedTargetFolder(e.target.value)}
                      className="input text-xs w-full bg-white border-slate-300"
                    >
                      {areaFolders.map((af) => (
                        <option key={af.id} value={af.id}>
                          {af.name} ({getFolderDocCount(af)} files)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* INTERACTIVE DROPZONE */}
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
                  className={'group border-2 border-dashed rounded-xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 ' + (
                    isDragging
                      ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-400/30'
                      : 'border-slate-300 hover:border-brand-400 bg-slate-50/40 hover:bg-brand-50/20'
                  )}
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
                      ? 'Imports directory hierarchy and indexes all nested evidence documents.'
                      : 'Supports PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), and images.'}
                  </p>
                </div>

                {/* SELECTED ITEMS PREVIEW LIST */}
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
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-2xs">
                          <div className="flex items-center gap-2 truncate max-w-[420px]">
                            {item.name.endsWith('.xlsx') || item.name.endsWith('.csv') ? (
                              <FileSpreadsheetIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : item.name.endsWith('.docx') ? (
                              <FileTextIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <FileTextIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            )}
                            <span className="truncate font-medium text-slate-800">{item.path || item.name}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-2">
                            {(item.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* TAB 3: CUSTOM FOLDER SELECTION VIEW */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Select Custom Folder to Transfer
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Destination: {isTopUploadSource
                        ? topUploadTargetFolderObj
                          ? '"' + topUploadTargetFolderObj.name + '" in Area ' + topUploadTargetAreaObj.number
                          : 'Area ' + topUploadTargetAreaObj.number + ': ' + topUploadTargetAreaObj.name
                        : currentActiveFolder
                        ? '"' + currentActiveFolder.name + '"'
                        : currentArea
                        ? 'Area ' + currentArea.number
                        : 'this Area'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {rootCustomFolders.length} {rootCustomFolders.length === 1 ? 'folder' : 'folders'} available
                  </span>
                </div>

                {rootCustomFolders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500 space-y-1.5">
                    <FolderIcon className="mx-auto h-8 w-8 text-slate-400 mb-1" />
                    <p className="font-semibold text-slate-800">No Custom Folders Available</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      All custom folders have been transferred or none exist for {campusName}. You can create new folders under the &quot;Custom Folders&quot; tab.
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
                          className={'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ' + (
                            isSelected
                              ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="selectedCustomFolderToUpload"
                              checked={isSelected}
                              onChange={() => setSelectedCustomFolderToUpload(f.id)}
                              className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                            />
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
                              <FolderIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{f.name}</span>
                              <span className="text-[10px] text-slate-400">{f.code || 'CUSTOM'} · Created {f.createdAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {subCount > 0 && (
                              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {subCount} {subCount === 1 ? 'subfolder' : 'subfolders'}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-md">
                              {docCount} {docCount === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* REVISION REQUEST FEEDBACK MODAL */}
      {revisionModalDoc && (
        <Modal
          open={!!revisionModalDoc}
          onClose={() => setRevisionModalDoc(null)}
          size="md"
          title="Request Document Revision"
          description={'Provide specific revision instructions for "' + revisionModalDoc.title + '".'}
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
              <button
                type="button"
                className="btn btn-secondary w-full sm:w-auto text-xs font-semibold h-9 px-4"
                onClick={() => setRevisionModalDoc(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRevision || !revisionRemarks.trim()}
                className="btn btn-primary w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs bg-amber-600 hover:bg-amber-700 border-amber-600 text-white disabled:opacity-50"
                onClick={handleSubmitRevision}
              >
                <AlertCircleIcon className="h-3.5 w-3.5" />
                <span>Submit Revision Request</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Document Info Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <FileTextIcon className="h-4 w-4 text-brand-600 shrink-0" />
                <h4 className="font-bold text-xs text-slate-800 truncate">{revisionModalDoc.title}</h4>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/70">
                <span>Type: {revisionModalDoc.fileType}</span>
                <span>·</span>
                <span>Size: {revisionModalDoc.sizeMb} MB</span>
                <span>·</span>
                <span>Campus: {revisionModalDoc.campus || campusName}</span>
              </div>
            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Revision Remarks & Feedback <span className="text-danger-600">*</span>
              </label>
              <textarea
                value={revisionRemarks}
                onChange={(e) => setRevisionRemarks(e.target.value)}
                rows={4}
                className="textarea text-xs w-full bg-white border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="Explain clearly what needs to be revised or attached (e.g. Please attach the signed BOR certification on page 3 and update statistical figures for AY 2024–2025)..."
                required
              />
              <p className="text-[10px] text-slate-400">
                These remarks will be flagged on the document and visible to faculty and accreditation chairs.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE FOLDER MODAL */}
      </div>
  );
}
