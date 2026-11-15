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
  },
  // Cantilan Campus ISO Folders
  {
    id: 'folder-iso-qm-can',
    name: 'Quality Manual & Mandated Procedures',
    code: 'QM',
    frameworkId: 'iso',
    areaId: 'iso-qm',
    category: 'Quality Management',
    description: 'Documented ISO 9001:2015 quality manual, quality policy, and core institutional SOPs for Cantilan Campus.',
    color: 'indigo',
    createdAt: '2026-01-15',
    campusId: 'cantilan',
    campus: 'Cantilan Campus',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c8-can',
    name: 'Operation & Laboratory Delivery Evidence',
    code: 'C8',
    frameworkId: 'iso',
    areaId: 'iso-c8',
    category: 'Quality Management',
    description: 'Workshop safety logs, instructional laboratory maintenance, and service delivery records.',
    color: 'emerald',
    createdAt: '2026-01-15',
    campusId: 'cantilan',
    campus: 'Cantilan Campus',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c9-can',
    name: '1st Surveillance Audit & Evaluation Reports',
    code: 'C9',
    frameworkId: 'iso',
    areaId: 'iso-c9',
    category: 'Quality Management',
    description: 'Surveillance audit evaluation notes, IQA summaries, and conformance reports.',
    color: 'rose',
    createdAt: '2026-01-15',
    campusId: 'cantilan',
    campus: 'Cantilan Campus',
    parentId: 'folder-iso'
  },
  // Tandag Campus ISO Folders
  {
    id: 'folder-iso-qm-tan',
    name: 'Quality Manual & Institutional SOPs',
    code: 'QM',
    frameworkId: 'iso',
    areaId: 'iso-qm',
    category: 'Quality Management',
    description: 'Documented university quality manual and institutional operational procedures.',
    color: 'indigo',
    createdAt: '2026-01-15',
    campusId: 'tandag',
    campus: 'Tandag Campus (Main)',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c6-tan',
    name: 'Planning & Risk Management Registers',
    code: 'C6',
    frameworkId: 'iso',
    areaId: 'iso-c6',
    category: 'Quality Management',
    description: 'Campus risk and opportunity registers, institutional quality objectives, and plans.',
    color: 'amber',
    createdAt: '2026-01-15',
    campusId: 'tandag',
    campus: 'Tandag Campus (Main)',
    parentId: 'folder-iso'
  },
  {
    id: 'folder-iso-c9-tan',
    name: 'Internal Quality Audit & Surveillance Evaluations',
    code: 'C9',
    frameworkId: 'iso',
    areaId: 'iso-c9',
    category: 'Quality Management',
    description: 'Third-party surveillance and IQA audit reports, nonconformity records, and MR documentation.',
    color: 'rose',
    createdAt: '2026-01-15',
    campusId: 'tandag',
    campus: 'Tandag Campus (Main)',
    parentId: 'folder-iso'
  }
];
