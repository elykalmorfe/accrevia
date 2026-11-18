/**
 * Faculty/Staff demonstration document catalog — intentionally empty.
 * Use verified institutional catalogs and real uploads only.
 */
import type { RepoDocumentItem } from '../../types/accreditationRepository';

export type DemoDocumentCategory =
  | 'accreditation-certificate'
  | 'copc'
  | 'faculty-qualification'
  | 'accreditation-evidence'
  | 'quality-assurance';

export type DemoDocumentRecord = {
  id: string;
  title: string;
  category: DemoDocumentCategory;
  categoryLabel: string;
  fileType: 'PDF';
  mimeType: 'application/pdf';
  documentType: 'PDF';
  campus: string;
  campusId: string;
  college?: string;
  program?: string;
  academicYear?: string;
  localPreviewUrl: string;
  filename: string;
  provenance: 'demonstration';
  isDemo: true;
  dataSource: 'frontend-demonstration-fixture';
  verificationNote: string;
  locationPath: string;
};

export const DEMO_DOCUMENTS_BANNER = 'SAMPLE DOCUMENT — FOR DEMONSTRATION ONLY';

export const demoDocumentCatalog: readonly DemoDocumentRecord[] = [];

export function getDemoDocumentRecords(): DemoDocumentRecord[] {
  return [];
}

export function getDemoDocumentById(_id: string): DemoDocumentRecord | undefined {
  return undefined;
}

export function toRepoDocumentItem(record: DemoDocumentRecord): RepoDocumentItem {
  return {
    id: record.id,
    name: record.title,
    mimeType: record.mimeType,
    documentType: record.documentType,
    category: record.category,
    campus: record.campus,
    campusId: record.campusId,
    college: record.college,
    program: record.program,
    academicYear: record.academicYear,
    localPreviewUrl: record.localPreviewUrl,
    sourceKind: 'local-file',
    locationPath: record.locationPath,
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: record.verificationNote
  };
}

export function listDemoRepoDocuments(): RepoDocumentItem[] {
  return [];
}

export function demoBrowseHref(docId?: string): string {
  const params = new URLSearchParams({ tab: 'sample-documents' });
  if (docId) params.set('doc', docId);
  return `/open/browse?${params.toString()}`;
}
