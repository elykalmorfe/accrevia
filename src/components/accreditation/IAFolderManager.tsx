import React, { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FolderIcon,
  FolderPlusIcon,
  UploadIcon,
  FileTextIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  ExternalLinkIcon,
  CheckCircle2Icon,
  LayersIcon,
  FileCheckIcon,
  FolderArchiveIcon,
  FolderOpenIcon,
  PlusIcon,
  XIcon,
  AlertCircleIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { EvidenceFolder, EvidenceDocument } from '../../types/evidence';
import { CampusId, IARequirementItem } from '../../types/accreditation';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { FolderFormModal } from '../folders/FolderFormModal';
import { DeleteFolderModal } from '../folders/DeleteFolderModal';

interface IAFolderManagerProps {
  campusId: CampusId;
  campusName: string;
  iaRequirements: IARequirementItem[];
  onRequirementUpdated?: (reqId: string, docName: string, docUrl: string) => void;
}

// 9 Official AACCUP Institutional Accreditation Instrument Areas
export const OFFICIAL_IA_AREAS = [
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

// Searchable Official IA Instrument Common Documents Catalogue
interface OfficialIADoc {
  id: string;
  areaCode: string;
  areaNumber: number;
  title: string;
  category: string;
  instrumentReference: string;
  documentUrl: string;
  fileType: string;
  sizeMb: number;
  validity: string;
  status: 'Verified' | 'Pending Review' | 'Archived';
  keywords: string[];
}

export const OFFICIAL_IA_COMMON_DOCS: OfficialIADoc[] = [
  {
    id: 'ia-doc-01',
    areaCode: 'AREA-I',
    areaNumber: 1,
    title: 'NEMSU 5-Year Institutional Development Plan (2024–2028)',
    category: 'Institutional Strategic Plan',
    instrumentReference: 'IA Parameter A.1: Vision, Mission, Goals and Objectives',
    documentUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    fileType: 'PDF',
    sizeMb: 8.4,
    validity: '2024–2028',
    status: 'Verified',
    keywords: ['development plan', 'strategic plan', 'governance', 'board approved', 'vmgo']
  },
  {
    id: 'ia-doc-02',
    areaCode: 'AREA-I',
    areaNumber: 1,
    title: 'University Administrative Operations Manual & Organizational Structure',
    category: 'Administrative Manual',
    instrumentReference: 'IA Parameter A.2: Governance Structure & Organizational Chart',
    documentUrl: 'https://drive.google.com/file/d/1dAr6YbSm9d-ucxx2I2Y9qT5MIVRK0WW4/view',
    fileType: 'PDF',
    sizeMb: 12.1,
    validity: 'Current',
    status: 'Verified',
    keywords: ['administrative manual', 'organizational chart', 'transparency seal', 'governance']
  },
  {
    id: 'ia-doc-03',
    areaCode: 'AREA-II',
    areaNumber: 2,
    title: 'Outcomes-Based Education (OBE) Institutional Syllabi Matrix & Curriculum Guide',
    category: 'Instruction & OBE',
    instrumentReference: 'IA Parameter B.1: Curriculum Design & Instructional Delivery',
    documentUrl: 'https://drive.google.com/file/d/1irJbb1Xwxj8uKo0BKHRXZm72njXKLtrO/view?usp=sharing',
    fileType: 'PDF',
    sizeMb: 15.6,
    validity: 'AY 2024–2025',
    status: 'Verified',
    keywords: ['obe', 'syllabi', 'curriculum', 'instruction', 'teaching evaluation']
  },
  {
    id: 'ia-doc-04',
    areaCode: 'AREA-II',
    areaNumber: 2,
    title: 'Licensure Examination Performance Profile & Academic Council Resolutions',
    category: 'Evaluation & Licensure',
    instrumentReference: 'IA Parameter B.3: Retention, Graduation & Licensure Outcomes',
    documentUrl: 'https://drive.google.com/file/d/17g5WUASVKkDIVqDloHrFH_h6CaU_7NKR/view',
    fileType: 'PDF',
    sizeMb: 4.8,
    validity: 'AY 2023–2024',
    status: 'Verified',
    keywords: ['licensure', 'board exam', 'graduation rate', 'academic council']
  },
  {
    id: 'ia-doc-05',
    areaCode: 'AREA-III',
    areaNumber: 3,
    title: 'Institutional Faculty Plantilla, Masteral/Doctoral Qualifications & PRC Roster',
    category: 'Faculty Qualifications',
    instrumentReference: 'IA Parameter C.1: Faculty Qualifications & Academic Ranks',
    documentUrl: 'https://drive.google.com/file/d/18jaQTgFEdjXgkaqeHWFH-5kEfAaH4RlS/view',
    fileType: 'PDF',
    sizeMb: 9.7,
    validity: 'AY 2024–2025',
    status: 'Verified',
    keywords: ['faculty plantilla', 'credentials', 'masteral', 'doctoral', 'prc license']
  },
  {
    id: 'ia-doc-06',
    areaCode: 'AREA-III',
    areaNumber: 3,
    title: 'Faculty and Staff Development Plan (FSDP) & Qualitative Contribution Evaluation (QCE)',
    category: 'Staff Development',
    instrumentReference: 'IA Parameter C.2: Professional Growth & Faculty Evaluation',
    documentUrl: 'https://drive.google.com/file/d/1Noyo-GMjkzveJ-Y4PTYPDL5Fokd9xfLI/view',
    fileType: 'PDF',
    sizeMb: 6.2,
    validity: '2023–2026',
    status: 'Verified',
    keywords: ['faculty development', 'qce', 'nbc 461', 'trainings', 'scholarships']
  },
  {
    id: 'ia-doc-07',
    areaCode: 'AREA-IV',
    areaNumber: 4,
    title: 'Institutional Research Agenda (2023–2028) & Ethics Review Board Manual',
    category: 'Research Agenda',
    instrumentReference: 'IA Parameter D.1: Research Priorities & Resource Allocation',
    documentUrl: 'https://drive.google.com/file/d/197RDkFdoH3-DkXp0Bqpn_SAtneNFEVT0/view',
    fileType: 'PDF',
    sizeMb: 5.3,
    validity: '2023–2028',
    status: 'Verified',
    keywords: ['research agenda', 'research ethics', 'research priorities', 'funding']
  },
  {
    id: 'ia-doc-08',
    areaCode: 'AREA-IV',
    areaNumber: 4,
    title: 'Scopus / WoS Published Research Compendium & Intellectual Property Registrations',
    category: 'Research Productivity',
    instrumentReference: 'IA Parameter D.2: Publications, Citations & IP Disclosures',
    documentUrl: 'https://drive.google.com/file/d/1kxSu_DuKmOYYDVLH8oB2hZ7qFC0VfzVQ/view',
    fileType: 'PDF',
    sizeMb: 14.2,
    validity: 'AY 2024',
    status: 'Verified',
    keywords: ['scopus', 'wos', 'ip registration', 'patents', 'journal publications']
  },
  {
    id: 'ia-doc-09',
    areaCode: 'AREA-V',
    areaNumber: 5,
    title: 'Institutional Extension Master Plan & Adopted Community Impact Assessment',
    category: 'Extension Services',
    instrumentReference: 'IA Parameter E.1: Community Outreach & Sustainable Linkages',
    documentUrl: 'https://drive.google.com/file/d/18qtWdmaPeC8o6NKGj8AVuc8KBDhCcqNN/view',
    fileType: 'PDF',
    sizeMb: 11.5,
    validity: '2023–2026',
    status: 'Verified',
    keywords: ['extension', 'community impact', 'outreach', 'technology transfer']
  },
  {
    id: 'ia-doc-10',
    areaCode: 'AREA-V',
    areaNumber: 5,
    title: 'Memorandum of Agreement (MOA/MOU) Compendium with LGUs, SUCs & Industries',
    category: 'Institutional Linkages',
    instrumentReference: 'IA Parameter E.2: Partnerships & Collaborative Linkages',
    documentUrl: 'https://drive.google.com/drive/folders/1c95n6ZIge4zvZZ11wN4y0IKDr_r2mYko',
    fileType: 'PDF',
    sizeMb: 18.0,
    validity: '2022–2025',
    status: 'Verified',
    keywords: ['moa', 'mou', 'linkages', 'partnerships', 'lgu collaboration']
  },
  {
    id: 'ia-doc-11',
    areaCode: 'AREA-VI',
    areaNumber: 6,
    title: 'Student Affairs and Services (SAS) Comprehensive Operations & Welfare Manual',
    category: 'Student Support',
    instrumentReference: 'IA Parameter F.1: Student Services & Welfare Administration',
    documentUrl: 'https://drive.google.com/file/d/1dAr6YbSm9d-ucxx2I2Y9qT5MIVRK0WW4/view',
    fileType: 'PDF',
    sizeMb: 8.9,
    validity: 'Current',
    status: 'Verified',
    keywords: ['student affairs', 'sas', 'guidance', 'scholarships', 'student council']
  },
  {
    id: 'ia-doc-12',
    areaCode: 'AREA-VII',
    areaNumber: 7,
    title: 'University Library Holdings Inventory, ScienceDirect Subscriptions & OPAC System',
    category: 'Library Resources',
    instrumentReference: 'IA Parameter G.1: Library Holdings & Digital Information Systems',
    documentUrl: 'https://drive.google.com/file/d/1xsNkKL7GoKyB47CFHPqu0lkF-CmuwH9p/view',
    fileType: 'PDF',
    sizeMb: 10.4,
    validity: 'AY 2024–2025',
    status: 'Verified',
    keywords: ['library', 'sciencedirect', 'e-books', 'opac', 'library holdings']
  },
  {
    id: 'ia-doc-13',
    areaCode: 'AREA-VIII',
    areaNumber: 8,
    title: 'Physical Facilities Development, Laboratory Safety Calibrations & Fire Clearances',
    category: 'Infrastructure & Safety',
    instrumentReference: 'IA Parameter H.1: Physical Plant, Laboratories & OSH Safety',
    documentUrl: 'https://drive.google.com/file/d/1irJbb1Xwxj8uKo0BKHRXZm72njXKLtrO/view',
    fileType: 'PDF',
    sizeMb: 13.8,
    validity: '2024–2025',
    status: 'Verified',
    keywords: ['infrastructure', 'laboratories', 'calibration', 'fire safety', 'pwd accessibility']
  },
  {
    id: 'ia-doc-14',
    areaCode: 'AREA-IX',
    areaNumber: 9,
    title: 'NEMSU Quality Manual, ISO 9001:2015 QMS Audits & Internal Quality Audit (IQA) Log',
    category: 'QA Management System',
    instrumentReference: 'IA Parameter I.1: Institutional Quality Culture & Continual Improvement',
    documentUrl: 'https://drive.google.com/file/d/18jaQTgFEdjXgkaqeHWFH-5kEfAaH4RlS/view',
    fileType: 'PDF',
    sizeMb: 16.3,
    validity: '2023–2026',
    status: 'Verified',
    keywords: ['quality manual', 'iso 9001:2015', 'internal quality audit', 'iqa', 'continual improvement']
  }
];

export function IAFolderManager({ campusId, campusName, iaRequirements, onRequirementUpdated }: IAFolderManagerProps) {
  const { folders, saveFolder, deleteFolder, documents, addDocument } = usePortal();

  // Active view tab: 'folders' | 'areas' | 'official-instrument'
  const [activeTab, setActiveTab] = useState<'folders' | 'areas' | 'official-instrument'>('areas');

  // Selected folder for filtering
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  // Selected IA Area filter
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>('all');

  // Common Docs Search
  const [docSearch, setDocSearch] = useState('');
  const [docAreaFilter, setDocAreaFilter] = useState('all');

  // Folder Modals
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<EvidenceFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<EvidenceFolder | null>(null);

  // Upload States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');
  const [selectedTargetArea, setSelectedTargetArea] = useState<string>('AREA-I');
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

  // Documents mapped to this campus
  const campusIADocs = useMemo(() => {
    return documents.filter((d) => d.frameworkId === 'ia');
  }, [documents]);

  // Filtered official common docs based on search
  const filteredCommonDocs = useMemo(() => {
    return OFFICIAL_IA_COMMON_DOCS.filter((doc) => {
      if (docAreaFilter !== 'all' && doc.areaCode !== docAreaFilter) return false;
      if (docSearch.trim()) {
        const q = docSearch.toLowerCase();
        const mTitle = doc.title.toLowerCase().includes(q);
        const mCat = doc.category.toLowerCase().includes(q);
        const mRef = doc.instrumentReference.toLowerCase().includes(q);
        const mKw = doc.keywords.some((k) => k.toLowerCase().includes(q));
        if (!mTitle && !mCat && !mRef && !mKw) return false;
      }
      return true;
    });
  }, [docSearch, docAreaFilter]);

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
    toast.success(`Selected entire folder with ${list.length} file(s)`);
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

    const traverseFileTree = async (item: any, path = '') => {
      if (item.isFile) {
        await new Promise<void>((resolve) => {
          item.file((file: File) => {
            collected.push({
              name: file.name,
              size: file.size,
              path: path + file.name
            });
            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        await new Promise<void>((resolve) => {
          dirReader.readEntries(async (entries: any[]) => {
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
      toast.success(`Scanned and prepared ${collected.length} file(s) from folder drop`);
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
      const targetAreaObj = OFFICIAL_IA_AREAS.find((a) => a.code === selectedTargetArea) || OFFICIAL_IA_AREAS[0];

      uploadedFileList.forEach((file, idx) => {
        const newDoc: EvidenceDocument = {
          id: `doc-ia-${Date.now()}-${idx}`,
          title: file.path ? `${file.path.split('/')[0]}: ${file.name}` : file.name,
          description: `Uploaded evidence for Institutional Accreditation (${targetAreaObj.name}).`,
          keywords: ['IA Evidence', targetAreaObj.name, campusName],
          frameworkId: 'ia',
          areaId: selectedTargetArea.toLowerCase(),
          criterionId: 'c-ia-1',
          indicatorId: 'i-1-1',
          docType: 'Report',
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
          passages: [`Institutional evidence registered under ${targetAreaObj.name}`],
          folderId: selectedTargetFolder || 'folder-ia'
        };
        addDocument(newDoc);
      });

      setIsProcessingUpload(false);
      setUploadModalOpen(false);
      setUploadedFileList([]);
      toast.success(
        uploadMode === 'folder'
          ? `Successfully uploaded and indexed entire folder (${uploadedFileList.length} files) to ${targetAreaObj.code}!`
          : `Successfully uploaded ${uploadedFileList.length} document(s) to ${targetAreaObj.code}!`
      );
    }, 600);
  };

  // Quick 1-click Attach from Official Common Docs to IA Requirement
  const handleAttachOfficialDocToRequirement = (doc: OfficialIADoc) => {
    const matchingReq = iaRequirements.find((r) => r.areaCode === doc.areaCode);
    if (matchingReq && onRequirementUpdated) {
      onRequirementUpdated(matchingReq.id, doc.title, doc.documentUrl);
      toast.success(`Attached "${doc.title}" to ${doc.areaCode} Requirement!`);
    } else {
      toast.info(`Official Document "${doc.title}" verified for ${doc.areaCode}.`);
    }
  };

  return (
    <div className="panel mb-6 overflow-hidden">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col gap-3 border-b border-line bg-canvas/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink">IA Document & Folder Management</h3>
            <Badge tone="brand">Official Areas 1–9</Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Organize institutional accreditation portfolios, manage custom folders, upload entire folders or files, and access official instrument documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingFolder(null);
              setFolderFormOpen(true);
            }}
            className="btn btn-secondary btn-sm"
            title="Create a new folder for institutional evidence"
          >
            <FolderPlusIcon className="h-3.5 w-3.5 text-brand-600" />
            <span>New Folder</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="btn btn-primary btn-sm"
            title="Upload individual files or entire folders"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            <span>Upload Files / Folder</span>
          </button>
        </div>
      </div>

      {/* Segmented View Tabs */}
      <div className="flex items-center gap-1 border-b border-line bg-white px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('areas')}
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
          onClick={() => setActiveTab('official-instrument')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'official-instrument'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <FileCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
          <span>Official IA Instrument Common Documents ({OFFICIAL_IA_COMMON_DOCS.length})</span>
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
          <span>Custom Folders ({iaFolders.length})</span>
        </button>
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
            {OFFICIAL_IA_AREAS.map((area) => {
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
                        setSelectedTargetArea(area.code);
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

      {/* TAB 2: SEARCHABLE COMMON ACCREDITATION DOCUMENTS (OFFICIAL IA INSTRUMENT) */}
      {activeTab === 'official-instrument' && (
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search official IA instrument common documents by title, parameter, or keyword..."
                className="input pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={docAreaFilter}
                onChange={(e) => setDocAreaFilter(e.target.value)}
                className="input h-9 text-xs py-0"
              >
                <option value="all">All IA Areas (1–9)</option>
                {OFFICIAL_IA_AREAS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code}: {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-line text-ink-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Area</th>
                  <th className="px-3 py-2.5 font-semibold">Document Title & Instrument Parameter</th>
                  <th className="px-3 py-2.5 font-semibold">Category</th>
                  <th className="px-3 py-2.5 font-semibold">Validity</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {filteredCommonDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded text-[11px]">
                        {doc.areaCode}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-ink flex items-center gap-1.5">
                        <FileTextIcon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">{doc.instrumentReference}</p>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-ink-muted">{doc.category}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-ink-muted">{doc.validity}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge tone={doc.status === 'Verified' ? 'success' : 'brand'} dot>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-xs"
                          title="Open official document link"
                        >
                          <ExternalLinkIcon className="h-3 w-3" /> Link
                        </a>
                        <button
                          type="button"
                          onClick={() => handleAttachOfficialDocToRequirement(doc)}
                          className="btn btn-primary btn-xs"
                          title="Attach to corresponding IA Area requirement"
                        >
                          <CheckCircle2Icon className="h-3 w-3" /> Attach to IA
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM FOLDERS MANAGEMENT */}
      {activeTab === 'folders' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              IA Evidence Folders Repository
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingFolder(null);
                setFolderFormOpen(true);
              }}
              className="btn btn-secondary btn-xs"
            >
              <FolderPlusIcon className="h-3 w-3" /> New Folder
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {iaFolders.map((folder) => {
              const docCount = campusIADocs.filter((d) => d.folderId === folder.id).length;
              return (
                <div
                  key={folder.id}
                  className="rounded-lg border border-line bg-white p-3.5 shadow-xs transition-all hover:border-brand-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                        <FolderIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">{folder.name}</h4>
                        <span className="text-[10px] text-ink-subtle">{folder.code} · {folder.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
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

                  <p className="mt-2 text-[11px] text-ink-muted line-clamp-2">{folder.description || 'No description provided.'}</p>

                  <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-subtle">
                    <span>{docCount} documents inside</span>
                    <button
                      type="button"
                      onClick={() => {
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
        </div>
      )}

      {/* UPLOAD INDIVIDUAL FILES & ENTIRE FOLDERS MODAL */}
      {uploadModalOpen && (
        <Modal
          open={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setUploadedFileList([]);
          }}
          title={uploadMode === 'folder' ? 'Upload Entire Folder to IA Repository' : 'Upload Evidence Files to IA Repository'}
          description="Select individual documents or upload an entire directory structure for AACCUP Institutional Accreditation."
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
                  : `Commit Upload (${uploadedFileList.length} files)`}
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
                <FolderArchiveIcon className="h-3.5 w-3.5" /> Upload Entire Folder
              </button>
            </div>

            {/* Target IA Area Selection */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Target IA Area (Areas 1–9)</label>
                <select
                  value={selectedTargetArea}
                  onChange={(e) => setSelectedTargetArea(e.target.value)}
                  className="input text-xs"
                >
                  {OFFICIAL_IA_AREAS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code}: {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Target Folder (Optional)</label>
                <select
                  value={selectedTargetFolder}
                  onChange={(e) => setSelectedTargetFolder(e.target.value)}
                  className="input text-xs"
                >
                  <option value="">Default IA Root</option>
                  {iaFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
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

      {/* CREATE / RENAME FOLDER MODAL */}
      <FolderFormModal
        open={folderFormOpen}
        folder={editingFolder}
        onClose={() => {
          setFolderFormOpen(false);
          setEditingFolder(null);
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
        documentCount={campusIADocs.filter((d) => d.folderId === deletingFolder?.id).length}
        onClose={() => setDeletingFolder(null)}
        onConfirm={(id) => {
          deleteFolder(id);
          toast.success('Folder deleted');
        }}
      />
    </div>
  );
}
