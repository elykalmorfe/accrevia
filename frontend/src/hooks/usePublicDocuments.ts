import { useMemo } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { EvidenceDocument } from '../types/evidence';
import {
  PublicDocumentFilters,
  PublicDocumentSort,
  filterPublicDocuments,
  isPublicPortalEligible,
  normalizeDocumentsPublishingFields,
  publicSearchHaystack,
  sortPublicDocuments
} from '../utils/publicDocuments';
import { searchEvidence } from '../utils/search';
import { useLookup } from './useLookup';

export type { PublicDocumentFilters, PublicDocumentSort };

/**
 * Read-only access to documents explicitly published to the Public Document Portal.
 * Never returns confidential, internal, unapproved, archived, or unpublished records.
 *
 * Prototype note: eligibility is enforced in the client only. Production must
 * authorize list/search/download on the server before returning file bytes.
 */
export function usePublicDocuments(filters: PublicDocumentFilters = {}) {
  const { documents } = usePortal();
  const lookup = useLookup();

  const normalized = useMemo(() => normalizeDocumentsPublishingFields(documents), [documents]);

  const published = useMemo(() => normalized.filter(isPublicPortalEligible), [normalized]);

  const {
    query = '',
    areaId = '',
    program = '',
    docType = '',
    publishedFrom = '',
    publishedTo = '',
    sort = 'published-desc'
  } = filters;

  const filtered = useMemo(() => {
    const scoped = filterPublicDocuments(normalized, {
      areaId,
      program,
      docType,
      publishedFrom,
      publishedTo,
      sort,
      query: ''
    });

    const q = query.trim();
    if (!q) return scoped;

    const ranked = searchEvidence(q, scoped, lookup).map((r) => r.doc);
    if (ranked.length > 0) {
      return sortPublicDocuments(ranked, sort);
    }

    // Fallback: public-safe substring match (includes area name).
    const lower = q.toLowerCase();
    const matched = scoped.filter((d) => {
      const areaName = lookup.area(d.areaId)?.name ?? '';
      return publicSearchHaystack(d, areaName).includes(lower);
    });
    return sortPublicDocuments(matched, sort);
  }, [normalized, query, areaId, program, docType, publishedFrom, publishedTo, sort, lookup]);

  const areaOptions = useMemo(() => {
    const ids = [...new Set(published.map((d) => d.areaId).filter(Boolean))];
    return ids
      .map((id) => ({ value: id, label: lookup.area(id)?.name || id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [published, lookup]);

  const programOptions = useMemo(() => {
    return [...new Set(published.map((d) => d.program).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [published]);

  const docTypeOptions = useMemo(() => {
    return [...new Set(published.map((d) => d.docType).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [published]);

  return {
    /** All currently eligible published documents (ignores UI filters except eligibility). */
    publishedDocuments: published,
    /** Published documents after search / area / program / type / date / sort filters. */
    documents: filtered as EvidenceDocument[],
    totalPublished: published.length,
    areaOptions,
    programOptions,
    docTypeOptions,
    isPublicPortalEligible
  };
}
