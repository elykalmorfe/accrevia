import { EvidenceFolder } from '../types/evidence';

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
