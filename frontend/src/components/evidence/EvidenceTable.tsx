import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  DatabaseIcon,
  HourglassIcon,
  Loader2Icon,
  XCircleIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useSharingDialogs } from '../../contexts/SharingDialogsContext';
import { useLookup } from '../../hooks/useLookup';
import { useAccess } from '../../hooks/useAccess';
import { downloadStoredFile } from '../../utils/fileStore';
import { DocumentBulkActions } from './DocumentBulkActions';
import { DocumentStatus, EvidenceDocument } from '../../types/evidence';
import { formatDate } from '../../utils/format';
import { FrameworkTag } from '../ui/FrameworkTag';
import { RowActionsMenu, RowAction } from '../ui/RowActionsMenu';
import { SharingStatusBadge } from '../sharing/SharingStatusBadge';
import { usePortalSettings } from '../../settings/portalSettings';

interface EvidenceTableProps {
  docs: EvidenceDocument[];
  onPreview: (doc: EvidenceDocument) => void;
  onEdit: (doc: EvidenceDocument) => void;
}

const processingStatusStyle: Partial<Record<DocumentStatus, { icon: React.ElementType; tone: string; spin?: boolean }>> = {
  Indexed: { icon: DatabaseIcon, tone: 'text-emerald-600' },
  Processing: { icon: Loader2Icon, tone: 'text-brand-600', spin: true },
  'Pending Classification': { icon: HourglassIcon, tone: 'text-amber-600' },
  Failed: { icon: XCircleIcon, tone: 'text-danger-600' }
};

function processingIndicator(doc: EvidenceDocument) {
  const style = doc.status ? processingStatusStyle[doc.status] : undefined;
  if (!style) return null;
  const Icon = style.icon;
  return (
    <p className="mt-1 inline-flex items-center gap-1 text-[11px] leading-4 text-slate-500" title="Document processing status">
      <Icon className={`h-3 w-3 shrink-0 ${style.tone} ${style.spin ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
      <span className="sr-only">Processing status:</span>
      {doc.status}
    </p>
  );
}

const emptyCell = (
  <span className="text-slate-400" aria-label="Not assigned">
    —
  </span>
);

function fileTypeIcon(doc: EvidenceDocument) {
  const type = doc.fileType?.toLowerCase() ?? '';
  const tone =
    type === 'pdf'
      ? 'border-rose-200/90 bg-rose-50 text-rose-700'
      : type.includes('doc')
      ? 'border-blue-200/90 bg-blue-50 text-blue-700'
      : type.includes('xls')
      ? 'border-emerald-200/90 bg-emerald-50 text-emerald-700'
      : 'border-slate-200/90 bg-slate-50 text-slate-700';
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-[10px] font-black uppercase ${tone}`}
      title={type ? `${type.toUpperCase()} file` : 'File'}
    >
      {type.toUpperCase() || 'FILE'}
    </span>
  );
}

