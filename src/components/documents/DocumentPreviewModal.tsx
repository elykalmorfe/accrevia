import React from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EvidenceDocument } from '../../types/evidence';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { useAccess } from '../../hooks/useAccess';
import { Modal } from '../ui/Modal';
import { DocumentPage } from './DocumentPage';

interface DocumentPreviewModalProps {
  doc: EvidenceDocument | null;
  onClose: () => void;
  terms?: string[];
  query?: string;
}

export function DocumentPreviewModal({ doc, onClose, terms = [], query }: DocumentPreviewModalProps) {
  const lookup = useLookup();
  const { logAccess } = usePortal();
  const { rightsFor } = useAccess();
  const rights = doc ? rightsFor(doc.id) : { canView: false, canDownload: false };
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
          onClick={() => {
            logAccess('Downloaded', doc.id);
            toast.success(`Downloading ${doc.title}`);
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
          <DocumentPage doc={doc} terms={terms} />
        </div>
      }
    </Modal>);

}