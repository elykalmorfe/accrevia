/**
 * Chunk 9.4 — verified individual Google Drive file URL mappings for AACCUP catalog records.
 *
 * Rules:
 * - Map only by existing catalog record ID or an exact confirmed source relationship.
 * - Never invent Drive file IDs or derive URLs from filenames.
 * - Only entries with publicationApprovalStatus === 'approved' are applied to Faculty UI documents.
 * - Restricted Technical Review sources must never appear here.
 *
 * Status: no publication-approved individual file URLs are available in this checkout.
 * The array below intentionally remains empty until institutional publication approval is provided.
 */
import type { RepoDocumentItem } from '../../types/accreditationRepository';

/** How the mapping was confirmed (never filename similarity alone). */
export type VerifiedLinkMatchMethod = 'catalog-record-id' | 'verified-source-relationship';

export type PublicationApprovalStatus =
  | 'approved'
  | 'pending'
  | 'not-approved'
  | 'restricted';

export type VerifiedIndividualCertificateLink = {
  /** Existing verified catalog document `id` (must match a catalog row). */
  catalogRecordId: string;
  /** Exact verified Google Drive file URL (`/file/d/...`). Never guessed. */
  driveFileUrl: string;
  /** Human-readable source reference for provenance (folder/sheet/inventory note). */
  sourceReference: string;
  /** Verification metadata explaining how the URL was confirmed. */
  verificationMetadata: string;
  /** Frontend publication gate — only `approved` is applied to UI documents. */
  publicationApprovalStatus: PublicationApprovalStatus;
  /** Optional ISO date when the URL/relationship was verified. */
  verifiedAt?: string;
  matchMethod: VerifiedLinkMatchMethod;
};

/**
 * Importable mapping of catalog records → individual Drive file URLs.
 * Populate only with verified, publication-approved entries. Do not fabricate.
 */
export const verifiedIndividualCertificateLinkMappings: readonly VerifiedIndividualCertificateLink[] =
  [
    // Intentionally empty — Chunk 9.4 blocker:
    // No verified, publication-approved individual Google Drive file URLs were provided
    // for AACCUP certificate catalog record IDs. Folder-only references remain in force.
  ];

const FILE_URL_RE = /^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+(?:\/view)?(?:\?.*)?$/i;

export function isValidDriveFileUrl(url: string): boolean {
  return FILE_URL_RE.test(url.trim());
}

export function getLinkMappingByCatalogId(
  catalogRecordId: string
): VerifiedIndividualCertificateLink | undefined {
  return verifiedIndividualCertificateLinkMappings.find((m) => m.catalogRecordId === catalogRecordId);
}

/** Returns the Drive file URL only when publication-approved. */
export function getApprovedDriveFileUrl(catalogRecordId: string): string | undefined {
  const mapping = getLinkMappingByCatalogId(catalogRecordId);
  if (!mapping) return undefined;
  if (mapping.publicationApprovalStatus !== 'approved') return undefined;
  if (!isValidDriveFileUrl(mapping.driveFileUrl)) return undefined;
  return mapping.driveFileUrl.trim();
}

/**
 * Attach an approved individual Drive file URL onto a catalog document.
 * Leaves folder `externalUrl` intact when no approved mapping exists.
 */
export function applyApprovedDriveFileLink(doc: RepoDocumentItem): RepoDocumentItem {
  const approvedUrl = getApprovedDriveFileUrl(doc.id);
  if (!approvedUrl) return doc;
  return {
    ...doc,
    driveFileUrl: approvedUrl,
    sourceKind: 'drive-file'
  };
}

export type CertificateLinkCoverageSummary = {
  totalDocuments: number;
  approvedIndividualFileLinks: number;
  pendingOrUnapprovedMappings: number;
  folderOnlyRecords: number;
  metadataOnlyRecords: number;
  localCandidateRecords: number;
};

/**
 * Summarize link coverage for a flattened document list after approved mappings are applied.
 * Folder-only: has a Drive folder URL and no approved individual file URL.
 * Metadata-only: no folder URL, no approved file URL, and no local candidate path.
 */
export function summarizeCertificateLinkCoverage(
  documents: RepoDocumentItem[]
): CertificateLinkCoverageSummary {
  let approvedIndividualFileLinks = 0;
  let folderOnlyRecords = 0;
  let metadataOnlyRecords = 0;
  let localCandidateRecords = 0;

  for (const raw of documents) {
    const doc = applyApprovedDriveFileLink(raw);
    const hasApprovedFile = Boolean(doc.driveFileUrl?.includes('/file/d/'));
    const hasFolder = Boolean(doc.externalUrl?.includes('/folders/'));
    const hasLocal = Boolean(doc.localPreviewUrl?.trim());

    if (hasApprovedFile) approvedIndividualFileLinks += 1;
    else if (hasFolder) folderOnlyRecords += 1;
    else if (!hasLocal) metadataOnlyRecords += 1;

    if (hasLocal) localCandidateRecords += 1;
  }

  const pendingOrUnapprovedMappings = verifiedIndividualCertificateLinkMappings.filter(
    (m) => m.publicationApprovalStatus !== 'approved'
  ).length;

  return {
    totalDocuments: documents.length,
    approvedIndividualFileLinks,
    pendingOrUnapprovedMappings,
    folderOnlyRecords,
    metadataOnlyRecords,
    localCandidateRecords
  };
}

/** Structural validation helpers used by scripts and future mapping fills. */
export function validateIndividualLinkMappings(knownCatalogIds: Set<string>): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const urlById = new Map<string, string>();

  for (const mapping of verifiedIndividualCertificateLinkMappings) {
    if (!mapping.catalogRecordId?.trim()) {
      errors.push('Mapping missing catalogRecordId');
      continue;
    }
    if (seenIds.has(mapping.catalogRecordId)) {
      errors.push(`Duplicate mapping for catalogRecordId: ${mapping.catalogRecordId}`);
    }
    seenIds.add(mapping.catalogRecordId);

    if (!knownCatalogIds.has(mapping.catalogRecordId)) {
      errors.push(`Unknown catalogRecordId (not in verified catalog): ${mapping.catalogRecordId}`);
    }

    if (!mapping.driveFileUrl || !isValidDriveFileUrl(mapping.driveFileUrl)) {
      errors.push(`Invalid or fabricated-style Drive file URL for ${mapping.catalogRecordId}`);
    }
    if (mapping.driveFileUrl?.includes('/folders/')) {
      errors.push(`Folder URL used as individual file URL for ${mapping.catalogRecordId}`);
    }
    if (!mapping.sourceReference?.trim()) {
      errors.push(`Missing sourceReference for ${mapping.catalogRecordId}`);
    }
    if (!mapping.verificationMetadata?.trim()) {
      errors.push(`Missing verificationMetadata for ${mapping.catalogRecordId}`);
    }
    if (!mapping.publicationApprovalStatus) {
      errors.push(`Missing publicationApprovalStatus for ${mapping.catalogRecordId}`);
    }
    if (mapping.publicationApprovalStatus === 'restricted') {
      errors.push(`Restricted mapping must not be published: ${mapping.catalogRecordId}`);
    }

    const prior = urlById.get(mapping.catalogRecordId);
    if (prior && prior !== mapping.driveFileUrl) {
      errors.push(`Conflicting Drive URLs for ${mapping.catalogRecordId}`);
    }
    urlById.set(mapping.catalogRecordId, mapping.driveFileUrl);
  }

  return errors;
}
