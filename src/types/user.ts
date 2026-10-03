export type UserRole = 'Administrator' | 'QA Personnel' | 'Faculty' | 'Staff' | 'Accreditor';
export type UserStatus = 'Active' | 'Invited' | 'Deactivated';
export type PortalViewRole = 'Administrator' | 'Faculty' | 'Staff' | 'Accreditor';

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  office: string;
  status: UserStatus;
  lastLogin: string | null;
}