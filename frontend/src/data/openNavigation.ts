import {
  HelpCircleIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LucideIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon
} from 'lucide-react';

export type OpenNavSection = 'main' | 'information' | 'account';

export interface OpenNavChild {
  label: string;
  to: string;
}

export interface OpenNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  section: OpenNavSection;
  matchPrefix?: string;
  children?: OpenNavChild[];
  /** When true, render as a noninteractive preview (future feature). */
  preview?: boolean;
  countKey?: 'requests';
}

const brandChip = {
  iconBg: 'bg-brand-50',
  iconColor: 'text-brand-700',
  border: 'border-brand-100'
} as const;

export const openNavSections: { id: OpenNavSection; label: string }[] = [
  { id: 'main', label: 'Main Menu' },
  { id: 'information', label: 'Information' },
  { id: 'account', label: 'Account' }
];

/**
 * Faculty & Staff sidebar — aligned with System Administrator structure.
 * Removed: Document Search, Accreditation Repository, Accreditation Areas, Academic Programs (as top-level entries).
 * Underlying catalog/search services remain available via deep links where needed.
 */
export const openNavigation: OpenNavItem[] = [
  {
    label: 'Dashboard',
    to: '/open',
    icon: LayoutDashboardIcon,
    section: 'main'
  },
  {
    label: 'Accreditation',
    to: '/open/frameworks/ia',
    icon: ShieldCheckIcon,
    section: 'main',
    matchPrefix: '/open/frameworks',
    children: [
      { label: 'Institutional (IA)', to: '/open/frameworks/ia' },
      { label: 'Program (AACCUP)', to: '/open/frameworks/pa' },
      { label: 'CHED COPC', to: '/open/frameworks/copc' },
      { label: 'PQA Standards', to: '/open/frameworks/pqa' },
      { label: 'ISO 9001', to: '/open/frameworks/iso' }
    ]
  },
  {
    label: 'Requests',
    to: '/open/requests',
    icon: InboxIcon,
    section: 'main',
    matchPrefix: '/open/requests',
    countKey: 'requests'
  },
  {
    label: 'About & Help',
    to: '/open/about',
    icon: HelpCircleIcon,
    section: 'information',
    children: [
      { label: 'About QA Office', to: '/open/about' },
      { label: 'Help & Guidelines', to: '/open/help' }
    ]
  },
  {
    label: 'My Profile',
    to: '/open/account',
    icon: UserIcon,
    section: 'account',
    matchPrefix: '/open/account'
  },
  {
    label: 'Settings',
    to: '/open/settings',
    icon: SettingsIcon,
    section: 'account',
    matchPrefix: '/open/settings'
  }
];

export const openNavIconTone = brandChip;

export function isOpenNavItemActive(item: OpenNavItem, pathname: string) {
  if (item.children?.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`))) return true;
  if (item.to === '/open') return pathname === '/open';
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
