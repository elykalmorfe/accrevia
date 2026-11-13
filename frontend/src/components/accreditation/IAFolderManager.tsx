import React, { useState, useMemo, useEffect } from 'react';
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
import { Modal } from '../ui/Modal';
import { FolderFormModal } from '../folders/FolderFormModal';
import { FolderAction, FolderCard, FolderStatus } from '../folders/FolderCard';
import { pluralize } from '../../utils/format';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';
import { downloadStoredFile, persistUpload } from '../../utils/fileStore';
import { fileTypeFromName } from '../../utils/fileTypes';
import { applyNamingPattern, filterAllowedUploads, uploadAcceptAttribute } from '../../utils/uploadRules';
import type { PendingUpload } from '../../utils/dropFiles';
import { UploadDropzone } from '../upload/UploadDropzone';
import { StagedFileList } from '../upload/StagedFileList';
import { FileList, FileRow, FileRowAction, FileStatusPill } from '../upload/FileRow';
import { formatSize } from '../upload/fileTypeStyle';
import { isCertificateArea } from '../../utils/programAccreditation';
import { IAAreaTemplate, usePortalSettings } from '../../settings/portalSettings';
import { FolderFramework, iaFolderFramework } from './folderFrameworks';

interface IAFolderManagerProps {
  campusId: CampusId;
  campusName: string;
  /** Defaults to Institutional Accreditation with the areas from Settings. */
  framework?: FolderFramework;
  iaRequirements?: IARequirementItem[];
  onRequirementUpdated?: (reqId: string, docName: string, docUrl: string) => void;
}

const AREA_STATUS_STYLE: Record<string, { tile: string }> = {
  approved: { tile: 'from-brand-500 to-brand-600' },
  needs_revision: { tile: 'from-brand-600 to-brand-700' },
  review_required: { tile: 'from-brand-500 to-brand-600' },
  needs_files: { tile: 'from-brand-500 to-brand-600' },
  needs_evidence: { tile: 'from-slate-400 to-slate-500' }
};

const AREA_STATUS: Record<string, FolderStatus> = {
  approved: { label: 'All approved', tone: 'success' },
  needs_revision: { label: 'Needs revision', tone: 'danger' },
  review_required: { label: 'Awaiting review', tone: 'info' },
  needs_files: { label: 'No files yet', tone: 'warning' },
  needs_evidence: { label: 'Empty', tone: 'neutral' }
};

const FOLDER_STATUS: Record<string, FolderStatus> = {
  approved: { label: 'All approved', tone: 'success' },
  needs_revision: { label: 'Needs revision', tone: 'danger' },
  review_required: { label: 'Awaiting review', tone: 'info' },
  empty: { label: 'No files yet', tone: 'neutral' }
};

function folderDeadlineText(folder: EvidenceFolder): string {
  if (folder.hasNoDeadline) return 'No deadline';
  if (folder.expiredDate) {
    return new Date(folder.expiredDate) < new Date() ? `Expired ${folder.expiredDate}` : `Due ${folder.expiredDate}`;
  }
  return `Created ${folder.createdAt}`;
}

