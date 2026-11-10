import { CertificateFoldersModal, CertificateLevel } from './CertificateFoldersModal';
import { CERTIFICATE_LEVELS, certificateAreaKey, formatLevel, formatValidity, levelRank } from '../../utils/programAccreditation';
import type { ProgramAccreditation } from '../../types/accreditation';

interface ProgramCertificatesModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  onClose: () => void;
}

const PROGRAM_LEVELS: CertificateLevel[] = CERTIFICATE_LEVELS.map((level) => ({ code: level, label: formatLevel(level) }));

export function ProgramCertificatesModal({ open, program, onClose }: ProgramCertificatesModalProps) {
  if (!program) return null;

  const currentLevel = levelRank(program.status) !== null ? program.status : 'Candidate';

  return (
    <CertificateFoldersModal
      open={open}
      onClose={onClose}
      title="AACCUP Certificates"
      description={`${program.programName} · ${program.campusName}`}
      frameworkId="pa"
      areaKey={certificateAreaKey(program.id)}
      levels={PROGRAM_LEVELS}
      currentLevelCode={currentLevel}
      subject={program.programName}
      program={program.programName}
      cycle="AACCUP Program Accreditation"
      campusId={program.campusId}
      campusName={program.campusName}
      stats={[
        { label: 'Current level', value: formatLevel(program.status) },
        { label: 'Validity', value: program.validityStart ? formatValidity(program) : '—' }
      ]}
    />
  );
}
