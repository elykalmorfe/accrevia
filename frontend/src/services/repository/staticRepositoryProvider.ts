/**
 * Static repository data provider (Chunk 9.1).
 * Serves verified Drive/Sheets catalogs by default; demonstration fixtures remain available separately.
 * Replace this module with an API-backed provider when the backend team delivers endpoints.
 */
import type {
  CertificateBrowseResult,
  CopcRecordRow,
  RepoDocumentItem,
  RepoFolderNode,
  RepositoryDataProvider,
  RepositoryStatusSnapshot
} from '../../types/accreditationRepository';
import {
  VERIFIED_AACCUP_DRIVE_FOLDER_URL,
  VERIFIED_COPC_SPREADSHEET_URL,
  getVerifiedCatalogStats,
  getVerifiedCertificateRoots,
  getVerifiedCopcRecords
} from '../../data/repositoryCatalog';
import { enrichDocument, flattenEnrichedDocuments } from './documentMeta';
import { matchesCampusFilter } from './verifiedCatalogSearch';
import { loadAccessRequests } from '../accessRequests/mockAccessRequestStore';
import {
  SAMPLE_CERTIFICATES_FOLDER_URL,
  SAMPLE_COPC_SPREADSHEET_URL,
  demonstrationCertificateTree,
  demonstrationCopcRecords
} from './mockRepositoryData';

const LATENCY_MS = 220;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function countFolders(nodes: RepoFolderNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countFolders(n.children ?? []), 0);
}

function countDocuments(nodes: RepoFolderNode[]): number {
  return nodes.reduce(
    (sum, n) => sum + (n.documents?.length ?? 0) + countDocuments(n.children ?? []),
    0
  );
}

function resolvePath(
  roots: RepoFolderNode[],
  pathIds: string[]
): { trail: RepoFolderNode[]; current: RepoFolderNode | null; missing: boolean } {
  if (pathIds.length === 0) return { trail: [], current: null, missing: false };
  const trail: RepoFolderNode[] = [];
  let level: RepoFolderNode[] | undefined = roots;
  for (const id of pathIds) {
    const next: RepoFolderNode | undefined = level?.find((n) => n.id === id);
    if (!next) return { trail, current: trail[trail.length - 1] ?? null, missing: true };
    trail.push(next);
    level = next.children;
  }
  return { trail, current: trail[trail.length - 1] ?? null, missing: false };
}

const verifiedRoots = getVerifiedCertificateRoots();
const verifiedCopc = getVerifiedCopcRecords();
const catalogStats = getVerifiedCatalogStats();

