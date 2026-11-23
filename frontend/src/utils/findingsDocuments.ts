import type { ProgramAccreditation } from '../types/accreditation';
import type { EvidenceDocument, EvidenceFolder, FileType } from '../types/evidence';
import { getSettings } from '../settings/portalSettings';
import { findingsAreaKey, paCanonicalFolderIdForCode } from './programAccreditation';
import { prefetchCertificateFiles } from './linkedCertificates';
import { findingsDocumentManifest } from '../data/findingsDocumentManifest';

export const FINDINGS_DOCUMENTS_VERSION = 'aaccup-findings-folder-only-2';
export const FINDINGS_DOCUMENTS_KEY = 'accrevia_findings_documents';

type FindingsEntry = { path: string; fileName: string };

function fileTypeFromName(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'png') return 'PNG';
  if (ext === 'docx') return 'DOCX';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'JPG';
  return 'PDF';
}

export function manifestEntriesFor(programId: string): FindingsEntry[] {
  const raw = (findingsDocumentManifest as Record<string, readonly FindingsEntry[]>)[programId];
  return raw ? [...raw] : [];
}

export function hasFindingsDocuments(programId: string): boolean {
  return manifestEntriesFor(programId).length > 0;
}

/** Primary local path for a program's Summary of Findings & Recommendation. */
export function primaryFindingsPath(programId: string): string | undefined {
  return manifestEntriesFor(programId)[0]?.path;
}

/**
 * Seeds Summary of Findings & Recommendation documents under `findings-{programId}`.
 */
export function buildFindingsDocuments(programs: ProgramAccreditation[]): {
  folders: EvidenceFolder[];
  documents: EvidenceDocument[];
} {
  const today = new Date().toISOString().slice(0, 10);
  const { defaultAcademicYear } = getSettings().general;
  const folders: EvidenceFolder[] = [];
  const documents: EvidenceDocument[] = [];

  for (const p of programs) {
    const entries = manifestEntriesFor(p.id);
    if (!entries.length) continue;

    const areaKey = findingsAreaKey(p.id);
    const folderId = paCanonicalFolderIdForCode('findings')!;

    entries.forEach((entry, idx) => {
      documents.push({
        id: `doc-findings-${p.id}-${idx}`,
        title: entry.fileName.replace(/\.[^.]+$/, '') || `Findings – ${p.programName}`,
        description: `AACCUP Summary of Findings & Recommendation for ${p.programName}.`,
        keywords: ['AACCUP', 'Findings', 'Recommendation', p.programName],
        frameworkId: 'pa',
        areaId: areaKey,
        criterionId: '',
        indicatorId: '',
        docType: 'Report',
        documentUrl: entry.path,
        academicYear: defaultAcademicYear,
        cycle: 'AACCUP Summary of Findings & Recommendation',
        program: p.programName,
        college: '—',
        department: '—',
        office: 'Quality Assurance Office',
        campus: p.campusName,
        campusId: p.campusId,
        documentDate: today,
        confidentiality: 'Internal',
        status: 'Indexed',
        dateAdded: today,
        fileType: fileTypeFromName(entry.fileName),
        pages: 1,
        sizeMb: 0.2,
        uploadedBy: 'Accreditation Office',
        passages: [
          'Summary of Findings & Recommendation',
          `Program: ${p.programName}`,
          `File: ${entry.fileName}`
        ],
        folderId,
        approvalStatus: 'Approved',
        isActive: idx === 0
      });
    });
  }

  return { folders, documents };
}

export const prefetchFindingsDocuments = prefetchCertificateFiles;
