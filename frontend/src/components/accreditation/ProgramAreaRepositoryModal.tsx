import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  BadgeCheckIcon,
  CheckIcon,
  ChevronRightIcon,
  CloudUploadIcon,
  EyeIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderUpIcon,
  HomeIcon,
  PencilIcon,
  PresentationIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';
import { usePortal } from '../../contexts/PortalContext';
import type { ProgramAccreditation, ProgramRequirementItem } from '../../types/accreditation';
import type { EvidenceDocument, EvidenceFolder, FileType } from '../../types/evidence';

interface ProgramAreaRepositoryModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  requirement: ProgramRequirementItem | null;
  onClose: () => void;
}

interface PendingUpload {
  file: File;
  path: string;
}

const FILE_TYPE_BY_EXT: Record<string, FileType> = {
  pdf: 'PDF',
  doc: 'DOCX',
  docx: 'DOCX',
  xls: 'XLSX',
  xlsx: 'XLSX',
  csv: 'XLSX',
  ppt: 'PPTX',
  pptx: 'PPTX',
  jpg: 'JPG',
  jpeg: 'JPG',
  png: 'PNG',
  tif: 'TIFF',
  tiff: 'TIFF'
};

const FILE_TYPE_STYLE: Record<FileType, { icon: React.ElementType; className: string }> = {
  PDF: { icon: FileTextIcon, className: 'bg-rose-50 text-rose-600 ring-rose-100' },
  DOCX: { icon: FileTextIcon, className: 'bg-sky-50 text-sky-600 ring-sky-100' },
  XLSX: { icon: FileSpreadsheetIcon, className: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  PPTX: { icon: PresentationIcon, className: 'bg-orange-50 text-orange-600 ring-orange-100' },
  JPG: { icon: FileImageIcon, className: 'bg-violet-50 text-violet-600 ring-violet-100' },
  PNG: { icon: FileImageIcon, className: 'bg-violet-50 text-violet-600 ring-violet-100' },
  TIFF: { icon: FileImageIcon, className: 'bg-violet-50 text-violet-600 ring-violet-100' }
};

const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function fileTypeOf(name: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_TYPE_BY_EXT[ext] ?? 'PDF';
}

function formatSize(mb: number): string {
  return mb < 1 ? `${Math.max(1, Math.round(mb * 1024))} KB` : `${mb.toFixed(1)} MB`;
}

async function readDroppedItems(items: DataTransferItemList): Promise<PendingUpload[]> {
  const results: PendingUpload[] = [];

  const readAllEntries = (reader: FileSystemDirectoryReader) =>
    new Promise<FileSystemEntry[]>((resolve, reject) => {
      const all: FileSystemEntry[] = [];
      const readBatch = () =>
        reader.readEntries((batch) => {
          if (!batch.length) return resolve(all);
          all.push(...batch);
          readBatch();
        }, reject);
      readBatch();
    });

  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
      results.push({ file, path: `${prefix}${file.name}` });
    } else if (entry.isDirectory) {
      const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
      for (const child of children) await walk(child, `${prefix}${entry.name}/`);
    }
  };

  const entries = Array.from(items)
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);
  for (const entry of entries) await walk(entry, '');
  return results;
}

