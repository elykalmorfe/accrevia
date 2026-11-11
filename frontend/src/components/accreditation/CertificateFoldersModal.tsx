import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { AwardIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Switch } from '../ui/Switch';
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
  /** Awarding body named in certificate metadata and level folder labels. */
  body?: string;
  campusId: CampusId;
  campusName: string;
  /** Stats shown next to the counts in the summary strip. */
  stats: { label: string; value: string }[];
  /**
   * Enables single-active certificates: uploads start inactive and admins activate one.
   * `levelCode` is the code of the level folder holding the certificate, or null at the root.
   */
  onActivate?: (doc: EvidenceDocument, levelCode: string | null) => void;
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
  body = 'AACCUP',
  campusId,
  campusName,
  stats,
  onActivate
}: CertificateFoldersModalProps) {
  const { folders, documents, saveFolder, updateDocument, currentUser, isAdmin } = usePortal();

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

  const levelFolderOf = (folderId: string | null | undefined): EvidenceFolder | undefined => {
    let cursor = certFolders.find((f) => f.id === folderId);
    while (cursor && !cursor.isSystem) cursor = certFolders.find((f) => f.id === cursor?.parentId);
    return cursor;
  };
  const levelOf = (folderId: string | null): string => levelFolderOf(folderId)?.name ?? currentLabel;
  const levelCodeOf = (folderId: string | null | undefined): string | null => levelFolderOf(folderId)?.code ?? null;

  const activation = !!onActivate;
  const activeDoc = activation ? certDocs.find((d) => d.isActive) : undefined;
  const activeLevelFolder = activeDoc ? levelFolderOf(activeDoc.folderId) : undefined;

  const activate = (doc: EvidenceDocument) => {
    certDocs.forEach((d) => {
      const isActive = d.id === doc.id;
      if (!!d.isActive !== isActive) updateDocument(d.id, { isActive });
    });
    onActivate?.(doc, levelCodeOf(doc.folderId));
  };

  const deactivate = (doc: EvidenceDocument) => {
    updateDocument(doc.id, { isActive: false });
    toast.success(`"${doc.title}" deactivated`);
  };

  const buildDocument = (file: File, folderId: string | null): EvidenceDocument => {
    const { general } = getSettings();
    const level = levelOf(folderId);
    return {
      id: uid('doc-cert'),
      title: file.name.replace(/\.[^.]+$/, ''),
      description: `${body} ${level} certificate for ${subject}`,
      keywords: [body, 'Certificate', level, subject],
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
      passages: [`${body} ${level} certificate — ${subject} (${campusName})`],
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
          ...(activation ? [{ label: 'Active', value: activeDoc ? activeLevelFolder?.name ?? activeDoc.title : 'None' }] : []),
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
        folderEyebrow={(f) => (f.isSystem ? `${body} level` : undefined)}
        folderStatus={(f, count) =>
          activeLevelFolder && f.id === activeLevelFolder.id
            ? { label: 'Active certificate', tone: 'success' }
            : f.id === currentFolder?.id
            ? { label: 'Current level', tone: 'info' }
            : count === 0
            ? { label: 'Empty', tone: 'neutral' }
            : null
        }
        documentStatus={
          !activation
            ? undefined
            : isAdmin
            ? (doc) => (
                <span className="inline-flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${doc.isActive ? 'text-success-700' : 'text-ink-subtle'}`}>
                    {doc.isActive ? 'On' : 'Off'}
                  </span>
                  <Switch
                    checked={!!doc.isActive}
                    onChange={(on) => (on ? activate(doc) : deactivate(doc))}
                    label={`${doc.isActive ? 'Deactivate' : 'Activate'} ${doc.title}`}
                  />
                </span>
              )
            : (doc) => (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    doc.isActive ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {doc.isActive ? 'Active' : 'Inactive'}
                </span>
              )
        }
        onUploaded={
          activation
            ? (docs) =>
                toast.info(`${docs.length === 1 ? 'The certificate is' : 'New certificates are'} inactive`, {
                  description: 'Switch it on to make it the current certificate.'
                })
            : undefined
        }
        summary={summary}
        emptyHint="Upload the certificate for this level, or create a folder to organize it."
        resetKey={`${areaKey}-${open}`}
      />
    </Modal>
  );
}
