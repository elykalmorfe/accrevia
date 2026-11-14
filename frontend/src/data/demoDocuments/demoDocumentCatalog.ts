/**
 * Separate Faculty/Staff demonstration document catalog.
 * Intentionally NOT merged into verified AACCUP / COPC institutional catalogs.
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

export const demoDocumentCatalog: readonly DemoDocumentRecord[] = [
  {
    id: 'demo-doc-aaccup-level-ii-sample',
    title: 'Sample AACCUP Level II Certificate',
    category: 'accreditation-certificate',
    categoryLabel: 'Accreditation certificate',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Riverside Demo Campus',
    campusId: 'demo-riverside',
    college: 'College of Sample Sciences',
    program: 'BS Sample Studies',
    academicYear: '2024',
    localPreviewUrl: '/demo-documents/demo-aaccup-level-ii-sample.pdf',
    filename: 'demo-aaccup-level-ii-sample.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional demonstration PDF for Faculty/Staff preview. Not an institutional certificate.',
    locationPath: 'Sample Documents / Accreditation certificates'
  },
  {
    id: 'demo-doc-aaccup-level-iii-sample',
    title: 'Sample AACCUP Level III Certificate',
    category: 'accreditation-certificate',
    categoryLabel: 'Accreditation certificate',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Harbor Demo Campus',
    campusId: 'demo-harbor',
    college: 'College of Civic Communication',
    program: 'BA Civic Communication',
    academicYear: '2023',
    localPreviewUrl: '/demo-documents/demo-aaccup-level-iii-sample.pdf',
    filename: 'demo-aaccup-level-iii-sample.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional demonstration PDF for Faculty/Staff preview. Not an institutional certificate.',
    locationPath: 'Sample Documents / Accreditation certificates'
  },
  {
    id: 'demo-doc-copc-bsit-sample',
    title: 'Sample COPC — BS Information Technology',
    category: 'copc',
    categoryLabel: 'COPC',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Lakeside Demo Campus',
    campusId: 'demo-lakeside',
    college: 'College of Computing (Demo)',
    program: 'BS Information Technology',
    academicYear: '2025',
    localPreviewUrl: '/demo-documents/demo-copc-sample-bsit.pdf',
    filename: 'demo-copc-sample-bsit.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional COPC-style sample for UI demonstration only.',
    locationPath: 'Sample Documents / COPC'
  },
  {
    id: 'demo-doc-copc-bsed-sample',
    title: 'Sample COPC — Bachelor of Secondary Education',
    category: 'copc',
    categoryLabel: 'COPC',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Upland Demo Campus',
    campusId: 'demo-upland',
    college: 'College of Education (Demo)',
    program: 'BSEd Mathematics',
    academicYear: '2024',
    localPreviewUrl: '/demo-documents/demo-copc-sample-bsed.pdf',
    filename: 'demo-copc-sample-bsed.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional COPC-style sample for UI demonstration only.',
    locationPath: 'Sample Documents / COPC'
  },
  {
    id: 'demo-doc-faculty-qualification-summary',
    title: 'Sample Faculty Qualification Summary',
    category: 'faculty-qualification',
    categoryLabel: 'Faculty qualification',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Riverside Demo Campus',
    campusId: 'demo-riverside',
    college: 'College of Applied Demonstration Sciences',
    program: 'Faculty Affairs (Demo)',
    academicYear: '2024',
    localPreviewUrl: '/demo-documents/demo-faculty-qualification-summary.pdf',
    filename: 'demo-faculty-qualification-summary.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional faculty record using invented names. Not personal data.',
    locationPath: 'Sample Documents / Faculty qualification'
  },
  {
    id: 'demo-doc-faculty-development-record',
    title: 'Sample Faculty Development Record',
    category: 'faculty-qualification',
    categoryLabel: 'Faculty qualification',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Harbor Demo Campus',
    campusId: 'demo-harbor',
    college: 'Human Resource Development (Demo)',
    program: 'Faculty Development (Demo)',
    academicYear: '2025',
    localPreviewUrl: '/demo-documents/demo-faculty-development-record.pdf',
    filename: 'demo-faculty-development-record.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional training record for preview rehearsals only.',
    locationPath: 'Sample Documents / Faculty qualification'
  },
  {
    id: 'demo-doc-area-research-evidence',
    title: 'Sample Area III Research Evidence Packet',
    category: 'accreditation-evidence',
    categoryLabel: 'Accreditation evidence',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Lakeside Demo Campus',
    campusId: 'demo-lakeside',
    college: 'Research Office (Demo)',
    program: 'Institutional Research (Demo)',
    academicYear: '2024',
    localPreviewUrl: '/demo-documents/demo-area-research-evidence.pdf',
    filename: 'demo-area-research-evidence.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Invented evidence packet for accreditation UI demos.',
    locationPath: 'Sample Documents / Accreditation evidence'
  },
  {
    id: 'demo-doc-curriculum-syllabus-evidence',
    title: 'Sample Curriculum & Syllabus Evidence',
    category: 'accreditation-evidence',
    categoryLabel: 'Accreditation evidence',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Upland Demo Campus',
    campusId: 'demo-upland',
    college: 'Curriculum Committee (Demo)',
    program: 'DEMO 101 Quality Systems',
    academicYear: '2023',
    localPreviewUrl: '/demo-documents/demo-curriculum-syllabus-evidence.pdf',
    filename: 'demo-curriculum-syllabus-evidence.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional syllabus extract for document retrieval demos.',
    locationPath: 'Sample Documents / Accreditation evidence'
  },
  {
    id: 'demo-doc-qa-internal-audit-summary',
    title: 'Sample Internal Quality Audit Summary',
    category: 'quality-assurance',
    categoryLabel: 'Quality assurance',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Riverside Demo Campus',
    campusId: 'demo-riverside',
    college: 'Quality Assurance Office (Demo)',
    program: 'Institutional QA (Demo)',
    academicYear: '2024',
    localPreviewUrl: '/demo-documents/demo-qa-internal-audit-summary.pdf',
    filename: 'demo-qa-internal-audit-summary.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional QA summary. Not a restricted Technical Review file.',
    locationPath: 'Sample Documents / Quality assurance'
  },
  {
    id: 'demo-doc-qa-continual-improvement-plan',
    title: 'Sample Continual Improvement Plan',
    category: 'quality-assurance',
    categoryLabel: 'Quality assurance',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    documentType: 'PDF',
    campus: 'Harbor Demo Campus',
    campusId: 'demo-harbor',
    college: 'Quality Assurance Office (Demo)',
    program: 'Continual Improvement (Demo)',
    academicYear: '2025',
    localPreviewUrl: '/demo-documents/demo-qa-continual-improvement-plan.pdf',
    filename: 'demo-qa-continual-improvement-plan.pdf',
    provenance: 'demonstration',
    isDemo: true,
    dataSource: 'frontend-demonstration-fixture',
    verificationNote: 'Fictional improvement plan for Faculty/Staff preview demos.',
    locationPath: 'Sample Documents / Quality assurance'
  }
];

export function getDemoDocumentRecords(): DemoDocumentRecord[] {
  return [...demoDocumentCatalog];
}

export function getDemoDocumentById(id: string): DemoDocumentRecord | undefined {
  return demoDocumentCatalog.find((d) => d.id === id);
}

/** Map demo catalog rows onto RepoDocumentItem for existing details/preview modals. */
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
  return demoDocumentCatalog.map(toRepoDocumentItem);
}

export function demoBrowseHref(docId?: string): string {
  const params = new URLSearchParams({ tab: 'sample-documents' });
  if (docId) params.set('doc', docId);
  return `/open/browse?${params.toString()}`;
}
