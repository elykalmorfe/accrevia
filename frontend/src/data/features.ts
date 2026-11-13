import {
  LayoutDashboardIcon,
  FolderKanbanIcon,
  UploadCloudIcon,
  ShieldCheckIcon,
  GraduationCapIcon,
  FileCheck2Icon,
  AwardIcon,
  FileSpreadsheetIcon,
  InboxIcon,
  BarChart3Icon,
  UsersIcon,
  SettingsIcon,
  UserIcon,
  LucideIcon
} from 'lucide-react';

export interface SystemFeature {
  id: string;
  name: string;
  description: string;
  category: 'Core Workspace' | 'Evidence & Records' | 'Accreditation Frameworks' | 'Governance & Analytics';
  path: string;
  icon: LucideIcon;
}

export const SYSTEM_FEATURES: SystemFeature[] = [
  // Core Workspace
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    description: 'System metrics, accreditation readiness, and quick operational widgets.',
    category: 'Core Workspace',
    path: '/',
    icon: LayoutDashboardIcon
  },
  {
    id: 'account',
    name: 'My Profile & Account',
    description: 'Personal institutional profile, security credentials, and preferences.',
    category: 'Core Workspace',
    path: '/account',
    icon: UserIcon
  },

  // Evidence & Records
  {
    id: 'documents',
    name: 'Documents Repository',
    description: 'Centralized evidence repository, folder hierarchies, and document viewer.',
    category: 'Evidence & Records',
    path: '/evidence',
    icon: FolderKanbanIcon
  },
  {
    id: 'upload_evidence',
    name: 'Upload Documents',
    description: 'Single & batch evidence uploading, metadata tagging, and auto-classification.',
    category: 'Evidence & Records',
    path: '/evidence/upload',
    icon: UploadCloudIcon
  },
  {
    id: 'requests',
    name: 'Document Requests',
    description: 'Evidence sharing requests, fulfillment pipelines, and access approval requests.',
    category: 'Evidence & Records',
    path: '/requests',
    icon: InboxIcon
  },

  // Accreditation Frameworks
  {
    id: 'framework_ia',
    name: 'Institutional Accreditation (IA)',
    description: 'SUC Institutional Accreditation core areas and official survey instruments.',
    category: 'Accreditation Frameworks',
    path: '/frameworks/ia',
    icon: ShieldCheckIcon
  },
  {
    id: 'framework_pa',
    name: 'Program Accreditation (AACCUP)',
    description: 'AACCUP Program Accreditation Levels I to IV, 10 survey areas, and parameters.',
    category: 'Accreditation Frameworks',
    path: '/frameworks/pa',
    icon: GraduationCapIcon
  },
  {
    id: 'framework_copc',
    name: 'CHED COPC Evaluation',
    description: 'Certificate of Program Compliance monitoring and documentary compliance.',
    category: 'Accreditation Frameworks',
    path: '/frameworks/copc',
    icon: FileCheck2Icon
  },
  {
    id: 'framework_pqa',
    name: 'PQA Standards Framework',
    description: 'Philippine Quality Award institutional criteria and organizational assessment.',
    category: 'Accreditation Frameworks',
    path: '/frameworks/pqa',
    icon: AwardIcon
  },
  {
    id: 'framework_iso',
    name: 'ISO 9001:2015 Quality Management',
    description: 'QMS audit trails, surveillance cycles, and Corrective Action Requests (CARs).',
    category: 'Accreditation Frameworks',
    path: '/frameworks/iso',
    icon: FileSpreadsheetIcon
  },

  // Governance & Analytics
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Institutional readiness heatmaps, compliance gap analyses, and exportable audit reports.',
    category: 'Governance & Analytics',
    path: '/reports',
    icon: BarChart3Icon
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'System user directory, credential generation, and tailored feature permissions.',
    category: 'Governance & Analytics',
    path: '/users',
    icon: UsersIcon
  },
  {
    id: 'settings',
    name: 'System Settings',
    description: 'Institutional security policies, session controls, and workspace configurations.',
    category: 'Governance & Analytics',
    path: '/settings',
    icon: SettingsIcon
  }
];

export const ALL_FEATURE_IDS = SYSTEM_FEATURES.map((f) => f.id);
