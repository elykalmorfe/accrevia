import { useMemo } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { accessFor, AccessRights, grantsFromRequests } from '../utils/sharing';
import { EvidenceDocument } from '../types/evidence';
import { useAreaAccess } from '../services/api/repositoryAccess';

export function useAccess(): {rightsFor: (documentId: string) => AccessRights;accessibleDocuments: EvidenceDocument[];} {
  const { currentUser, shares, documents, folders, programAccreditations, isAdmin, documentRequests, fileGrants } = usePortal();
  const areaAccess = useAreaAccess();
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
  return useMemo(() => {
    const rightsFor = (documentId: string): AccessRights => {
      const doc = documents.find(d => d.id === documentId);
      if (areaAccess.member && doc && ['ia', 'pa', 'pqa'].includes(doc.frameworkId)) {
        let area = doc.areaId;
        let parent = folders.find(f => f.id === doc.folderId);
        const visited = new Set<string>();
        while (!area && parent && !visited.has(parent.id)) {
          visited.add(parent.id); area = parent.areaId || '';
          parent = folders.find(f => f.id === parent?.parentId);
        }
        const program = doc.frameworkId === 'pa' ? programAccreditations.find(p => p.campusId === doc.campusId && p.requirements?.some(r => r.id === area))?.id || '' : '';
        const allowed = !doc.libraryOnly && areaAccess.canView({campus: doc.campusId || '', framework: doc.frameworkId, area: area || '', program});
        return {canView: allowed, canDownload: allowed, shares: []};
      }
      return accessFor(currentUser, documentId, shares, grants);
    };
    return {rightsFor, accessibleDocuments: isAdmin ? documents : documents.filter(d => d.status !== 'Archived' && rightsFor(d.id).canView)};
  }, [currentUser, shares, documents, folders, programAccreditations, isAdmin, grants, areaAccess.assignments, areaAccess.member]);
}