export function ProgramAreaRepositoryModal({ open, program, requirement, onClose }: ProgramAreaRepositoryModalProps) {
  const { folders, saveFolder, deleteFolder, documents, addDocument, deleteDocument, updateProgramRequirement, currentUser } =
    usePortal();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const areaKey = requirement?.id ?? '';

  useEffect(() => {
    setCurrentFolderId(null);
    setQuery('');
    setCreatingFolder(false);
    setRenamingId(null);
  }, [areaKey, open]);

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
    folderInputRef.current?.setAttribute('directory', '');
  }, [open]);

  const areaFolders = useMemo(
    () => folders.filter((f) => f.frameworkId === 'pa' && f.areaId === areaKey),
    [folders, areaKey]
  );
  const areaDocs = useMemo(
    () => documents.filter((d) => d.frameworkId === 'pa' && d.areaId === areaKey),
    [documents, areaKey]
  );

  const descendantFolderIds = (rootId: string): string[] => {
    const ids = [rootId];
    for (let i = 0; i < ids.length; i++) {
      areaFolders.forEach((f) => f.parentId === ids[i] && ids.push(f.id));
    }
    return ids;
  };

  const fileCountIn = (folderId: string) => {
    const ids = new Set(descendantFolderIds(folderId));
    return areaDocs.filter((d) => d.folderId && ids.has(d.folderId)).length;
  };

  const breadcrumb = useMemo(() => {
    const trail: EvidenceFolder[] = [];
    let cursor = areaFolders.find((f) => f.id === currentFolderId);
    while (cursor) {
      trail.unshift(cursor);
      cursor = areaFolders.find((f) => f.id === cursor?.parentId);
    }
    return trail;
  }, [areaFolders, currentFolderId]);

  const q = query.trim().toLowerCase();
  const visibleFolders = q
    ? areaFolders.filter((f) => f.name.toLowerCase().includes(q))
    : areaFolders.filter((f) => (f.parentId ?? null) === currentFolderId);
  const visibleDocs = q
    ? areaDocs.filter((d) => d.title.toLowerCase().includes(q))
    : areaDocs.filter((d) => (d.folderId ?? null) === currentFolderId);

  const totalSizeMb = areaDocs.reduce((sum, d) => sum + (d.sizeMb || 0), 0);

  if (!program || !requirement) return null;

  const buildFolder = (name: string, parentId: string | null): EvidenceFolder => ({
    id: uid('folder-pa'),
    name,
    code: requirement.areaCode,
    frameworkId: 'pa',
    category: 'Accreditation',
    description: `${requirement.areaName} — ${program.programName}`,
    color: 'purple',
    createdAt: today(),
    parentId: parentId ?? undefined,
    areaId: areaKey,
    campusId: program.campusId,
    campus: program.campusName,
    hasNoDeadline: true
  });

  const buildDocument = (file: File, folderId: string | null): EvidenceDocument => {
    const year = new Date().getFullYear();
    const sizeMb = Math.max(0.1, Math.round((file.size / (1024 * 1024)) * 10) / 10);
    return {
      id: uid('doc-pa'),
      title: file.name,
      description: `${requirement.areaName} evidence for ${program.programName}`,
      keywords: ['Program Accreditation', 'AACCUP', requirement.areaCode, program.programName],
      frameworkId: 'pa',
      areaId: areaKey,
      criterionId: '',
      indicatorId: '',
      requirementId: requirement.id,
      docType: 'Report',
      academicYear: `${year}–${year + 1}`,
      cycle: 'AACCUP Program Accreditation',
      program: program.programName,
      college: '—',
      department: '—',
      office: 'Accreditation Office',
      campus: program.campusName,
      campusId: program.campusId,
      documentDate: today(),
      confidentiality: 'Internal',
      status: 'Indexed',
      dateAdded: today(),
      fileType: fileTypeOf(file.name),
      pages: Math.max(1, Math.round(file.size / 50000)),
      sizeMb,
      uploadedBy: currentUser.name,
      passages: [`${requirement.areaName} — ${program.programName} (${program.campusName})`],
      folderId: folderId ?? undefined,
      approvalStatus: 'Pending Review'
    };
  };

  const ingest = (uploads: PendingUpload[]) => {
    const accepted = uploads.filter((u) => !u.file.name.startsWith('.'));
    if (!accepted.length) return;

    const created: EvidenceFolder[] = [];
    const resolveFolder = (segments: string[]): string | null => {
      let parent = currentFolderId;
      for (const name of segments) {
        const match = [...areaFolders, ...created].find((f) => f.name === name && (f.parentId ?? null) === parent);
        if (match) {
          parent = match.id;
        } else {
          const folder = buildFolder(name, parent);
          created.push(folder);
          parent = folder.id;
        }
      }
      return parent;
    };

    accepted.forEach(({ file, path }) => {
      const segments = path.split('/').filter(Boolean);
      addDocument(buildDocument(file, resolveFolder(segments.slice(0, -1))));
    });
    created.forEach(saveFolder);

    updateProgramRequirement(program.id, requirement.id, {
      isSubmitted: true,
      submissionDate: today(),
      documentName: accepted[accepted.length - 1].file.name
    });

    toast.success(
      `Uploaded ${accepted.length} file${accepted.length === 1 ? '' : 's'}` +
        (created.length ? ` and created ${created.length} folder${created.length === 1 ? '' : 's'}` : '')
    );
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    ingest(files.map((file) => ({ file, path: file.webkitRelativePath || file.name })));
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    const uploads = event.dataTransfer.items?.length
      ? await readDroppedItems(event.dataTransfer.items)
      : Array.from(event.dataTransfer.files).map((file) => ({ file, path: file.name }));
    ingest(uploads);
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const exists = areaFolders.some((f) => f.name.toLowerCase() === name.toLowerCase() && (f.parentId ?? null) === currentFolderId);
    if (exists) {
      toast.error(`A folder named "${name}" already exists here`);
      return;
    }
    saveFolder(buildFolder(name, currentFolderId));
    setNewFolderName('');
    setCreatingFolder(false);
    toast.success(`Folder "${name}" created`);
  };

  const handleRename = (folder: EvidenceFolder) => {
    const name = renameValue.trim();
    if (name && name !== folder.name) {
      saveFolder({ ...folder, name });
      toast.success('Folder renamed');
    }
    setRenamingId(null);
  };

  const handleDeleteFolder = (folder: EvidenceFolder) => {
    const ids = descendantFolderIds(folder.id);
    const fileCount = areaDocs.filter((d) => d.folderId && ids.includes(d.folderId)).length;
    const detail = fileCount ? ` and its ${fileCount} file${fileCount === 1 ? '' : 's'}` : '';
    if (!confirm(`Delete folder "${folder.name}"${detail}? This cannot be undone.`)) return;
    areaDocs.filter((d) => d.folderId && ids.includes(d.folderId)).forEach((d) => deleteDocument(d.id));
    ids.forEach(deleteFolder);
    toast.success('Folder deleted');
  };

  const handleDeleteDoc = (doc: EvidenceDocument) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    deleteDocument(doc.id);
    toast.success('File removed');
  };

  const toggleVerified = () => {
    const verified = !requirement.verified;
    updateProgramRequirement(program.id, requirement.id, { verified });
    toast.success(verified ? `${requirement.areaName} marked as verified` : 'Verification removed');
  };

  const isEmpty = !visibleFolders.length && !visibleDocs.length;
  const locationLabel = breadcrumb.length ? breadcrumb[breadcrumb.length - 1].name : 'Area root';

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="xl"
        title={requirement.areaName}
        description={`${program.programName} · ${program.campusName}`}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <p className="hidden text-[12px] text-ink-subtle sm:block">
              Tip: drag files or whole folders anywhere into the panel above.
            </p>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Done
            </button>
          </div>
        }>
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-violet-50 p-4">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-200/40 blur-2xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
                  <FolderOpenIcon className="h-5 w-5" />
                </span>
                <div className="flex gap-5">
                  {[
                    { label: 'Folders', value: areaFolders.length },
                    { label: 'Files', value: areaDocs.length },
                    { label: 'Storage', value: areaDocs.length ? formatSize(totalSizeMb) : '—' }
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[18px] font-bold leading-tight text-ink">{stat.value}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleVerified}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all ${
                  requirement.verified
                    ? 'bg-success-600 text-white shadow-md shadow-success-600/25 hover:bg-success-700'
                    : 'border border-line bg-white text-ink-muted hover:border-success-600 hover:text-success-700'
                }`}
                title={requirement.verified ? 'Click to remove verification' : 'Mark this area as verified'}>
                {requirement.verified ? <BadgeCheckIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                {requirement.verified ? 'Verified' : 'Mark as Verified'}
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex min-w-0 flex-wrap items-center gap-1 text-[13px]" aria-label="Folder path">
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition-colors ${
                  currentFolderId ? 'text-ink-muted hover:bg-canvas hover:text-ink' : 'text-brand-700'
                }`}>
                <HomeIcon className="h-3.5 w-3.5" />
                {requirement.areaName.split(':')[0]}
              </button>
              {breadcrumb.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-ink-subtle" />
                  <button
                    type="button"
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`max-w-[180px] truncate rounded-lg px-2 py-1 font-semibold transition-colors ${
                      index === breadcrumb.length - 1 ? 'text-brand-700' : 'text-ink-muted hover:bg-canvas hover:text-ink'
                    }`}>
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this area…"
                  className="h-9 w-44 rounded-lg border border-line bg-white pl-8 pr-3 text-[13px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreatingFolder(true);
                  setQuery('');
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-700">
                <FolderPlusIcon className="h-4 w-4" />
                New Folder
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-700">
                <FolderUpIcon className="h-4 w-4" />
                Upload Folder
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700">
                <UploadIcon className="h-4 w-4" />
                Upload Files
              </button>
              <input ref={fileInputRef} type="file" multiple hidden onChange={handleInputChange} />
              <input ref={folderInputRef} type="file" multiple hidden onChange={handleInputChange} />
            </div>
          </div>

          {/* Workspace / dropzone */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              dragDepth.current += 1;
              setDragActive(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => {
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (!dragDepth.current) setDragActive(false);
            }}
            onDrop={handleDrop}
            className={`relative min-h-[300px] rounded-2xl border p-4 transition-colors ${
              dragActive ? 'border-brand-400 bg-brand-50/60' : 'border-line bg-canvas/60'
            }`}>
            {dragActive && (
              <div className="pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-400 bg-white/85 backdrop-blur-sm">
                <CloudUploadIcon className="h-10 w-10 animate-bounce text-brand-600" />
                <p className="mt-2 text-[14px] font-bold text-brand-700">Drop to upload into “{locationLabel}”</p>
                <p className="text-[12px] text-ink-subtle">Folder structure is preserved</p>
              </div>
            )}

            {creatingFolder && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-white p-2 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <FolderPlusIcon className="h-[18px] w-[18px]" />
                </span>
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setCreatingFolder(false);
                  }}
                  placeholder={`New folder in ${locationLabel}`}
                  className="h-9 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink-subtle"
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-[12.5px] font-semibold text-white hover:bg-brand-700">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingFolder(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-canvas hover:text-ink"
                  aria-label="Cancel">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {isEmpty ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white/70 px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-500/30">
                  <CloudUploadIcon className="h-7 w-7" />
                </span>
                <p className="mt-4 text-[15px] font-bold text-ink">
                  {q ? 'No matches in this area' : 'This folder is empty'}
                </p>
                <p className="mt-1 max-w-sm text-[13px] text-ink-muted">
                  {q
                    ? 'Try a different file or folder name.'
                    : 'Drag & drop files or entire folders here, or use the buttons above to organize this area’s evidence.'}
                </p>
                {!q && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold text-white hover:bg-brand-700">
                      <UploadIcon className="h-4 w-4" />
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatingFolder(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-muted hover:text-brand-700">
                      <FolderPlusIcon className="h-4 w-4" />
                      New Folder
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {visibleFolders.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Folders</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleFolders.map((folder) => {
                        const count = fileCountIn(folder.id);
                        const subCount = areaFolders.filter((f) => f.parentId === folder.id).length;
                        return (
                          <div
                            key={folder.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => renamingId !== folder.id && (setQuery(''), setCurrentFolderId(folder.id))}
                            onKeyDown={(e) => e.key === 'Enter' && renamingId !== folder.id && setCurrentFolderId(folder.id)}
                            className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/10">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition group-hover:bg-amber-100">
                              <FolderIcon className="h-5 w-5 fill-amber-400/40" />
                            </span>
                            <div className="min-w-0 flex-1">
                              {renamingId === folder.id ? (
                                <input
                                  autoFocus
                                  value={renameValue}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onBlur={() => handleRename(folder)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename(folder);
                                    if (e.key === 'Escape') setRenamingId(null);
                                  }}
                                  className="w-full rounded-md border border-brand-300 px-1.5 py-0.5 text-[13px] font-semibold outline-none ring-2 ring-brand-100"
                                />
                              ) : (
                                <p className="truncate text-[13.5px] font-semibold text-ink">{folder.name}</p>
                              )}
                              <p className="text-[11.5px] text-ink-subtle">
                                {count} file{count === 1 ? '' : 's'}
                                {subCount > 0 && ` · ${subCount} folder${subCount === 1 ? '' : 's'}`}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingId(folder.id);
                                  setRenameValue(folder.name);
                                }}
                                className="rounded-md p-1.5 text-ink-subtle hover:bg-canvas hover:text-brand-700"
                                aria-label={`Rename ${folder.name}`}>
                                <PencilIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder);
                                }}
                                className="rounded-md p-1.5 text-ink-subtle hover:bg-danger-50 hover:text-danger-600"
                                aria-label={`Delete ${folder.name}`}>
                                <Trash2Icon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {visibleDocs.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Files</p>
                    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                      {visibleDocs.map((doc) => {
                        const style = FILE_TYPE_STYLE[doc.fileType] ?? FILE_TYPE_STYLE.PDF;
                        const Icon = style.icon;
                        return (
                          <li key={doc.id} className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-brand-50/40">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${style.className}`}>
                              <Icon className="h-[18px] w-[18px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.5px] font-semibold text-ink">{doc.title}</p>
                              <p className="truncate text-[11.5px] text-ink-subtle">
                                {doc.fileType} · {formatSize(doc.sizeMb)} · {doc.dateAdded} · {doc.uploadedBy}
                              </p>
                            </div>
                            <span
                              className={`hidden rounded-full px-2 py-0.5 text-[10.5px] font-bold sm:inline ${
                                doc.approvalStatus === 'Approved'
                                  ? 'bg-success-50 text-success-700'
                                  : 'bg-warning-50 text-warning-700'
                              }`}>
                              {doc.approvalStatus ?? 'Pending Review'}
                            </span>
                            <div className="flex shrink-0 gap-0.5">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="rounded-md p-1.5 text-ink-subtle hover:bg-canvas hover:text-brand-700"
                                aria-label={`Preview ${doc.title}`}>
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(doc)}
                                className="rounded-md p-1.5 text-ink-subtle hover:bg-danger-50 hover:text-danger-600"
                                aria-label={`Delete ${doc.title}`}>
                                <Trash2Icon className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  );
}
