import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { CertificateFoldersModal } from './CertificateFoldersModal';
import { usePortal } from '../../contexts/PortalContext';
import {
  COPC_DOC_FOLDERS,
  COPC_ROOT_FOLDER_ID,
  buildCanonicalRepoFolders,
  copcCanonicalFolderIdForCode,
  reconcilePaCopcRepository
} from '../../utils/programAccreditation';
import type { COPCRecord } from '../../types/accreditation';
import type { EvidenceDocument } from '../../types/evidence';

interface CopcDocumentsModalProps {
  open: boolean;
  record: COPCRecord | null;
  onClose: () => void;
  /** Open Certificate Number or BOR Resolution folder. */
  preferredFolderCode?: 'certificate' | 'bor';
}

export function CopcDocumentsModal({
  open,
  record,
  onClose,
  preferredFolderCode = 'certificate'
}: CopcDocumentsModalProps) {
  const { folders, documents, saveFolder, updateDocument, updateCOPCRecord } = usePortal();

  useEffect(() => {
    if (!open) return;
    const result = reconcilePaCopcRepository(folders, documents);
    result.folders
      .filter((f) => f.parentId === COPC_ROOT_FOLDER_ID)
      .forEach((f) => {
        if (!folders.some((e) => e.id === f.id)) saveFolder(f);
      });
    if (!result.changed) return;
    result.documents.forEach((d) => {
      const prev = documents.find((p) => p.id === d.id);
      if (prev && prev.folderId !== d.folderId) updateDocument(d.id, { folderId: d.folderId });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canonicalFolders = useMemo(() => {
    const built = buildCanonicalRepoFolders().filter((f) => f.frameworkId === 'copc');
    return built.map((b) => {
      const live = folders.find((f) => f.id === b.id) || b;
      return { ...live, parentId: undefined };
    });
  }, [folders]);

  if (!record) return null;

  const linkToRecord = (doc: EvidenceDocument, code: string | null) => {
    if (code === 'certificate') {
      updateCOPCRecord(record.id, {
        certificateNumber: record.certificateNumber || doc.title,
        documentLink: doc.documentUrl || doc.title
      });
      toast.success(`Certificate file linked to ${record.programName}`);
    } else if (code === 'bor') {
      updateCOPCRecord(record.id, {
        borRes: doc.documentUrl || doc.title
      });
      toast.success(`BOR Resolution linked to ${record.programName}`);
    }
  };

  return (
    <CertificateFoldersModal
      open={open}
      onClose={onClose}
      title="COPC Documents"
      description={`${record.programName} · ${record.campusName}`}
      frameworkId="copc"
      areaKey="copc-repo"
      levels={COPC_DOC_FOLDERS}
      currentLevelCode={preferredFolderCode}
      subject={record.programName}
      program={record.programName}
      cycle="Certificate of Program Compliance"
      body="COPC"
      campusId={record.campusId}
      campusName={record.campusName}
      rootLabel="COPC"
      allowNestedFolders={true}
      stats={[
        { label: 'Certificate No.', value: record.certificateNumber || '—' },
        { label: 'Status', value: record.copcStatus }
      ]}
      onActivate={(doc, code) => linkToRecord(doc, code)}
      activatableCodes={['certificate', 'bor']}
      canonicalFolders={canonicalFolders}
      preferredFolderId={copcCanonicalFolderIdForCode(preferredFolderCode)}
    />
  );
}
