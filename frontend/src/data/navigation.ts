import {
  BookmarkIcon,
  BarChart3Icon,
  FolderOpenIcon,
  ShieldCheckIcon,
  LayoutDashboardIcon,
  FolderKanbanIcon,
  InboxIcon,
  LucideIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon
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

export const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboardIcon,
    color: {
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      border: 'border-blue-500/20'
    }
  },
  {
    label: 'Documents',
    to: '/evidence',
    icon: FolderKanbanIcon,
    matchPrefix: '/evidence',
    color: {
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      border: 'border-amber-500/20'
    },
    children: [
      { label: 'All Documents', to: '/evidence' },
      { label: 'Upload Documents', to: '/evidence/upload' }
    ]
  },
  {
    label: 'Accreditation',
    to: '/frameworks/ia',
    icon: ShieldCheckIcon,
    matchPrefix: '/frameworks',
    color: {
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-500/20'
    },
    children: [
      { label: 'Institutional (IA)', to: '/frameworks/ia' },
      { label: 'Program (AACCUP)', to: '/frameworks/pa' },
      { label: 'CHED COPC', to: '/frameworks/copc' },
      { label: 'PQA Standards', to: '/frameworks/pqa' },
      { label: 'ISO 9001', to: '/frameworks/iso' }
    ]
  },
  {
    label: 'Requests',
    to: '/requests',
    icon: InboxIcon,
    matchPrefix: '/requests',
    countKey: 'requests',
    color: {
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
      border: 'border-rose-500/20'
    }
  },
  {
    label: 'Reports & Analytics',
    to: '/reports',
    icon: BarChart3Icon,
    color: {
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
      border: 'border-purple-500/20'
    }
  },
  {
    label: 'My Profile',
    to: '/account',
    matchPrefix: '/account',
    icon: UserIcon,
    section: 'account',
    color: {
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-600',
      border: 'border-indigo-500/20'
    }
  },
  {
    label: 'User Management',
    to: '/users',
    icon: UsersIcon,
    section: 'account',
    color: {
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-600',
      border: 'border-cyan-500/20'
    }
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: SettingsIcon,
    section: 'account',
    color: {
      iconBg: 'bg-slate-500/10',
      iconColor: 'text-slate-600',
      border: 'border-slate-500/20'
    }
  }
];

export const userNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboardIcon,
    color: {
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      border: 'border-blue-500/20'
    }
  },
  {
    label: 'Shared with Me',
    to: '/shared-with-me',
    icon: FolderOpenIcon,
    color: {
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      border: 'border-amber-500/20'
    }
  },
  {
    label: 'Saved Documents',
    to: '/saved',
    icon: BookmarkIcon,
    color: {
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
      border: 'border-purple-500/20'
    }
  },
  {
    label: 'My Requests',
    to: '/requests',
    icon: InboxIcon,
    matchPrefix: '/requests',
    countKey: 'requests',
    color: {
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
      border: 'border-rose-500/20'
    }
  },
  {
    label: 'My Profile',
    to: '/account',
    matchPrefix: '/account',
    icon: UserIcon,
    section: 'account',
    color: {
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-600',
      border: 'border-indigo-500/20'
    }
  }
];