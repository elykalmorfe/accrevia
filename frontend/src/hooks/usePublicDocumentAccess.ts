import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../contexts/PortalContext';
import { EvidenceDocument } from '../types/evidence';
import {
  downloadPublicStoredFile,
  isPublicPortalEligible,
  publicEligibilityMessage,
  resolveLivePublicDocument
} from '../utils/publicDocuments';

/**
 * Shared public-portal preview/download helpers.
 * Always re-resolves the live document record before allowing access.
 */
export function usePublicDocumentAccess() {
  const { documents } = usePortal();

  const resolveEligible = useCallback(
    (id: string): EvidenceDocument | null => resolveLivePublicDocument(documents, id),
    [documents]
  );

  const isEligibleId = useCallback((id: string) => Boolean(resolveEligible(id)), [resolveEligible]);

  const downloadById = useCallback(
    async (id: string) => {
      const live = resolveEligible(id);
      if (!live) {
        const current = documents.find((d) => d.id === id);
        const message = current
          ? publicEligibilityMessage(current)
          : 'This document is not available on the Public Document Portal.';
        toast.error(message);
        return { ok: false as const, message };
      }
      const result = await downloadPublicStoredFile(live);
      if (result.ok) toast.success(`Downloading ${result.fileName}`);
      else toast.error(result.message);
      return result;
    },
    [documents, resolveEligible]
  );

  const downloadDoc = useCallback(
    async (doc: EvidenceDocument) => downloadById(doc.id),
    [downloadById]
  );

  return {
    documents,
    resolveEligible,
    isEligibleId,
    isPublicPortalEligible,
    downloadById,
    downloadDoc
  };
}
