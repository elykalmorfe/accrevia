import type { EvidenceDocument } from '../../types/evidence';
import { isPublicPortalEligible, normalizePublishingFields } from '../../utils/publicDocuments';
import { accessFor } from '../../utils/sharing';
import type { DocumentShare } from '../../types/sharing';
import type { PortalUser } from '../../types/user';

/**
 * Faculty/Staff access-visibility classification (frontend prototype only).
 *
 * Production authorization must be enforced by the backend. Client-side filtering
 * is for demonstration and must not be treated as secure access control.
 *
 * Rules for this prototype:
 * - demonstration: approved sample PDFs in the demo catalog (allowed, labeled)
 * - public: evidence explicitly published to the public portal (allowed)
 * - authorized: evidence shared with the current user (allowed via useAccess)
 * - unknown / restricted: verified AACCUP/COPC static catalog rows without an
 *   explicit publication approval flag — NOT exposed in Faculty/Staff search UI
 */
export type FacultyVisibilityClass =
  | 'demonstration'
  | 'public'
  | 'authorized'
  | 'restricted'
  | 'unknown';

export const FACULTY_ACCESS_VISIBILITY_NOTE =
  'Faculty/Staff visibility is a frontend demonstration classification. Verified AACCUP/COPC catalog rows are not assumed publicly authorized. Backend authorization is required for production.';

/** Whether Faculty/Staff search/browse may surface this visibility class. */
export function isFacultyDiscoverable(visibility: FacultyVisibilityClass): boolean {
  return visibility === 'demonstration' || visibility === 'public' || visibility === 'authorized';
}

/** Demo catalog entries are explicitly approved demonstration samples. */
export function classifyDemoDocument(): FacultyVisibilityClass {
  return 'demonstration';
}

/**
 * Verified static catalog rows (AACCUP certificates / COPC spreadsheet) have no
 * explicit Faculty/Staff publication approval in this prototype → unknown.
 * Do not treat catalog presence as public authorization.
 */
export function classifyVerifiedCatalogRecord(): FacultyVisibilityClass {
  return 'unknown';
}

/** Classify an evidence document for Faculty/Staff discovery. */
export function classifyEvidenceForFaculty(
  doc: EvidenceDocument,
  currentUser: PortalUser,
  shares: DocumentShare[]
): FacultyVisibilityClass {
  const normalized = normalizePublishingFields(doc);
  if (isPublicPortalEligible(normalized)) return 'public';
  const rights = accessFor(currentUser, normalized.id, shares);
  if (rights.canView) return 'authorized';
  if (normalized.confidentiality === 'Confidential' || normalized.confidentiality === 'Internal') {
    return 'restricted';
  }
  return 'unknown';
}

/** Evidence the Faculty/Staff search UI may list (public + explicitly shared). */
export function filterFacultyDiscoverableEvidence(
  documents: EvidenceDocument[],
  currentUser: PortalUser,
  shares: DocumentShare[]
): EvidenceDocument[] {
  return documents.filter((doc) => isFacultyDiscoverable(classifyEvidenceForFaculty(doc, currentUser, shares)));
}
