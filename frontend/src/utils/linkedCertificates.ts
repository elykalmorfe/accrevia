import type { ProgramAccreditation } from '../types/accreditation';
import type { EvidenceDocument, EvidenceFolder, FileType } from '../types/evidence';
import { getSettings } from '../settings/portalSettings';
import {
  CERTIFICATE_LEVELS,
  certificateAreaKey,
  formatLevel,
  isUrl,
  levelRank,
  parseAccreditationDate
} from './programAccreditation';
import { deleteStoredFile, getStoredFile, saveStoredFile } from './fileStore';
import { aaccupCertificateManifest } from '../data/aaccupCertificateManifest';
import { copcCertificateManifest } from '../data/copcCertificateManifest';

/**
 * Bump when the linked-certificate seed shape changes (local AACCUP files by level).
 */
export const LINKED_CERTIFICATES_VERSION = 'aaccup-local-certs-1';
export const LINKED_CERTIFICATES_KEY = 'accrevia_linked_certificates';
export const COPC_CERT_FILES_KEY = 'accrevia_copc_cert_files';
export const COPC_CERT_FILES_VERSION = 'copc-local-certs-1';

type ManifestEntry = { level: string; path: string; fileName: string };

function slugLevel(level: string): string {
  return level.toLowerCase().replace(/\s+/g, '-');
}

function fileTypeFromName(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'png') return 'PNG';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'JPG';
  return 'PDF';
}

/** Primary / legacy linked id (current-level active cert). */
export function linkedCertificateId(programId: string): string {
  return `doc-cert-link-${programId}`;
}

export function localCertificateDocId(programId: string, level: string, index: number): string {
  return `doc-cert-${programId}-${slugLevel(level)}-${index}`;
}

export function isLinkedCertificateId(id: string): boolean {
  return id.startsWith('doc-cert-link-') || id.startsWith('doc-cert-');
}

export function isLocalCertificatePath(url?: string | null): boolean {
  return /^\/certificates\//i.test((url || '').trim());
}

function certificateYear(program: ProgramAccreditation): number {
  return (
    parseAccreditationDate(program.validityStart)?.getFullYear() ||
    Number(program.levelHistory?.slice(-1)[0]?.year) ||
    new Date().getFullYear()
  );
}

function manifestEntriesFor(programId: string): ManifestEntry[] {
  const raw = (aaccupCertificateManifest as Record<string, readonly ManifestEntry[]>)[programId];
  return raw ? [...raw] : [];
}

function resolveSeedLevel(program: ProgramAccreditation, entryLevel: string): string {
  if (levelRank(entryLevel as ProgramAccreditation['status']) !== null) return entryLevel;
  if (levelRank(program.status) !== null) return program.status;
  return 'Candidate';
}

/**
 * Places each program's real certificate files into level folders in the
 * AACCUP Certificates window. Current-level primary file starts active.
 */
