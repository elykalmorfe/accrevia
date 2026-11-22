import {
  BookmarkIcon,
  BarChart3Icon,
  AwardIcon,
  FileCheck2Icon,
  FileSpreadsheetIcon,
  FolderOpenIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  LayoutDashboardIcon,
  FolderKanbanIcon,
  InboxIcon,
  LucideIcon,
  SettingsIcon,
  UserIcon
} from 'lucide-react';

export interface NavChild {
  label: string;
  to: string;
  showPendingCount?: boolean;
  badge?: string;
}

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  matchPrefix?: string;
  badge?: string;
  /** Shows a live count badge computed by the sidebar. */
  countKey?: 'requests';
  /** `account` items render in the lower group of the sidebar. */
  section?: 'account';
  color: {
    iconBg: string;
    iconColor: string;
    border: string;
  };
  children?: NavChild[];
}

/** Shared ocean brand chip for every nav icon in light and dark mode. */
const navIcon = {
  iconBg: 'bg-brand-50',
  iconColor: 'text-brand-700',
  border: 'border-brand-100'
} as const;

export const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboardIcon,
    matchPrefix: '/dashboard',
    color: navIcon
  },
  {
    label: 'Documents',
    to: '/evidence',
    icon: FolderKanbanIcon,
    matchPrefix: '/evidence',
    color: navIcon,
    children: [
      { label: 'All Documents', to: '/evidence' },
      { label: 'Upload Documents', to: '/evidence/upload' }
    ]
  },
  {
    label: 'Institutional (IA)',
    to: '/frameworks/ia',
    icon: ShieldCheckIcon,
    matchPrefix: '/frameworks/ia',
    color: navIcon
  },
  {
    label: 'Program (AACCUP)',
    to: '/frameworks/pa',
    icon: GraduationCapIcon,
    matchPrefix: '/frameworks/pa',
    color: navIcon
  },
  {
    label: 'CHED COPC',
    to: '/frameworks/copc',
    icon: FileCheck2Icon,
    matchPrefix: '/frameworks/copc',
    color: navIcon
  },
  {
    label: 'PQA',
    to: '/frameworks/pqa',
    icon: AwardIcon,
    matchPrefix: '/frameworks/pqa',
    color: navIcon
  },
  {
    label: 'ISO 9001',
    to: '/frameworks/iso',
    icon: FileSpreadsheetIcon,
    matchPrefix: '/frameworks/iso',
    color: navIcon
  },
  {
    label: 'Requests',
    to: '/requests',
    icon: InboxIcon,
    matchPrefix: '/requests',
    countKey: 'requests',
    color: navIcon
  },
  {
    label: 'Reports & Analytics',
    to: '/reports',
    icon: BarChart3Icon,
    color: navIcon
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: SettingsIcon,
    section: 'account',
    color: navIcon,
    children: [
      { label: 'My Profile', to: '/account' },
      { label: 'User Management', to: '/users' },
      { label: 'Settings', to: '/settings' }
    ]
  }
];

export const userNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboardIcon,
    matchPrefix: '/dashboard',
    color: navIcon
  },
  {
    label: 'Shared with Me',
    to: '/shared-with-me',
    icon: FolderOpenIcon,
    color: navIcon
  },
  {
    label: 'Saved Documents',
    to: '/saved',
    icon: BookmarkIcon,
    color: navIcon
  },
  {
    label: 'My Requests',
    to: '/requests',
    icon: InboxIcon,
    matchPrefix: '/requests',
    countKey: 'requests',
    color: navIcon
  },
  {
    label: 'My Profile',
    to: '/account',
    matchPrefix: '/account',
    icon: UserIcon,
    section: 'account',
    color: navIcon
  }
];
