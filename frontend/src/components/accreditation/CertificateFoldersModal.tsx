import { useEffect, useMemo } from 'react';
import { AwardIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FolderExplorer, UploadTarget } from '../upload/FolderExplorer';
import { usePortal } from '../../contexts/PortalContext';
import { fileTypeFromName } from '../../utils/fileTypes';
import { getSettings } from '../../settings/portalSettings';
import type { CampusId } from '../../types/accreditation';
import type { EvidenceDocument, EvidenceFolder } from '../../types/evidence';

export interface CertificateLevel {
  /** Stored on the level folder as `code`; must be stable. */
  code: string;
  label: string;
}

interface CertificateFoldersModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  frameworkId: string;
  /** `areaId` shared by every certificate folder and document in this repository. */
  areaKey: string;
  levels: CertificateLevel[];
  currentLevelCode: string;
  /** Who the certificates belong to, e.g. a program or campus name. */
  subject: string;
  /** Written to each document's `program` field. */
  program: string;
  cycle: string;
  campusId: CampusId;
  campusName: string;
  /** Stats shown next to the counts in the summary strip. */
  stats: { label: string; value: string }[];
}

const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function CertificateFoldersModal({
  open,
  onClose,
  title,
  description,
  frameworkId,
  areaKey,
  levels,
  currentLevelCode,
  subject,
  program,
  cycle,
  campusId,
  campusName,
  stats
}: CertificateFoldersModalProps) {
  const { folders, documents, saveFolder, currentUser, isAdmin } = usePortal();

  const certFolders = useMemo(
    () => folders.filter((f) => f.frameworkId === frameworkId && f.areaId === areaKey),
    [folders, frameworkId, areaKey]
  );
  const certDocs = useMemo(
    () => documents.filter((d) => d.frameworkId === frameworkId && d.areaId === areaKey),
    [documents, frameworkId, areaKey]
  );

  useEffect(() => {
    if (!open || !isAdmin) return;
    levels.forEach((level, i) => {
      if (certFolders.some((f) => f.isSystem && f.code === level.code)) return;
      saveFolder({
        id: `folder-${areaKey}-${i}`,
        name: level.label,
        code: level.code,
        frameworkId,
        category: 'Accreditation',
        description: `${level.label} certificates — ${subject}`,
        isSystem: true,
        color: 'amber',
        createdAt: today(),
        areaId: areaKey,
        campusId,
        campus: campusName,
        hasNoDeadline: true
      });
    });
  }, [open, isAdmin, levels, certFolders, saveFolder, areaKey, frameworkId, subject, campusId, campusName]);

  const currentFolder = certFolders.find((f) => f.isSystem && f.code === currentLevelCode);
  const currentLabel = levels.find((l) => l.code === currentLevelCode)?.label ?? currentLevelCode;

  const buildFolder = (name: string, parentId: string | null): EvidenceFolder => ({
    id: uid('folder-cert'),
    name,
    code: 'CERT',
    frameworkId,
    category: 'Accreditation',
    description: `Certificates — ${subject}`,
    color: 'amber',
    createdAt: today(),
    parentId: parentId ?? undefined,
    areaId: areaKey,
    campusId,
    campus: campusName,
    hasNoDeadline: true
  });

  const levelOf = (folderId: string | null): string => {
    let cursor = certFolders.find((f) => f.id === folderId);
    while (cursor && !cursor.isSystem) cursor = certFolders.find((f) => f.id === cursor?.parentId);
    return cursor ? cursor.name : currentLabel;
  };

  const buildDocument = (file: File, folderId: string | null): EvidenceDocument => {
    const { general } = getSettings();
    const level = levelOf(folderId);
    return {
      id: uid('doc-cert'),
      title: file.name.replace(/\.[^.]+$/, ''),
      description: `AACCUP ${level} certificate for ${subject}`,
      keywords: ['AACCUP', 'Certificate', level, subject],
      frameworkId,
      areaId: areaKey,
      criterionId: '',
      indicatorId: '',
      docType: 'Certificate',
      academicYear: general.defaultAcademicYear,
      cycle,
      program,
      college: '—',
      department: '—',
      office: 'Accreditation Office',
      campus: campusName,
      campusId,
      documentDate: today(),
      confidentiality: 'Internal',
      status: 'Indexed',
      dateAdded: today(),
      fileType: fileTypeFromName(file.name),
      pages: 1,
      sizeMb: Math.max(0.1, Math.round((file.size / (1024 * 1024)) * 10) / 10),
      uploadedBy: currentUser.name,
      passages: [`AACCUP ${level} certificate — ${subject} (${campusName})`],
      folderId: folderId ?? undefined,
      approvalStatus: 'Approved'
    };
  };

  const resolveUploadTarget = (currentFolderId: string | null): UploadTarget => {
    if (currentFolderId) {
      return { folderId: currentFolderId, label: certFolders.find((f) => f.id === currentFolderId)?.name ?? 'this folder' };
    }
    return currentFolder
      ? { folderId: currentFolder.id, label: `${currentFolder.name} (current level)` }
      : { folderId: null, label: 'Certificates' };
  };

  const summary = (
    <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-brand-50 p-4">
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-amber-200/40 blur-2xl" />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
          <AwardIcon className="h-5 w-5" />
        </span>
        {[
          ...stats,
          { label: 'Certificates', value: String(certDocs.length) },
          { label: 'Folders', value: String(certFolders.length) }
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-[16px] font-bold leading-tight text-ink">{stat.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={title}
      description={description}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-[12px] text-ink-subtle">{isAdmin ? '' : 'View-only access.'}</p>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Done
          </button>
        </div>
      }
    >
      <FolderExplorer
        folders={certFolders}
        documents={certDocs}
        rootLabel="Certificates"
        canEdit={isAdmin}
        openToViewers
        showApproval={false}
        buildFolder={buildFolder}
        buildDocument={buildDocument}
        resolveUploadTarget={resolveUploadTarget}
        folderEyebrow={(f) => (f.isSystem ? 'AACCUP level' : undefined)}
        folderStatus={(f, count) =>
          f.id === currentFolder?.id ? { label: 'Current level', tone: 'info' } : count === 0 ? { label: 'Empty', tone: 'neutral' } : null
        }
        summary={summary}
        emptyHint="Upload the certificate for this level, or create a folder to organize it."
        resetKey={`${areaKey}-${open}`}
      />
    </Modal>
  );
}
