/**
 * Faculty/Staff repository data access.
 * Chunk 9.1: delegates to the static verified catalog provider.
 * Swap `activeRepositoryProvider` for a backend API client later without changing UI contracts.
 */
import type {
  CertificateBrowseResult,
  CopcRecordRow,
  RepositoryDataProvider,
  RepositoryStatusSnapshot
} from '../../types/accreditationRepository';
import { staticRepositoryProvider } from './staticRepositoryProvider';

/** Active provider binding — replace with API client when backend endpoints are ready. */
export const activeRepositoryProvider: RepositoryDataProvider = staticRepositoryProvider;

export async function getRepositoryStatus(): Promise<RepositoryStatusSnapshot> {
  return activeRepositoryProvider.getStatus();
}

export async function browseCertificates(pathIds: string[]): Promise<CertificateBrowseResult> {
  return activeRepositoryProvider.browseCertificates(pathIds);
}

export async function searchCertificates(params: {
  q?: string;
  campus?: string;
  academicYear?: string;
  program?: string;
  documentType?: string;
}): Promise<{ documents: import('../../types/accreditationRepository').RepoDocumentItem[] }> {
  return activeRepositoryProvider.searchCertificates(params);
}

export async function listCopcRecords(params?: {
  q?: string;
  campus?: string;
  academicYear?: string;
  college?: string;
  program?: string;
}): Promise<{ worksheet: string; records: CopcRecordRow[]; sourceReferenceUrl: string }> {
  return activeRepositoryProvider.listCopcRecords(params);
}

export function listDemoProgramOptions(): { value: string; label: string }[] {
  return activeRepositoryProvider.listProgramOptions();
}

export async function listCampuses() {
  return activeRepositoryProvider.listCampuses();
}
