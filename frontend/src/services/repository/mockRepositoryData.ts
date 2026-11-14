import type { CopcRecordRow, RepoFolderNode } from '../../types/accreditationRepository';

/** Public sample certificates folder used as a frontend reference only. */
export const SAMPLE_CERTIFICATES_FOLDER_URL =
  'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5';

/** COPC spreadsheet reference for prototype labeling (not live-fetched). */
export const SAMPLE_COPC_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1RjvN8ZUlqrnJ4tA6yyieHOSIPEF7DbLYniLjT1opvUI/edit';

/**
 * Restricted Technical Review Drive sources are backend-owned.
 * Never ship restricted folder IDs, file IDs, filenames, or Drive URLs in the Faculty/Staff frontend.
 */

const DEMO_DOC = (id: string, name: string, academicYear?: string): NonNullable<RepoFolderNode['documents']>[number] => ({
  id,
  name: `[DEMO] ${name}`,
  mimeType: 'application/pdf',
  isDemo: true,
  externalUrl: SAMPLE_CERTIFICATES_FOLDER_URL,
  academicYear,
  updatedAt: 'Demo placeholder',
  provenance: 'demonstration',
  dataSource: 'frontend-demonstration-fixture',
  verificationNote: 'Invented demonstration fixture — not a verified Drive record'
});

/**
 * Demonstration-only campus hierarchy (Chunk 9.1 keeps this separate from verified catalogs).
 * Folder/document names are clearly DEMO and are not verified accreditation facts.
 */
export const mockCertificateTree: RepoFolderNode[] = [
  {
    id: 'tandag',
    name: 'Tandag',
    kind: 'campus',
    description: 'Sample campus folder (demo catalog)',
    children: [
      {
        id: 'tandag-cas',
        name: 'College of Arts and Sciences',
        kind: 'college',
        children: [
          {
            id: 'tandag-cas-bscs',
            name: 'BS Computer Science',
            kind: 'program',
            children: [
              {
                id: 'tandag-cas-bscs-2024',
                name: '2024–2025',
                kind: 'year',
                documents: [
                  DEMO_DOC('demo-tandag-bscs-1', 'Program accreditation certificate (sample).pdf', '2024–2025'),
                  DEMO_DOC('demo-tandag-bscs-2', 'Certificate scan placeholder.pdf', '2024–2025')
                ]
              }
            ]
          }
        ]
      }
    ],
    documents: [DEMO_DOC('demo-tandag-root', 'Campus overview certificate packet (sample).pdf')]
  },
  {
    id: 'bislig',
    name: 'Bislig',
    kind: 'campus',
    description: 'Sample campus folder (demo catalog)',
    children: [
      {
        id: 'bislig-coe',
        name: 'College of Engineering',
        kind: 'college',
        children: [
          {
            id: 'bislig-coe-bsce',
            name: 'BS Civil Engineering',
            kind: 'program',
            documents: [DEMO_DOC('demo-bislig-bsce', 'Program certificate placeholder.pdf')]
          }
        ]
      }
    ]
  },
  {
    id: 'cagwait',
    name: 'Cagwait',
    kind: 'campus',
    description: 'Sample campus folder (demo catalog)',
    children: [
      {
        id: 'cagwait-chtm',
        name: 'Hospitality programs (sample folder)',
        kind: 'folder',
        documents: [DEMO_DOC('demo-cagwait-1', 'Sample certificate card.pdf')]
      }
    ]
  },
  {
    id: 'cantilan',
    name: 'Cantilan',
    kind: 'campus',
    description: 'Sample campus folder (demo catalog)',
    children: [
      {
        id: 'cantilan-2023',
        name: '2023–2024',
        kind: 'year',
        documents: [DEMO_DOC('demo-cantilan-1', 'Multi-program certificate sample.pdf', '2023–2024')]
      }
    ]
  },
  {
    id: 'lianga',
    name: 'Lianga',
    kind: 'campus',
    description: 'Sample campus folder (demo catalog)',
    documents: [DEMO_DOC('demo-lianga-1', 'Sample certificate document.pdf')]
  },
  {
    id: 'san-miguel',
    name: 'San Miguel',
    kind: 'campus',
    description: 'Sample campus folder (demo catalog)',
    children: [
      {
        id: 'san-miguel-agriculture',
        name: 'Agriculture-related programs (sample)',
        kind: 'folder',
        documents: [DEMO_DOC('demo-sm-1', 'Demo certificate file.pdf')]
      }
    ]
  },
  {
    id: 'tagbina',
    name: 'Tagbina',
    kind: 'campus',
    description: 'Sample campus folder (demo catalog)',
    children: [
      {
        id: 'tagbina-teacher-ed',
        name: 'Teacher education (sample folder)',
        kind: 'folder',
        documents: [DEMO_DOC('demo-tag-1', 'Sample accreditation certificate.pdf')]
      }
    ]
  }
];

