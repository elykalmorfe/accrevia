import { DocumentRequest } from '../types/request';
import { DocumentShare, RecipientRole, ShareStatus } from '../types/sharing';
import { PortalUser, UserRole } from '../types/user';
import { formatDate } from './format';

/** Reference "today" for the prototype data set. */
export const TODAY = '2026-10-01';

export function nowIso(): string {
  const d = new Date();
  return `${TODAY}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export const recipientRoles: RecipientRole[] = ['Faculty', 'Staff', 'Accreditor', 'User'];

export function isAdminRole(role: UserRole): boolean {
  return role === 'Superadmin' || role === 'Administrator';
}

/** QA Office inbox: administrators and QA personnel see every request, not only their own. */
export function seesOfficeQueue(role: string | undefined | null): boolean {
  return role === 'Superadmin' || role === 'Administrator' || role === 'QA Personnel';
}

export function isRecipientRole(role: string): role is RecipientRole {
  return role === 'Faculty' || role === 'Staff' || role === 'Accreditor' || role === 'User';
}

export function roleGroupName(role: RecipientRole): string {
  return role === 'Faculty' ? 'All Faculty' : role === 'Staff' ? 'All Staff' : role === 'User' ? 'All Users' : 'All Accreditors';
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
/** Access carried by a file that was sent on a document request. */
export interface SentFileGrant {
  documentId: string;
  canView: boolean;
  canDownload: boolean;
  name?: string;
  fileType?: string;
}

function samePerson(user: PortalUser, request: DocumentRequest): boolean {
  if (request.requesterId && request.requesterId === user.id) return true;
  const left = (request.requesterEmail || '').trim().toLowerCase();
  const right = (user.email || '').trim().toLowerCase();
  return Boolean(left && right && left === right);
}

/**
 * The choice on a sent file is the permission. Restricted is the requester.
 * Anyone is every signed-in Faculty or Staff member. Editor may download.
 */
export function grantsFromRequests(user: PortalUser, requests: DocumentRequest[]): SentFileGrant[] {
  const byDocument = new Map<string, SentFileGrant>();
  requests.forEach((request) => {
    const requester = samePerson(user, request);
    request.messages.forEach((message) => {
      message.attachments.forEach((file) => {
        if (file.kind !== 'document' || !file.documentId) return;
        const access = file.access ?? 'restricted';
        const allowed = seesOfficeQueue(user.role) || requester || access === 'anyone';
        if (!allowed) return;
        const canDownload = seesOfficeQueue(user.role) || file.role === 'editor';
        const previous = byDocument.get(file.documentId);
        if (!previous || (canDownload && !previous.canDownload)) {
          byDocument.set(file.documentId, {
            documentId: file.documentId,
            canView: true,
            canDownload,
            name: file.name,
            fileType: file.fileType
          });
        }
      });
    });
  });
  return [...byDocument.values()];
}

export function accessFor(user: PortalUser, documentId: string, shares: DocumentShare[], grants: SentFileGrant[] = []): AccessRights {
  if (isAdminRole(user.role)) return { canView: true, canDownload: true, shares: [] };
  const applicable = shares.filter(
    (s) =>
    s.documentId === documentId &&
    shareStatus(s) === 'Active' && (
    s.recipientType === 'user' ? s.recipientId === user.id : s.recipientRole === user.role)
  );
  const grant = grants.find((item) => item.documentId === documentId);
  return {
    canView: applicable.some((s) => s.canView) || Boolean(grant?.canView),
    canDownload: applicable.some((s) => s.canView && s.canDownload) || Boolean(grant?.canDownload),
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