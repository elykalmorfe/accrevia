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
  FolderOpenIcon
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
  const { folders, saveFolder, deleteFolder, documents, addDocument } = usePortal();

  // Active view tab: 'folders' | 'areas' | 'official-instrument'
  const [activeTab, setActiveTab] = useState<'folders' | 'areas'>('areas');
  const [searchQuery, setSearchQuery] = useState('');

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

      {/* Segmented View Tabs & Action Row (Tabs + Search Bar + Upload Button) */}
      <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1">
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

        {/* Search Bar replacing "New Folder" + Upload Files/Folder Button on the same row */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'areas' ? 'Search areas 1–9...' : 'Search custom folders...'}
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
            onClick={() => setUploadModalOpen(true)}
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
            {filteredFolders.map((folder) => {
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
