export type UserRole = 'Superadmin' | 'Administrator' | 'QA Personnel' | 'User' | 'Faculty' | 'Staff' | 'Accreditor';
export type UserStatus = 'Active' | 'Pending Approval' | 'Invited' | 'Deactivated' | 'Rejected';
export type PortalViewRole = 'Superadmin' | 'Administrator' | 'Faculty' | 'Staff' | 'Accreditor' | 'User';

export type PersonnelClassification = 
  | 'Faculty (Teaching - Accreditation Committee)'
  | 'Faculty (Non-Teaching Coordinator)'
  | 'Staff (Administrative)'
  | 'Staff (Technical)'
  | 'Accreditor (External)';

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  office: string;
  status: UserStatus;
  lastLogin: string | null;
  employeeId?: string;
  personnelClassification?: PersonnelClassification;
  affiliationVerified?: boolean;
  registeredAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}