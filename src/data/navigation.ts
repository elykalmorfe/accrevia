import {
  BookmarkIcon,
  BarChart3Icon,
  ListCheckIcon,
  FolderOpenIcon,
  ShieldCheckIcon,
  LayoutDashboardIcon,
  FolderKanbanIcon,
  LucideIcon,
  SettingsIcon,
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
      { label: 'Upload Evidence', to: '/evidence/upload' },
      { label: 'Pending Review', to: '/evidence/pending', showPendingCount: true }
    ]
  },
  {
    label: 'Accreditation',
    to: '/frameworks',
    icon: ShieldCheckIcon,
    matchPrefix: '/frameworks',
    color: {
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-500/20'
    },
    children: [
      { label: 'Frameworks Hub', to: '/frameworks' },
      { label: 'Institutional (IA)', to: '/frameworks/ia' },
      { label: 'Program (AACCUP)', to: '/frameworks/pa' },
      { label: 'CHED COPC', to: '/frameworks/copc' },
      { label: 'PQA Standards', to: '/frameworks/pqa' },
      { label: 'ISO 9001', to: '/frameworks/iso' }
    ]
  },
  {
    label: 'Criteria & Standards',
    to: '/criteria/areas',
    icon: ListCheckIcon,
    matchPrefix: '/criteria',
    color: {
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-600',
      border: 'border-indigo-500/20'
    },
    children: [
      { label: 'Areas', to: '/criteria/areas' },
      { label: 'Criteria Explorer', to: '/criteria/criteria' },
      { label: 'Indicators', to: '/criteria/indicators' },
      { label: 'Requirements', to: '/criteria/requirements' }
    ]
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
    label: 'Users',
    to: '/users',
    icon: UsersIcon,
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
  }
];