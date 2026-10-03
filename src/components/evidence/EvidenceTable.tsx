import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArchiveIcon, DownloadIcon, EyeIcon, FileTextIcon, PencilIcon, Share2Icon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useSharingDialogs } from '../../contexts/SharingDialogsContext';
import { useLookup } from '../../hooks/useLookup';
import { EvidenceDocument } from '../../types/evidence';
import { formatDate } from '../../utils/format';
import { StatusBadge } from '../ui/StatusBadge';
import { FrameworkTag } from '../ui/FrameworkTag';
import { RowActionsMenu, RowAction } from '../ui/RowActionsMenu';
import { SharingStatusBadge } from '../sharing/SharingStatusBadge';

interface EvidenceTableProps {
  docs: EvidenceDocument[];
  onPreview: (doc: EvidenceDocument) => void;
  onEdit: (doc: EvidenceDocument) => void;
}

export function EvidenceTable({ docs, onPreview, onEdit }: EvidenceTableProps) {
  const navigate = useNavigate();
  const { updateDocument, logAccess } = usePortal();
  const { openShare, openManageAccess } = useSharingDialogs();
  const lookup = useLookup();

  const actionsFor = (doc: EvidenceDocument): RowAction[] => [
  { label: 'View document', icon: FileTextIcon, onSelect: () => navigate(`/documents/${doc.id}`) },
  { label: 'Preview', icon: EyeIcon, onSelect: () => onPreview(doc) },
  { label: 'Edit metadata', icon: PencilIcon, onSelect: () => onEdit(doc) },
  { label: 'Share', icon: Share2Icon, onSelect: () => openShare(doc.id) },
  { label: 'Manage access', icon: ShieldCheckIcon, onSelect: () => openManageAccess(doc.id) },
  {
    label: 'Download',
    icon: DownloadIcon,
    onSelect: () => {
      logAccess('Downloaded', doc.id);
      toast.success(`Downloading ${doc.title}`);
    }
  },
  {
    label: 'Archive',
    icon: ArchiveIcon,
    tone: 'danger',
    onSelect: () => {
      const previous = doc.status;
      updateDocument(doc.id, { status: 'Archived' });
      toast('Moved to Archived Evidence', {
        description: doc.title,
        action: { label: 'Undo', onClick: () => updateDocument(doc.id, { status: previous }) }
      });
    }
  }];


  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1440px]">
          <thead className="bg-canvas">
            <tr>
              <th className="th">Document title</th>
              <th className="th">Framework</th>
              <th className="th">Accreditation area</th>
              <th className="th">Criterion</th>
              <th className="th">Indicator</th>
              <th className="th">Document type</th>
              <th className="th">Academic year</th>
              <th className="th">Office / Unit</th>
              <th className="th">Sharing</th>
              <th className="th">Processing</th>
              <th className="th">Date added</th>
              <th className="th text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.map((doc) =>
            <tr key={doc.id} className="hover:bg-canvas/60">
                <td className="td min-w-[280px] max-w-[340px]">
                  <Link to={`/documents/${doc.id}`} className="font-medium text-ink hover:text-brand-700 hover:underline">{doc.title}</Link>
                  <p className="mt-0.5 text-xs text-ink-subtle">{doc.fileType} · {doc.pages} pages · {doc.confidentiality}</p>
                </td>
                <td className="td"><FrameworkTag frameworkId={doc.frameworkId} /></td>
                <td className="td whitespace-nowrap text-ink-muted">{lookup.area(doc.areaId)?.shortName}</td>
                <td className="td whitespace-nowrap text-ink-muted">{lookup.criterion(doc.criterionId)?.code}</td>
                <td className="td whitespace-nowrap text-ink-muted">{lookup.indicator(doc.indicatorId)?.code}</td>
                <td className="td whitespace-nowrap text-ink-muted">{doc.docType}</td>
                <td className="td whitespace-nowrap text-ink-muted">{doc.academicYear}</td>
                <td className="td max-w-[200px] text-ink-muted">{doc.office}</td>
                <td className="td">
                  <button type="button" onClick={() => openManageAccess(doc.id)} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={`Manage access for ${doc.title}`}>
                    <SharingStatusBadge documentId={doc.id} />
                  </button>
                </td>
                <td className="td"><StatusBadge status={doc.status} /></td>
                <td className="td whitespace-nowrap text-ink-muted">{formatDate(doc.dateAdded)}</td>
                <td className="td">
                  <div className="flex items-center justify-end gap-0.5">
                    <button type="button" className="btn btn-ghost btn-icon" aria-label={`Share ${doc.title}`} title="Share" onClick={() => openShare(doc.id)}>
                      <Share2Icon className="h-4 w-4" />
                    </button>
                    <RowActionsMenu label={`More actions for ${doc.title}`} actions={actionsFor(doc)} />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line lg:hidden">
        {docs.map((doc) =>
        <li key={doc.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/documents/${doc.id}`} className="text-sm font-medium text-ink hover:text-brand-700">{doc.title}</Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <FrameworkTag frameworkId={doc.frameworkId} />
                  <StatusBadge status={doc.status} />
                  <SharingStatusBadge documentId={doc.id} />
                </div>
              </div>
              <RowActionsMenu label={`Actions for ${doc.title}`} actions={actionsFor(doc)} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
              <div><dt className="text-ink-subtle">Area</dt><dd className="text-ink">{lookup.area(doc.areaId)?.shortName}</dd></div>
              <div><dt className="text-ink-subtle">Criterion · Indicator</dt><dd className="text-ink">{lookup.criterion(doc.criterionId)?.code} · {lookup.indicator(doc.indicatorId)?.code}</dd></div>
              <div><dt className="text-ink-subtle">Type</dt><dd className="text-ink">{doc.docType}</dd></div>
              <div><dt className="text-ink-subtle">Academic year</dt><dd className="text-ink">{doc.academicYear}</dd></div>
              <div className="col-span-2"><dt className="text-ink-subtle">Office / Unit</dt><dd className="text-ink">{doc.office}</dd></div>
            </dl>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openShare(doc.id)}><Share2Icon className="h-3.5 w-3.5" /> Share</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openManageAccess(doc.id)}><ShieldCheckIcon className="h-3.5 w-3.5" /> Manage access</button>
            </div>
          </li>
        )}
      </ul>
    </>);

}