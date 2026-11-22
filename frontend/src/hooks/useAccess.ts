import { useMemo } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { accessFor, AccessRights, grantsFromRequests } from '../utils/sharing';
import { EvidenceDocument } from '../types/evidence';

export function useAccess(): {rightsFor: (documentId: string) => AccessRights;accessibleDocuments: EvidenceDocument[];} {
  const { currentUser, shares, documents, isAdmin, documentRequests, fileGrants } = usePortal();
  const grants = useMemo(
    () => {
      const fromRequests = grantsFromRequests(currentUser, documentRequests);
      const merged = new Map(fromRequests.map((grant) => [grant.documentId, grant]));
      fileGrants.forEach((grant) => {
        const previous = merged.get(grant.documentId);
        if (!previous || (grant.canDownload && !previous.canDownload)) {
          merged.set(grant.documentId, { ...grant, name: grant.name || previous?.name, fileType: grant.fileType || previous?.fileType });
        } else if (!previous.name && grant.name) {
          merged.set(grant.documentId, { ...previous, name: grant.name, fileType: grant.fileType || previous.fileType });
        }
      });
      return [...merged.values()];
    },
    [currentUser, documentRequests, fileGrants]
  );
  return useMemo(
    () => ({
      rightsFor: (documentId: string) => accessFor(currentUser, documentId, shares, grants),
      accessibleDocuments: isAdmin
        ? documents
        : documents.filter((d) => d.status !== 'Archived' && accessFor(currentUser, d.id, shares, grants).canView)
    }),
    [currentUser, shares, documents, isAdmin, grants]
  );
}