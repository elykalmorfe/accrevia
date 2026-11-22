import { ProgramCertificatesModal } from './ProgramCertificatesModal';
import type { ProgramAccreditation } from '../../types/accreditation';

interface ProgramRatingsModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  onClose: () => void;
}

/** Opens the shared Program Accreditation folder on Technical Review & Board Action. */
export function ProgramRatingsModal({ open, program, onClose }: ProgramRatingsModalProps) {
  return (
    <ProgramCertificatesModal open={open} program={program} onClose={onClose} preferredFolderCode="trba" />
  );
}
