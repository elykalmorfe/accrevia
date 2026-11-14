import { EvidenceDocument } from '../types/evidence';
import { getStoredFile } from './fileStore';

/**
 * Prototype public-portal helpers.
 *
 * IMPORTANT: Filtering here is client-side only (localStorage / IndexedDB).
 * Before production, add server-side authorization and signed file URLs so
 * unpublished or restricted files cannot be fetched by guessing an ID.
 */

export type PublicPublishBlocker =
  | 'not-public-confidentiality'
  | 'not-approved'
  | 'archived'
  | 'already-published'
  | 'not-published';

/** Safe defaults for records created before the publishing fields existed. */
export function normalizePublishingFields<T extends EvidenceDocument>(doc: T): T {
  return {
    ...doc,
    isPubliclyPublished: doc.isPubliclyPublished ?? false,
    publicPublishedAt: doc.publicPublishedAt ?? null
  };
}

export function normalizeDocumentsPublishingFields(docs: EvidenceDocument[]): EvidenceDocument[] {
  return docs.map(normalizePublishingFields);
}

export function isDocumentApproved(doc: EvidenceDocument): boolean {
  return (doc.approvalStatus ?? 'Pending Review') === 'Approved';
}

export function isDocumentArchived(doc: EvidenceDocument): boolean {
  return doc.status === 'Archived';
}

/** Eligible for the portal (including already-published). */
export function isPublicPortalEligible(doc: EvidenceDocument): boolean {
  return publicEligibilityBlocker(doc) === null;
}

/** Why a document fails public-portal eligibility, or `null` when eligible. */
export function publicEligibilityBlocker(doc: EvidenceDocument): Exclude<PublicPublishBlocker, 'already-published'> | null {
  const d = normalizePublishingFields(doc);
  if (d.confidentiality !== 'Public') return 'not-public-confidentiality';
  if (!isDocumentApproved(d)) return 'not-approved';
  if (isDocumentArchived(d)) return 'archived';
  if (d.isPubliclyPublished !== true) return 'not-published';
  return null;
}

export function publicEligibilityMessage(doc: EvidenceDocument): string {
  const reason = publicEligibilityBlocker(doc);
  switch (reason) {
    case 'not-public-confidentiality':
      return 'This document is not classified as Public and cannot be accessed through the Public Document Portal.';
    case 'not-approved':
      return 'This document is not approved for public access.';
    case 'archived':
      return 'This document has been archived and is no longer available on the Public Document Portal.';
    case 'not-published':
      return 'This document is not currently published to the Public Document Portal.';
    default:
      return 'This document is not available on the Public Document Portal.';
  }
}

/** Resolve the live document record and confirm it is still publicly eligible. */
export function resolveLivePublicDocument(
  documents: EvidenceDocument[],
  id: string
): EvidenceDocument | null {
  const live = documents.find((d) => d.id === id);
  if (!live) return null;
  const normalized = normalizePublishingFields(live);
  return isPublicPortalEligible(normalized) ? normalized : null;
}

/** Can the QA Office publish this document right now? */
export function canPublishToPublicPortal(doc: EvidenceDocument): { ok: true } | { ok: false; reason: PublicPublishBlocker; message: string } {
  const d = normalizePublishingFields(doc);
  if (d.confidentiality !== 'Public') {
    return {
      ok: false,
      reason: 'not-public-confidentiality',
      message: 'Set confidentiality to Public before publishing to the portal.'
    };
  }
  if (!isDocumentApproved(d)) {
    return {
      ok: false,
      reason: 'not-approved',
      message: 'Only approved documents can be published to the public portal.'
    };
  }
  if (isDocumentArchived(d)) {
    return {
      ok: false,
      reason: 'archived',
      message: 'Archived documents cannot be published to the public portal.'
    };
  }
  if (d.isPubliclyPublished) {
    return { ok: false, reason: 'already-published', message: 'This document is already published to the public portal.' };
  }
  return { ok: true };
}

export function canUnpublishFromPublicPortal(doc: EvidenceDocument): { ok: true } | { ok: false; reason: PublicPublishBlocker; message: string } {
  const d = normalizePublishingFields(doc);
  if (!d.isPubliclyPublished) {
    return { ok: false, reason: 'not-published', message: 'This document is not published to the public portal.' };
  }
  return { ok: true };
}

export function publishToPublicPortalPatch(nowIso = new Date().toISOString()): Pick<EvidenceDocument, 'isPubliclyPublished' | 'publicPublishedAt'> {
  return { isPubliclyPublished: true, publicPublishedAt: nowIso };
}

export function unpublishFromPublicPortalPatch(): Pick<EvidenceDocument, 'isPubliclyPublished' | 'publicPublishedAt'> {
  return { isPubliclyPublished: false, publicPublishedAt: null };
}

