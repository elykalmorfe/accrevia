import type { RepoDocumentItem, RepoDocumentSourceKind, RepoFolderNode } from '../../types/accreditationRepository';
import { applyApprovedDriveFileLink } from '../../data/repositoryCatalog/verifiedIndividualCertificateLinks';

export function mimeToDocumentType(mimeType?: string): string {
  if (!mimeType) return 'Document';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Spreadsheet';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word document';
  return 'Document';
}

/**
 * Catalog-declared source kind. Local paths are candidates only —
 * use `documentAccess.probeLocalPreview` before treating a file as available.
 * Never invent individual Drive file IDs.
 */
export function resolveSourceKind(
  doc: Pick<RepoDocumentItem, 'localPreviewUrl' | 'externalUrl' | 'driveFileUrl' | 'sourceKind'>
): RepoDocumentSourceKind {
  if (doc.sourceKind) return doc.sourceKind;
  if (doc.driveFileUrl) return 'drive-file';
  if (doc.localPreviewUrl) return 'local-file';
  if (doc.externalUrl?.includes('/folders/')) return 'drive-folder';
  if (doc.externalUrl?.includes('/file/d/')) return 'drive-file';
  if (doc.externalUrl) return 'drive-folder';
  return 'unavailable';
}

export function enrichDocument(
  doc: RepoDocumentItem,
  trail: RepoFolderNode[],
  campusFallback?: string
): RepoDocumentItem {
  const campusNode = trail.find((n) => n.kind === 'campus');
  const collegeNode = trail.find((n) => n.kind === 'college');
  const programNode = trail.find((n) => n.kind === 'program');
  const yearNode = trail.find((n) => n.kind === 'year');

  const enriched: RepoDocumentItem = {
    ...doc,
    campusId: campusNode?.id ?? doc.campusId,
    campus: campusNode?.name ?? doc.campus ?? campusFallback,
    college: collegeNode?.name ?? doc.college,
    program: programNode?.name ?? doc.program,
    academicYear: yearNode?.name ?? doc.academicYear,
    locationPath: trail.length ? trail.map((n) => n.name).join(' / ') : doc.locationPath,
    documentType: doc.documentType ?? mimeToDocumentType(doc.mimeType),
    sourceKind: doc.sourceKind ?? resolveSourceKind(doc)
  };

  // Chunk 9.4: attach publication-approved individual Drive file URLs by catalog ID only.
  const withApprovedLink = applyApprovedDriveFileLink(enriched);
  return {
    ...withApprovedLink,
    sourceKind: withApprovedLink.driveFileUrl
      ? 'drive-file'
      : withApprovedLink.sourceKind ?? resolveSourceKind(withApprovedLink)
  };
}

/** Walk the tree and emit documents with location metadata for search. */
export function flattenEnrichedDocuments(
  nodes: RepoFolderNode[],
  trail: RepoFolderNode[] = []
): RepoDocumentItem[] {
  const out: RepoDocumentItem[] = [];
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    for (const doc of node.documents ?? []) {
      out.push(enrichDocument(doc, nextTrail));
    }
    out.push(...flattenEnrichedDocuments(node.children ?? [], nextTrail));
  }
  return out;
}
