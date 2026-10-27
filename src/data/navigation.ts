import {
  BookmarkIcon,
  ChartColumnIcon,
  ClipboardListIcon,
  FolderOpenIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  LucideIcon,
  SettingsIcon,
  UsersIcon } from
'lucide-react';

export interface NavChild {
  label: string;
  to: string;
  showPendingCount?: boolean;
}

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  matchPrefix?: string;
  children?: NavChild[];
}

export const navigation: NavItem[] = [
{ label: 'Dashboard', to: '/', icon: LayoutDashboardIcon },
{
  label: 'Document Management',
  to: '/evidence',
  icon: LibraryBigIcon,
  matchPrefix: '/evidence',
  children: [
    { label: 'All Documents', to: '/evidence' },
    { label: 'Common Documents', to: '/evidence/common' },
    { label: 'Upload Documents', to: '/evidence/upload' },
    { label: 'Pending Classification', to: '/evidence/pending', showPendingCount: true }
  ]
},
{
  label: 'Accreditation & Frameworks',
  to: '/frameworks',
  icon: LandmarkIcon,
  matchPrefix: '/frameworks',
  children: [
  { label: 'Institutional Accreditation', to: '/frameworks/ia' },
  { label: 'Program Accreditation', to: '/frameworks/pa' },
  { label: 'COPC', to: '/frameworks/copc' },
  { label: 'PQA', to: '/frameworks/pqa' },
  { label: 'ISO', to: '/frameworks/iso' }]

},
{
  label: 'Criteria & Indicators',
  to: '/criteria/areas',
  icon: ClipboardListIcon,
  matchPrefix: '/criteria',
  children: [
  { label: 'Accreditation Areas', to: '/criteria/areas' },
  { label: 'Criteria', to: '/criteria/criteria' },
  { label: 'Indicators', to: '/criteria/indicators' },
  { label: 'Evidence Requirements', to: '/criteria/requirements' }]

},
{ label: 'User Management', to: '/users', icon: UsersIcon },
{ label: 'Reports & Analytics', to: '/reports', icon: ChartColumnIcon },
{ label: 'System Settings', to: '/settings', icon: SettingsIcon }];


export const userNavigation: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboardIcon },
  { label: 'Common Documents', to: '/evidence/common', icon: LibraryBigIcon },
  { label: 'Shared with Me', to: '/shared-with-me', icon: FolderOpenIcon },
  { label: 'Saved Documents', to: '/saved', icon: BookmarkIcon }
];