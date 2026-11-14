/**
 * Chunk 9.x debug — searchable access to verified AACCUP + COPC catalogs.
 * Metadata-only rows remain searchable even when local PDF/image binaries are missing.
 * Restricted Technical Review sources are never included.
 */
import type { CopcRecordRow, RepoDocumentItem, RepoFolderNode } from '../../types/accreditationRepository';
import {
  getVerifiedCertificateRoots,
  getVerifiedCopcRecords
} from '../../data/repositoryCatalog';
import { applyApprovedDriveFileLink } from '../../data/repositoryCatalog/verifiedIndividualCertificateLinks';
import { enrichDocument } from './documentMeta';

export type VerifiedSearchCategory = 'aaccup-certificate' | 'copc-record';

export type VerifiedSearchHit = {
  id: string;
  title: string;
  category: VerifiedSearchCategory;
  categoryLabel: string;
  campus?: string;
  college?: string;
  program?: string;
  documentType?: string;
  locationPath?: string;
  /** Navigate to repository browse/details location. */
  href: string;
  /** Certificate document when category is aaccup-certificate. */
  document?: RepoDocumentItem;
  /** COPC row when category is copc-record. */
  copc?: CopcRecordRow;
};

export type VerifiedSearchParams = {
  q?: string;
  campus?: string;
  program?: string;
  documentType?: string;
  /** Limit categories; default both. */
  categories?: VerifiedSearchCategory[];
};

/** Match campus filter values like `verified-bislig`, `bislig`, or display name `Bislig`. */
export function matchesCampusFilter(
  doc: Pick<RepoDocumentItem, 'campusId' | 'campus'>,
  campusFilter?: string
): boolean {
  const raw = campusFilter?.trim();
  if (!raw) return true;
  const f = raw.toLowerCase();
  const id = (doc.campusId ?? '').toLowerCase();
  const name = (doc.campus ?? '').toLowerCase();

  if (id && (id === f || f === `verified-${id}` || f.endsWith(`-${id}`))) return true;
  if (name && (name === f || name.includes(f) || f.includes(name))) return true;
  if (id && f.includes(id)) return true;
  return false;
}

