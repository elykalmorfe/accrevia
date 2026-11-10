import React from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EvidenceDocument } from '../../types/evidence';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { useAccess } from '../../hooks/useAccess';
import { Modal } from '../ui/Modal';
import { downloadStoredFile } from '../../utils/fileStore';
import { OriginalDocumentView } from './OriginalDocumentView';

interface DocumentPreviewModalProps {
  doc: EvidenceDocument | null;
  onClose: () => void;
  terms?: string[];
  query?: string;
  /** Lets everyone who can open the surrounding screen view and download, regardless of shares. */
  grantAccess?: boolean;
}

export function DocumentPreviewModal({ doc, onClose, terms = [], query, grantAccess = false }: DocumentPreviewModalProps) {
  const lookup = useLookup();
  const { logAccess } = usePortal();
  const { rightsFor } = useAccess();
  const rights = !doc ? { canView: false, canDownload: false } : grantAccess ? { canView: true, canDownload: true } : rightsFor(doc.id);
  const meta = doc ?
  [lookup.framework(doc.frameworkId)?.shortName, lookup.criterion(doc.criterionId)?.code, doc.docType, `${doc.pages} pages`].filter(Boolean).join(' · ') :
  '';

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title={doc?.title ?? ''}
      description={meta}
      size="xl"
      footer={
      doc &&
      <>
            {rights.canDownload &&
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            logAccess('Downloaded', doc.id);
            const saved = await downloadStoredFile(doc.id, doc.title);
            toast.success(saved ? `Downloading ${doc.title}` : `No original file stored for ${doc.title}`);
          }}>
          
                <DownloadIcon className="h-4 w-4" /> Download
              </button>
        }
            <Link to={`/documents/${doc.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`} className="btn btn-primary" onClick={onClose}>
              Open full viewer
            </Link>
          </>

      }>
      
      {doc && rights.canView &&
      <div className="-mx-6 -my-5 bg-canvas p-4 sm:p-6">
          <OriginalDocumentView doc={doc} terms={terms} canDownload={rights.canDownload} />
        </div>
      }
    </Modal>);

}