export function IAFolderManager({ campusId, campusName, framework: frameworkProp, iaRequirements = [], onRequirementUpdated }: IAFolderManagerProps) {
  const { folders, saveFolder, deleteFolder, documents, addDocument, deleteDocument, updateDocument, updateIARequirement, currentUser } = usePortal();
  const settings = usePortalSettings();
  // IA area names are editable in Settings → Accreditation Setup
  const framework = frameworkProp ?? iaFolderFramework(settings.accreditation.iaAreas);
  const OFFICIAL_IA_AREAS = framework.areas;
  const FIRST_AREA_CODE = OFFICIAL_IA_AREAS[0]?.code ?? '';
  const ROOT_FOLDER_ID = 'folder-' + framework.id;
  const areaLabel = (area: IAAreaTemplate) => framework.areaNoun + ' ' + area.number;
  const areaRangeLabel = framework.areaNounPlural + ' 1–' + OFFICIAL_IA_AREAS.length;
  const { approverRoles, requireRevisionNote, autoVerifyArea } = settings.workflow;
  const canReview = approverRoles.includes(currentUser.role);
  const uploadSettings = { defaultYear: settings.general.defaultAcademicYear, status: settings.uploads.newUploadStatus };

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
  const [targetAreaForCustomFolder, setTargetAreaForCustomFolder] = useState<string>(FIRST_AREA_CODE);

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
  const [uploadedFileList, setUploadedFileList] = useState<Array<{ name: string; size: number; path?: string; file?: File }>>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // States for Top Upload Button (beside search bar)
  const [isTopUploadSource, setIsTopUploadSource] = useState(false);
  const [topUploadTargetAreaCode, setTopUploadTargetAreaCode] = useState<string>(FIRST_AREA_CODE);
  const [topUploadTargetFolderId, setTopUploadTargetFolderId] = useState<string>('');

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
      if (f.frameworkId === 'pa' || isCertificateArea(f.areaId)) return false;
      const inFramework =
        framework.id === 'ia'
          ? f.frameworkId === 'ia' ||
            f.category === 'Accreditation' ||
            (f.category === 'General / Custom' && !f.frameworkId) ||
            f.id.startsWith('folder-ia')
          : f.frameworkId === framework.id;
      if (!inFramework) return false;

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
      // ONLY associate the initial untagged framework root folder with default 'tandag'
      return f.id === ROOT_FOLDER_ID && campusId === 'tandag';
    });
  }, [folders, campusId, campusName, framework.id, ROOT_FOLDER_ID]);

  // Documents mapped strictly to this campus and framework
  const campusIADocs = useMemo(() => {
    return documents.filter((d) => {
      if (d.frameworkId !== framework.id || isCertificateArea(d.areaId)) return false;

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
  }, [documents, campusId, campusName, framework.id]);

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
  }, [selectedAreaCode, OFFICIAL_IA_AREAS]);

  // Destination helpers for the Top Upload Button beside search bar:
  const topUploadTargetAreaObj = useMemo(() => {
    return OFFICIAL_IA_AREAS.find((a) => a.code === topUploadTargetAreaCode) || OFFICIAL_IA_AREAS[0];
  }, [topUploadTargetAreaCode, OFFICIAL_IA_AREAS]);

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
  // (or if unassigned initial doc in the framework's default system folder)
  const isDocInFolder = (doc: EvidenceDocument, folder: EvidenceFolder) => {
    if (doc.folderId === folder.id) return true;
    if (!doc.folderId && folder.id === ROOT_FOLDER_ID) return true;
    return false;
  };

  // --- DOCUMENT APPROVAL & REVISION WORKFLOW ---
  const areaRequirement = (doc: EvidenceDocument) => {
    const code = (doc.areaId || '').toUpperCase();
    return code ? iaRequirements.find((r) => r.areaCode === code) : undefined;
  };

  const handleApproveDocument = (doc: EvidenceDocument) => {
    updateDocument(doc.id, {
      approvalStatus: 'Approved',
      revisionNotes: undefined,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString()
    });
    toast.success('Approved "' + doc.title + '"');

    const req = areaRequirement(doc);
    if (!autoVerifyArea || !req || req.status === 'Approved') return;
    const areaDocs = campusIADocs.filter((d) => d.areaId === doc.areaId);
    if (areaDocs.every((d) => d.id === doc.id || d.approvalStatus === 'Approved')) {
      updateIARequirement(campusId, req.id, {
        status: 'Approved',
        isSubmitted: true,
        submissionDate: req.submissionDate || new Date().toISOString().slice(0, 10),
        documentName: doc.title
      });
      toast.success(req.areaName + ' marked as verified', { description: 'All files in this area are approved.' });
    }
  };

  const handleOpenRevisionModal = (doc: EvidenceDocument) => {
    setRevisionModalDoc(doc);
    setRevisionRemarks(doc.revisionNotes || '');
  };

  const handleSubmitRevision = () => {
    if (!revisionModalDoc || (requireRevisionNote && !revisionRemarks.trim())) return;
    setIsSubmittingRevision(true);
    updateDocument(revisionModalDoc.id, {
      approvalStatus: 'Needs Revision',
      revisionNotes: revisionRemarks.trim() || undefined,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString()
    });
    const req = areaRequirement(revisionModalDoc);
    if (autoVerifyArea && req?.status === 'Approved') {
      updateIARequirement(campusId, req.id, { status: 'Under Review' });
    }
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
  }, [searchQuery, OFFICIAL_IA_AREAS]);

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
      setFolderFormInitialName(area ? `${area.name} Evidence Portfolio` : `${framework.areaNoun} ${areaCode} Portfolio`);
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
              ? 'bg-brand-50 text-brand-900 border-brand-200'
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
            category: framework.category,
            parentId: targetParentFolderId ? targetParentFolderId : undefined,
            campusId: campusId,
            campus: campusName
          });
        } else {
          saveFolder({
            ...f,
            areaId: targetAreaId,
            category: framework.category,
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
      ? '"' + targetParentFolder.name + '" in ' + areaLabel(targetAreaObj)
      : areaLabel(targetAreaObj) + ': ' + targetAreaObj.name;

    toast.success(`Folder "${folderToUpload.name}" successfully uploaded into ${destinationName}!`);
    setUploadingCustomFolder(null);

    // If user was viewing that folder in Custom, exit to root since it moved
    if (activeFolderId === folderToUpload.id) {
      setActiveFolderId(null);
    }
  };

  // Stage files picked or dropped in the upload modal
  const handleStageUploads = (uploads: PendingUpload[]) => {
    const list = uploads.map(({ file, path }) => ({
        name: file.name,
        size: file.size,
      path: path !== file.name ? path : undefined,
        file
    }));
    const allowed = filterAllowedUploads(list, (f) => f);
    if (allowed.length === 0) return;
    setUploadedFileList((prev) => (uploadMode === 'folder' ? allowed : [...prev, ...allowed]));
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

      const targetAreaCode = isTopUploadSource ? topUploadTargetAreaCode : (selectedAreaCode || FIRST_AREA_CODE);
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
        : (selectedAreaCode || currentActiveFolder?.areaId?.toUpperCase() || FIRST_AREA_CODE);
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
              frameworkId: framework.id,
              category: framework.category,
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
              const newAreaFolderId = ROOT_FOLDER_ID + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
              const initialAreaFolder: EvidenceFolder = {
                id: newAreaFolderId,
                name: targetAreaObj.name + ' Evidence Portfolio',
                code: targetAreaCode,
                frameworkId: framework.id,
                category: framework.category,
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
            const newAreaFolderId = ROOT_FOLDER_ID + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
            const initialAreaFolder: EvidenceFolder = {
              id: newAreaFolderId,
              name: currentArea ? currentArea.name + ' Portfolio' : framework.areaNoun + ' ' + selectedAreaCode + ' Evidence Portfolio',
              code: selectedAreaCode,
              frameworkId: framework.id,
              category: framework.category,
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
            destinationFolderId = targetFolder?.id || ROOT_FOLDER_ID;
          }
        }
      }

      const { criterionId, indicatorId } = framework.criterionFor(targetAreaObj);
      uploadedFileList.forEach((file, idx) => {
        const newDoc: EvidenceDocument = {
          id: 'doc-' + framework.id + '-' + Date.now() + '-' + idx,
          title: applyNamingPattern(file.path ? file.path.split('/')[0] + ': ' + file.name : file.name, {
            campus: campusName,
            area: areaLabel(targetAreaObj),
            year: uploadSettings.defaultYear
          }),
          description: 'Uploaded evidence document for ' + framework.fullName + ' (' + (targetFolder?.name || targetAreaObj.name) + ').',
          keywords: [framework.label + ' Evidence', targetFolder?.name || targetAreaObj.name, campusName],
          frameworkId: framework.id,
          areaId: targetFolder?.areaId || targetAreaId,
          criterionId,
          indicatorId,
          docType: file.name.endsWith('.xlsx') ? 'Statistical Report' : 'Report',
          academicYear: uploadSettings.defaultYear,
          cycle: framework.cycle,
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
          fileType: fileTypeFromName(file.name),
          pages: Math.max(1, Math.round(file.size / 50000)),
          sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10 || 1.2,
          uploadedBy: currentUser.name,
          passages: ['Institutional evidence registered under ' + (targetFolder?.name || targetAreaObj.name)],
          folderId: destinationFolderId || undefined,
          approvalStatus: uploadSettings.status
        };
        persistUpload(newDoc.id, file.file);
        addDocument(newDoc);
      });

      setIsProcessingUpload(false);
      setUploadModalOpen(false);
      setIsTopUploadSource(false);
      setUploadedFileList([]);

      const destinationTitle = targetFolder
        ? '"' + targetFolder.name + '" in ' + areaLabel(targetAreaObj)
        : areaLabel(targetAreaObj) + ': ' + targetAreaObj.name;

      toast.success(
        uploadMode === 'folder'
          ? 'Successfully uploaded entire folder into ' + destinationTitle + ' (' + uploadedFileList.length + ' files)!'
          : 'Successfully uploaded ' + uploadedFileList.length + ' document(s) into ' + destinationTitle + '!'
      );
    }, 600);
  };

  const fileMeta = (doc: EvidenceDocument) =>
    [doc.fileType, doc.sizeMb ? formatSize(doc.sizeMb) : null, doc.documentDate, doc.academicYear].filter(Boolean).join(' · ');

  const handleDownloadDoc = async (doc: EvidenceDocument) => {
    const ok = await downloadStoredFile(doc.id, doc.title);
    if (!ok) toast.error(`"${doc.title}" has no stored file to download.`);
  };

  const handleRemoveDoc = (doc: EvidenceDocument) => {
    if (!window.confirm(`Are you sure you want to remove "${doc.title}"?`)) return;
    deleteDocument(doc.id);
    toast.success(`Removed "${doc.title}"`);
  };

  // PROFESSIONAL FOLDER HEADER COMPONENT (Redesigned from the user's provided image)
  const renderProfessionalFolderHeader = () => {
    if (!currentActiveFolder) return null;

    const backLabel = currentActiveFolder.parentId && parentFolder
      ? parentFolder.name
      : selectedAreaCode && currentArea
      ? `${areaLabel(currentArea)}: ${currentArea.name}`
      : 'Custom Folders Repository';

    return (
      <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-white via-white to-brand-50/60 p-4 shadow-xs space-y-3">
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
          {framework.customFolders && !currentActiveFolder.areaId && (
            <button
              type="button"
              onClick={() => setUploadingCustomFolder(currentActiveFolder)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
              title={`Upload and transfer this custom folder to an official ${framework.areaNoun}`}
            >
              <Share2Icon className="h-3.5 w-3.5" />
              <span>Upload to {areaRangeLabel} →</span>
            </button>
          )}
        </div>

        {/* Main Row: Folder Identity on Left, Action Buttons on Right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2.5 border-t border-line/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-500 text-white shadow-md shadow-brand/30">
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
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-300/80 px-2.5 py-1 rounded-lg shadow-2xs">
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-brand-600" />
                        <span>Folder Approved</span>
                      </span>
                    );
                  }
                  if (fStatus.status === 'needs_revision') {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-800 bg-brand-50 border border-brand-300/80 px-2.5 py-1 rounded-lg shadow-2xs">
                        <AlertTriangleIcon className="h-3.5 w-3.5 text-brand-600" />
                        <span>Needs Revision</span>
                      </span>
                    );
                  }
                  if (fStatus.status === 'review_required') {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
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

  const areaStatuses = OFFICIAL_IA_AREAS.map((a) => getAreaApprovalStatus(a.code));
  const overviewStats = [
    {
      label: `${framework.areaNounPlural} Approved`,
      value: `${areaStatuses.filter((s) => s.status === 'approved').length}/${OFFICIAL_IA_AREAS.length}`,
      icon: CheckCircle2Icon,
      tile: 'bg-brand-50 text-brand-600'
    },
    {
      label: 'Evidence Files',
      value: areaStatuses.reduce((sum, s) => sum + s.fileCount, 0),
      icon: FileTextIcon,
      tile: 'bg-brand-50 text-brand-600'
    },
    {
      label: 'Pending Review',
      value: areaStatuses.reduce((sum, s) => sum + s.pendingCount, 0),
      icon: ClockIcon,
      tile: 'bg-brand-50 text-brand-600'
    },
    {
      label: 'Needs Revision',
      value: areaStatuses.reduce((sum, s) => sum + s.revisionCount, 0),
      icon: AlertTriangleIcon,
      tile: 'bg-brand-50 text-brand-600'
    }
  ];

  return (
    <div className="panel mb-6 overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-line bg-gradient-to-br from-brand-50 via-white to-brand-50/70 p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-brand-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] font-bold tracking-tight text-ink">{framework.title}</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 backdrop-blur">
                  <Building2Icon className="h-3 w-3" />
                  {campusName}
                </span>
              </div>
              {framework.description && (
                <p className="mt-1 max-w-xl text-[12.5px] text-ink-muted">
                  {framework.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:min-w-[600px]">
            {overviewStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-sm shadow-slate-200/60 backdrop-blur"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.tile}`}>
                  <stat.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[16px] font-bold leading-tight text-ink">{stat.value}</p>
                  <p className="text-[10.5px] font-semibold uppercase leading-tight tracking-wider text-ink-subtle">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Segmented View Tabs & Action Row */}
      <div className="flex flex-col gap-3 border-b border-line bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="inline-flex items-center gap-1 self-start rounded-xl border border-line bg-canvas p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('areas');
              setSelectedAreaCode(null);
              setActiveFolderId(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'areas'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <LayersIcon className="h-3.5 w-3.5" />
            <span>{framework.areasTabLabel}</span>
            <span
              className={`rounded-full px-1.5 text-[10px] font-bold ${
                activeTab === 'areas' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200/80 text-ink-muted'
              }`}
            >
              {OFFICIAL_IA_AREAS.length}
            </span>
          </button>

          {framework.customFolders && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('folders');
                setSelectedAreaCode(null);
                setActiveFolderId(null);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'folders'
                  ? 'bg-white text-brand-700 shadow-sm ring-1 ring-line'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FolderIcon className="h-3.5 w-3.5 text-brand-500" />
              <span>Custom Folders</span>
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  activeTab === 'folders' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200/80 text-ink-muted'
                }`}
              >
                {rootCustomFolders.length}
              </span>
            </button>
          )}
        </div>

        {/* Search Bar + Upload Files/Folder Button on the same row */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
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
                  ? `Search ${areaRangeLabel.toLowerCase()}...`
                  : 'Search folders...'
              }
              className="h-9 w-full rounded-xl border border-line bg-canvas pl-8 pr-7 text-xs outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm leading-none text-ink-subtle hover:text-ink"
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
                const initialArea = selectedAreaCode || FIRST_AREA_CODE;
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
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-brand-600/25 transition hover:shadow-lg hover:shadow-brand-600/30 hover:brightness-110"
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  {framework.areasHeading}
                </span>
                <span className="text-[11.5px] text-ink-subtle">
                  Open {framework.areaNoun === 'Area' ? 'an area' : 'a ' + framework.areaNoun.toLowerCase()} to manage its evidence folders, timelines & deadlines
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAreas.map((area) => {
                  const areaStatus = getAreaApprovalStatus(area.code);
                  return (
                    <FolderCard
                      key={area.code}
                      onOpen={() => handleSelectArea(area.code)}
                      title={`Open ${areaLabel(area)}: ${area.name}`}
                      eyebrow={areaLabel(area)}
                      name={area.name}
                      meta={`${pluralize(areaStatus.folderCount, 'folder')} · ${pluralize(areaStatus.fileCount, 'file')}`}
                      status={AREA_STATUS[areaStatus.status] ?? AREA_STATUS.needs_evidence}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 2: INSIDE A SELECTED AREA (Viewing its folders or prompt to create first folder) */}
          {selectedAreaCode && currentArea && !activeFolderId && (
            <div className="space-y-4">
              {/* Breadcrumb Header for Area */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-gradient-to-r from-white via-white to-brand-50/60 p-4 shadow-xs">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAreaCode(null);
                      setSearchQuery('');
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink-muted transition hover:border-brand-300 hover:text-brand-700"
                    title={`Back to ${framework.areasTabLabel}`}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[15px] font-bold text-white shadow-md shadow-slate-300/50 ${
                      (AREA_STATUS_STYLE[getAreaApprovalStatus(currentArea.code).status] ?? AREA_STATUS_STYLE.needs_evidence).tile
                    }`}
                  >
                    {currentArea.number}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-subtle">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAreaCode(null);
                          setSearchQuery('');
                        }}
                        className="hover:text-brand-700"
                      >
                        {framework.areasTabLabel}
                      </button>
                      <ChevronRightIcon className="h-3 w-3" />
                      <span>{areaLabel(currentArea)}</span>
                    </div>
                    <h4 className="truncate text-[15px] font-bold text-ink">{currentArea.name}</h4>
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
                    className="btn btn-primary btn-sm text-xs gap-1.5 shadow-xs"
                    title={`Upload individual files, an entire folder, or a custom folder into this ${framework.areaNoun}`}
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
                    className="btn btn-secondary btn-sm text-xs gap-1.5"
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
                    <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50/90 p-3.5 text-xs text-brand-900 shadow-2xs">
                      <CheckCircle2Icon className="h-4 w-4 text-brand-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold text-brand-950">All {framework.areaNoun} Evidence Approved: </span>
                        <span>
                          All {areaStatus.fileCount} evidence file(s) across {areaStatus.folderCount} folder(s) in {areaLabel(currentArea)} ({currentArea.name}) are officially approved for {campusName}.
                        </span>
                      </div>
                    </div>
                  );
                }
                if (areaStatus.status === 'needs_revision') {
                  return (
                    <div className="flex items-center gap-2.5 rounded-xl border border-brand-300 bg-brand-50/90 p-3.5 text-xs text-brand-900 shadow-2xs">
                      <AlertTriangleIcon className="h-4 w-4 text-brand-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold text-brand-950">Action Required — Revisions Pending: </span>
                        <span>
                          {areaStatus.revisionCount} file(s) in this {framework.areaNoun} have been returned for revision. Please review feedback remarks and update evidence portfolios.
                        </span>
                      </div>
                    </div>
                  );
                }
                if (areaStatus.status === 'review_required') {
                  return (
                    <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50/90 p-3.5 text-xs text-blue-900 shadow-2xs">
                      <ClockIcon className="h-4 w-4 text-brand-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold text-brand-950">{framework.label} Review in Progress: </span>
                        <span>
                          {areaStatus.pendingCount} file(s) in {areaLabel(currentArea)} are awaiting review and sign-off ({areaStatus.approvedCount} of {areaStatus.fileCount} approved).
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs text-slate-700 shadow-2xs">
                    <InfoIcon className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900">{framework.areaNoun} Repository Ready: </span>
                      <span>
                        Upload official {framework.label} evidence files or create structured subfolders for {areaLabel(currentArea)} ({currentArea.name}) at {campusName}.
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Area Folders Display */}
              {areaFolders.length === 0 ? (
                /* Prompt to create first folder if none exists */
                <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-b from-white to-brand-50/40 p-10 text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-500 text-white shadow-lg shadow-brand-500/30">
                    <FolderPlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">
                      No Folder Created for {areaLabel(currentArea)} Yet
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
                      {areaLabel(currentArea)} Evidence Folders ({areaFolders.length})
                    </span>
                    <span className="text-[11px] text-ink-subtle">Click a folder to view and upload files</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {areaFolders.map((folder) => {
                      const docCount = getFolderDocCount(folder);
                      const subCount = getFolderSubfolderCount(folder.id);
                      return (
                        <FolderCard
                          key={folder.id}
                          onOpen={() => {
                            setActiveFolderId(folder.id);
                            setRepoFilter('all');
                            setSearchQuery('');
                          }}
                          title={folder.description || 'Open this folder'}
                          eyebrow={folderDeadlineText(folder)}
                          name={folder.name}
                          meta={`${pluralize(docCount, 'file')}${subCount > 0 ? ` · ${pluralize(subCount, 'subfolder')}` : ''}`}
                          status={FOLDER_STATUS[getFolderApprovalStatus(folder).status]}
                          actions={
                            <>
                              <FolderAction
                                icon={UploadIcon}
                                label="Upload into folder"
                                onClick={() => {
                                  setIsTopUploadSource(false);
                                  setSelectedTargetFolder(folder.id);
                                  setUploadModalOpen(true);
                                }}
                              />
                              <FolderAction
                                icon={PencilIcon}
                                label="Edit folder"
                                onClick={() => {
                                  setEditingFolder(folder);
                                  setFolderFormOpen(true);
                                }}
                              />
                            </>
                          }
                        />
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
                          ? 'bg-brand-600 text-white shadow-2xs'
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
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : folderApprovalCounts.approved > 0
                          ? 'text-brand-700 hover:bg-brand-50 hover:text-brand-800'
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
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : folderApprovalCounts.pending > 0
                          ? 'text-brand-700 hover:bg-brand-50 hover:text-brand-800'
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
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : folderApprovalCounts.revision > 0
                          ? 'text-brand-800 hover:bg-brand-50 hover:text-brand-900 font-bold'
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
                <div className="rounded-2xl border-2 border-dashed border-line bg-gradient-to-b from-white to-canvas p-10 text-center">
                  <FolderOpenIcon className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-brand-50 p-2.5 text-brand-500 ring-1 ring-brand-100" />
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
                        <FolderCard
                          key={sub.id}
                          onOpen={() => {
                            setActiveFolderId(sub.id);
                            setSearchQuery('');
                          }}
                          title={sub.description || 'Open this subfolder'}
                          eyebrow={folderDeadlineText(sub)}
                          name={sub.name}
                          meta={pluralize(count, 'file')}
                          status={FOLDER_STATUS[getFolderApprovalStatus(sub).status]}
                          actions={
                            <>
                              <FolderAction
                                icon={UploadIcon}
                                label="Upload into subfolder"
                                onClick={() => {
                                  setIsTopUploadSource(false);
                                  setSelectedTargetFolder(sub.id);
                                  setUploadModalOpen(true);
                                }}
                              />
                              <FolderAction
                                icon={PencilIcon}
                                label="Rename / edit subfolder"
                                onClick={() => {
                                  setEditingFolder(sub);
                                  setFolderFormParentId(activeFolderId || undefined);
                                  setFolderFormAreaId(selectedAreaCode?.toLowerCase());
                                  setFolderFormOpen(true);
                                }}
                              />
                            </>
                          }
                        />
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
                    <FileList>
                      {insideFiles.map((doc) => {
                        const isOfficialArea = !isCustomFolder && !!currentActiveFolder?.areaId;
                        const isApproved = doc.approvalStatus === 'Approved';
                        const isNeedsRevision = doc.approvalStatus === 'Needs Revision';

                        return (
                          <FileRow
                            key={doc.id}
                            name={doc.title}
                            fileType={doc.fileType}
                            onOpen={() => setPreviewDoc(doc)}
                            meta={fileMeta(doc)}
                            status={isOfficialArea ? <FileStatusPill status={doc.approvalStatus} /> : undefined}
                            actions={
                              <>
                              <FileRowAction icon={EyeIcon} label={`Preview ${doc.title}`} onClick={() => setPreviewDoc(doc)} />

                              {/* 2. Review Decision CTAs */}
                              {isOfficialArea && canReview && (
                                <>
                                  {isApproved ? (
                                    /* Already Approved: status is shown on badge; provide clean revision trigger */
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRevisionModal(doc)}
                                      className="btn btn-ghost btn-xs h-7.5 px-2.5 text-xs font-medium text-slate-500 hover:text-brand-800 hover:bg-brand-50 border border-transparent hover:border-brand-200 rounded-lg gap-1.5 transition-all"
                                      title="Request changes or update revision remarks"
                                    >
                                      <FileEditIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600" />
                                      <span>Request Revision</span>
                                    </button>
                                  ) : isNeedsRevision ? (
                                    /* Needs Revision: Provide Mark Approved or Edit Feedback */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveDocument(doc)}
                                        className="btn btn-xs h-7.5 px-3 text-xs font-semibold gap-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs transition-all"
                                        title="Mark this revised document as Approved"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        <span>Mark Approved</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRevisionModal(doc)}
                                        className="btn btn-xs h-7.5 px-2.5 text-xs font-medium text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg gap-1.5 transition-all"
                                        title="Edit revision instructions"
                                      >
                                        <FileEditIcon className="h-3.5 w-3.5 text-brand-600" />
                                        <span>Edit Notes</span>
                                      </button>
                                    </>
                                  ) : (
                                    /* Pending Review: Primary Decision Buttons */
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveDocument(doc)}
                                        className="btn btn-xs h-7.5 px-3 text-xs font-semibold gap-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs transition-all"
                                        title="Approve this evidence document"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRevisionModal(doc)}
                                        className="btn btn-xs h-7.5 px-3 text-xs font-semibold gap-1.5 bg-brand-50 text-brand-800 hover:bg-brand-600 hover:text-white border border-brand-300 rounded-lg shadow-2xs transition-all"
                                        title="Request revision with feedback remarks"
                                      >
                                        <FileEditIcon className="h-3.5 w-3.5" />
                                        <span>Revise</span>
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
                              <FileRowAction icon={DownloadIcon} label={`Download ${doc.title}`} onClick={() => handleDownloadDoc(doc)} />
                              <FileRowAction icon={Trash2Icon} label={`Delete ${doc.title}`} danger onClick={() => handleRemoveDoc(doc)} />
                              </>
                            }
                          >
                            {isOfficialArea && isNeedsRevision && doc.revisionNotes && (
                              <div className="flex items-start gap-2.5 rounded-r-lg border-l-4 border-brand-500 bg-brand-50/70 p-2.5 text-xs text-brand-900">
                                <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                                <div className="min-w-0">
                                  <span className="font-bold text-brand-950">Revision Feedback: </span>
                                  <span className="text-brand-900">{doc.revisionNotes}</span>
                            </div>
                          </div>
                            )}
                          </FileRow>
                        );
                      })}
                    </FileList>
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
                      {framework.label} Evidence Folders Repository (Custom)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                      <Building2Icon className="h-3 w-3 text-brand-600" />
                      <span>{campusName}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-subtle mt-0.5">
                    Custom evidence folders and portfolios strictly isolated to {campusName}. Folders can be uploaded directly to specific {framework.label} {areaRangeLabel}.
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
                <div className="rounded-2xl border-2 border-dashed border-line bg-gradient-to-b from-white to-canvas p-10 text-center space-y-2">
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
                    <FolderCard
                      key={folder.id}
                      onOpen={() => {
                        setActiveFolderId(folder.id);
                        setRepoFilter('all');
                        setSearchQuery('');
                      }}
                      title={folder.description || 'Open this folder'}
                      eyebrow={folderDeadlineText(folder)}
                      name={folder.name}
                      meta={`${pluralize(docCount, 'file')}${subCount > 0 ? ` · ${pluralize(subCount, 'subfolder')}` : ''}`}
                      status={FOLDER_STATUS[getFolderApprovalStatus(folder).status]}
                      actions={
                        <>
                          <FolderAction
                            icon={Share2Icon}
                            label={`Move into an official ${framework.label} ${framework.areaNoun}`}
                            onClick={() => setUploadingCustomFolder(folder)}
                          />
                          <FolderAction
                            icon={UploadIcon}
                            label="Upload into folder"
                            onClick={() => {
                              setIsTopUploadSource(false);
                              setSelectedTargetFolder(folder.id);
                              setUploadModalOpen(true);
                            }}
                          />
                          <FolderAction
                            icon={PencilIcon}
                            label="Rename folder"
                            onClick={() => {
                              setEditingFolder(folder);
                              setFolderFormOpen(true);
                            }}
                          />
                        </>
                      }
                    />
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
                        ? 'bg-brand-600 text-white shadow-xs'
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
                        ? 'bg-brand-600 text-white shadow-xs'
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
                <div className="rounded-2xl border-2 border-dashed border-line bg-gradient-to-b from-white to-canvas p-10 text-center">
                  <FolderOpenIcon className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-brand-50 p-2.5 text-brand-500 ring-1 ring-brand-100" />
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
                        <FolderCard
                          key={sub.id}
                          onOpen={() => {
                            setActiveFolderId(sub.id);
                            setSearchQuery('');
                          }}
                          title={sub.description || 'Open this subfolder'}
                          eyebrow={folderDeadlineText(sub)}
                          name={sub.name}
                          meta={pluralize(count, 'file')}
                          status={FOLDER_STATUS[getFolderApprovalStatus(sub).status]}
                          actions={
                            <FolderAction
                              icon={PencilIcon}
                              label="Rename / edit subfolder"
                              onClick={() => {
                                setEditingFolder(sub);
                                setFolderFormParentId(activeFolderId || undefined);
                                setFolderFormAreaId(selectedAreaCode?.toLowerCase());
                                setFolderFormOpen(true);
                              }}
                            />
                          }
                        />
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

                  <FileList>
                      {insideFiles.map((doc) => (
                      <FileRow
                          key={doc.id}
                        name={doc.title}
                        fileType={doc.fileType}
                        onOpen={() => setPreviewDoc(doc)}
                        meta={fileMeta(doc)}
                        actions={
                          <>
                            <FileRowAction icon={EyeIcon} label={`Preview ${doc.title}`} onClick={() => setPreviewDoc(doc)} />
                            <FileRowAction icon={DownloadIcon} label={`Download ${doc.title}`} onClick={() => handleDownloadDoc(doc)} />
                            <FileRowAction icon={Trash2Icon} label={`Delete ${doc.title}`} danger onClick={() => handleRemoveDoc(doc)} />
                          </>
                        }
                      />
                    ))}
                  </FileList>
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
          title={"Transfer Custom Folder to " + framework.areaNoun}
          description={"Transfer folder and attached documents to an official " + framework.fullName + " " + framework.areaNoun + " in " + campusName + "."}
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
                  Confirm Transfer to {framework.areaNoun} {OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaForCustomFolder)?.number || 1}
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 border border-brand-200 shrink-0">
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
                  Select Target {framework.label} {framework.areaNoun} ({areaRangeLabel})
                </label>
                <span className="text-[10px] text-slate-400 font-normal">
                  Folder will move into this {framework.areaNoun}
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
                            {areaLabel(a)}
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
                  {framework.areaNoun} {OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaForCustomFolder)?.number}: {OFFICIAL_IA_AREAS.find((a) => a.code === targetAreaForCustomFolder)?.name}
                </span>
                <ChevronRightIcon className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-brand-700">{uploadingCustomFolder.name}</span>
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
              ? 'Upload into ' + areaLabel(currentArea) + ': ' + currentArea.name
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
                        ? 'Upload to ' + areaLabel(topUploadTargetAreaObj) + (topUploadTargetFolderObj ? ' / ' + topUploadTargetFolderObj.name : '')
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
                      {framework.label} {framework.areaNoun}
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
                      className="input select select-sm h-9 w-full text-xs font-medium hover:border-brand-300"
                    >
                      {OFFICIAL_IA_AREAS.map((a) => {
                        const count = iaFolders.filter((f) => (f.areaId || '').toLowerCase() === a.code.toLowerCase()).length;
                        return (
                          <option key={a.code} value={a.code}>
                            {areaLabel(a)}: {a.name} ({count} {count === 1 ? 'folder' : 'folders'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Target Folder */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Folder in {areaLabel(topUploadTargetAreaObj)}
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">Optional hierarchy</span>
                    </div>
                    <select
                      value={topUploadTargetFolderId}
                      onChange={(e) => setTopUploadTargetFolderId(e.target.value)}
                      className="input select select-sm h-9 w-full text-xs font-medium hover:border-brand-300"
                    >
                      <option value="">
                        {foldersInTopUploadArea.length === 0
                          ? framework.areaNoun + ' Root (Default Portfolio)'
                          : framework.areaNoun + ' Root (Directly in ' + framework.areaNoun + ')'}
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
                      {areaLabel(topUploadTargetAreaObj)}: {topUploadTargetAreaObj.name}
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
                    {currentArea && <span className="text-brand-700 font-normal"> ({areaLabel(currentArea)})</span>}
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
                    <span className="text-slate-500 font-medium">Destination {framework.areaNoun}: </span>
                    <strong className="font-bold text-slate-900">{areaLabel(currentArea)}: {currentArea.name}</strong>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                  {campusName}
                </span>
              </div>
            ) : null}

            {/* MODERN SEGMENTED CONTROL: 3 MODES */}
            <div className={'rounded-xl border border-slate-200 bg-slate-100/90 p-1 grid gap-1 text-xs ' + (
              framework.customFolders && (isTopUploadSource || selectedAreaCode) ? 'grid-cols-3' : 'grid-cols-2'
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
                <FolderArchiveIcon className="h-4 w-4 shrink-0 text-brand-600" />
                <span>Entire Folder</span>
              </button>

              {/* In Area mode or Top Upload mode: option to upload a folder from Custom Folders */}
              {framework.customFolders && (isTopUploadSource || selectedAreaCode) && (
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
                  <FolderIcon className="h-4 w-4 shrink-0 text-brand-600" />
                  <span>Custom Folder</span>
                </button>
              )}
            </div>

            {/* TAB 1 & 2: INDIVIDUAL FILES & ENTIRE FOLDER VIEW */}
            {uploadMode !== 'from-custom' ? (
              <>
                {/* Optional folder selector when at Area root with multiple folders (contextual modal) */}
                {!isTopUploadSource && selectedAreaCode && !modalTargetFolder && areaFolders.length > 0 && uploadMode === 'files' && (
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Target Evidence Folder in {framework.areaNoun} {currentArea?.number}:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Choose destination</span>
                    </label>
                    <select
                      value={selectedTargetFolder || areaFolders[0]?.id || ''}
                      onChange={(e) => setSelectedTargetFolder(e.target.value)}
                      className="input select h-9 w-full text-xs hover:border-brand-300"
                    >
                      {areaFolders.map((af) => (
                        <option key={af.id} value={af.id}>
                          {af.name} ({getFolderDocCount(af)} files)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <UploadDropzone
                  key={uploadMode}
                  onFiles={handleStageUploads}
                  selectFolder={uploadMode === 'folder'}
                  allowFolders
                  title={uploadMode === 'folder' ? 'Drag a folder here' : 'Drag & drop files here'}
                  hint={
                    uploadMode === 'folder'
                      ? 'Keeps the folder structure and indexes every document inside it.'
                      : undefined
                  }
                />

                <StagedFileList
                  items={uploadedFileList}
                  onRemove={(idx) => setUploadedFileList((prev) => prev.filter((_, i) => i !== idx))}
                  onClear={() => setUploadedFileList([])}
                />
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
                          ? '"' + topUploadTargetFolderObj.name + '" in ' + areaLabel(topUploadTargetAreaObj)
                          : areaLabel(topUploadTargetAreaObj) + ': ' + topUploadTargetAreaObj.name
                        : currentActiveFolder
                        ? '"' + currentActiveFolder.name + '"'
                        : currentArea
                        ? areaLabel(currentArea)
                        : 'this ' + framework.areaNoun}
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 border border-brand-200/60 shrink-0">
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
        frameworkId={framework.id}
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
            frameworkId: framework.id,
            category: assignedAreaId ? framework.category : 'General / Custom',
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
                disabled={isSubmittingRevision || (requireRevisionNote && !revisionRemarks.trim())}
                className="btn btn-primary w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs bg-brand-600 hover:bg-brand-700 border-brand-600 text-white disabled:opacity-50"
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
                className="textarea text-xs w-full bg-white border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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
