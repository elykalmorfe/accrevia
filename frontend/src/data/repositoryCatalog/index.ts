/**
 * Repository catalog entry points (Chunk 9.1).
 * Verified catalogs are generated; demonstration fixtures remain in services/repository/demoRepositoryData.ts.
 * Chunk 9.4 individual Drive file link mappings are separate and publication-gated.
 */
import type { CopcRecordRow, RepoFolderNode } from '../../types/accreditationRepository';
import { verifiedCertificateCatalog } from './verifiedCertificateCatalog.generated';
import { verifiedCopcCatalog } from './verifiedCopcCatalog.generated';

export { verifiedCertificateCatalog } from './verifiedCertificateCatalog.generated';
export { verifiedCopcCatalog } from './verifiedCopcCatalog.generated';
export {
  verifiedIndividualCertificateLinkMappings,
  applyApprovedDriveFileLink,
  getApprovedDriveFileUrl,
  summarizeCertificateLinkCoverage,
  validateIndividualLinkMappings
} from './verifiedIndividualCertificateLinks';
export type {
  VerifiedIndividualCertificateLink,
  PublicationApprovalStatus,
  CertificateLinkCoverageSummary
} from './verifiedIndividualCertificateLinks';

export const VERIFIED_AACCUP_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5';

export const VERIFIED_COPC_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1RjvN8ZUlqrnJ4tA6yyieHOSIPEF7DbLYniLjT1opvUI/edit?gid=1651511406#gid=1651511406';

/** Campus + institutional folder roots for the Faculty certificates browser. */
export function getVerifiedCertificateRoots(): RepoFolderNode[] {
  const root = verifiedCertificateCatalog.tree[0] as unknown as RepoFolderNode;
  const institutional: RepoFolderNode = {
    id: 'verified-institutional-root-files',
    name: 'Institutional root files',
    kind: 'folder',
    description: 'Files listed at the AACCUP PROGRAM CERTIFICATION Drive root',
    children: [],
    documents: (root.documents ?? []) as RepoFolderNode['documents']
  };
  return [institutional, ...((root.children ?? []) as RepoFolderNode[])];
}

export function getVerifiedCopcRecords(): CopcRecordRow[] {
  return verifiedCopcCatalog.records as unknown as CopcRecordRow[];
}

export function getVerifiedCatalogStats() {
  return {
    certificates: verifiedCertificateCatalog.stats,
    copc: verifiedCopcCatalog.stats,
    certificateMissing: verifiedCertificateCatalog.missing,
    copcMissing: verifiedCopcCatalog.missing
  };
}