/**
 * Invented layout rows only — every row is SAMPLE DATA.
 * Certificate numbers use a SAMPLE- prefix and are not official CHED identifiers.
 * No official compliance statuses or expiration dates are invented.
 */
export const mockCopcRecords: CopcRecordRow[] = [
  {
    id: 'sample-copc-1',
    campus: 'Tandag',
    college: 'College of Arts and Sciences',
    program: 'BS Computer Science (sample)',
    academicYear: '2026',
    certificateNumber: 'SAMPLE-0001',
    sampleNote: 'Layout sample for program information columns',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-2',
    campus: 'Bislig',
    college: 'College of Engineering',
    program: 'BS Civil Engineering (sample)',
    academicYear: '2026',
    certificateNumber: 'SAMPLE-0002',
    sampleNote: 'Layout sample for campus filter testing',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-3',
    campus: 'Cantilan',
    college: 'College of Computing',
    program: 'BS Information Technology (sample)',
    academicYear: '2026',
    certificateNumber: 'SAMPLE-0003',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-4',
    campus: 'Tagbina',
    college: 'College of Education',
    program: 'Bachelor of Elementary Education (sample)',
    academicYear: '2026',
    certificateNumber: 'SAMPLE-0004',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-5',
    campus: 'Cagwait',
    college: 'Hospitality programs',
    program: 'BS Hospitality Management (sample)',
    academicYear: '2025',
    certificateNumber: 'SAMPLE-0005',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-6',
    campus: 'Lianga',
    college: 'College of Arts and Sciences',
    program: 'BS Environmental Science (sample)',
    academicYear: '2025',
    certificateNumber: 'SAMPLE-0006',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-7',
    campus: 'San Miguel',
    college: 'Agriculture-related programs',
    program: 'BS Agriculture (sample)',
    academicYear: '2025',
    certificateNumber: 'SAMPLE-0007',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-8',
    campus: 'Tandag',
    college: 'College of Engineering',
    program: 'BS Civil Engineering (sample)',
    academicYear: '2025',
    certificateNumber: 'SAMPLE-0008',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-9',
    campus: 'Cantilan',
    college: 'College of Education',
    program: 'Bachelor of Secondary Education (sample)',
    academicYear: '2024',
    certificateNumber: 'SAMPLE-0009',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-10',
    campus: 'Bislig',
    college: 'College of Technology',
    program: 'BS Industrial Technology (sample)',
    academicYear: '2024',
    certificateNumber: 'SAMPLE-0010',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-11',
    campus: 'Tagbina',
    college: 'Business programs',
    program: 'BSBA Human Resource Management (sample)',
    academicYear: '2024',
    certificateNumber: 'SAMPLE-0011',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  },
  {
    id: 'sample-copc-12',
    campus: 'Tandag',
    college: 'College of Education',
    program: 'Bachelor of Secondary Education (sample)',
    academicYear: '2026',
    certificateNumber: 'SAMPLE-0012',
    sampleNote: 'Extra row for pagination demonstration',
    worksheet: '2026',
    isSample: true,
    provenance: 'demonstration',
    dataSource: 'frontend-demonstration-fixture'
  }
];

/** Explicit aliases for Chunk 9.1 provenance separation. */
export const demonstrationCertificateTree = mockCertificateTree;
export const demonstrationCopcRecords = mockCopcRecords;