function haystackIncludes(parts: Array<string | undefined | null>, q: string): boolean {
  if (!q) return true;
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function buildCertificateIndex(roots: RepoFolderNode[]) {
  const documents: RepoDocumentItem[] = [];
  const pathByDocId = new Map<string, string[]>();

  const walk = (nodes: RepoFolderNode[], trail: RepoFolderNode[]) => {
    for (const node of nodes) {
      const nextTrail = [...trail, node];
      for (const doc of node.documents ?? []) {
        const enriched = applyApprovedDriveFileLink(enrichDocument(doc, nextTrail));
        documents.push(enriched);
        pathByDocId.set(doc.id, nextTrail.map((n) => n.id));
      }
      if (node.children?.length) walk(node.children, nextTrail);
    }
  };

  walk(roots, []);
  return { documents, pathByDocId };
}

const certificateIndex = buildCertificateIndex(getVerifiedCertificateRoots());
const copcRecords = getVerifiedCopcRecords().filter(
  (r) => r.provenance !== 'demonstration' && !r.isSample
);

export function getVerifiedCertificateDocumentCount(): number {
  return certificateIndex.documents.length;
}

export function getVerifiedCopcSearchableCount(): number {
  return copcRecords.length;
}

export function getCertificateBrowsePath(docId: string): string[] {
  return certificateIndex.pathByDocId.get(docId) ?? [];
}

export function certificateBrowseHref(docId: string): string {
  const path = getCertificateBrowsePath(docId);
  const params = new URLSearchParams({ tab: 'certificates' });
  if (path.length) params.set('path', path.join('/'));
  params.set('doc', docId);
  return `/open/browse?${params.toString()}`;
}

export function copcBrowseHref(program?: string): string {
  const params = new URLSearchParams({ tab: 'copc' });
  if (program?.trim()) params.set('q', program.trim());
  return `/open/browse?${params.toString()}`;
}

export function listVerifiedCampusOptions(): Array<{ value: string; label: string }> {
  const map = new Map<string, string>();
  for (const doc of certificateIndex.documents) {
    if (doc.campusId && doc.campus) map.set(doc.campusId, doc.campus);
  }
  for (const row of copcRecords) {
    if (!row.campus) continue;
    const already = [...map.values()].some((n) => n.toLowerCase() === row.campus!.toLowerCase());
    if (already) continue;
    map.set(row.campus.toLowerCase().replace(/\s+/g, '-'), row.campus);
  }
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function listVerifiedProgramOptions(): string[] {
  const set = new Set<string>();
  for (const doc of certificateIndex.documents) if (doc.program) set.add(doc.program);
  for (const row of copcRecords) if (row.program) set.add(row.program);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function listVerifiedDocumentTypeOptions(): string[] {
  const set = new Set<string>();
  for (const doc of certificateIndex.documents) if (doc.documentType) set.add(doc.documentType);
  return [...set].sort((a, b) => a.localeCompare(b));
}

function scoreTitle(title: string, q: string): number {
  const t = title.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  return 10;
}

/**
 * Search verified AACCUP certificate metadata and COPC spreadsheet rows.
 * Does not require local PDF/image assets to exist.
 */
export function searchVerifiedCatalog(params: VerifiedSearchParams = {}): VerifiedSearchHit[] {
  const q = params.q?.trim().toLowerCase() ?? '';
  const categories = params.categories?.length
    ? new Set(params.categories)
    : new Set<VerifiedSearchCategory>(['aaccup-certificate', 'copc-record']);
  const hits: Array<VerifiedSearchHit & { score: number }> = [];

  if (categories.has('aaccup-certificate')) {
    for (const doc of certificateIndex.documents) {
      if (!matchesCampusFilter(doc, params.campus)) continue;
      if (params.program) {
        const p = params.program.toLowerCase();
        const ok =
          (doc.program ?? '').toLowerCase() === p ||
          (doc.program ?? '').toLowerCase().includes(p) ||
          doc.name.toLowerCase().includes(p);
        if (!ok) continue;
      }
      if (params.documentType) {
        const t = params.documentType.toLowerCase();
        const ok =
          (doc.documentType ?? '').toLowerCase() === t ||
          (doc.documentType ?? '').toLowerCase().includes(t) ||
          (t === 'pdf' && (doc.mimeType ?? '').includes('pdf')) ||
          (t === 'image' && (doc.mimeType ?? '').startsWith('image/'));
        if (!ok) continue;
      }
      if (
        q &&
        !haystackIncludes(
          [
            doc.name,
            doc.campus,
            doc.college,
            doc.program,
            doc.locationPath,
            doc.documentType,
            doc.mimeType,
            doc.verificationNote,
            doc.academicYear
          ],
          q
        )
      ) {
        continue;
      }

      hits.push({
        id: doc.id,
        title: doc.name,
        category: 'aaccup-certificate',
        categoryLabel: 'AACCUP certificate',
        campus: doc.campus,
        college: doc.college,
        program: doc.program,
        documentType: doc.documentType,
        locationPath: doc.locationPath,
        href: certificateBrowseHref(doc.id),
        document: doc,
        score: scoreTitle(doc.name, q) + (doc.program?.toLowerCase().includes(q) ? 15 : 0)
      });
    }
  }

  if (categories.has('copc-record') && !params.documentType) {
    for (const row of copcRecords) {
      if (params.campus) {
        const f = params.campus.toLowerCase();
        const campus = (row.campus ?? '').toLowerCase();
        const ok =
          campus === f ||
          campus.includes(f) ||
          f.includes(campus) ||
          f === `verified-${campus}` ||
          f.endsWith(`-${campus.replace(/\s+/g, '-')}`);
        if (!ok) continue;
      }
      if (params.program) {
        const p = params.program.toLowerCase();
        const ok =
          (row.program ?? '').toLowerCase() === p || (row.program ?? '').toLowerCase().includes(p);
        if (!ok) continue;
      }
      if (
        q &&
        !haystackIncludes(
          [
            row.program,
            row.campus,
            row.college,
            row.academicYear,
            row.sheetLabel,
            row.complianceNote,
            row.certificateNumber,
            row.worksheet
          ],
          q
        )
      ) {
        continue;
      }

      hits.push({
        id: row.id,
        title: row.program || row.id,
        category: 'copc-record',
        categoryLabel: 'COPC record',
        campus: row.campus,
        college: row.college,
        program: row.program,
        documentType: row.sheetLabel,
        locationPath: [row.campus, row.college, row.program].filter(Boolean).join(' / '),
        href: copcBrowseHref(row.program),
        copc: row,
        score: scoreTitle(row.program || '', q) + 5
      });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .map(({ score: _score, ...hit }) => hit);
}