export function buildLinkedCertificates(programs: ProgramAccreditation[]): {
  folders: EvidenceFolder[];
  documents: EvidenceDocument[];
} {
  const today = new Date().toISOString().slice(0, 10);
  const { defaultAcademicYear } = getSettings().general;
  const folders: EvidenceFolder[] = [];
  const documents: EvidenceDocument[] = [];
  const folderKeys = new Set<string>();

  for (const p of programs) {
    const entries = manifestEntriesFor(p.id);
    const hasLocal = entries.length > 0;
    const driveFallback = isUrl(p.certificationFile) ? p.certificationFile : undefined;

    if (!hasLocal && !driveFallback) continue;

    const currentLevel = levelRank(p.status) !== null ? p.status : 'Candidate';
    const year = certificateYear(p);
    const areaKey = certificateAreaKey(p.id);

    const ensureFolder = (level: string) => {
      const levelIndex = CERTIFICATE_LEVELS.indexOf(level as (typeof CERTIFICATE_LEVELS)[number]);
      if (levelIndex < 0) return null;
      const folderId = `folder-${areaKey}-${levelIndex}`;
      if (!folderKeys.has(folderId)) {
        folderKeys.add(folderId);
        folders.push({
          id: folderId,
          name: formatLevel(level as ProgramAccreditation['status']),
          code: level,
          frameworkId: 'pa',
          category: 'Accreditation',
          description: `${formatLevel(level as ProgramAccreditation['status'])} certificates — ${p.programName}`,
          isSystem: true,
          color: 'amber',
          createdAt: today,
          areaId: areaKey,
          campusId: p.campusId,
          campus: p.campusName,
          hasNoDeadline: true
        });
      }
      return folderId;
    };

    if (hasLocal) {
      const levelCounters = new Map<string, number>();
      let activated = false;

      for (const entry of entries) {
        const level = resolveSeedLevel(p, entry.level);
        const folderId = ensureFolder(level);
        if (!folderId) continue;

        const idx = levelCounters.get(level) ?? 0;
        levelCounters.set(level, idx + 1);
        const levelLabel = formatLevel(level as ProgramAccreditation['status']);
        const isCurrent = level === currentLevel;
        const isActive = isCurrent && !activated;
        if (isActive) activated = true;

        const docId = isActive ? linkedCertificateId(p.id) : localCertificateDocId(p.id, level, idx);

        documents.push({
          id: docId,
          title: `AACCUP ${levelLabel} Certificate – ${p.programName}${idx > 0 ? ` (${idx + 1})` : ''}`,
          description: `Original AACCUP certificate file for ${p.programName} (${levelLabel}).`,
          keywords: ['AACCUP', 'Certificate', 'NNQAA', levelLabel, p.programName],
          frameworkId: 'pa',
          areaId: areaKey,
          criterionId: '',
          indicatorId: '',
          docType: 'Certificate',
          documentUrl: entry.path,
          academicYear: defaultAcademicYear,
          cycle: 'AACCUP Program Accreditation',
          program: p.programName,
          college: '—',
          department: '—',
          office: 'Accreditation Office',
          campus: p.campusName,
          campusId: p.campusId,
          documentDate: /^\d{4}-\d{2}-\d{2}$/.test(p.validityStart) ? p.validityStart : today,
          confidentiality: 'Internal',
          status: 'Indexed',
          dateAdded: today,
          fileType: fileTypeFromName(entry.fileName),
          pages: 1,
          sizeMb: 0.2,
          uploadedBy: 'Accreditation Office',
          passages: [
            `${year} CERTIFICATE OF ACCREDITATION`,
            `Program: ${p.programName}`,
            `Level/Status: ${levelLabel}`,
            `File: ${entry.fileName}`
          ],
          folderId,
          approvalStatus: 'Approved',
          isActive
        });
      }

      // If no entry matched current level, activate the first document
      if (!activated && documents.length) {
        const firstForProgram = documents.filter((d) => d.areaId === areaKey);
        if (firstForProgram[0]) {
          firstForProgram[0].isActive = true;
          // Prefer stable linked id for the active one
          const active = firstForProgram[0];
          if (active.id !== linkedCertificateId(p.id)) {
            active.id = linkedCertificateId(p.id);
          }
        }
      }
    } else if (driveFallback) {
      const level = currentLevel;
      const levelIndex = CERTIFICATE_LEVELS.indexOf(level);
      if (levelIndex < 0) continue;
      const folderId = ensureFolder(level);
      if (!folderId) continue;
      const levelLabel = formatLevel(level);

      documents.push({
        id: linkedCertificateId(p.id),
        title: `AACCUP ${levelLabel} Certificate – ${p.programName}`,
        description: `Original AACCUP Certificate of Accreditation for ${p.programName}. Opens the real file from Google Drive.`,
        keywords: ['AACCUP', 'Certificate', 'NNQAA', levelLabel, p.programName],
        frameworkId: 'pa',
        areaId: areaKey,
        criterionId: '',
        indicatorId: '',
        docType: 'Certificate',
        documentUrl: driveFallback,
        academicYear: defaultAcademicYear,
        cycle: 'AACCUP Program Accreditation',
        program: p.programName,
        college: '—',
        department: '—',
        office: 'Accreditation Office',
        campus: p.campusName,
        campusId: p.campusId,
        documentDate: /^\d{4}-\d{2}-\d{2}$/.test(p.validityStart) ? p.validityStart : today,
        confidentiality: 'Internal',
        status: 'Indexed',
        dateAdded: today,
        fileType: 'PDF',
        pages: 1,
        sizeMb: 0.2,
        uploadedBy: 'Accreditation Office',
        passages: [
          `${year} CERTIFICATE OF ACCREDITATION`,
          `Program: ${p.programName}`,
          `Level/Status: ${levelLabel}`,
          `Duration of Validity: ${p.validityStart || '—'} to ${p.validityEnd || '—'}`
        ],
        folderId,
        approvalStatus: 'Approved',
        isActive: true
      });
    }
  }

  return { folders, documents };
}

