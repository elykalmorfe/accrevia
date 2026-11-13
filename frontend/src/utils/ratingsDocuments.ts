import type { ProgramAccreditation } from '../types/accreditation';
import type { EvidenceDocument, EvidenceFolder, FileType } from '../types/evidence';
import { getSettings } from '../settings/portalSettings';
import { ratingsAreaKey } from './programAccreditation';
import { getStoredFile, saveStoredFile } from './fileStore';
import { isLocalCertificatePath } from './linkedCertificates';
import { ratingsDocumentManifest } from '../data/ratingsDocumentManifest';

export const RATINGS_DOCUMENTS_VERSION = 'aaccup-ratings-local-1';
export const RATINGS_DOCUMENTS_KEY = 'accrevia_ratings_documents';

type RatingsEntry = { period: string; path: string; fileName: string };

function fileTypeFromName(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'png') return 'PNG';
  if (ext === 'docx') return 'DOCX';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'JPG';
  return 'PDF';
}

function slugPeriod(period: string): string {
  return period.toLowerCase().replace(/\s+/g, '-');
}

export function manifestEntriesFor(programId: string): RatingsEntry[] {
  const raw = (ratingsDocumentManifest as Record<string, readonly RatingsEntry[]>)[programId];
  return raw ? [...raw] : [];
}

export function hasRatingsDocuments(programId: string): boolean {
  return manifestEntriesFor(programId).length > 0;
}

/** Newest period's primary local path for a program. */
export function primaryRatingsPath(programId: string): string | undefined {
  return manifestEntriesFor(programId)[0]?.path;
}

/** Unique periods newest-first for folder levels in the modal. */
export function ratingsPeriodsFor(programId: string): { code: string; label: string }[] {
  const seen = new Set<string>();
  const periods: { code: string; label: string }[] = [];
  for (const e of manifestEntriesFor(programId)) {
    if (seen.has(e.period)) continue;
    seen.add(e.period);
    periods.push({ code: e.period, label: e.period === 'general' ? 'General' : e.period });
  }
  return periods;
}

/**
 * Seeds Technical Review & Board Action documents into period folders under `trba-{programId}`.
 */
export function buildRatingsDocuments(programs: ProgramAccreditation[]): {
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
    if (!entries.length) continue;

    const areaKey = ratingsAreaKey(p.id);
    const periodCounters = new Map<string, number>();

    for (const entry of entries) {
      const period = entry.period || 'general';
      const folderId = `folder-${areaKey}-${slugPeriod(period)}`;
      if (!folderKeys.has(folderId)) {
        folderKeys.add(folderId);
        folders.push({
          id: folderId,
          name: period === 'general' ? 'General' : period,
          code: period,
          frameworkId: 'pa',
          category: 'Accreditation',
          description: `Technical Review & Board Action — ${p.programName} (${period})`,
          isSystem: true,
          color: 'blue',
          createdAt: today,
          areaId: areaKey,
          campusId: p.campusId,
          campus: p.campusName,
          hasNoDeadline: true
        });
      }

      const idx = periodCounters.get(period) ?? 0;
      periodCounters.set(period, idx + 1);
      const docId = `doc-trba-${p.id}-${slugPeriod(period)}-${idx}`;

      documents.push({
        id: docId,
        title: entry.fileName.replace(/\.[^.]+$/, '') || `Ratings – ${p.programName}`,
        description: `AACCUP Technical Review / Board Action document for ${p.programName} (${period}).`,
        keywords: ['AACCUP', 'Technical Review', 'Board Action', 'Ratings', p.programName, period],
        frameworkId: 'pa',
        areaId: areaKey,
        criterionId: '',
        indicatorId: '',
        docType: 'Report',
        documentUrl: entry.path,
        academicYear: defaultAcademicYear,
        cycle: 'AACCUP Technical Review & Board Action',
        program: p.programName,
        college: '—',
        department: '—',
        office: 'Accreditation Office',
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
        passages: [`Technical Review & Board Action`, `Program: ${p.programName}`, `Period: ${period}`, `File: ${entry.fileName}`],
        folderId,
        approvalStatus: 'Approved',
        isActive: idx === 0 && period === entries[0]?.period
      });
    }
  }

  return { folders, documents };
}

export async function prefetchRatingsDocuments(documents: EvidenceDocument[]): Promise<number> {
  let stored = 0;
  for (const doc of documents) {
    if (!isLocalCertificatePath(doc.documentUrl)) continue;
    const existing = await getStoredFile(doc.id).catch(() => undefined);
    if (existing) continue;
    try {
      const res = await fetch(doc.documentUrl!);
      if (!res.ok) continue;
      const blob = await res.blob();
      const name = doc.documentUrl!.split('/').pop() || `${doc.id}.pdf`;
      await saveStoredFile(doc.id, blob, name);
      stored += 1;
    } catch {
      // ignore
    }
  }
  return stored;
}
