import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, EyeIcon, FolderIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../contexts/PortalContext';
import { useAccess } from '../../hooks/useAccess';
import { useInstitutionalMutationAccess } from '../../hooks/useInstitutionalMutationAccess';
import type { CampusId } from '../../types/accreditation';
import type { EvidenceDocument } from '../../types/evidence';
import { repositoryDescendantIds, uploadedFrameworkRecords } from '../../utils/repositoryView';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';
import { FileList, FileRow, FileRowAction } from '../upload/FileRow';

/** These are the original shared records, not imported copies. */
export function UploadedFrameworkRepository({frameworkId, campus}: {frameworkId: string; campus: CampusId | 'all'}) {
  const {folders, documents} = usePortal();
  const {rightsFor} = useAccess();
  const {canMutate} = useInstitutionalMutationAccess();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);
  const [query, setQuery] = useState('');
  const records = useMemo(() => uploadedFrameworkRecords(frameworkId, campus, folders, documents), [frameworkId, campus, folders, documents]);
  const visibleDocs = records.documents.filter(doc => canMutate || rightsFor(doc.id).canView);
  const visibleFolders = canMutate ? records.folders : records.folders.filter(folder => {
    const ids = repositoryDescendantIds(folder.id, records.folders);
    return visibleDocs.some(doc => !!doc.folderId && ids.has(doc.folderId));
  });
  const ids = new Set(visibleFolders.map(folder => folder.id));
  const current = visibleFolders.find(folder => folder.id === activeId);
  const selected = current?.id || null;
  const needle = query.trim().toLowerCase();
  const childFolders = visibleFolders.filter(folder => (selected ? folder.parentId === selected : !folder.parentId || !ids.has(folder.parentId)) && (!needle || `${folder.name} ${folder.code}`.toLowerCase().includes(needle)));
  const childDocs = visibleDocs.filter(doc => (selected ? doc.folderId === selected : !doc.folderId || !ids.has(doc.folderId)) && (!needle || doc.title.toLowerCase().includes(needle)));

  useEffect(() => {setActiveId(null); setPreview(null); setQuery('');}, [frameworkId, campus]);

  return <section className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-ink">Documents from Upload Documents</h2>
        <p className="mt-1 text-xs text-ink-muted">Folders and files added there appear here automatically for the selected campus.</p>
      </div>
      {canMutate && <Link className="btn btn-secondary btn-sm" to={`/evidence/upload?folder=folder-${frameworkId}`}>Manage in Upload Documents</Link>}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {current && <button type="button" className="btn btn-secondary btn-sm" onClick={() => {setActiveId(current.parentId && ids.has(current.parentId) ? current.parentId : null);setQuery('');}}><ArrowLeftIcon className="h-4 w-4" />Back</button>}
      <span className="text-sm font-semibold text-ink">{current?.name || 'All uploaded folders'} · {visibleDocs.length} files</span>
      <input className="input ml-auto max-w-xs text-sm" aria-label="Search uploaded folders and files" placeholder="Search this folder…" value={query} onChange={event => setQuery(event.target.value)} />
    </div>
    {childFolders.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{childFolders.map(folder => <button key={folder.id} type="button" className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:bg-brand-50" onClick={() => {setActiveId(folder.id);setQuery('');}}><FolderIcon className="h-6 w-6 shrink-0 text-brand-600" /><span className="min-w-0 break-words text-sm font-semibold">{folder.name}</span></button>)}</div>}
    {childDocs.length > 0 && <FileList>{childDocs.map(doc => <FileRow documentId={doc.id} key={doc.id} name={doc.title} fileType={doc.fileType} meta={[doc.campus, doc.program].filter(Boolean).join(' · ')} onOpen={() => setPreview(doc)} actions={<FileRowAction icon={EyeIcon} label={`View ${doc.title}`} onClick={() => setPreview(doc)} />} />)}</FileList>}
    {!childFolders.length && !childDocs.length && <p className="py-4 text-sm text-ink-muted">No matching uploaded folders or files in this location.</p>}
    <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} grantAccess={canMutate} />
  </section>;
}