/** Prefetch public certificate files into IndexedDB for offline-fast viewing. */
export async function prefetchCertificateFiles(
  documents: EvidenceDocument[],
  options?: { force?: boolean }
): Promise<number> {
  let stored = 0;
  for (const doc of documents) {
    if (!isLocalCertificatePath(doc.documentUrl)) continue;
    if (!options?.force) {
      const existing = await getStoredFile(doc.id).catch(() => undefined);
      if (existing) continue;
    }
    try {
      const res = await fetch(doc.documentUrl!);
      if (!res.ok) continue;
      const blob = await res.blob();
      const name = doc.documentUrl!.split('/').pop() || `${doc.id}.pdf`;
      await saveStoredFile(doc.id, blob, name);
      stored += 1;
    } catch {
      // Ignore individual fetch failures
    }
  }
  return stored;
}

export async function prefetchCopcCertificateFiles(
  records: { id: string; programId: string; documentLink?: string }[]
): Promise<number> {
  let stored = 0;
  for (const rec of records) {
    const entry = (copcCertificateManifest as Record<string, { path: string }>)[rec.programId];
    const path = entry?.path || (isLocalCertificatePath(rec.documentLink) ? rec.documentLink : '');
    if (!path) continue;
    const key = `${rec.id}-COPC-CERT`;
    const existing = await getStoredFile(key).catch(() => undefined);
    if (existing) continue;
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const blob = await res.blob();
      await saveStoredFile(key, blob, path.split('/').pop() || 'copc-certificate.pdf');
      stored += 1;
    } catch {
      // ignore
    }
  }
  return stored;
}

/**
 * Removes previously generated stand-in PDFs for legacy linked certificate ids.
 */
export async function clearGeneratedLinkedCertificateFiles(programs: ProgramAccreditation[]): Promise<number> {
  let cleared = 0;
  for (const program of programs) {
    const id = linkedCertificateId(program.id);
    try {
      // Only clear if we are about to replace with a local public file
      const entries = manifestEntriesFor(program.id);
      if (!entries.length) continue;
      await deleteStoredFile(id);
      cleared += 1;
    } catch {
      // Ignore missing entries.
    }
  }
  return cleared;
}

/**
 * Keeps seeded certificate docs pointed at local public paths (or Drive fallback).
 */
export function refreshLinkedCertificateMeta(
  documents: EvidenceDocument[],
  programs: ProgramAccreditation[]
): EvidenceDocument[] {
  const byProgram = new Map(programs.map((p) => [p.id, p]));
  let changed = false;

  const next = documents.map((doc) => {
    if (!isLinkedCertificateId(doc.id)) return doc;
    // doc-cert-link-{programId} or doc-cert-{programId}-…
    const linkMatch = /^doc-cert-link-(pa-[a-z]+-g?\d+)$/.exec(doc.id);
    const localMatch = /^doc-cert-(pa-[a-z]+-g?\d+)-/.exec(doc.id);
    const programId = linkMatch?.[1] || localMatch?.[1];
    if (!programId) return doc;
    const program = byProgram.get(programId);
    if (!program) return doc;

    const entries = manifestEntriesFor(programId);
    const preferred =
      entries.find((e) => e.level === program.status)?.path ||
      entries[0]?.path ||
      (isLocalCertificatePath(doc.documentUrl) ? doc.documentUrl : undefined) ||
      (isUrl(program.certificationFile) ? program.certificationFile : undefined);

    if (!preferred || doc.documentUrl === preferred) return doc;
    changed = true;
    return {
      ...doc,
      documentUrl: preferred,
      description: isLocalCertificatePath(preferred)
        ? `Original AACCUP certificate file for ${program.programName}.`
        : `Original AACCUP Certificate of Accreditation for ${program.programName}. Opens the real file from Google Drive.`
    };
  });

  return changed ? next : documents;
}

/** Prefer local public path for a program's certificationFile when available. */
export function localCertificationFileFor(program: ProgramAccreditation): string | undefined {
  const entries = manifestEntriesFor(program.id);
  if (!entries.length) return undefined;
  return (
    entries.find((e) => e.level === program.status)?.path ||
    entries[0]?.path
  );
}
