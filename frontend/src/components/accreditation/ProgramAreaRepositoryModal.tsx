import { useMemo } from 'react';
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
    () => folders.filter((f) => f.frameworkId === 'pa' && f.areaId === areaKey && !f.libraryOnly),
    [folders, areaKey]
  );
  const areaDocs = useMemo(
    () => documents.filter((d) => d.frameworkId === 'pa' && d.areaId === areaKey && !d.libraryOnly),
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
    parentId: parentId ?? 'folder-pa',
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
      folderId: folderId ?? 'folder-pa',
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

  const summary = (
    <div className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-white">
      {[
        { label: 'Folders', value: String(areaFolders.length) },
        { label: 'Files', value: String(areaDocs.length) },
        { label: 'Storage', value: areaDocs.length ? formatSize(totalSizeMb) : '0 MB' }
      ].map((stat) => (
        <div key={stat.label} className="px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{stat.label}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{stat.value}</p>
        </div>
      ))}
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
        <div className="flex w-full justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Close
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
        folderLayout="list"
        showApproval={false}
        emptyHint="Drop files or a folder here, or use Upload Files."
        resetKey={`${areaKey}-${open}`}
      />
    </Modal>
  );
}
