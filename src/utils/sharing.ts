import { DocumentShare, RecipientRole, ShareStatus } from '../types/sharing';
import { PortalUser, UserRole } from '../types/user';
import { formatDate } from './format';

/** Reference "today" for the prototype data set. */
export const TODAY = '2026-10-01';

export function nowIso(): string {
  const d = new Date();
  return `${TODAY}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export const recipientRoles: RecipientRole[] = ['Faculty', 'Staff', 'Accreditor'];

export function isAdminRole(role: UserRole): boolean {
  return role === 'Administrator' || role === 'QA Personnel';
}

export function isRecipientRole(role: UserRole): role is RecipientRole {
  return role === 'Faculty' || role === 'Staff' || role === 'Accreditor';
}

export function roleGroupName(role: RecipientRole): string {
  return role === 'Faculty' ? 'All Faculty' : role === 'Staff' ? 'All Staff' : 'All Accreditors';
}

export function shareStatus(share: DocumentShare): ShareStatus {
  if (share.revokedAt) return 'Revoked';
  if (share.expiresAt && share.expiresAt < TODAY) return 'Expired';
  return 'Active';
}

export function permissionLabel(canDownload: boolean): string {
  return canDownload ? 'View + Download' : 'View only';
}

export function expiryLabel(expiresAt: string | null): string {
  return expiresAt ? formatDate(expiresAt) : 'No expiry';
}

export interface AccessRights {
  canView: boolean;
  canDownload: boolean;
  shares: DocumentShare[];
}

/**
 * Mirrors the server-side check: administrators and QA personnel have full access;
 * everyone else needs an active, explicit share (to them or to their role).
 */
export function accessFor(user: PortalUser, documentId: string, shares: DocumentShare[]): AccessRights {
  if (isAdminRole(user.role)) return { canView: true, canDownload: true, shares: [] };
  const applicable = shares.filter(
    (s) =>
    s.documentId === documentId &&
    shareStatus(s) === 'Active' && (
    s.recipientType === 'user' ? s.recipientId === user.id : s.recipientRole === user.role)
  );
  return {
    canView: applicable.some((s) => s.canView),
    canDownload: applicable.some((s) => s.canView && s.canDownload),
    shares: applicable
  };
}

export function summarizeShares(applicable: DocumentShare[]) {
  const sorted = [...applicable].sort((a, b) => b.sharedAt.localeCompare(a.sharedAt));
  const expiresAt = applicable.some((s) => !s.expiresAt) ?
  null :
  applicable.reduce<string | null>((max, s) => !max || (s.expiresAt ?? '') > max ? s.expiresAt : max, null);
  return {
    sharedBy: sorted[0]?.sharedBy ?? '',
    sharedAt: sorted[0]?.sharedAt ?? '',
    expiresAt,
    canDownload: applicable.some((s) => s.canDownload)
  };
}