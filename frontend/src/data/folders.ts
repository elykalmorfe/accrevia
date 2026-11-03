import { EvidenceFolder } from '../types/evidence';

export const ROOT_FRAMEWORK_FOLDER_IDS = [
  'folder-ia',
  'folder-pa',
  'folder-copc',
  'folder-pqa',
  'folder-iso'
] as const;

export const ROOT_FRAMEWORK_CODES = ['IA', 'PA', 'COPC', 'PQA', 'ISO'] as const;

export function isRootFrameworkFolder(folder?: EvidenceFolder | null): boolean {
  if (!folder) return false;
  return (
    ROOT_FRAMEWORK_FOLDER_IDS.includes(folder.id as any) ||
    (folder.isSystem && ROOT_FRAMEWORK_CODES.includes(folder.code?.toUpperCase() as any)) ||
    (!folder.parentId && !folder.areaId && ROOT_FRAMEWORK_CODES.includes(folder.code?.toUpperCase() as any))
  );
}

export const initialFolders: EvidenceFolder[] = [
  {
    id: 'folder-ia',
    name: 'Institutional Accreditation',
    code: 'IA',
    frameworkId: 'ia',
    category: 'Accreditation',
    description: 'AACCUP institutional sustainability, university governance, instruction, research, extension, faculty development, and support services portfolios.',
    isSystem: true,
    color: 'blue',
    createdAt: '2026-01-15'
  },
  {
    id: 'folder-pa',
    name: 'Program Accreditation',
    code: 'PA',
    frameworkId: 'pa',
    category: 'Accreditation',
    description: 'AACCUP degree program surveys (Candidate, Level 1 through Level 4), curricular outcomes, instructional syllabi, faculty portfolios, and area survey instruments.',
    isSystem: true,
    color: 'purple',
    createdAt: '2026-01-15'
  },
  {
    id: 'folder-copc',
    name: 'Certificate of Program Compliance',
    code: 'COPC',
    frameworkId: 'copc',
    category: 'Compliance',
    description: 'CHED regulatory compliance records, CMO policies and standards, program curricula, full-time faculty credentials, and laboratory equipment compliance.',
    isSystem: true,
    color: 'emerald',
    createdAt: '2026-01-15'
  },
  {
    id: 'folder-pqa',
    name: 'Philippine Quality Award',
    code: 'PQA',
    frameworkId: 'pqa',
    category: 'Quality Excellence',
    description: 'National performance excellence framework documents covering Leadership, Strategy, Customers, Measurement & Knowledge, Workforce, Operations, and Results.',
    isSystem: true,
    color: 'amber',
    createdAt: '2026-01-15'
  },
  {
    id: 'folder-iso',
    name: 'ISO 9001:2015 Quality Management',
    code: 'ISO',
    frameworkId: 'iso',
    category: 'Quality Management',
    description: 'ISO surveillance audit evaluations, Internal Quality Audit (IQA) reports, Corrective Action Requests (CARs), risk-opportunity registers, and documented quality procedures.',
    isSystem: true,
    color: 'indigo',
    createdAt: '2026-01-15'
  }
];

// Curated starter subfolders for non-IA frameworks (Strictly isolated by frameworkId & parentId)
export const frameworkSubfolders: EvidenceFolder[] = [
  // --- PA (Program Accreditation) Subfolders ---
  {
    id: 'folder-pa-curriculum',
    name: 'Curriculum & Course Syllabi',
    code: 'PA-CURR',
    frameworkId: 'pa',
    parentId: 'folder-pa',
    category: 'Accreditation',
    description: 'Outcomes-based course syllabi, curriculum mapping matrices, instructional delivery guides, and learning assessment portfolios.',
    color: 'purple',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },
  {
    id: 'folder-pa-faculty',
    name: 'Faculty Portfolios & Credentials',
    code: 'PA-FAC',
    frameworkId: 'pa',
    parentId: 'folder-pa',
    category: 'Accreditation',
    description: 'Faculty qualification profiles, PRC professional licenses, 201 records, teaching loads, and advanced degree scholarships.',
    color: 'blue',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },
  {
    id: 'folder-pa-survey',
    name: 'AACCUP Survey Instruments & Exhibits',
    code: 'PA-SURV',
    frameworkId: 'pa',
    parentId: 'folder-pa',
    category: 'Accreditation',
    description: 'Program self-survey instruments, area compliance summaries, benchmark statements, and institutional survey team ratings.',
    color: 'indigo',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },

  // --- COPC (Certificate of Program Compliance) Subfolders ---
  {
    id: 'folder-copc-ched',
    name: 'CHED PSG & Policies Compliance',
    code: 'COPC-CHED',
    frameworkId: 'copc',
    parentId: 'folder-copc',
    category: 'Compliance',
    description: 'CHED Memoranda Orders, regulatory compliance matrices, Board of Regents authorities, and CMO alignment exhibits.',
    color: 'emerald',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },
  {
    id: 'folder-copc-facilities',
    name: 'Laboratories & Learning Resources',
    code: 'COPC-FACIL',
    frameworkId: 'copc',
    parentId: 'folder-copc',
    category: 'Compliance',
    description: 'Specialized laboratory equipment compliance inventories, library book holding certifications, and physical learning resources.',
    color: 'cyan',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },

  // --- PQA (Philippine Quality Award) Subfolders ---
  {
    id: 'folder-pqa-leadership',
    name: 'Leadership & Ethical Governance',
    code: 'PQA-LEAD',
    frameworkId: 'pqa',
    parentId: 'folder-pqa',
    category: 'Quality Excellence',
    description: 'Senior leadership governance, executive oversight, ethical practices, and legal and regulatory compliance systems.',
    color: 'amber',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },
  {
    id: 'folder-pqa-strategy',
    name: 'Strategic Planning & Customer Focus',
    code: 'PQA-STRAT',
    frameworkId: 'pqa',
    parentId: 'folder-pqa',
    category: 'Quality Excellence',
    description: 'Strategic deployment plans, student-stakeholder feedback surveys, Citizen Charter satisfaction metrics, and KPI monitors.',
    color: 'rose',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },

  // --- ISO (ISO 9001:2015 Quality Management) Subfolders ---
  {
    id: 'folder-iso-audit',
    name: 'Internal Quality Audit (IQA) Reports',
    code: 'ISO-IQA',
    frameworkId: 'iso',
    parentId: 'folder-iso',
    category: 'Quality Management',
    description: 'Annual surveillance audit evaluations, Internal Quality Audit plans, auditor findings, and Corrective Action Requests (CARs).',
    color: 'indigo',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  },
  {
    id: 'folder-iso-procedures',
    name: 'Documented Quality Procedures & SOPs',
    code: 'ISO-SOP',
    frameworkId: 'iso',
    parentId: 'folder-iso',
    category: 'Quality Management',
    description: 'Quality manual, university core and support process flowcharts, risk-opportunity registers, and standard operating procedures.',
    color: 'blue',
    createdAt: '2026-01-20',
    startDate: '2026-01-20',
    hasNoDeadline: true
  }
];
