import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import {
  CampusId,
  ISOComplianceStatus,
  ISOCorrectiveAction,
  ISOSurveillanceRecord
} from '../../types/accreditation';
import {
  EvidenceDocument,
  EvidenceFolder,
  ISODocumentStage,
  DocumentType,
  FolderColor
} from '../../types/evidence';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { FolderFormModal } from '../../components/folders/FolderFormModal';
import { DeleteFolderModal } from '../../components/folders/DeleteFolderModal';
import { persistUpload, downloadStoredFile } from '../../utils/fileStore';
import { fileTypeFromName } from '../../utils/fileTypes';
import { filesFromDrop, filesFromInput, PendingUpload } from '../../utils/dropFiles';
import { CertificateFoldersModal, CertificateLevel } from '../../components/accreditation/CertificateFoldersModal';
import { OfficialCertificatesStrip, useCampusCertificates } from '../../components/accreditation/OfficialCertificatesStrip';
import { formatDate } from '../../utils/format';
import {
  ShieldCheckIcon,
  UserCheckIcon,
  PencilIcon,
  HistoryIcon,
  FileTextIcon,
  LayersIcon,
  EyeIcon,
  CloudUploadIcon,
  FolderPlusIcon,
  FolderIcon,
  FolderOpenIcon,
  Trash2Icon,
  DownloadIcon,
  XIcon,
  FolderUpIcon,
  FileUpIcon,
  SearchIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  AwardIcon
} from 'lucide-react';
import { useInstitutionalMutationAccess } from '../../hooks/useInstitutionalMutationAccess';

const ISO_CERTIFICATE_LEVELS: CertificateLevel[] = [
  { code: 'ISO 9001:2015 Certified', label: 'ISO 9001:2015' },
  { code: '1st Surveillance Compliant', label: '1st Surveillance' },
  { code: '2nd Surveillance Compliant', label: '2nd Surveillance' },
  { code: 'Recertification Audit Certified', label: 'Recertification' },
  { code: 'Compliant', label: 'Compliant' }
];

