export type UserRole =
  | 'Superadmin'
  | 'Administrator'
  | 'QA Personnel'
  | 'Faculty'
  | 'Staff'
  | 'Accreditor'
  | 'User'; // Maintained for legacy fallback

export type UserStatus = 'Active' | 'Pending Approval' | 'Invited' | 'Deactivated' | 'Rejected';

export type PortalViewRole =
  | 'Superadmin'
  | 'Administrator'
  | 'QA Personnel'
  | 'Faculty'
  | 'Staff'
  | 'Accreditor'
  | 'User';

export type PersonnelClassification = 
  | 'Faculty (Teaching - Accreditation Committee)'
  | 'Faculty (Non-Teaching Coordinator)'
  | 'Staff (Administrative)'
  | 'Staff (Technical)'
  | 'Accreditor (External)';

export type PermissionDomain =
  | 'System & Security'
  | 'User Governance'
  | 'Accreditation & Quality'
  | 'Repository & Folders'
  | 'Document Access & Sharing';

export interface RoleCapability {
  code: string;
  domain: PermissionDomain;
  name: string;
  description: string;
}

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
  campusId?: string;
  assignedAreas?: string[];
  assignedPrograms?: string[];
  temporaryPassword?: string;
  allowedFeatures?: string[];
}
