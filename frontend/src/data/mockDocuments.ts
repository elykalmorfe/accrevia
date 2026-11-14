import type { ApprovalStatus, DocumentStatus, DocumentType, EvidenceDocument, FileType } from '../types/evidence';

const DOCUMENTS_KEY = 'accrevia_documents';
const MOCK_SEED_KEY = 'accrevia_mock_documents';
const MOCK_SEED_VERSION = 'v1';

interface MockSpec {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  frameworkId: string;
  areaId: string;
  criterionId: string;
  docType: DocumentType;
  academicYear: string;
  campusId: string;
  campus: string;
  program?: string;
  college?: string;
  office: string;
  uploadedBy: string;
  /** Upload date relative to the day the mock records are first seeded. */
  daysAgo: number;
  fileType: FileType;
  pages: number;
  sizeMb: number;
  status?: DocumentStatus;
  approvalStatus?: ApprovalStatus;
  revisionNotes?: string;
  reviewedBy?: string;
  folderId?: string;
  passages: string[];
}

const specs: MockSpec[] = [
  {
    id: 'mock-doc-01',
    title: 'Institutional Self-Survey Report AY 2025-2026.pdf',
    description: 'Consolidated self-survey report covering all institutional accreditation criteria.',
    keywords: ['self-survey', 'institutional accreditation', 'governance'],
    frameworkId: 'ia', areaId: 'governance', criterionId: 'c-ia-1', docType: 'Report',
    academicYear: '2025–2026', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    office: 'Quality Assurance Office', uploadedBy: 'Dr. Maria L. Santos',
    daysAgo: 1, fileType: 'PDF', pages: 86, sizeMb: 4.2,
    approvalStatus: 'Pending Review', folderId: 'folder-ia',
    passages: ['The University continues to strengthen its governance structures in line with its Vision, Mission, Goals, and Objectives.']
  },
  {
    id: 'mock-doc-02',
    title: 'Faculty Development Program Accomplishment Report.docx',
    description: 'Summary of trainings, seminars, and graduate studies supported for faculty members.',
    keywords: ['faculty development', 'training', 'seminars'],
    frameworkId: 'ia', areaId: 'faculty', criterionId: 'c-ia-2', docType: 'Accomplishment Report',
    academicYear: '2025–2026', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    office: 'Human Resource Management Office', uploadedBy: 'Ana Marie T. Ochoa',
    daysAgo: 3, fileType: 'DOCX', pages: 24, sizeMb: 1.1,
    approvalStatus: 'Approved', reviewedBy: 'System Administrator', folderId: 'folder-ia',
    passages: ['A total of 48 faculty members attended discipline-based trainings and 12 pursued graduate studies during the academic year.']
  },
  {
    id: 'mock-doc-03',
    title: 'BSIT Area III Curriculum and Instruction Portfolio.pdf',
    description: 'Program curriculum, syllabi, and instructional delivery evidence for AACCUP Area III.',
    keywords: ['curriculum', 'syllabi', 'BSIT', 'Area III'],
    frameworkId: 'pa', areaId: 'curriculum', criterionId: 'c-pa-3', docType: 'Report',
    academicYear: '2025–2026', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    program: 'BS Information Technology', college: 'College of Information Technology',
    office: 'College of Information Technology', uploadedBy: 'Engr. Mark Anthony Reyes',
    daysAgo: 5, fileType: 'PDF', pages: 132, sizeMb: 7.8,
    approvalStatus: 'Needs Revision',
    revisionNotes: 'Attach the updated OBE-aligned syllabi for 3rd-year courses.',
    reviewedBy: 'System Administrator', folderId: 'folder-pa',
    passages: ['The BSIT curriculum is aligned with CMO No. 25, s. 2015 and implements outcomes-based education.']
  },
  {
    id: 'mock-doc-04',
    title: 'COPC Faculty Qualifications Matrix - BS Civil Engineering.xlsx',
    description: 'Faculty qualification matrix submitted for CHED Certificate of Program Compliance.',
    keywords: ['COPC', 'faculty qualifications', 'civil engineering'],
    frameworkId: 'copc', areaId: 'faculty', criterionId: 'c-copc-1', docType: 'Faculty Record',
    academicYear: '2025–2026', campusId: 'cantilan', campus: 'Cantilan Campus',
    program: 'BS Civil Engineering', college: 'College of Engineering',
    office: 'College of Engineering', uploadedBy: 'Dr. Teresita A. Gonzaga',
    daysAgo: 8, fileType: 'XLSX', pages: 6, sizeMb: 0.4,
    approvalStatus: 'Approved', reviewedBy: 'System Administrator', folderId: 'folder-copc',
    passages: ['All faculty handling professional courses are licensed civil engineers with relevant master\'s degrees.']
  },
  {
    id: 'mock-doc-05',
    title: 'ISO 9001:2015 Internal Quality Audit Report Q3.pdf',
    description: 'Results of the third-quarter internal quality audit including nonconformities.',
    keywords: ['ISO 9001', 'internal audit', 'nonconformity'],
    frameworkId: 'iso', areaId: 'qa', criterionId: 'c-iso-9', docType: 'Report',
    academicYear: '2025–2026', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    office: 'Quality Management System Office', uploadedBy: 'Jun Carlo P. Esteban',
    daysAgo: 12, fileType: 'PDF', pages: 18, sizeMb: 2.3,
    folderId: 'folder-iso',
    passages: ['Two minor nonconformities were raised on document control and records retention.']
  },
  {
    id: 'mock-doc-06',
    title: 'Research Publications Inventory AY 2025-2026.xlsx',
    description: 'Inventory of faculty research outputs published in indexed journals.',
    keywords: ['research', 'publications', 'Scopus'],
    frameworkId: 'ia', areaId: 'research', criterionId: 'c-ia-4', docType: 'Statistical Report',
    academicYear: '2025–2026', campusId: 'bislig', campus: 'Bislig Campus',
    office: 'Research and Development Office', uploadedBy: 'Prof. Liza M. Cabrera',
    daysAgo: 18, fileType: 'XLSX', pages: 4, sizeMb: 0.3,
    approvalStatus: 'Approved', reviewedBy: 'System Administrator', folderId: 'folder-ia',
    passages: ['Fourteen research articles were published in Scopus-indexed journals during the academic year.']
  },
  {
    id: 'mock-doc-07',
    title: 'Community Extension Program Documentation - Coastal Livelihood.pdf',
    description: 'Photo documentation and terminal report of the coastal livelihood extension program.',
    keywords: ['extension', 'community', 'livelihood'],
    frameworkId: 'ia', areaId: 'extension', criterionId: 'c-ia-5', docType: 'Photo / Documentation',
    academicYear: '2025–2026', campusId: 'lianga', campus: 'Lianga Campus',
    office: 'Extension Services Office', uploadedBy: 'Dr. Gemma R. Plaza',
    daysAgo: 24, fileType: 'PDF', pages: 40, sizeMb: 9.6,
    approvalStatus: 'Pending Review', folderId: 'folder-ia',
    passages: ['The program trained 65 fisherfolk beneficiaries on seaweed farming and fish processing.']
  },
  {
    id: 'mock-doc-08',
    title: 'PQA Leadership System Narrative.docx',
    description: 'Category 1 narrative describing how senior leaders set direction and sustain performance.',
    keywords: ['PQA', 'leadership', 'Category 1'],
    frameworkId: 'pqa', areaId: 'governance', criterionId: 'c-pqa-1', docType: 'Report',
    academicYear: '2025–2026', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    office: 'Office of the President', uploadedBy: 'System Administrator',
    daysAgo: 35, fileType: 'DOCX', pages: 15, sizeMb: 0.8,
    folderId: 'folder-pqa',
    passages: ['Senior leaders communicate the strategic direction through quarterly management reviews.']
  },
  {
    id: 'mock-doc-09',
    title: 'Scanned Memorandum - Accreditation Task Force.jpg',
    description: 'Scanned memorandum awaiting classification.',
    keywords: ['memorandum', 'task force'],
    frameworkId: '', areaId: '', criterionId: '', docType: 'Memorandum',
    academicYear: '2025–2026', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    office: 'Records Office', uploadedBy: 'Rhea Mae Tolentino',
    daysAgo: 2, fileType: 'JPG', pages: 1, sizeMb: 1.6,
    status: 'Pending Classification',
    passages: ['Creation of the University Accreditation Task Force for AY 2025-2026.']
  },
  {
    id: 'mock-doc-10',
    title: 'Library Holdings Certification - BS Education.pdf',
    description: 'Certification of library titles and holdings for the BS Education program.',
    keywords: ['library', 'holdings', 'COPC'],
    frameworkId: 'copc', areaId: 'library', criterionId: 'c-copc-2', docType: 'Certificate',
    academicYear: '2025–2026', campusId: 'tagbina', campus: 'Tagbina Campus',
    program: 'Bachelor of Secondary Education', college: 'College of Teacher Education',
    office: 'University Library', uploadedBy: 'Engr. Ramon D. Villanueva',
    daysAgo: 48, fileType: 'PDF', pages: 9, sizeMb: 1.2,
    approvalStatus: 'Approved', reviewedBy: 'System Administrator', folderId: 'folder-copc',
    passages: ['The library holds 1,250 titles relevant to the BSEd program, exceeding CHED minimum requirements.']
  },
  {
    id: 'mock-doc-11',
    title: 'Student Services Program Evaluation Report.pdf',
    description: 'Evaluation of guidance, scholarship, and student welfare services.',
    keywords: ['student services', 'guidance', 'scholarship'],
    frameworkId: 'ia', areaId: 'students', criterionId: 'c-ia-6', docType: 'Report',
    academicYear: '2024–2025', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    office: 'Office of Student Affairs', uploadedBy: 'Sarah Jane Flores',
    daysAgo: 320, fileType: 'PDF', pages: 28, sizeMb: 2.9,
    approvalStatus: 'Approved', reviewedBy: 'System Administrator', folderId: 'folder-ia',
    passages: ['Student satisfaction with guidance services reached 92% in the annual survey.']
  },
  {
    id: 'mock-doc-12',
    title: 'Superseded Campus Development Plan 2020-2024.pdf',
    description: 'Previous campus development plan kept for reference.',
    keywords: ['development plan', 'planning'],
    frameworkId: 'ia', areaId: 'planning', criterionId: 'c-ia-10', docType: 'Plan',
    academicYear: '2025–2026', campusId: 'tandag', campus: 'Tandag Campus (Main)',
    office: 'Planning and Development Office', uploadedBy: 'Dr. Evelyn C. Miranda',
    daysAgo: 60, fileType: 'PDF', pages: 54, sizeMb: 3.5,
    status: 'Archived', approvalStatus: 'Approved', reviewedBy: 'System Administrator', folderId: 'folder-ia',
    passages: ['This plan has been superseded by the Campus Development Plan 2025-2029.']
  }
];