export type PublicDocumentSort = 'published-desc' | 'published-asc' | 'title-asc';

export interface PublicDocumentFilters {
  query?: string;
  areaId?: string;
  program?: string;
  docType?: string;
  /** Inclusive lower bound on `publicPublishedAt` (YYYY-MM-DD or ISO). */
  publishedFrom?: string;
  /** Inclusive upper bound on `publicPublishedAt` (YYYY-MM-DD or ISO). */
  publishedTo?: string;
  sort?: PublicDocumentSort;
}

function publishedAtValue(doc: EvidenceDocument): string {
  return doc.publicPublishedAt || doc.dateAdded || '';
}

/** Normalize a date filter value to a comparable YYYY-MM-DD prefix. */
export function toPublicDateKey(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
}

function matchesPublishedRange(doc: EvidenceDocument, from: string, to: string): boolean {
  const key = toPublicDateKey(publishedAtValue(doc));
  if (!key) return false;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

/** Public-safe text fields used for keyword search (no uploader, shares, or review notes). */
export function publicSearchHaystack(doc: EvidenceDocument, areaName = ''): string {
  return [doc.title, doc.description, doc.keywords.join(' '), doc.docType, doc.program, doc.campus, areaName]
    .join(' ')
    .toLowerCase();
}

export function filterPublicDocuments(docs: EvidenceDocument[], filters: PublicDocumentFilters = {}): EvidenceDocument[] {
  const {
    query = '',
    areaId = '',
    program = '',
    docType = '',
    publishedFrom = '',
    publishedTo = '',
    sort = 'published-desc'
  } = filters;
  const q = query.trim().toLowerCase();
  const from = toPublicDateKey(publishedFrom);
  const to = toPublicDateKey(publishedTo);

  let list = docs.filter(isPublicPortalEligible);

  if (areaId) list = list.filter((d) => d.areaId === areaId);
  if (program) list = list.filter((d) => d.program === program);
  if (docType) list = list.filter((d) => d.docType === docType);
  if (from || to) list = list.filter((d) => matchesPublishedRange(d, from, to));

  if (q) {
    list = list.filter((d) => publicSearchHaystack(d).includes(q));
  }

  return sortPublicDocuments(list, sort);
}

export function sortPublicDocuments(docs: EvidenceDocument[], sort: PublicDocumentSort = 'published-desc'): EvidenceDocument[] {
  return [...docs].sort((a, b) => {
    if (sort === 'title-asc') return a.title.localeCompare(b.title);
    if (sort === 'published-asc') return publishedAtValue(a).localeCompare(publishedAtValue(b));
    return publishedAtValue(b).localeCompare(publishedAtValue(a));
  });
}

/**
 * Prototype featured selection — no dedicated featured flag exists on EvidenceDocument.
 * Uses the latest eligible public documents by `publicPublishedAt` (falls back to dateAdded only for ordering stability).
 */
export function selectFeaturedDocuments(docs: EvidenceDocument[], limit: number): EvidenceDocument[] {
  return sortPublicDocuments(docs.filter(isPublicPortalEligible), 'published-desc').slice(0, limit);
}

/** Sort strictly by public publication timestamp (no upload-date substitution). */
export function sortByPublicPublishedAt(docs: EvidenceDocument[], direction: 'desc' | 'asc' = 'desc'): EvidenceDocument[] {
  return [...docs].sort((a, b) => {
    const left = a.publicPublishedAt || '';
    const right = b.publicPublishedAt || '';
    return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
  });
}

export type PublicDownloadResult =
  | { ok: true; fileName: string }
  | { ok: false; message: string };

/**
 * Prototype-gated download: refuses files that are not currently public-portal eligible.
 * Production must enforce the same check on the server before streaming a file.
 *
 * SECURITY (prototype): IndexedDB blobs remain reachable by document id from any
 * client code that knows the id. UI gating alone is not production authorization.
 */
export async function downloadPublicStoredFile(doc: EvidenceDocument): Promise<PublicDownloadResult> {
  const current = normalizePublishingFields(doc);
  if (!isPublicPortalEligible(current)) {
    return { ok: false, message: publicEligibilityMessage(current) };
  }

  try {
    const stored = await getStoredFile(current.id).catch(() => undefined);
    if (!stored?.blob) {
      return {
        ok: false,
        message: 'The original file for this document is not available for download.'
      };
    }

    const fileName = stored.name || sanitizeDownloadName(current.title);
    const url = URL.createObjectURL(stored.blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      // Allow the browser to begin the download before releasing the object URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
    }

    return { ok: true, fileName };
  } catch {
    return { ok: false, message: 'Download failed. Please try again.' };
  }
}

function sanitizeDownloadName(title: string): string {
  const cleaned = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim();
  return cleaned || 'document';
}
