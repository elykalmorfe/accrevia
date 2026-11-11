import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  CheckIcon,
  ChevronRightIcon,
  CloudUploadIcon,
  DownloadIcon,
  EyeIcon,
  FolderPlusIcon,
  FolderUpIcon,
  HomeIcon,
  LockIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  XIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';
import { FolderAction, FolderCard, FolderStatus } from '../folders/FolderCard';
import { downloadStoredFile, persistUpload } from '../../utils/fileStore';
import { filesFromInput, PendingUpload } from '../../utils/dropFiles';
import { filterAllowedUploads, uploadAcceptAttribute } from '../../utils/uploadRules';
import { pluralize } from '../../utils/format';
import type { EvidenceDocument, EvidenceFolder } from '../../types/evidence';
import { formatSize } from './fileTypeStyle';
import { FileList, FileRow, FileRowAction, FileStatusPill } from './FileRow';
import { UploadDropzone } from './UploadDropzone';

export interface UploadTarget {
  folderId: string | null;
  label: string;
}

interface FolderExplorerProps {
  /** Folders and documents already scoped to this workspace. */
  folders: EvidenceFolder[];
  documents: EvidenceDocument[];
  rootLabel: string;
  canEdit?: boolean;
  buildFolder: (name: string, parentId: string | null) => EvidenceFolder;
  buildDocument: (file: File, folderId: string | null) => EvidenceDocument;
  /** Where uploads made from the current location go; defaults to the current folder. */
  resolveUploadTarget?: (currentFolderId: string | null) => UploadTarget;
  onUploaded?: (docs: EvidenceDocument[]) => void;
  folderStatus?: (folder: EvidenceFolder, fileCount: number) => FolderStatus | null;
  folderEyebrow?: (folder: EvidenceFolder) => ReactNode;
  showApproval?: boolean;
  /** Replaces the approval pill on each file row. */
  documentStatus?: (doc: EvidenceDocument) => ReactNode;
  /** Extra row actions rendered before preview/download/delete. */
  documentActions?: (doc: EvidenceDocument) => ReactNode;
  /** Everyone who can open this explorer may preview and download its files, even without a share. */
  openToViewers?: boolean;
  /** Content above the toolbar, e.g. a stats strip. */
  summary?: ReactNode;
  emptyHint?: string;
  /** Changing this resets navigation (e.g. a different area or program). */
  resetKey?: string;
}

const isSystem = (f: EvidenceFolder) => !!f.isSystem;

