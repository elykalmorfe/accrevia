/** Faculty/Staff Accreditation Repository types (frontend demo + future API-compatible). */

export type RepositoryTabId = 'certificates' | 'technical-reviews' | 'copc' | 'sample-documents';

export type RepoFolderKind = 'campus' | 'college' | 'program' | 'year' | 'folder';

/** How a catalog document can be opened in the prototype UI. */
export type RepoDocumentSourceKind = 'local-file' | 'drive-file' | 'drive-folder' | 'unavailable';

/** Provenance for repository catalog rows (Chunk 9.1). */
export type RepositoryProvenance = 'verified' | 'demonstration';

export type RepositoryDataSource =
  | 'google-drive-aaccup-certificates'
  | 'google-sheets-copc-2026'
  | 'frontend-demonstration-fixture';

export interface RepoDocumentItem {
  id: string;
  name: string;
  mimeType?: string;
  updatedAt?: string;
  /** When true, UI must show a DEMO badge — not verified institutional metadata. */
  isDemo?: boolean;
  /**
   * Permitted external reference.
   * May be a Drive folder URL or (when explicitly verified) an individual file URL.
   * Never invent file IDs.
   */
  externalUrl?: string;
  /**
   * Explicit individual Google Drive file URL when verified and approved for publication.
   * Prefer this over guessing from `externalUrl`.
   */
  driveFileUrl?: string;
  /** Safe same-origin PDF/image path candidate for in-app preview (must be probed). */
  localPreviewUrl?: string;
  sourceKind?: RepoDocumentSourceKind;
  documentType?: string;
  category?: string;
  /** Stable campus folder id (e.g. tandag) for filters. */
  campusId?: string;
  campus?: string;
  college?: string;
  program?: string;
  academicYear?: string;
  /** Breadcrumb-style location within the demo repository tree. */
  locationPath?: string;
  provenance?: RepositoryProvenance;
  dataSource?: RepositoryDataSource | string;
  verificationNote?: string;
}

/**
 * Hierarchical folder node. Child levels are optional because Google Drive
 * layouts can differ by campus (Campus → College → Program → Year → Documents).
 */
export interface RepoFolderNode {
  id: string;
  name: string;
  kind: RepoFolderKind;
  description?: string;
  children?: RepoFolderNode[];
  documents?: RepoDocumentItem[];
}

export type RepositoryLoadState = 'idle' | 'loading' | 'ready' | 'error';

/** COPC row shape for the table layout. */
export interface CopcRecordRow {
  id: string;
  campus?: string;
  college?: string;
  program?: string;
  academicYear?: string;
  /** Explicitly simulated sample ID — not an official certificate number. */
  certificateNumber?: string;
  /** Optional layout note for DEMO rows (never an official compliance status). */
  sampleNote?: string;
  /** Original COPC sheet column value (label or free-text note). */
  sheetLabel?: string;
  /** Preserved sheet note when it is not a simple certificate label (e.g. ongoing compliance). */
  complianceNote?: string;
  /** Worksheet label referenced by the catalog. */
  worksheet?: string;
  /** When true, row is invented layout sample data — not an official record. */
  isSample?: boolean;
  /** True when the sheet cell notes ongoing CHED compliance (not an approved COPC claim). */
  isOngoingCompliance?: boolean;
  /** Sequence number from the source worksheet section, when available. */
  sourceRow?: number;
  provenance?: RepositoryProvenance;
  dataSource?: RepositoryDataSource | string;
  verificationNote?: string;
}

export type CopcSortKey = 'campus' | 'program' | 'academicYear';
export type CopcSortDirection = 'asc' | 'desc';

export type CopcLocalFilters = {
  query: string;
  campus: string;
  academicYear: string;
  college: string;
};

export type CopcSummaryStats = {
  totalRecords: number;
  campusCount: number;
  programCount: number;
  academicYearCount: number;
};

export interface RepositoryFilters {
  query: string;
  campus: string;
  academicYear: string;
  program: string;
  documentType: string;
}

export type RepositoryCatalogMode = 'mock' | 'verified-static' | 'api';

export interface RepositoryStatusSnapshot {
  mode: RepositoryCatalogMode;
  label: string;
  description: string;
  sampleCertificatesFolderUrl: string;
  sampleCopcSpreadsheetUrl: string;
  stats: {
    certificates: { folders: number; documents: number; verifiedDocuments?: number; demonstrationDocuments?: number };
    technicalReviews: { demoRequests: number };
    copc: { records: number; verifiedRecords?: number; demonstrationRecords?: number };
  };
}

/**
 * Frontend repository data-provider contract.
 * Swap the static implementation for a backend API client without rewriting UI pages.
 */
export interface RepositoryDataProvider {
  getStatus(): Promise<RepositoryStatusSnapshot>;
  listCampuses(): Promise<RepoFolderNode[]>;
  browseCertificates(pathIds: string[]): Promise<CertificateBrowseResult>;
  searchCertificates(params: {
    q?: string;
    campus?: string;
    academicYear?: string;
    program?: string;
    documentType?: string;
  }): Promise<{ documents: RepoDocumentItem[] }>;
  listCopcRecords(params?: {
    q?: string;
    campus?: string;
    academicYear?: string;
    college?: string;
    program?: string;
  }): Promise<{ worksheet: string; records: CopcRecordRow[]; sourceReferenceUrl: string }>;
  listProgramOptions(): { value: string; label: string }[];
}

export interface CertificateBrowseResult {
  path: string[];
  missing: boolean;
  trail: Array<{ id: string; name: string; kind: RepoFolderKind }>;
  current: {
    id: string | null;
    name: string;
    kind: string;
    folders: RepoFolderNode[];
    documents: RepoDocumentItem[];
  };
}

export const REPOSITORY_TAB_IDS: RepositoryTabId[] = [
  'certificates',
  'technical-reviews',
  'copc',
  'sample-documents'
];

export function isRepositoryTabId(value: string | null | undefined): value is RepositoryTabId {
  return (
    value === 'certificates' ||
    value === 'technical-reviews' ||
    value === 'copc' ||
    value === 'sample-documents'
  );
}
