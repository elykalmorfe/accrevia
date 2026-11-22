import { ProgramCertificatesModal } from './ProgramCertificatesModal';
import type { ProgramAccreditation } from '../../types/accreditation';

interface ProgramFindingsModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  onClose: () => void;
}

/** Opens the shared Program Accreditation folder on Summary of Findings & Recommendation. */
export function ProgramFindingsModal({ open, program, onClose }: ProgramFindingsModalProps) {
  return (
    <ProgramCertificatesModal open={open} program={program} onClose={onClose} preferredFolderCode="findings" />
  );
}
