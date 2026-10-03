import { useMemo } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { accessFor, AccessRights } from '../utils/sharing';
import { EvidenceDocument } from '../types/evidence';

export function useAccess(): {rightsFor: (documentId: string) => AccessRights;accessibleDocuments: EvidenceDocument[];} {
  const { currentUser, shares, documents, isAdmin } = usePortal();
  return useMemo(
    () => ({
      rightsFor: (documentId: string) => accessFor(currentUser, documentId, shares),
      accessibleDocuments: isAdmin ? documents : documents.filter((d) => d.status !== 'Archived' && accessFor(currentUser, d.id, shares).canView)
    }),
    [currentUser, shares, documents, isAdmin]
  );
}