import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TriangleAlertIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { DocumentMetadata, EvidenceDocument } from '../../types/evidence';
import { emptyMetadata, metadataToPatch, missingRequiredFields, toMetadata } from '../../utils/metadata';
import { Modal } from '../ui/Modal';
import { MetadataForm } from './MetadataForm';

export function EditMetadataModal({ doc, onClose }: {doc: EvidenceDocument | null;onClose: () => void;}) {
  const { updateDocument } = usePortal();
  const [meta, setMeta] = useState<DocumentMetadata>(emptyMetadata());
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (doc) {
      setMeta(toMetadata(doc));
      setMissing([]);
    }
  }, [doc]);

  const save = () => {
    if (!doc) return;
    const gaps = missingRequiredFields(meta);
    setMissing(gaps);
    if (gaps.length) return;
    updateDocument(doc.id, metadataToPatch(meta));
    toast.success('Evidence metadata updated');
    onClose();
  };

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title="Edit metadata"
      description={doc?.title}
      size="lg"
      footer={
      <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            Save changes
          </button>
        </>
      }>
      
      {missing.length > 0 &&
      <div role="alert" className="mb-5 flex gap-2.5 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-700">
          <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Complete the required fields: {missing.join(', ')}.</span>
        </div>
      }
      <MetadataForm value={meta} onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))} />
    </Modal>);

}