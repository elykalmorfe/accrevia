export type RecipientRole = 'Faculty' | 'Staff' | 'Accreditor' | 'User';
export type ShareStatus = 'Active' | 'Expired' | 'Revoked';

export interface DocumentShare {
  id: string;
  documentId: string;
  recipientType: 'user' | 'role';
  recipientId: string;
  recipientName: string;
  recipientRole: RecipientRole;
  canView: boolean;
  canDownload: boolean;
  sharedBy: string;
  sharedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

export interface ShareRecipientInput {
  recipientType: 'user' | 'role';
  recipientId: string;
  recipientName: string;
  recipientRole: RecipientRole;
  canView: boolean;
  canDownload: boolean;
}

export type AccessAction =
  | 'Viewed'
  | 'Downloaded'
  | 'Shared'
  | 'Permission changed'
  | 'Access extended'
  | 'Access revoked'
  | 'Access expired'
  | 'Access denied'
  | 'Access requested'
  | 'Access approved'
  | 'Access rejected';

export interface AccessLogEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: AccessAction;
  documentId: string;
  detail?: string;
  at: string;
}

export type AccessRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AccessRequest {
  id: string;
  documentId: string;
  documentTitle: string;
  requesterId: string;
  requesterName: string;
  requesterRole: 'Faculty' | 'Staff' | 'Accreditor' | string;
  requesterOffice?: string;
  requesterEmail?: string;
  reason: string;
  requestedPermission: 'View only' | 'View and Download';
  status: AccessRequestStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  grantedExpiresAt?: string | null;
}