export function EvidenceTable({ docs: allDocs, onPreview, onEdit }: EvidenceTableProps) {
  const navigate = useNavigate();
  const { updateDocument, logAccess, isAdmin } = usePortal();
  const { rightsFor } = useAccess();
  const { openShare, openManageAccess } = useSharingDialogs();
  const lookup = useLookup();
  const { pageSize } = usePortalSettings().general;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(allDocs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const docs = allDocs.slice(firstIndex, firstIndex + pageSize);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(allDocs.map((d) => d.id));
      const kept = [...prev].filter((id) => visible.has(id));
      return kept.length === prev.size ? prev : new Set(kept);
    });
  }, [allDocs]);
  const selectedDocs = useMemo(() => allDocs.filter((d) => selectedIds.has(d.id)), [allDocs, selectedIds]);
  const pageSelectedCount = docs.filter((d) => selectedIds.has(d.id)).length;
  const pageAllSelected = docs.length > 0 && pageSelectedCount === docs.length;
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = pageSelectedCount > 0 && !pageAllSelected;
  }, [pageSelectedCount, pageAllSelected]);

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const togglePage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      docs.forEach((d) => (pageAllSelected ? next.delete(d.id) : next.add(d.id)));
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());

  const rowCheckbox = (doc: EvidenceDocument) => (
    <input
      type="checkbox"
      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      checked={selectedIds.has(doc.id)}
      onChange={() => toggleSelected(doc.id)}
      aria-label={`Select ${doc.title}`}
    />
  );

  const renderApprovalBadge = (doc: EvidenceDocument) => {
    const badge = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold';
    if (doc.approvalStatus === 'Approved') {
      return (
        <span className={`${badge} border-emerald-200 bg-emerald-50 text-emerald-700`}>
          <CheckCircle2Icon className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          Approved
        </span>
      );
    }
    if (doc.approvalStatus === 'Needs Revision') {
      return (
        <span
          className={`${badge} cursor-help border-orange-200 bg-orange-50 text-orange-700`}
          title={doc.revisionNotes ? 'Revision: ' + doc.revisionNotes : 'Requires revision'}
        >
          <AlertTriangleIcon className="h-3 w-3 text-orange-600" aria-hidden="true" />
          Needs Revision
        </span>
      );
    }
    return (
      <span className={`${badge} border-blue-200 bg-blue-50 text-brand-700`}>
        <ClockIcon className="h-3 w-3 text-brand-600" aria-hidden="true" />
        Pending Review
      </span>
    );
  };

  const fileDetails = (doc: EvidenceDocument) =>
    [
      doc.pages ? `${doc.pages} ${doc.pages === 1 ? 'page' : 'pages'}` : null,
      doc.sizeMb ? `${doc.sizeMb} MB` : null,
      doc.campus || null
    ].filter(Boolean) as string[];

  const actionsFor = (doc: EvidenceDocument): RowAction[] => {
    const rights = rightsFor(doc.id);
    const actions: RowAction[] = [];
    if (rights.canView) actions.push({ label: 'View document', icon: FileTextIcon, onSelect: () => navigate(`/documents/${doc.id}`) });
    if (isAdmin) {
      actions.push(
        { label: 'Edit metadata', icon: PencilIcon, onSelect: () => onEdit(doc) },
        { label: 'Manage access', icon: ShieldCheckIcon, onSelect: () => openManageAccess(doc.id) }
      );
    }
    if (rights.canDownload) {
      actions.push({
        label: 'Download',
        icon: DownloadIcon,
        onSelect: async () => {
          logAccess('Downloaded', doc.id);
          const saved = await downloadStoredFile(doc.id, doc.title);
          toast.success(saved ? `Downloading ${doc.title}` : `No original file stored for ${doc.title}`);
        }
      });
    }
    if (isAdmin) {
      actions.push({
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
      });
    }
    return actions;
  };


  return (
    <>
      {selectedDocs.length > 0 && (
        <DocumentBulkActions
          selected={selectedDocs}
          totalCount={allDocs.length}
          onSelectAll={() => setSelectedIds(new Set(allDocs.map((d) => d.id)))}
          onClear={clearSelection}
        />
      )}

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1240px] table-fixed text-left">
          <colgroup>
            <col className="w-[3%]" />
            <col className="w-[22.5%]" />
            <col className="w-[11.5%]" />
            <col className="w-[7.5%]" />
            <col className="w-[9%]" />
            <col className="w-[8.5%]" />
            <col className="w-[8.5%]" />
            <col className="w-[9.5%]" />
            <col className="w-[9.5%]" />
            <col className="w-[10.5%]" />
          </colgroup>
          <thead className="border-b border-line bg-slate-50/90 text-xs font-bold text-slate-700">
            <tr className="[&>th:first-child]:pl-4 [&>th:first-child]:pr-0 [&>th]:whitespace-normal [&>th]:px-2.5 [&>th]:align-bottom">
              <th className="th">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={pageAllSelected}
                  onChange={togglePage}
                  aria-label={pageAllSelected ? 'Deselect all documents on this page' : 'Select all documents on this page'}
                />
              </th>
              <th className="th">Document Title &amp; Details</th>
              <th className="th">Accreditation Status</th>
              <th className="th">Framework</th>
              <th className="th">Area / Standard</th>
              <th className="th">Criterion · Indicator</th>
              <th className="th">Type</th>
              <th className="th">Office / Unit</th>
              <th className="th">Sharing</th>
              <th className="th">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.map((doc) => {
              const area = lookup.area(doc.areaId);
              const criterion = lookup.criterion(doc.criterionId);
              const indicator = lookup.indicator(doc.indicatorId);
              const details = fileDetails(doc);
              return (
                <tr
                  key={doc.id}
                  className={`transition-colors [&>td:first-child]:pl-4 [&>td:first-child]:pr-0 [&>td:last-child]:pl-1.5 [&>td:last-child]:pr-2 [&>td]:px-2.5 ${
                    selectedIds.has(doc.id) ? 'bg-brand-50/50 hover:bg-brand-50/70' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="td">{rowCheckbox(doc)}</td>
                  <td className="td">
                    <div className="flex items-start gap-2.5">
                      {fileTypeIcon(doc)}
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="line-clamp-2 break-words text-[13px] font-bold leading-snug text-slate-900 transition-colors hover:text-brand-700 hover:underline"
                          title={doc.title}
                        >
                          {doc.title}
                        </Link>
                        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-4 text-slate-500">
                          {details.map((d, i) => (
                            <React.Fragment key={d}>
                              {i > 0 && <span aria-hidden="true">·</span>}
                              <span>{d}</span>
                            </React.Fragment>
                          ))}
                          {details.length > 0 && <span aria-hidden="true">·</span>}
                          <span>Added {formatDate(doc.dateAdded)}</span>
                          {doc.isoStage && (
                            <span className="rounded bg-purple-100 px-1.5 text-[10px] font-bold text-purple-800">{doc.isoStage}</span>
                          )}
                        </p>
                        {processingIndicator(doc)}
                      </div>
                    </div>
                  </td>

                  <td className="td">{renderApprovalBadge(doc)}</td>

                  <td className="td">{doc.frameworkId ? <FrameworkTag frameworkId={doc.frameworkId} /> : emptyCell}</td>

                  <td className="td text-xs font-medium text-slate-700">
                    {area ? (
                      <span className="line-clamp-2 break-words" title={area.name}>
                        {area.shortName || area.name}
                      </span>
                    ) : (
                      emptyCell
                    )}
                  </td>

                  <td className="td text-xs">
                    {criterion ? (
                      <>
                        <span className="block truncate font-medium text-slate-800" title={`${criterion.code} – ${criterion.name}`}>
                          {criterion.code}
                        </span>
                        {indicator && (
                          <span className="block truncate text-[11px] text-slate-500" title={`${indicator.code} – ${indicator.name}`}>
                            Indicator {indicator.code}
                          </span>
                        )}
                      </>
                    ) : (
                      emptyCell
                    )}
                  </td>

                  <td className="td">
                    <span
                      className="inline-block max-w-full break-words rounded-md border border-slate-200/70 bg-slate-100 px-2 py-0.5 align-middle text-[11px] font-medium leading-4 text-slate-700"
                    >
                      {doc.docType}
                    </span>
                  </td>

                  <td className="td text-xs text-slate-600">
                    {doc.office ? (
                      <span className="line-clamp-2 break-words" title={doc.office}>
                        {doc.office}
                      </span>
                    ) : (
                      emptyCell
                    )}
                  </td>

                  <td className="td">
                    <button
                      type="button"
                      onClick={() => openManageAccess(doc.id)}
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={`Manage access for ${doc.title}`}
                      title="Manage access"
                    >
                      <SharingStatusBadge documentId={doc.id} />
                    </button>
                  </td>

                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost h-7 min-h-0 w-7 shrink-0 rounded-lg p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        aria-label={`Preview ${doc.title}`}
                        title="Quick preview"
                        onClick={() => onPreview(doc)}
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost h-7 min-h-0 w-7 shrink-0 rounded-lg p-0 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                        aria-label={`Share ${doc.title}`}
                        title="Share document"
                        onClick={() => openShare(doc.id)}
                      >
                        <Share2Icon className="h-3.5 w-3.5" />
                      </button>
                      <RowActionsMenu label={`More actions for ${doc.title}`} actions={actionsFor(doc)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line lg:hidden">
        {docs.map((doc) => (
          <li
            key={doc.id}
            className={`p-4 space-y-3 transition-colors ${selectedIds.has(doc.id) ? 'bg-brand-50/50' : 'hover:bg-slate-50/60'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="flex h-8 shrink-0 items-center">{rowCheckbox(doc)}</span>
                {fileTypeIcon(doc)}
                <div className="min-w-0">
                  <Link to={`/documents/${doc.id}`} className="text-sm font-bold text-slate-900 hover:text-brand-700 block">
                    {doc.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {renderApprovalBadge(doc)}
                    <FrameworkTag frameworkId={doc.frameworkId} />
                  </div>
                  {processingIndicator(doc)}
                </div>
              </div>
              <RowActionsMenu label={`Actions for ${doc.title}`} actions={actionsFor(doc)} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Area</span>
                <span className="font-medium text-slate-800">{lookup.area(doc.areaId)?.shortName || emptyCell}</span>
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