function isoDate(base: Date, daysAgo: number) {
  const d = new Date(base);
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildMockDocuments(today: Date): EvidenceDocument[] {
  return specs.map(({ daysAgo, ...s }) => ({
    ...s,
    indicatorId: '',
    cycle: '',
    program: s.program ?? '',
    college: s.college ?? '',
    department: '',
    documentDate: isoDate(today, daysAgo + 2),
    confidentiality: 'Internal',
    status: s.status ?? 'Indexed',
    dateAdded: isoDate(today, daysAgo),
    reviewedAt: s.approvalStatus && s.approvalStatus !== 'Pending Review' ? isoDate(today, Math.max(daysAgo - 1, 0)) : undefined
  }));
}

/**
 * Adds the mock documents to stored documents once per browser. Later edits, archives,
 * and deletions stick because the seed is never re-applied after the version flag is stored.
 */
export function seedMockDocuments() {
  try {
    if (localStorage.getItem(MOCK_SEED_KEY) === MOCK_SEED_VERSION) return;
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const stored = Array.isArray(parsed) ? (parsed as EvidenceDocument[]) : [];
    const existingIds = new Set(stored.map((d) => d.id));
    const mocks = buildMockDocuments(new Date()).filter((d) => !existingIds.has(d.id));
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify([...mocks, ...stored]));
    localStorage.setItem(MOCK_SEED_KEY, MOCK_SEED_VERSION);
  } catch {
    // Storage unavailable or unreadable; leave stored documents untouched.
  }
}