function readableDate(value?: string): string {
  if (!value) return '—';
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

const DEFAULT_ISO_TITLE = 'ISO 9001:2015 Quality Management Framework';
const DEFAULT_ISO_DESCRIPTION =
  'Campus-level quality management system monitoring, surveillance audits, Corrective Action Request (CAR) tracking, and auditor sign-off.';

const DEFAULT_ISO_FOLDERS: Omit<EvidenceFolder, 'createdAt'>[] = [
  {
    id: 'folder-iso-qm',
    name: 'Quality Manual & Mandated Procedures',
    code: 'QM',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Documented ISO 9001:2015 quality manual, quality policy, and core institutional standard operating procedures.',
    isSystem: false,
    color: 'indigo',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c4',
    name: 'Clause 4: Context of the Organization',
    code: 'C4',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Internal & external issues, stakeholder requirements, and institutional QMS scope boundaries.',
    isSystem: false,
    color: 'blue',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c5',
    name: 'Clause 5: Leadership & Governance',
    code: 'C5',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Management commitment, quality policy, university organizational roles, and responsibilities.',
    isSystem: false,
    color: 'purple',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c6',
    name: 'Clause 6: Planning & Risk Management',
    code: 'C6',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Campus risk and opportunity registers, institutional quality objectives, and plans to achieve them.',
    isSystem: false,
    color: 'amber',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c7',
    name: 'Clause 7: Support & Resources',
    code: 'C7',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Personnel competence, training records, infrastructure, monitoring resources, and documented information.',
    isSystem: false,
    color: 'cyan',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c8',
    name: 'Clause 8: Operation & Service Delivery',
    code: 'C8',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Operational planning, curriculum delivery, student admission, research, extension, and control of externally provided processes.',
    isSystem: false,
    color: 'emerald',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c9',
    name: 'Clause 9: Performance Evaluation & IQA',
    code: 'C9',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Customer satisfaction surveys, Internal Quality Audit (IQA) reports, and Management Review minutes.',
    isSystem: false,
    color: 'rose',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c10',
    name: 'Clause 10: Continual Improvement',
    code: 'C10',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'Nonconformity handling, corrective action implementation, and continual improvement initiatives.',
    isSystem: false,
    color: 'slate',
    parentId: 'folder-iso'
  }
];

const FOLDER_COLOR_MAP: Record<FolderColor, { bg: string; text: string; border: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-50/70', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800' },
  blue: { bg: 'bg-blue-50/70', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  purple: { bg: 'bg-purple-50/70', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' },
  emerald: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  amber: { bg: 'bg-amber-50/70', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  rose: { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' },
  cyan: { bg: 'bg-cyan-50/70', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800' },
  slate: { bg: 'bg-slate-50/70', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800' }
};

export function CampusISOView() {
  const {
    campuses,
    isoRecords,
    saveISOSurveillanceRecord,
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    folders,
    saveFolder,
    deleteFolder,
    currentUser,
    selectedCampus,
    setSelectedCampus
  } = usePortal();

  const { canMutate } = useInstitutionalMutationAccess();

  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>(() => {
    return selectedCampus !== 'all' ? selectedCampus : 'tandag';
  });
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedStageFilter, setSelectedStageFilter] = useState<'All' | '1st Surveillance' | '2nd Surveillance' | 'Recertification'>('All');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [isFolderSectionOpen, setIsFolderSectionOpen] = useState(true);

  // Auto-sync campus selection
  useEffect(() => {
    if (selectedCampus !== 'all' && selectedCampus !== selectedCampusId) {
      setSelectedCampusId(selectedCampus);
      setSelectedRecordId(null);
    }
  }, [selectedCampus, selectedCampusId]);

  const campus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];
  const campusRecords = isoRecords.filter((r) => r.campusId === selectedCampusId);
  const activeRecord = campusRecords.find((r) => !r.isHistorical) || campusRecords[0];
  const isoRecord = campusRecords.find((r) => r.id === selectedRecordId) || activeRecord || isoRecords[0];

  const certAreaKey = `cert-iso-${selectedCampusId}`;
  const { certificates, activeCertificate, activeLevel, levelCount } = useCampusCertificates('iso', certAreaKey);
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<EvidenceDocument | null>(null);

  const handleSelectCampus = (cid: CampusId) => {
    setSelectedCampusId(cid);
    setSelectedRecordId(null);
    setSelectedCampus(cid);
  };

  // Auto-seed default ISO folders if no ISO subfolders exist
  useEffect(() => {
    const currentIsoFolders = folders.filter((f) => f.frameworkId === 'iso' && f.id !== 'folder-iso');
    if (currentIsoFolders.length === 0) {
      DEFAULT_ISO_FOLDERS.forEach((df) => {
        saveFolder({
          ...df,
          createdAt: new Date().toISOString().slice(0, 10),
          campusId: selectedCampusId,
          campus: campus.name
        });
      });
    }
  }, [folders, saveFolder, selectedCampusId, campus.name]);

  const openCars = (isoRecord.correctiveActions || []).filter((c) => c.status !== 'Closed / Verified');

  // ==========================================
  // Upload File / Folder Modal State
  // ==========================================
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'files' | 'folder'>('files');
  const [stagedFiles, setStagedFiles] = useState<{ file: File; path: string; name: string; sizeMb: number }[]>([]);
  const [uploadFolderChoice, setUploadFolderChoice] = useState<'existing' | 'new'>('existing');
  const [uploadSelectedFolderId, setUploadSelectedFolderId] = useState<string>('folder-iso-qm');
  const [uploadNewFolderName, setUploadNewFolderName] = useState('');
  const [uploadStage, setUploadStage] = useState<ISODocumentStage>('1st Surveillance');
  const [uploadDocType, setUploadDocType] = useState<DocumentType>('Report');
  const [uploadOffice, setUploadOffice] = useState('Quality Management System Office');
  const [uploadAcademicYear, setUploadAcademicYear] = useState('2024–2025');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Configure directory attributes on folder input
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, [uploadTab]);

  const handleStageUploads = (uploads: PendingUpload[]) => {
    if (!uploads.length) return;
    const items = uploads.map((u) => ({
      file: u.file,
      path: u.path,
      name: u.file.name,
      sizeMb: parseFloat((u.file.size / (1024 * 1024)).toFixed(2)) || 0.01
    }));

    setStagedFiles((prev) => [...prev, ...items]);

    // Check if any file came from a directory path (e.g. "Quality Procedures/sop.pdf")
    const itemWithPath = items.find((i) => i.path.includes('/'));
    if (itemWithPath) {
      const detectedName = itemWithPath.path.split('/')[0];
      if (detectedName) {
        setUploadFolderChoice('new');
        setUploadNewFolderName(detectedName);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = filesFromInput(e.target.files);
    handleStageUploads(files);
    if (e.target) e.target.value = '';
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = filesFromInput(e.target.files);
    handleStageUploads(files);
    if (e.target) e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const uploads = await filesFromDrop(e, true);
    if (uploads.length) {
      handleStageUploads(uploads);
    }
  };

  const removeStagedFile = (idx: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExecuteUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutate) return;
    if (stagedFiles.length === 0) {
      toast.error('Please select or drop at least one file or folder to upload');
      return;
    }

    setIsUploading(true);
    try {
      let targetFolderId = uploadSelectedFolderId;

      // If user chose to create a new folder
      if (uploadFolderChoice === 'new' && uploadNewFolderName.trim()) {
        const folderName = uploadNewFolderName.trim();
        const code = (folderName.slice(0, 4) || 'ISO').toUpperCase();
        const newFolderId = `folder-iso-${Date.now()}`;
        const newFolder: EvidenceFolder = {
          id: newFolderId,
          name: folderName,
          code,
          frameworkId: 'iso',
          category: 'Quality Management',
          description: `ISO surveillance evidence folder for ${campus.name}`,
          color: 'indigo',
          createdAt: new Date().toISOString().slice(0, 10),
          campusId: selectedCampusId,
          campus: campus.name,
          parentId: 'folder-iso'
        };
        saveFolder(newFolder);
        targetFolderId = newFolderId;
      }

      // Upload each staged file
      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        const docId = `doc-iso-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

        // Save binary blob to IndexedDB
        persistUpload(docId, item.file, item.file.name);

        const newDoc: EvidenceDocument = {
          id: docId,
          title: item.name,
          description: uploadDescription.trim() || `ISO surveillance documentation (${uploadStage}) for ${campus.name}.`,
          keywords: ['ISO 9001', 'Surveillance', uploadStage, campus.shortName],
          frameworkId: 'iso',
          areaId: 'qa',
          criterionId: 'c-iso-9',
          indicatorId: 'ind-iso-surveillance',
          docType: uploadDocType,
          isoStage: uploadStage,
          academicYear: uploadAcademicYear.trim() || '2024–2025',
          cycle: isoRecord.cycle,
          program: 'Institutional Quality System',
          college: 'Administration',
          department: 'Quality Assurance Office',
          office: uploadOffice.trim() || 'Quality Management System Office',
          campus: campus.name,
          campusId: selectedCampusId,
          documentDate: new Date().toISOString().slice(0, 10),
          confidentiality: 'Internal',
          status: 'Indexed',
          dateAdded: new Date().toISOString().slice(0, 10),
          fileType: fileTypeFromName(item.file.name),
          pages: Math.max(1, Math.ceil(item.file.size / (150 * 1024))),
          sizeMb: parseFloat((item.file.size / (1024 * 1024)).toFixed(2)) || 0.1,
          uploadedBy: currentUser.name || 'QA Officer',
          passages: [`Uploaded evidence for ${uploadStage} under ISO 9001:2015 surveillance audit at ${campus.name}.`],
          folderId: targetFolderId,
          approvalStatus: 'Approved'
        };

        addDocument(newDoc);
      }

      toast.success(`Successfully uploaded ${stagedFiles.length} file${stagedFiles.length === 1 ? '' : 's'} to ISO evidence repository`);
      setStagedFiles([]);
      setUploadModalOpen(false);
      setUploadNewFolderName('');
      setUploadDescription('');
      if (targetFolderId) {
        setSelectedFolderId(targetFolderId);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================
  // 3. Document Edit, View, and Delete State
  // ==========================================
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<EvidenceDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<EvidenceDocument | null>(null);

  const [editDocForm, setEditDocForm] = useState({
    title: '',
    isoStage: '1st Surveillance' as ISODocumentStage,
    folderId: '',
    docType: 'Report' as DocumentType,
    office: '',
    academicYear: '',
    description: ''
  });

  const handleOpenEditDoc = (doc: EvidenceDocument) => {
    setEditingDoc(doc);
    setEditDocForm({
      title: doc.title,
      isoStage: (doc.isoStage === 'For Surveillance' ? '1st Surveillance' : doc.isoStage) || '1st Surveillance',
      folderId: doc.folderId || 'folder-iso-qm',
      docType: doc.docType || 'Report',
      office: doc.office || 'Quality Management System Office',
      academicYear: doc.academicYear || '2024–2025',
      description: doc.description || ''
    });
  };

  const handleSaveEditDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutate || !editingDoc) return;
    if (!editDocForm.title.trim()) {
      toast.error('Document title is required');
      return;
    }
    updateDocument(editingDoc.id, {
      title: editDocForm.title.trim(),
      isoStage: editDocForm.isoStage,
      folderId: editDocForm.folderId,
      docType: editDocForm.docType,
      office: editDocForm.office.trim(),
      academicYear: editDocForm.academicYear.trim(),
      description: editDocForm.description.trim()
    });
    toast.success(`Document "${editDocForm.title.trim()}" updated successfully`);
    setEditingDoc(null);
  };

  // ==========================================
  // 4. Folder Creation, Editing, Deletion State
  // ==========================================
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<EvidenceFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<EvidenceFolder | null>(null);

  // ISO Folders collection
  const isoFolders = folders.filter(
    (f) =>
      f.id === 'folder-iso' ||
      f.frameworkId === 'iso' ||
      f.category === 'Quality Management' ||
      f.parentId === 'folder-iso'
  );

  // ISO Documents filtering
  const isoDocuments = documents.filter((d) => {
    const isIso = d.frameworkId === 'iso' || (d.keywords && d.keywords.some((t) => t.toLowerCase().includes('iso')));
    const isCampus = !d.campusId || d.campusId === selectedCampusId || (selectedCampus as string) === 'all';
    return isIso && isCampus;
  });

  const filteredIsoDocs = isoDocuments.filter((doc) => {
    if (selectedStageFilter !== 'All') {
      const docStage = doc.isoStage === 'For Surveillance' ? '1st Surveillance' : doc.isoStage;
      if (docStage !== selectedStageFilter) return false;
    }
    if (selectedFolderId && doc.folderId !== selectedFolderId) return false;
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      const matchOffice = doc.office?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchOffice) return false;
    }
    return true;
  });

  const activeFolder = isoFolders.find((f) => f.id === selectedFolderId);

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            Accreditation & Frameworks / Quality Management
          </span>
        }
        title={DEFAULT_ISO_TITLE}
        description={DEFAULT_ISO_DESCRIPTION}
      />

      {/* Campus Selector Pills */}
      <div className="mb-6 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = isoRecords.find((r) => r.campusId === c.id && !r.isHistorical) || isoRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
          const openCarCount = (rec?.correctiveActions || []).filter((x) => x.status !== 'Closed / Verified').length;
          return (
            <button
              key={c.id}
              onClick={() => handleSelectCampus(c.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition-all ${isSelected
                ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-1 ring-brand-500'
                : 'border-line bg-white hover:bg-canvas'
                }`}
            >
              <ShieldCheckIcon className={`h-4 w-4 ${isSelected ? 'text-brand-700' : 'text-ink-subtle'}`} />
              <div>
                <p className={`text-xs font-semibold ${isSelected ? 'text-brand-900' : 'text-ink'}`}>
                  {c.shortName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span>{rec?.complianceStatus || 'Compliant'}</span>
                  {openCarCount > 0 && (
                    <span className="rounded bg-danger-100 px-1 font-bold text-danger-700 text-[10px]">
                      {openCarCount} CAR
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Historical Audit Cycle & Standard Selector */}
      {campusRecords.length > 1 && (
        <div className="mb-6 rounded-lg border border-line bg-canvas/60 p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <LayersIcon className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                ISO Standards & Surveillance Cycles ({campus.shortName})
              </span>
            </div>
            <span className="text-[11px] text-ink-muted">
              All previous ISO standards and records are preserved permanently for historical reference.
            </span>
          </div>

          <div className="mt-3 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2">
            {campusRecords.map((rec) => {
              const isCurrent = rec.id === isoRecord.id;
              const isHistorical = !!rec.isHistorical;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all ${isCurrent
                    ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900 shadow-xs ring-1 ring-brand-500'
                    : 'border-line bg-white text-ink hover:bg-canvas'
                    }`}
                >
                  {isHistorical ? (
                    <HistoryIcon className="h-3.5 w-3.5 text-brand-600" />
                  ) : (
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-brand-600" />
                  )}
                  <span>{rec.standardVersion || 'ISO 9001:2015'}</span>
                  <span className="text-ink-muted">·</span>
                  <span>{rec.cycle}</span>
                  {isHistorical ? (
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800">
                      Preserved
                    </span>
                  ) : (
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                      Active Cycle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preserved Historical Record Callout Banner */}
      {isoRecord.isHistorical && (
        <div className="mb-6 rounded-lg border border-brand-300 bg-brand-50/80 p-4 text-brand-900 shadow-sm flex items-start gap-3.5">
          <div className="rounded-md bg-brand-100 p-2 text-brand-700 shrink-0">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-brand-950">
                Preserved Historical ISO Standard & Audit Record
              </h4>
              <Badge tone="warning">Preserved · Read-Only</Badge>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-brand-200/60 text-brand-900">
                {isoRecord.standardVersion || 'ISO 9001:2015'}
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-800 leading-relaxed">
              Viewing preserved historical audit record for <strong>{campus.name}</strong> ({isoRecord.cycle}, audited on {isoRecord.auditDate}). As required by quality management policies, all previous ISO standards, surveillance evaluations, and compliance records are retained permanently for institutional accreditation and regulatory audits. Past records are never overwritten or deleted.
            </p>
            {activeRecord && activeRecord.id !== isoRecord.id && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(activeRecord.id)}
                  className="btn btn-secondary btn-sm text-xs bg-white text-ink border-brand-300 hover:bg-brand-100/50"
                >
                  Return to Active Audit Cycle ({activeRecord.cycle})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Surveillance Status Card (Uniform with PQA & Institutional Frameworks) */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel col-span-2 p-5 shadow-xs transition-shadow">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-ink">{campus.name}</h2>
                <Badge tone={
                  isoRecord.complianceStatus === 'Compliant' || isoRecord.complianceStatus === 'Certified'
                    ? 'success'
                    : isoRecord.complianceStatus === 'Minor Deficiencies'
                    ? 'warning'
                    : 'danger'
                }>
                  {isoRecord.complianceStatus}
                </Badge>
                {isoRecord.isHistorical && (
                  <Badge tone="warning">Preserved Record</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {campus.location} · ISO Surveillance Cycle: <strong className="text-ink">{isoRecord.cycle}</strong> · Lead Auditor: <strong className="text-ink">{isoRecord.leadAuditor || 'Dr. Evelyn P. Miranda'}</strong>
              </p>
              {isoRecord.scope && (
                <p className="mt-0.5 text-xs text-ink-muted">
                  Audit Scope: <span className="font-medium text-ink">{isoRecord.scope}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-ink-muted">Standard & Cycle</span>
              <p className="mt-0.5 text-sm font-semibold text-brand-700">
                {isoRecord.standardVersion || 'ISO 9001:2015'} · {isoRecord.cycle}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheckIcon,
                label: 'ISO Standard',
                value: isoRecord.standardVersion || 'ISO 9001:2015',
                tone: 'bg-brand-50 text-brand-600'
              },
              {
                icon: CalendarCheckIcon,
                label: 'Audit Date',
                value: readableDate(isoRecord.auditDate),
                tone: 'bg-brand-50 text-brand-600'
              },
              {
                icon: UserCheckIcon,
                label: 'Lead ISO Auditor',
                value: isoRecord.leadAuditor || 'Prof. Liza M. Cabrera',
                tone: 'bg-brand-50 text-brand-600'
              }
            ].map((info) => (
              <div key={info.label} className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/50 p-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${info.tone}`}>
                  <info.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-ink-subtle">{info.label}</p>
                  <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-ink">{info.value}</p>
                </div>
              </div>
            ))}
          </div>

          {isoRecord.summary && (
            <div className="mt-3 rounded-r-xl border-l-4 border-brand-400 bg-brand-50/40 px-3.5 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">LEAD AUDITOR SUMMARY</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{isoRecord.summary}</p>
            </div>
          )}

          <OfficialCertificatesStrip
            certificates={certificates}
            activeCertificate={activeCertificate}
            activeLevel={activeLevel}
            levelCount={levelCount}
            isAdmin={canMutate}
            onOpen={() => setCertificatesOpen(true)}
            onPreview={setPreviewCertificate}
          />
        </div>

        {/* Findings Counter */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Surveillance Findings Distribution
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-2 text-xs xs:grid-cols-2">
              <div className="rounded border border-success-200 bg-success-50/50 p-2.5">
                <span className="text-success-800 font-medium">Conformances</span>
                <p className="font-bold text-success-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.conformances || 14}
                </p>
              </div>
              <div className="rounded border border-brand-200 bg-brand-50/50 p-2.5">
                <span className="text-brand-800 font-medium">OFI (Opportunities)</span>
                <p className="font-bold text-brand-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.ofi || 2}
                </p>
              </div>
              <div className="rounded border border-warning-200 bg-warning-50/50 p-2.5">
                <span className="text-warning-800 font-medium">Minor NC</span>
                <p className="font-bold text-warning-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.minorNC || 0}
                </p>
              </div>
              <div className="rounded border border-danger-200 bg-danger-50/50 p-2.5">
                <span className="text-danger-800 font-medium">Major NC (CAR)</span>
                <p className="font-bold text-danger-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.majorNC || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3 flex items-center justify-between text-xs">
            <span className="text-ink-muted">Active Non-conformances:</span>
            <span className={`font-bold ${openCars.length > 0 ? 'text-danger-700' : 'text-success-700'}`}>
              {openCars.length === 0 ? '0 (All Closed)' : `${openCars.length} Pending Action`}
            </span>
          </div>
        </div>
      </div>

      {/* ISO Management Documents & Surveillance Evidence Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold text-ink">ISO Management Documents & Surveillance Evidence</h3>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Quality manuals, surveillance evidence, and compliance portfolios categorized by ISO audit stages and clause folders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canMutate && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setIsFolderModalOpen(true);
                  }}
                  className="btn btn-secondary btn-sm text-xs gap-1.5"
                >
                  <FolderPlusIcon className="h-3.5 w-3.5 text-brand-600" /> + New ISO Folder
                </button>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="btn btn-primary btn-sm text-xs gap-1.5"
                >
                  <CloudUploadIcon className="h-3.5 w-3.5" /> Upload File / Folder
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Stage Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', '1st Surveillance', '2nd Surveillance', 'Recertification'] as const).map((stage) => {
              const count = stage === 'All'
                ? isoDocuments.length
                : isoDocuments.filter((d) => {
                    const docStage = d.isoStage === 'For Surveillance' ? '1st Surveillance' : d.isoStage;
                    return docStage === stage;
                  }).length;
              const isActive = selectedStageFilter === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setSelectedStageFilter(stage)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'border border-line bg-white text-ink hover:bg-canvas'
                    }`}
                >
                  {stage} <span className={`ml-1 text-[11px] ${isActive ? 'text-brand-100' : 'text-ink-muted'}`}>({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[220px]">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-subtle" />
            <input
              type="text"
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              placeholder="Search ISO evidence..."
              className="input pl-8 py-1 text-xs w-full"
            />
            {docSearchQuery && (
              <button
                type="button"
                onClick={() => setDocSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ISO Evidence Folders Grid (Collapsible) */}
        <div className="rounded-lg border border-line bg-canvas/40 p-3.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsFolderSectionOpen((prev) => !prev)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink hover:text-brand-700"
            >
              <FolderIcon className="h-4 w-4 text-brand-600" />
              <span>Evidence Folders & Clause Portfolios ({isoFolders.length})</span>
              {isFolderSectionOpen ? (
                <ChevronDownIcon className="h-3.5 w-3.5 text-ink-muted" />
              ) : (
                <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
              )}
            </button>

            {selectedFolderId && (
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className="text-xs font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
              >
                <XIcon className="h-3 w-3" /> Clear Folder Filter
              </button>
            )}
          </div>

          {isFolderSectionOpen && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {isoFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                const folderDocCount = documents.filter((d) => d.folderId === folder.id).length;
                const theme = FOLDER_COLOR_MAP[folder.color] || FOLDER_COLOR_MAP.indigo;

                return (
                  <div
                    key={folder.id}
                    className={`group relative rounded-lg border p-3 transition-all cursor-pointer ${isSelected
                      ? 'border-brand-500 bg-brand-50/80 shadow-xs ring-2 ring-brand-500/30'
                      : 'border-line bg-white hover:border-brand-300 hover:bg-canvas/60'
                      }`}
                    onClick={() => setSelectedFolderId(isSelected ? null : folder.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`rounded-md p-1.5 shrink-0 ${theme.bg} ${theme.text}`}>
                          {isSelected ? (
                            <FolderOpenIcon className="h-4 w-4" />
                          ) : (
                            <FolderIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-brand-950 font-bold' : 'text-ink'}`}>
                            {folder.name}
                          </p>
                          <span className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded mt-0.5 ${theme.badge}`}>
                            {folder.code || 'ISO'}
                          </span>
                        </div>
                      </div>

                      <span className="rounded bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-ink-muted border border-line shrink-0">
                        {folderDocCount}
                      </span>
                    </div>

                    {/* Folder Quick Actions */}
                    {canMutate && !folder.isSystem && (
                      <div
                        className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolder(folder);
                            setIsFolderModalOpen(true);
                          }}
                          className="rounded p-1 text-ink-subtle hover:text-brand-700 hover:bg-brand-50 text-[11px]"
                          title="Edit Folder"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingFolder(folder)}
                          className="rounded p-1 text-ink-subtle hover:text-danger-700 hover:bg-danger-50 text-[11px]"
                          title="Delete Folder"
                        >
                          <Trash2Icon className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Folder Filter Banner */}
        {activeFolder && (
          <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50/70 px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <FolderOpenIcon className="h-4 w-4 text-brand-600" />
              <span className="text-ink-muted">Filtering by folder:</span>
              <strong className="text-brand-950">{activeFolder.name}</strong>
              <span className="rounded bg-brand-200/60 px-1.5 py-0.5 text-[11px] font-bold text-brand-800">
                {filteredIsoDocs.length} document{filteredIsoDocs.length === 1 ? '' : 's'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline flex items-center gap-1"
            >
              <XIcon className="h-3.5 w-3.5" /> Show All Folders
            </button>
          </div>
        )}

        {/* Documents Table / Grid */}
        {filteredIsoDocs.length === 0 ? (
          <div className="panel p-8 text-center text-xs text-ink-muted">
            <FileTextIcon className="mx-auto h-8 w-8 text-ink-subtle mb-2" />
            <p className="font-semibold text-ink">No ISO documents found</p>
            <p className="mt-1">
              {selectedFolderId
                ? 'There are no documents in this folder yet. Click "Upload File / Folder" to add evidence.'
                : 'No evidence documents match your selected filters. Try choosing a different stage or search term.'}
            </p>
            {canMutate && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="btn btn-primary btn-sm text-xs gap-1.5"
                >
                  <CloudUploadIcon className="h-3.5 w-3.5" /> Upload ISO Evidence
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="panel divide-y divide-line overflow-hidden shadow-xs">
            {filteredIsoDocs.map((doc) => {
              const docFolder = folders.find((f) => f.id === doc.folderId);
              return (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-canvas/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="font-semibold text-xs text-ink hover:text-brand-700 text-left cursor-pointer flex items-center gap-1.5 group"
                        title="Click to view and preview document"
                      >
                        <FileTextIcon className="h-3.5 w-3.5 text-brand-600 group-hover:text-brand-700 shrink-0" />
                        <span className="group-hover:underline">{doc.title}</span>
                      </button>

                      {doc.isoStage && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border bg-brand-50 text-brand-700 border-brand-200">
                          {doc.isoStage === 'For Surveillance' ? '1st Surveillance' : doc.isoStage}
                        </span>
                      )}

                      {docFolder && (
                        <span className="inline-flex items-center gap-1 rounded bg-canvas px-1.5 py-0.5 text-[11px] text-ink-muted border border-line">
                          <FolderIcon className="h-3 w-3 text-ink-subtle" />
                          {docFolder.name}
                        </span>
                      )}

                      <span className="rounded bg-canvas px-1.5 py-0.5 text-[11px] text-ink-muted border border-line">
                        {doc.fileType} · {doc.pages} p · {doc.sizeMb} MB
                      </span>
                    </div>

                    <p className="text-xs text-ink-muted mt-1 line-clamp-1">{doc.description}</p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ink-subtle">
                      <span>Office: {doc.office}</span>
                      <span>·</span>
                      <span>AY: {doc.academicYear}</span>
                      <span>·</span>
                      <span>Date: {doc.documentDate}</span>
                    </div>
                  </div>

                  {/* Actions: View, Edit, Download, Delete */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="btn btn-secondary btn-sm text-xs gap-1.5"
                      title="View & Preview Document"
                    >
                      <EyeIcon className="h-3.5 w-3.5 text-brand-600" /> View Document
                    </button>

                    {canMutate && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditDoc(doc)}
                        className="btn btn-ghost btn-sm text-xs p-1.5 text-ink-muted hover:text-brand-700"
                        title="Edit Document Information"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        const downloaded = await downloadStoredFile(doc.id, doc.title);
                        if (!downloaded) {
                          toast.error(`No stored binary file found for ${doc.title}`);
                        } else {
                          toast.success(`Downloaded ${doc.title}`);
                        }
                      }}
                      className="btn btn-ghost btn-sm text-xs p-1.5 text-ink-muted hover:text-brand-700"
                      title="Download File"
                    >
                      <DownloadIcon className="h-3.5 w-3.5" />
                    </button>

                    {canMutate && (
                      <button
                        type="button"
                        onClick={() => setDeletingDoc(doc)}
                        className="btn btn-ghost btn-sm text-xs p-1.5 text-ink-muted hover:text-danger-700"
                        title="Delete Document"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-md border border-line bg-canvas p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-ink-muted">
          <span>
            <strong className="text-ink">Historical Document Retention:</strong> In accordance with ISO QMS standard requirements, all evidence documents across current and superseded standards are permanently preserved and safeguarded against accidental deletion.
          </span>
          <span className="text-[11px] font-semibold text-brand-700 shrink-0">ISO 9001:2015 Clause 7.5.3 Compliant</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Upload File(s) / Folder Modal */}
      {uploadModalOpen && (
        <Modal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title={`Upload ISO Evidence · ${campus.name}`}
          description="Upload files or entire folders into ISO evidence portfolios with automatic stage tagging and original file persistence."
          size="lg"
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setUploadModalOpen(false);
                  setStagedFiles([]);
                }}
                className="btn btn-secondary w-full sm:w-auto"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={stagedFiles.length === 0 || isUploading}
                className="btn btn-primary w-full sm:w-auto gap-2"
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <CloudUploadIcon className="h-4 w-4" />
                    Upload {stagedFiles.length} File{stagedFiles.length === 1 ? '' : 's'}
                  </>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleExecuteUpload} className="space-y-4">
            {/* Upload Mode Selector */}
            <div className="flex rounded-lg border border-line bg-canvas p-1">
              <button
                type="button"
                onClick={() => setUploadTab('files')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-all ${uploadTab === 'files'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-ink-muted hover:text-ink'
                  }`}
              >
                <FileUpIcon className="h-4 w-4" /> Upload Files
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('folder')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-all ${uploadTab === 'folder'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-ink-muted hover:text-ink'
                  }`}
              >
                <FolderUpIcon className="h-4 w-4" /> Upload Folder (Directory)
              </button>
            </div>

            {/* Hidden native inputs */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <input
              type="file"
              ref={folderInputRef}
              multiple
              className="hidden"
              onChange={handleFolderInputChange}
            />

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isDragActive
                ? 'border-brand-500 bg-brand-50/70'
                : 'border-line bg-canvas/40 hover:bg-canvas/70'
                }`}
            >
              <CloudUploadIcon className="mx-auto h-10 w-10 text-brand-600 mb-2" />
              <p className="text-xs font-bold text-ink">
                {uploadTab === 'files'
                  ? 'Drag & drop ISO evidence documents here'
                  : 'Drag & drop an entire evidence folder here'}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {uploadTab === 'files'
                  ? 'Supports PDF, Word (DOCX), Excel (XLSX), PPTX, JPG, PNG'
                  : 'Folder structure and nested files will be staged automatically'}
              </p>

              <div className="mt-3.5 flex justify-center gap-2">
                {uploadTab === 'files' ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm text-xs gap-1.5"
                  >
                    <FileUpIcon className="h-3.5 w-3.5" /> Browse Files
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="btn btn-secondary btn-sm text-xs gap-1.5"
                  >
                    <FolderUpIcon className="h-3.5 w-3.5" /> Browse Folder
                  </button>
                )}
              </div>
            </div>

            {/* Staged Files Preview */}
            {stagedFiles.length > 0 && (
              <div className="rounded-lg border border-line bg-white p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">
                    Staged Files ({stagedFiles.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setStagedFiles([])}
                    className="text-[11px] font-semibold text-danger-600 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-line pr-1 text-xs">
                  {stagedFiles.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileTextIcon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                        <span className="truncate text-ink font-medium">{item.name}</span>
                        {item.path.includes('/') && (
                          <span className="text-[10px] text-ink-muted truncate">
                            ({item.path})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-ink-muted">{item.sizeMb} MB</span>
                        <button
                          type="button"
                          onClick={() => removeStagedFile(idx)}
                          className="text-ink-subtle hover:text-danger-600"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Folder Destination Settings */}
            <div className="space-y-2">
              <label className="label">Evidence Folder Destination</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer ${uploadFolderChoice === 'existing' ? 'border-brand-500 bg-brand-50/50' : 'border-line'
                  }`}>
                  <input
                    type="radio"
                    name="folderChoice"
                    checked={uploadFolderChoice === 'existing'}
                    onChange={() => setUploadFolderChoice('existing')}
                  />
                  <span>Save into existing folder</span>
                </label>
                <label className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer ${uploadFolderChoice === 'new' ? 'border-brand-500 bg-brand-50/50' : 'border-line'
                  }`}>
                  <input
                    type="radio"
                    name="folderChoice"
                    checked={uploadFolderChoice === 'new'}
                    onChange={() => setUploadFolderChoice('new')}
                  />
                  <span>Create new folder</span>
                </label>
              </div>

              {uploadFolderChoice === 'existing' ? (
                <select
                  value={uploadSelectedFolderId}
                  onChange={(e) => setUploadSelectedFolderId(e.target.value)}
                  className="select mt-2"
                >
                  {isoFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code || 'ISO'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={uploadNewFolderName}
                  onChange={(e) => setUploadNewFolderName(e.target.value)}
                  placeholder="Enter new folder name (e.g. 2024 Audit Records)"
                  className="input mt-2"
                  required
                />
              )}
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">ISO Audit Stage *</label>
                <select
                  value={uploadStage}
                  onChange={(e) => setUploadStage(e.target.value as ISODocumentStage)}
                  className="select"
                >
                  <option value="1st Surveillance">1st Surveillance</option>
                  <option value="2nd Surveillance">2nd Surveillance</option>
                  <option value="Recertification">Recertification</option>
                </select>
              </div>

              <div>
                <label className="label">Document Type *</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value as DocumentType)}
                  className="select"
                >
                  <option value="Report">Report</option>
                  <option value="Manual">Manual</option>
                  <option value="Policy">Policy</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Meeting Minutes">Meeting Minutes</option>
                  <option value="Plan">Plan</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Academic Year</label>
                <input
                  type="text"
                  value={uploadAcademicYear}
                  onChange={(e) => setUploadAcademicYear(e.target.value)}
                  className="input"
                  placeholder="2024–2025"
                />
              </div>
            </div>

            <div>
              <label className="label">Issuing Office / Unit</label>
              <input
                type="text"
                value={uploadOffice}
                onChange={(e) => setUploadOffice(e.target.value)}
                className="input"
                placeholder="e.g. Quality Management System Office"
              />
            </div>

            <div>
              <label className="label">Document Description / Scope</label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="textarea h-16 text-[13px]"
                placeholder="Context or clause relevance of the uploaded documents..."
              />
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Edit Document Metadata Modal */}
      {editingDoc && (
        <Modal
          open={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          title="Edit ISO Evidence Document"
          description={`Update metadata and folder placement for "${editingDoc.title}"`}
          size="md"
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditDoc}
                className="btn btn-primary w-full sm:w-auto"
              >
                Save Changes
              </button>
            </div>
          }
        >
          <form onSubmit={handleSaveEditDoc} className="space-y-3.5">
            <div>
              <label className="label">Document Title *</label>
              <input
                type="text"
                value={editDocForm.title}
                onChange={(e) => setEditDocForm({ ...editDocForm, title: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">ISO Audit Stage</label>
                <select
                  value={editDocForm.isoStage}
                  onChange={(e) => setEditDocForm({ ...editDocForm, isoStage: e.target.value as ISODocumentStage })}
                  className="select"
                >
                  <option value="1st Surveillance">1st Surveillance</option>
                  <option value="2nd Surveillance">2nd Surveillance</option>
                  <option value="Recertification">Recertification</option>
                </select>
              </div>

              <div>
                <label className="label">Evidence Folder</label>
                <select
                  value={editDocForm.folderId}
                  onChange={(e) => setEditDocForm({ ...editDocForm, folderId: e.target.value })}
                  className="select"
                >
                  {isoFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code || 'ISO'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Document Type</label>
                <select
                  value={editDocForm.docType}
                  onChange={(e) => setEditDocForm({ ...editDocForm, docType: e.target.value as DocumentType })}
                  className="select"
                >
                  <option value="Report">Report</option>
                  <option value="Manual">Manual</option>
                  <option value="Policy">Policy</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Meeting Minutes">Meeting Minutes</option>
                  <option value="Plan">Plan</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Academic Year</label>
                <input
                  type="text"
                  value={editDocForm.academicYear}
                  onChange={(e) => setEditDocForm({ ...editDocForm, academicYear: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Issuing Office</label>
              <input
                type="text"
                value={editDocForm.office}
                onChange={(e) => setEditDocForm({ ...editDocForm, office: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Description / Summary</label>
              <textarea
                value={editDocForm.description}
                onChange={(e) => setEditDocForm({ ...editDocForm, description: e.target.value })}
                className="textarea h-20 text-[13px]"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* 4. Delete Document Modal */}
      {deletingDoc && (
        <Modal
          open={!!deletingDoc}
          onClose={() => setDeletingDoc(null)}
          title="Delete Evidence Document"
          description={`Are you sure you want to remove "${deletingDoc.title}" from the ISO evidence repository?`}
          size="md"
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="btn btn-secondary w-full sm:w-auto text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(deletingDoc.id);
                  toast.success(`Deleted "${deletingDoc.title}"`);
                  setDeletingDoc(null);
                }}
                className="btn btn-danger w-full sm:w-auto text-xs"
              >
                Delete Document
              </button>
            </div>
          }
        >
          <div className="rounded-md bg-danger-50 border border-danger-200 p-3 text-xs text-danger-800">
            This action will permanently delete this document and any associated surveillance audit attachments.
          </div>
        </Modal>
      )}

      {/* 5. Document Preview Modal */}
      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        grantAccess={true}
      />

      {/* 6. Folder Create / Edit Modal */}
      <FolderFormModal
        open={isFolderModalOpen}
        folder={editingFolder}
        frameworkId="iso"
        category="Quality Management"
        parentId="folder-iso"
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={(savedF) => {
          saveFolder({
            ...savedF,
            frameworkId: 'iso',
            category: 'Quality Management',
            campusId: selectedCampusId,
            campus: campus.name
          });
          toast.success(editingFolder ? 'Folder updated' : 'ISO Folder created successfully');
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
      />

      {/* 7. Delete Folder Modal */}
      <DeleteFolderModal
        open={!!deletingFolder}
        folder={deletingFolder}
        documentCount={documents.filter((d) => d.folderId === deletingFolder?.id).length}
        onClose={() => setDeletingFolder(null)}
        onConfirm={(folderId) => {
          deleteFolder(folderId);
          toast.success('Folder deleted');
          setDeletingFolder(null);
          if (selectedFolderId === folderId) {
            setSelectedFolderId(null);
          }
        }}
      />

      {/* Official Certificates Modal */}
      <CertificateFoldersModal
        open={certificatesOpen}
        onClose={() => setCertificatesOpen(false)}
        title="Recognition & Compliance Certificates"
        description={`${campus.name} · Institutional Recognition & Standards`}
        frameworkId="iso"
        areaKey={certAreaKey}
        levels={ISO_CERTIFICATE_LEVELS}
        currentLevelCode={isoRecord.complianceStatus}
        subject={campus.name}
        program="Quality Management & Institutional Excellence"
        cycle={isoRecord.cycle}
        body="TÜV Rheinland"
        campusId={selectedCampusId}
        campusName={campus.name}
        stats={[
          { label: 'Surveillance Cycle', value: isoRecord.cycle },
          { label: 'Validation Status', value: isoRecord.validationStatus || 'Certified & Signed' }
        ]}
        onActivate={
          canMutate
            ? (doc, code) => {
              if (code) {
                saveISOSurveillanceRecord({
                  ...isoRecord,
                  complianceStatus: code as any
                });
              }
              toast.success(code ? `"${doc.title}" activated` : `"${doc.title}" activated`);
            }
            : undefined
        }
      />
      <DocumentPreviewModal doc={previewCertificate} onClose={() => setPreviewCertificate(null)} grantAccess />
    </>
  );
}
