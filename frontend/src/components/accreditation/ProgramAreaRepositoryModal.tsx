import { useMemo } from 'react';
import { toast } from 'sonner';
import { BadgeCheckIcon, CheckIcon, FolderOpenIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FolderExplorer } from '../upload/FolderExplorer';
import { formatSize } from '../upload/fileTypeStyle';
import { usePortal } from '../../contexts/PortalContext';
import { fileTypeFromName } from '../../utils/fileTypes';
import { applyNamingPattern } from '../../utils/uploadRules';
import { getSettings } from '../../settings/portalSettings';
import type { ProgramAccreditation, ProgramRequirementItem } from '../../types/accreditation';
import type { EvidenceDocument, EvidenceFolder } from '../../types/evidence';

interface ProgramAreaRepositoryModalProps {
  open: boolean;
  program: ProgramAccreditation | null;
  requirement: ProgramRequirementItem | null;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ProgramAreaRepositoryModal({ open, program, requirement, onClose }: ProgramAreaRepositoryModalProps) {
  const { folders, documents, updateProgramRequirement, currentUser } = usePortal();

  const areaKey = requirement?.id ?? '';

  const areaFolders = useMemo(
    () => folders.filter((f) => f.frameworkId === 'pa' && f.areaId === areaKey),
    [folders, areaKey]
  );
  const areaDocs = useMemo(
    () => documents.filter((d) => d.frameworkId === 'pa' && d.areaId === areaKey),
    [documents, areaKey]
  );

  if (!program || !requirement) return null;

  const totalSizeMb = areaDocs.reduce((sum, d) => sum + (d.sizeMb || 0), 0);

  const buildFolder = (name: string, parentId: string | null): EvidenceFolder => ({
    id: uid('folder-pa'),
    name,
    code: requirement.areaCode,
    frameworkId: 'pa',
    category: 'Accreditation',
    description: `${requirement.areaName} — ${program.programName}`,
    color: 'purple',
    createdAt: today(),
    parentId: parentId ?? undefined,
    areaId: areaKey,
    campusId: program.campusId,
    campus: program.campusName,
    hasNoDeadline: true
  });

  const buildDocument = (file: File, folderId: string | null): EvidenceDocument => {
    const { general, uploads } = getSettings();
    const sizeMb = Math.max(0.1, Math.round((file.size / (1024 * 1024)) * 10) / 10);
    return {
      id: uid('doc-pa'),
      title: applyNamingPattern(file.name, { campus: program.campusName, area: requirement.areaCode, year: general.defaultAcademicYear }),
      description: `${requirement.areaName} evidence for ${program.programName}`,
      keywords: ['Program Accreditation', 'AACCUP', requirement.areaCode, program.programName],
      frameworkId: 'pa',
      areaId: areaKey,
      criterionId: '',
      indicatorId: '',
      requirementId: requirement.id,
      docType: 'Report',
      academicYear: general.defaultAcademicYear,
      cycle: 'AACCUP Program Accreditation',
      program: program.programName,
      college: '—',
      department: '—',
      office: 'Accreditation Office',
      campus: program.campusName,
      campusId: program.campusId,
      documentDate: today(),
      confidentiality: 'Internal',
      status: 'Indexed',
      dateAdded: today(),
      fileType: fileTypeFromName(file.name),
      pages: Math.max(1, Math.round(file.size / 50000)),
      sizeMb,
      uploadedBy: currentUser.name,
      passages: [`${requirement.areaName} — ${program.programName} (${program.campusName})`],
      folderId: folderId ?? undefined,
      approvalStatus: uploads.newUploadStatus
    };
  };

  const handleUploaded = (docs: EvidenceDocument[]) => {
    updateProgramRequirement(program.id, requirement.id, {
      isSubmitted: true,
      submissionDate: today(),
      documentName: docs[docs.length - 1].title
    });
  };

  const toggleVerified = () => {
    const verified = !requirement.verified;
    updateProgramRequirement(program.id, requirement.id, { verified });
    toast.success(verified ? `${requirement.areaName} marked as verified` : 'Verification removed');
  };

  const summary = (
          <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-200/40 blur-2xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
                  <FolderOpenIcon className="h-5 w-5" />
                </span>
                <div className="flex gap-5">
                  {[
                    { label: 'Folders', value: areaFolders.length },
                    { label: 'Files', value: areaDocs.length },
                    { label: 'Storage', value: areaDocs.length ? formatSize(totalSizeMb) : '—' }
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[18px] font-bold leading-tight text-ink">{stat.value}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleVerified}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all ${
                  requirement.verified
                    ? 'bg-success-600 text-white shadow-md shadow-success-600/25 hover:bg-success-700'
                    : 'border border-line bg-white text-ink-muted hover:border-success-600 hover:text-success-700'
                }`}
          title={requirement.verified ? 'Click to remove verification' : 'Mark this area as verified'}
        >
                {requirement.verified ? <BadgeCheckIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                {requirement.verified ? 'Verified' : 'Mark as Verified'}
              </button>
            </div>
          </div>
  );

                        return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={requirement.areaName}
      description={`${program.programName} · ${program.campusName}`}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="hidden text-[12px] text-ink-subtle sm:block">Tip: drag files or whole folders anywhere into the panel above.</p>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Done
                              </button>
        </div>
      }
    >
      <FolderExplorer
        folders={areaFolders}
        documents={areaDocs}
        rootLabel={requirement.areaName.split(':')[0]}
        buildFolder={buildFolder}
        buildDocument={buildDocument}
        onUploaded={handleUploaded}
        summary={summary}
        emptyHint="Drag & drop files or entire folders here, or use the buttons above to organize this area’s evidence."
        resetKey={`${areaKey}-${open}`}
      />
      </Modal>
  );
}