export const staticRepositoryProvider: RepositoryDataProvider = {
  async getStatus(): Promise<RepositoryStatusSnapshot> {
    const demoDocs = countDocuments(demonstrationCertificateTree);
    return delay({
      mode: 'verified-static',
      label: 'Verified static catalog',
      description:
        'Showing verified AACCUP Drive inventory and COPC sheet rows for UI visualization. Not live-synced. Demonstration fixtures are retained separately. Technical Reviews remain restricted.',
      sampleCertificatesFolderUrl: VERIFIED_AACCUP_DRIVE_FOLDER_URL || SAMPLE_CERTIFICATES_FOLDER_URL,
      sampleCopcSpreadsheetUrl: VERIFIED_COPC_SPREADSHEET_URL || SAMPLE_COPC_SPREADSHEET_URL,
      stats: {
        certificates: {
          folders: countFolders(verifiedRoots),
          documents: countDocuments(verifiedRoots),
          verifiedDocuments: catalogStats.certificates.verifiedDocumentFiles + catalogStats.certificates.rootFiles,
          demonstrationDocuments: demoDocs
        },
        technicalReviews: { demoRequests: loadAccessRequests().length },
        copc: {
          records: verifiedCopc.length,
          verifiedRecords: catalogStats.copc.verifiedRows,
          demonstrationRecords: demonstrationCopcRecords.length
        }
      }
    });
  },

  async listCampuses() {
    return delay(verifiedRoots.filter((n) => n.kind === 'campus'));
  },

  async browseCertificates(pathIds: string[]): Promise<CertificateBrowseResult> {
    const { trail, current, missing } = resolvePath(verifiedRoots, pathIds);
    if (pathIds.length === 0) {
      return delay({
        path: pathIds,
        missing: false,
        trail: [],
        current: {
          id: null,
          name: 'AACCUP Certificates',
          kind: 'folder',
          folders: verifiedRoots,
          documents: []
        }
      });
    }

    const docs = (current?.documents ?? []).map((doc) => enrichDocument(doc, trail));
    return delay({
      path: pathIds,
      missing,
      trail: trail.map((n) => ({ id: n.id, name: n.name, kind: n.kind })),
      current: current
        ? {
            id: current.id,
            name: current.name,
            kind: current.kind,
            folders: current.children ?? [],
            documents: docs
          }
        : {
            id: null,
            name: 'AACCUP Certificates',
            kind: 'folder',
            folders: [],
            documents: []
          }
    });
  },

  async searchCertificates(params) {
    // Verified catalog only — demonstration fixtures are never included in default search.
    let docs = flattenEnrichedDocuments(verifiedRoots).filter(
      (d) => d.provenance !== 'demonstration' && !d.isDemo
    );
    const q = params.q?.trim().toLowerCase() ?? '';
    if (params.campus) {
      docs = docs.filter((d) => matchesCampusFilter(d, params.campus));
    }
    if (params.academicYear) docs = docs.filter((d) => d.academicYear === params.academicYear);
    if (params.program) {
      const p = params.program.toLowerCase();
      docs = docs.filter(
        (d) =>
          (d.program ?? '').toLowerCase() === p ||
          (d.program ?? '').toLowerCase().includes(p) ||
          d.name.toLowerCase().includes(p)
      );
    }
    if (params.documentType) {
      const t = params.documentType.toLowerCase();
      docs = docs.filter(
        (d) =>
          (d.documentType ?? '').toLowerCase() === t ||
          (d.documentType ?? '').toLowerCase().includes(t) ||
          (d.mimeType ?? '').toLowerCase().includes(t) ||
          (t === 'pdf' && (d.mimeType ?? '').includes('pdf')) ||
          (t === 'image' && (d.mimeType ?? '').startsWith('image/'))
      );
    }
    if (q) {
      docs = docs.filter((d) =>
        [d.name, d.campus, d.college, d.program, d.locationPath, d.documentType, d.mimeType, d.verificationNote]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    return delay({ documents: docs });
  },

  async listCopcRecords(params) {
    let rows: CopcRecordRow[] = [...verifiedCopc];
    const q = params?.q?.trim().toLowerCase() ?? '';
    if (params?.campus) rows = rows.filter((r) => r.campus === params.campus);
    if (params?.academicYear) rows = rows.filter((r) => r.academicYear === params.academicYear);
    if (params?.college) rows = rows.filter((r) => r.college === params.college);
    if (params?.program) rows = rows.filter((r) => r.program === params.program);
    if (q) {
      rows = rows.filter((r) =>
        [r.campus, r.college, r.program, r.academicYear, r.sheetLabel, r.complianceNote, r.certificateNumber]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    return delay({
      worksheet: '2026',
      records: rows,
      sourceReferenceUrl: VERIFIED_COPC_SPREADSHEET_URL
    });
  },

  listProgramOptions() {
    const programs = new Set<string>();
    for (const doc of flattenEnrichedDocuments(verifiedRoots)) {
      if (doc.program) programs.add(doc.program);
    }
    return [...programs].sort().map((p) => ({ value: p, label: p }));
  }
};

/** Demonstration-only helpers (not used by default Faculty repository browse). */
export function listDemonstrationCopcRecords(): CopcRecordRow[] {
  return demonstrationCopcRecords;
}

export function listDemonstrationCertificateDocuments(): RepoDocumentItem[] {
  return flattenEnrichedDocuments(demonstrationCertificateTree);
}
