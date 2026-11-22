import {
  campuses, initialCampusIA, initialCampusPQA, initialCOPCRecords, initialISORecords, initialProgramAccreditations
} from '../src/data/accreditationData';
import { areas } from '../src/data/areas';
import { criteria } from '../src/data/criteria';
import { initialFolders } from '../src/data/folders';
import { frameworks } from '../src/data/frameworks';
import { indicators } from '../src/data/indicators';
import { DEFAULT_SIGNATORIES } from '../src/data/reportTemplates';
import {
  getVerifiedCertificateRoots, getVerifiedCatalogStats, getVerifiedCopcRecords, verifiedIndividualCertificateLinkMappings
} from '../src/data/repositoryCatalog';
import { getSettings } from '../src/settings/portalSettings';
import type { RepoFolderNode } from '../src/types/accreditationRepository';
import { buildFindingsDocuments } from '../src/utils/findingsDocuments';
import { buildLinkedCertificates, buildLinkedCopcDocuments } from '../src/utils/linkedCertificates';
import { reconcilePaCopcRepository } from '../src/utils/programAccreditation';
import { buildRatingsDocuments } from '../src/utils/ratingsDocuments';

const certificates = buildLinkedCertificates(initialProgramAccreditations);
const ratings = buildRatingsDocuments(initialProgramAccreditations);
const findings = buildFindingsDocuments(initialProgramAccreditations);
const repository = reconcilePaCopcRepository(
  [...initialFolders, ...certificates.folders, ...ratings.folders, ...findings.folders],
  [...certificates.documents, ...ratings.documents, ...findings.documents, ...buildLinkedCopcDocuments(initialCOPCRecords)]
);

function flattenCatalog(nodes: RepoFolderNode[], parentId?: string): {
  folders: unknown[];
  documents: unknown[];
} {
  const folders = [];
  const documents = [];
  for (const { children, documents: items, ...folder } of nodes) {
    folders.push({ ...folder, parentId });
    documents.push(...(items ?? []).map((item) => ({ ...item, folderId: folder.id })));
    const subfolders = flattenCatalog(children ?? [], folder.id);
    folders.push(...subfolders.folders);
    documents.push(...subfolders.documents);
  }
  return { folders, documents };
}

const verified = flattenCatalog(getVerifiedCertificateRoots());

export const portalCatalog = {
  frameworks, areas, criteria, indicators, campuses,
  iaRecords: initialCampusIA,
  pqaRecords: initialCampusPQA,
  programAccreditations: initialProgramAccreditations,
  copcRecords: initialCOPCRecords,
  isoRecords: initialISORecords,
  folders: repository.folders,
  documents: repository.documents,
  verifiedCertificateFolders: verified.folders,
  verifiedCertificates: verified.documents,
  verifiedCertificateLinks: verifiedIndividualCertificateLinkMappings,
  verifiedCopcRecords: getVerifiedCopcRecords(),
  verifiedCatalogStats: getVerifiedCatalogStats(),
  report_signatories: DEFAULT_SIGNATORIES,
  settings: Object.entries(getSettings()).map(([id, section]) => ({ id, ...section }))
};
