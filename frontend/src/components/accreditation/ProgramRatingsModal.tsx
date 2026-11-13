import { CertificateFoldersModal, CertificateLevel } from './CertificateFoldersModal';
import { ratingsAreaKey } from '../../utils/programAccreditation';
import { ratingsPeriodsFor } from '../../utils/ratingsDocuments';
import type { ProgramAccreditation } from '../../types/accreditation';

interface ProgramRatingsModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  onClose: () => void;
}

export function ProgramRatingsModal({ open, program, onClose }: ProgramRatingsModalProps) {
  if (!program) return null;

  const periods = ratingsPeriodsFor(program.id);
  const levels: CertificateLevel[] =
    periods.length > 0
      ? periods
      : [{ code: 'general', label: 'General' }];

  return (
    <CertificateFoldersModal
      open={open}
      onClose={onClose}
      title="Technical Review & Board Action"
      description={`${program.programName} · ${program.campusName}`}
      frameworkId="pa"
      areaKey={ratingsAreaKey(program.id)}
      levels={levels}
      currentLevelCode={levels[0]?.code || 'general'}
      subject={program.programName}
      program={program.programName}
      cycle="AACCUP Technical Review & Board Action"
      campusId={program.campusId}
      campusName={program.campusName}
      stats={[
        { label: 'Periods', value: String(levels.length) },
        { label: 'Documents', value: 'On file' }
      ]}
    />
  );
}
