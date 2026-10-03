export type RecipientRole = 'Faculty' | 'Staff' | 'Accreditor';
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
'Viewed' |
'Downloaded' |
'Shared' |
'Permission changed' |
'Access extended' |
'Access revoked' |
'Access expired' |
'Access denied';

export interface AccessLogEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: AccessAction;
  documentId: string;
  detail?: string;
  at: string;
}