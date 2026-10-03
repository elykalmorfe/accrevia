import React from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { EvidenceDocument } from '../../types/evidence';
import { DocumentShare } from '../../types/sharing';
import { expiryLabel, summarizeShares } from '../../utils/sharing';
import { PermissionIndicator } from './PermissionIndicator';

export function SharedDocumentRow({ doc, shares }: {doc: EvidenceDocument;shares: DocumentShare[];}) {
  const { logAccess } = usePortal();
  const lookup = useLookup();
  const summary = summarizeShares(shares);

  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-6">
      <div className="min-w-0 flex-1">
        <Link to={`/documents/${doc.id}`} className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline">{doc.title}</Link>
        <p className="mt-0.5 text-xs text-ink-muted">
          {lookup.framework(doc.frameworkId)?.name} · {lookup.criterion(doc.criterionId)?.code} · {doc.docType} · AY {doc.academicYear}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
          <span><span className="sr-only">Permission: </span><PermissionIndicator canDownload={summary.canDownload} /></span>
          <span>Shared by {summary.sharedBy}</span>
          <span>Expires: <span className="text-ink">{expiryLabel(summary.expiresAt)}</span></span>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link to={`/documents/${doc.id}`} className="btn btn-secondary btn-sm">View</Link>
        {summary.canDownload &&
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            logAccess('Downloaded', doc.id);
            toast.success(`Downloading ${doc.title}`);
          }}>
          
            <DownloadIcon className="h-3.5 w-3.5" /> Download
          </button>
        }
      </div>
    </li>);

}