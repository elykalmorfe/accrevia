import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { CertificateFoldersModal } from './CertificateFoldersModal';
import { usePortal } from '../../contexts/PortalContext';
import {
  CERTIFICATE_LEVELS,
  PROGRAM_ACCREDITATION_DOC_FOLDERS,
  PA_ROOT_FOLDER_ID,
  buildCanonicalRepoFolders,
  formatLevel,
  formatValidity,
  levelRank,
  paCanonicalFolderIdForCode,
  reconcilePaCopcRepository
} from '../../utils/programAccreditation';
import type { AccreditationLevel, ProgramAccreditation } from '../../types/accreditation';

interface ProgramCertificatesModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  onClose: () => void;
  /** Open directly in this fixed folder (e.g. trba / findings / Level 1). */
  preferredFolderCode?: string;
}

export function ProgramCertificatesModal({
  open,
  program,
  onClose,
  preferredFolderCode
}: ProgramCertificatesModalProps) {
  const { folders, documents, saveFolder, updateDocument, saveProgramAccreditation } = usePortal();

  useEffect(() => {
    if (!open) return;
    const result = reconcilePaCopcRepository(folders, documents);
    result.folders
      .filter((f) => f.parentId === PA_ROOT_FOLDER_ID)
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
    const built = buildCanonicalRepoFolders().filter((f) => f.frameworkId === 'pa');
    // Explorer treats null parent as root; keep Online Repository parentId on the live folder.
    return built.map((b) => {
      const live = folders.find((f) => f.id === b.id) || b;
      return { ...live, parentId: undefined };
    });
  }, [folders]);

  if (!program) return null;

  const ranked = levelRank(program.status) !== null ? program.status : 'Candidate';
  const currentLevel = preferredFolderCode || ranked;
  const preferredId = paCanonicalFolderIdForCode(currentLevel) || undefined;

  return (
    <CertificateFoldersModal
      open={open}
      onClose={onClose}
      title="Program Accreditation Documents"
      description={`${program.programName} · ${program.campusName}`}
      frameworkId="pa"
      areaKey="pa-repo"
      levels={PROGRAM_ACCREDITATION_DOC_FOLDERS}
      currentLevelCode={currentLevel}
      subject={program.programName}
      program={program.programName}
      cycle="AACCUP Program Accreditation"
      campusId={program.campusId}
      campusName={program.campusName}
      rootLabel="Program Accreditation"
      allowNestedFolders={false}
      activatableCodes={[...CERTIFICATE_LEVELS]}
      canonicalFolders={canonicalFolders}
      preferredFolderId={preferredId}
      stats={[
        { label: 'Current level', value: formatLevel(program.status) },
        { label: 'Validity', value: program.validityStart ? formatValidity(program) : '—' }
      ]}
      onActivate={(doc, code) => {
        const level = CERTIFICATE_LEVELS.find((l) => l === code) as AccreditationLevel | undefined;
        const next: ProgramAccreditation = {
          ...program,
          certificationFile: doc.documentUrl || doc.title,
          ...(level && level !== program.status ? { status: level } : {})
        };
        saveProgramAccreditation(next);
        if (level && level !== program.status) {
          toast.success(`"${doc.title}" activated · program set to ${formatLevel(level)}`);
        } else {
          toast.success(`"${doc.title}" activated · linked to this program`);
        }
      }}
    />
  );
}
