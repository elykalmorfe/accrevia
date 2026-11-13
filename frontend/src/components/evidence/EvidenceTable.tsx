import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArchiveIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  PencilIcon,
  Share2Icon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ClockIcon,
  Building2Icon
} from 'lucide-react';
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
import { usePortalSettings } from '../../settings/portalSettings';

interface EvidenceTableProps {
  docs: EvidenceDocument[];
  onPreview: (doc: EvidenceDocument) => void;
  onEdit: (doc: EvidenceDocument) => void;
}

export function EvidenceTable({ docs: allDocs, onPreview, onEdit }: EvidenceTableProps) {
  const navigate = useNavigate();
  const { updateDocument, logAccess } = usePortal();
  const { openShare, openManageAccess } = useSharingDialogs();
  const lookup = useLookup();
  const { pageSize } = usePortalSettings().general;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(allDocs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const docs = allDocs.slice(firstIndex, firstIndex + pageSize);

  const renderApprovalBadge = (doc: EvidenceDocument) => {
    const isApproved = doc.approvalStatus === 'Approved';
    const isNeedsRevision = doc.approvalStatus === 'Needs Revision';

    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200/90 shadow-2xs whitespace-nowrap">
          <CheckCircle2Icon className="h-3 w-3 text-brand-600" />
          <span>Approved</span>
        </span>
      );
    }
    if (isNeedsRevision) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800 border border-brand-200/90 shadow-2xs whitespace-nowrap cursor-help"
          title={doc.revisionNotes ? 'Revision: ' + doc.revisionNotes : 'Requires revision'}
        >
          <AlertTriangleIcon className="h-3 w-3 text-brand-600" />
          <span>Needs Revision</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200/90 shadow-2xs whitespace-nowrap">
        <ClockIcon className="h-3 w-3 text-brand-600" />
        <span>Pending Review</span>
      </span>
    );
  };

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
      toast('Moved to Archived Documents', {
        description: doc.title,
        action: { label: 'Undo', onClick: () => updateDocument(doc.id, { status: previous }) }
      });
    }
  }];


  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1440px]">
          <thead className="bg-slate-50/90 border-b border-line text-xs font-bold text-slate-700">
            <tr>
              <th className="th">Document Title & Details</th>
              <th className="th">Accreditation Status</th>
              <th className="th">Framework</th>
              <th className="th">Area / Standard</th>
              <th className="th">Criterion · Indicator</th>
              <th className="th">Type</th>
              <th className="th">Office / Unit</th>
              <th className="th">Sharing</th>
              <th className="th">System Status</th>
              <th className="th">Date Added</th>
              <th className="th text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Title & Document Avatar */}
                <td className="td min-w-[320px] max-w-[380px]">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-[10px] font-black uppercase shadow-2xs ${
                        doc.fileType?.toLowerCase() === 'pdf'
                          ? 'bg-brand-50 text-brand-900 border-brand-200/90'
                          : doc.fileType?.toLowerCase().includes('doc')
                          ? 'bg-brand-50 text-brand-700 border-brand-200/90'
                          : doc.fileType?.toLowerCase().includes('xls')
                          ? 'bg-brand-50 text-brand-700 border-brand-200/90'
                          : 'bg-slate-50 text-slate-700 border-slate-200/90'
                      }`}
                      title={`${doc.fileType?.toUpperCase()} document`}
                    >
                      {doc.fileType?.toUpperCase() || 'FILE'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-bold text-xs text-slate-900 hover:text-brand-700 hover:underline line-clamp-1 transition-colors block"
                        title={doc.title}
                      >
                        {doc.title}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{doc.pages} pages</span>
                        <span>·</span>
                        <span>{doc.sizeMb || 1.2} MB</span>
                        {doc.campus && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5 text-slate-600 font-medium">
                              <Building2Icon className="h-3 w-3 text-slate-400" />
                              {doc.campus}
                            </span>
                          </>
                        )}
                        {doc.isoStage && (
                          <span className="rounded bg-brand-100 text-brand-800 font-bold px-1.5 py-0.2 text-[9.5px]">
                            {doc.isoStage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Accreditation Review Status */}
                <td className="td whitespace-nowrap">
                  {renderApprovalBadge(doc)}
                </td>

                {/* Framework */}
                <td className="td whitespace-nowrap">
                  <FrameworkTag frameworkId={doc.frameworkId} />
                </td>

                {/* Area / Standard */}
                <td className="td whitespace-nowrap text-xs font-medium text-slate-700">
                  {lookup.area(doc.areaId)?.shortName || lookup.area(doc.areaId)?.name || 'General'}
                </td>

                {/* Criterion · Indicator */}
                <td className="td whitespace-nowrap text-xs text-slate-600">
                  {lookup.criterion(doc.criterionId)?.code || '—'}
                  {lookup.indicator(doc.indicatorId)?.code ? ` · ${lookup.indicator(doc.indicatorId)?.code}` : ''}
                </td>

                {/* Document Type */}
                <td className="td whitespace-nowrap text-xs text-slate-600">
                  <span className="inline-block bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 text-[11px] font-medium border border-slate-200/60">
                    {doc.docType}
                  </span>
                </td>

                {/* Office / Unit */}
                <td className="td max-w-[180px] truncate text-xs text-slate-600" title={doc.office}>
                  {doc.office}
                </td>

                {/* Sharing Access */}
                <td className="td whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openManageAccess(doc.id)}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={`Manage access for ${doc.title}`}
                  >
                    <SharingStatusBadge documentId={doc.id} />
                  </button>
                </td>

                {/* System Processing Status */}
                <td className="td whitespace-nowrap">
                  <StatusBadge status={doc.status} />
                </td>

                {/* Date Added */}
                <td className="td whitespace-nowrap text-xs text-slate-500">
                  {formatDate(doc.dateAdded)}
                </td>

                {/* Row Quick Actions */}
                <td className="td">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      aria-label={`Preview ${doc.title}`}
                      title="Quick Preview"
                      onClick={() => onPreview(doc)}
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg"
                      aria-label={`Share ${doc.title}`}
                      title="Share Document"
                      onClick={() => openShare(doc.id)}
                    >
                      <Share2Icon className="h-3.5 w-3.5" />
                    </button>
                    <RowActionsMenu label={`More actions for ${doc.title}`} actions={actionsFor(doc)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line lg:hidden">
        {docs.map((doc) => (
          <li key={doc.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-[10px] font-black uppercase shadow-2xs ${
                    doc.fileType?.toLowerCase() === 'pdf'
                      ? 'bg-brand-50 text-brand-900 border-brand-200/90'
                      : doc.fileType?.toLowerCase().includes('doc')
                      ? 'bg-brand-50 text-brand-700 border-brand-200/90'
                      : doc.fileType?.toLowerCase().includes('xls')
                      ? 'bg-brand-50 text-brand-700 border-brand-200/90'
                      : 'bg-slate-50 text-slate-700 border-slate-200/90'
                  }`}
                >
                  {doc.fileType?.toUpperCase() || 'FILE'}
                </span>
                <div className="min-w-0">
                  <Link to={`/documents/${doc.id}`} className="text-sm font-bold text-slate-900 hover:text-brand-700 block">
                    {doc.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {renderApprovalBadge(doc)}
                    <FrameworkTag frameworkId={doc.frameworkId} />
                    <StatusBadge status={doc.status} />
                  </div>
                </div>
              </div>
              <RowActionsMenu label={`Actions for ${doc.title}`} actions={actionsFor(doc)} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Area</span>
                <span className="font-medium text-slate-800">{lookup.area(doc.areaId)?.shortName || 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Type</span>
                <span className="font-medium text-slate-800">{doc.docType}</span>
              </div>
              {doc.campus && (
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Campus</span>
                  <span className="font-medium text-slate-800">{doc.campus}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                className="btn btn-secondary btn-xs h-7 px-3 text-xs font-semibold gap-1.5 flex-1"
                onClick={() => onPreview(doc)}
              >
                <EyeIcon className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-xs h-7 px-3 text-xs font-semibold gap-1.5 flex-1"
                onClick={() => openShare(doc.id)}
              >
                <Share2Icon className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-ink-muted">
          <span>
            Showing <strong className="text-ink">{firstIndex + 1}–{firstIndex + docs.length}</strong> of{' '}
            <strong className="text-ink">{allDocs.length}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 tabular-nums">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>);

}