export function FolderExplorer({
  folders,
  documents,
  rootLabel,
  canEdit = true,
  buildFolder,
  buildDocument,
  resolveUploadTarget,
  onUploaded,
  folderStatus,
  folderEyebrow,
  showApproval = true,
  documentStatus,
  documentActions,
  openToViewers = false,
  summary,
  emptyHint,
  resetKey
}: FolderExplorerProps) {
  const { saveFolder, deleteFolder, addDocument, deleteDocument } = usePortal();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentFolderId(null);
    setQuery('');
    setCreatingFolder(false);
    setRenamingId(null);
  }, [resetKey]);

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
    folderInputRef.current?.setAttribute('directory', '');
  }, [canEdit]);

  useEffect(() => {
    if (currentFolderId && !folders.some((f) => f.id === currentFolderId)) setCurrentFolderId(null);
  }, [folders, currentFolderId]);

  const descendantFolderIds = (rootId: string): string[] => {
    const ids = [rootId];
    for (let i = 0; i < ids.length; i++) {
      folders.forEach((f) => f.parentId === ids[i] && ids.push(f.id));
    }
    return ids;
  };

  const fileCountIn = (folderId: string) => {
    const ids = new Set(descendantFolderIds(folderId));
    return documents.filter((d) => d.folderId && ids.has(d.folderId)).length;
  };

  const breadcrumb = useMemo(() => {
    const trail: EvidenceFolder[] = [];
    let cursor = folders.find((f) => f.id === currentFolderId);
    while (cursor) {
      trail.unshift(cursor);
      cursor = folders.find((f) => f.id === cursor?.parentId);
    }
    return trail;
  }, [folders, currentFolderId]);

  const q = query.trim().toLowerCase();
  const visibleFolders = (
    q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : folders.filter((f) => (f.parentId ?? null) === currentFolderId)
  )
    .slice()
    .sort((a, b) => (isSystem(a) === isSystem(b) ? (isSystem(a) ? 0 : a.name.localeCompare(b.name)) : isSystem(a) ? -1 : 1));
  const visibleDocs = q
    ? documents.filter((d) => d.title.toLowerCase().includes(q))
    : documents.filter((d) => (d.folderId ?? null) === currentFolderId);

  const locationLabel = breadcrumb.length ? breadcrumb[breadcrumb.length - 1].name : rootLabel;
  const target: UploadTarget = resolveUploadTarget
    ? resolveUploadTarget(currentFolderId)
    : { folderId: currentFolderId, label: locationLabel };

  const ingest = (uploads: PendingUpload[]) => {
    if (!canEdit) return;
    const accepted = filterAllowedUploads(uploads, (u) => u.file);
    if (!accepted.length) return;

    const created: EvidenceFolder[] = [];
    const resolveFolder = (segments: string[]): string | null => {
      let parent = target.folderId;
      for (const name of segments) {
        const match = [...folders, ...created].find((f) => f.name === name && (f.parentId ?? null) === parent);
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

    const docs = accepted.map(({ file, path }) => {
      const segments = path.split('/').filter(Boolean);
      const doc = buildDocument(file, resolveFolder(segments.slice(0, -1)));
      persistUpload(doc.id, file);
      addDocument(doc);
      return doc;
    });
    created.forEach(saveFolder);
    onUploaded?.(docs);

    toast.success(
      `Uploaded ${pluralize(docs.length, 'file')} to "${target.label}"` +
        (created.length ? ` and created ${pluralize(created.length, 'folder')}` : '')
    );
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const exists = folders.some((f) => f.name.toLowerCase() === name.toLowerCase() && (f.parentId ?? null) === currentFolderId);
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
    const inside = documents.filter((d) => d.folderId && ids.includes(d.folderId));
    const detail = inside.length ? ` and its ${pluralize(inside.length, 'file')}` : '';
    if (!confirm(`Delete folder "${folder.name}"${detail}? This cannot be undone.`)) return;
    inside.forEach((d) => deleteDocument(d.id));
    ids.forEach(deleteFolder);
    toast.success('Folder deleted');
  };

  const handleDeleteDoc = (doc: EvidenceDocument) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    deleteDocument(doc.id);
    toast.success('File removed');
  };

  const handleDownload = async (doc: EvidenceDocument) => {
    const ok = await downloadStoredFile(doc.id, doc.title);
    if (!ok) toast.error('The original file is not stored in this browser.');
  };

  const isEmpty = !visibleFolders.length && !visibleDocs.length;
  const toolbarButton =
    'inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-700';

  return (
    <div className="space-y-4">
      {summary}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex min-w-0 flex-wrap items-center gap-1 text-[13px]" aria-label="Folder path">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition-colors ${
              currentFolderId ? 'text-ink-muted hover:bg-canvas hover:text-ink' : 'text-brand-700'
            }`}
          >
            <HomeIcon className="h-3.5 w-3.5" />
            {rootLabel}
          </button>
          {breadcrumb.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRightIcon className="h-3.5 w-3.5 text-ink-subtle" />
              <button
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className={`max-w-[180px] truncate rounded-lg px-2 py-1 font-semibold transition-colors ${
                  index === breadcrumb.length - 1 ? 'text-brand-700' : 'text-ink-muted hover:bg-canvas hover:text-ink'
                }`}
              >
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
              placeholder="Search files and folders…"
              className="h-9 w-48 rounded-lg border border-line bg-white pl-8 pr-3 text-[13px] outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => {
                  setCreatingFolder(true);
                  setQuery('');
                }}
                className={toolbarButton}
              >
                <FolderPlusIcon className="h-4 w-4" />
                New Folder
              </button>
              <button type="button" onClick={() => folderInputRef.current?.click()} className={toolbarButton}>
                <FolderUpIcon className="h-4 w-4" />
                Upload Folder
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
              >
                <UploadIcon className="h-4 w-4" />
                Upload Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept={uploadAcceptAttribute()}
                onChange={(e) => {
                  ingest(filesFromInput(e.target.files));
                  e.target.value = '';
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  ingest(filesFromInput(e.target.files));
                  e.target.value = '';
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Workspace / dropzone */}
      <UploadDropzone variant="area" onFiles={ingest} disabled={!canEdit} targetLabel={target.label} className="min-h-[300px]">
        {creatingFolder && canEdit && (
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
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-[12.5px] font-semibold text-white hover:bg-brand-700"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreatingFolder(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-canvas hover:text-ink"
              aria-label="Cancel"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {isEmpty ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white/70 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-500/30">
              <CloudUploadIcon className="h-7 w-7" />
            </span>
            <p className="mt-4 text-[15px] font-bold text-ink">{q ? 'No matches' : 'This folder is empty'}</p>
            <p className="mt-1 max-w-sm text-[13px] text-ink-muted">
              {q
                ? 'Try a different file or folder name.'
                : canEdit
                ? emptyHint ?? 'Drag & drop files or entire folders here, or use the buttons above.'
                : 'Nothing has been uploaded here yet.'}
            </p>
            {!q && canEdit && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold text-white hover:bg-brand-700"
                >
                  <UploadIcon className="h-4 w-4" />
                  Browse Files
                </button>
                <button type="button" onClick={() => setCreatingFolder(true)} className={toolbarButton}>
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
                    const subCount = folders.filter((f) => f.parentId === folder.id).length;
                    const locked = isSystem(folder);
                    return (
                      <FolderCard
                        key={folder.id}
                        onOpen={() => {
                          if (renamingId === folder.id) return;
                          setQuery('');
                          setCurrentFolderId(folder.id);
                        }}
                        title={`Open ${folder.name}`}
                        eyebrow={folderEyebrow?.(folder)}
                        name={
                          renamingId === folder.id ? (
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
                            <span className="inline-flex items-center gap-1.5">
                              {folder.name}
                              {locked && <LockIcon className="h-3 w-3 text-ink-subtle" aria-label="System folder" />}
                            </span>
                          )
                        }
                        meta={`${pluralize(count, 'file')}${subCount > 0 ? ` · ${pluralize(subCount, 'folder')}` : ''}`}
                        status={folderStatus ? folderStatus(folder, count) : count === 0 ? { label: 'No files yet', tone: 'neutral' } : null}
                        actions={
                          canEdit && !locked ? (
                            <>
                              <FolderAction
                                icon={PencilIcon}
                                label={`Rename ${folder.name}`}
                                onClick={() => {
                                  setRenamingId(folder.id);
                                  setRenameValue(folder.name);
                                }}
                              />
                              <FolderAction icon={Trash2Icon} label={`Delete ${folder.name}`} danger onClick={() => handleDeleteFolder(folder)} />
                            </>
                          ) : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {visibleDocs.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Files</p>
                <FileList>
                  {visibleDocs.map((doc) => (
                    <FileRow
                      key={doc.id}
                      name={doc.title}
                      fileType={doc.fileType}
                      onOpen={() => setPreviewDoc(doc)}
                      meta={`${doc.fileType} · ${formatSize(doc.sizeMb)} · ${doc.dateAdded} · ${doc.uploadedBy}`}
                      status={
                        documentStatus ? documentStatus(doc) : showApproval ? <FileStatusPill status={doc.approvalStatus} /> : undefined
                      }
                      actions={
                        <>
                          {documentActions?.(doc)}
                          <FileRowAction icon={EyeIcon} label={`Preview ${doc.title}`} onClick={() => setPreviewDoc(doc)} />
                          {(canEdit || openToViewers) && (
                            <FileRowAction icon={DownloadIcon} label={`Download ${doc.title}`} onClick={() => handleDownload(doc)} />
                          )}
                          {canEdit && (
                            <FileRowAction icon={Trash2Icon} label={`Delete ${doc.title}`} danger onClick={() => handleDeleteDoc(doc)} />
                          )}
                        </>
                      }
                    />
                  ))}
                </FileList>
              </div>
            )}
          </div>
        )}
      </UploadDropzone>

      {/* Portaled so it isn't trapped inside a parent modal's transformed container. */}
      {createPortal(
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} grantAccess={openToViewers} />,
        document.body
      )}
    </div>
  );
}
