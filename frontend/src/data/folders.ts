import { EvidenceFolder } from '../types/evidence';
import { buildCanonicalRepoFolders } from '../utils/programAccreditation';

export const ROOT_FRAMEWORK_FOLDER_IDS: readonly string[] = [
  'folder-ia',
  'folder-pa',
  'folder-copc',
  'folder-pqa',
  'folder-iso'
];

export const ROOT_FRAMEWORK_CODES: readonly string[] = ['IA', 'PA', 'COPC', 'PQA', 'ISO'];

/** Legacy upload origin; shared uploads also appear in each framework repository. */
export function isUploadLibraryItem(item: { libraryOnly?: boolean }): boolean {
  return item.libraryOnly === true;
}

export function libraryRootFolderId(frameworkId: string): string {
  const id = `folder-${frameworkId}`;
  return (ROOT_FRAMEWORK_FOLDER_IDS as readonly string[]).includes(id) ? id : 'folder-ia';
}

const HIDDEN_FOLDERS_KEY = 'accrevia_hidden_folders';

export function loadHiddenFolderIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_FOLDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function hideFolderId(id: string) {
  const next = Array.from(new Set([...loadHiddenFolderIds(), id]));
  localStorage.setItem(HIDDEN_FOLDERS_KEY, JSON.stringify(next));
}

export function isRootFrameworkFolder(folder?: EvidenceFolder | null): boolean {
  if (!folder) return false;
  const upperCode = folder.code?.toUpperCase() ?? '';
  return (
    ROOT_FRAMEWORK_FOLDER_IDS.includes(folder.id) ||
    (folder.isSystem && ROOT_FRAMEWORK_CODES.includes(upperCode)) ||
    (!folder.libraryOnly && !folder.parentId && !folder.areaId && ROOT_FRAMEWORK_CODES.includes(upperCode))
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
  ...buildCanonicalRepoFolders().filter((f) => f.frameworkId === 'pa'),
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
  ...buildCanonicalRepoFolders().filter((f) => f.frameworkId === 'copc'),
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
