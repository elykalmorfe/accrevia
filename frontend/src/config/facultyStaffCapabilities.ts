/**
 * Faculty/Staff capability matrix (frontend prototype UI only).
 *
 * Client-side checks hide mutation controls and block management routes for
 * demonstration. Production authorization must be enforced by the backend.
 */
export type FacultyStaffCapabilities = {
  canSearchDocuments: boolean;
  canBrowseDocuments: boolean;
  canViewAuthorizedDocuments: boolean;
  canDownloadAuthorizedDocuments: boolean;
  canSubmitAccessRequests: boolean;
  canTrackOwnRequests: boolean;
  canCancelOwnPendingRequests: boolean;
  canViewOwnProfile: boolean;
  canUsePersonalPreferences: boolean;

  canEditProfile: boolean;
  canCreateDocuments: boolean;
  canEditDocuments: boolean;
  canUpdateDocuments: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canGenerateReports: boolean;
  canExportReports: boolean;
  canManagePermissions: boolean;
  canApproveRequests: boolean;
  canDenyRequests: boolean;
  canImportData: boolean;
  canConfigureInstitution: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
};

export const FACULTY_STAFF_CAPABILITIES: FacultyStaffCapabilities = {
  canSearchDocuments: true,
  canBrowseDocuments: true,
  canViewAuthorizedDocuments: true,
  canDownloadAuthorizedDocuments: true,
  canSubmitAccessRequests: true,
  canTrackOwnRequests: true,
  canCancelOwnPendingRequests: true,
  canViewOwnProfile: true,
  canUsePersonalPreferences: true,

  canEditProfile: false,
  canCreateDocuments: false,
  canEditDocuments: false,
  canUpdateDocuments: false,
  canUploadDocuments: false,
  canDeleteDocuments: false,
  canGenerateReports: false,
  canExportReports: false,
  canManagePermissions: false,
  canApproveRequests: false,
  canDenyRequests: false,
  canImportData: false,
  canConfigureInstitution: false,
  canManageUsers: false,
  canManageRoles: false
};

export const FACULTY_STAFF_CAPABILITY_NOTE =
  'Faculty/Staff capabilities are a frontend demonstration. Hidden buttons and route guards are not production security; the backend must enforce the same restrictions.';

/** AppShell / management paths Faculty/Staff must not open for mutation workflows. */
export const FACULTY_STAFF_BLOCKED_PATH_PREFIXES = [
  '/evidence/upload',
  '/evidence/pending',
  '/evidence/processing',
  '/evidence/archived',
  '/access-requests',
  '/technical-review-access',
  '/request-logs',
  '/reports',
  '/settings'
] as const;

export function isFacultyStaffBlockedPath(pathname: string): boolean {
  return FACULTY_STAFF_BLOCKED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
