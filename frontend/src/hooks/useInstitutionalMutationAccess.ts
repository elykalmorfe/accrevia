import { useMemo } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { useFacultyPortal } from '../contexts/FacultyPortalContext';
import {
  FACULTY_STAFF_CAPABILITIES,
  type FacultyStaffCapabilities
} from '../config/facultyStaffCapabilities';
import { useSessionAccount } from '../utils/auth';

function isFacultyOrStaffRole(role: string | undefined | null): boolean {
  return role === 'Faculty' || role === 'Staff';
}

const ADMIN_CAPABILITIES: FacultyStaffCapabilities = {
  canSearchDocuments: true,
  canBrowseDocuments: true,
  canViewAuthorizedDocuments: true,
  canDownloadAuthorizedDocuments: true,
  canSubmitAccessRequests: true,
  canTrackOwnRequests: true,
  canCancelOwnPendingRequests: true,
  canViewOwnProfile: true,
  canUsePersonalPreferences: true,
  canEditProfile: true,
  canCreateDocuments: true,
  canEditDocuments: true,
  canUpdateDocuments: true,
  canUploadDocuments: true,
  canDeleteDocuments: true,
  canGenerateReports: true,
  canExportReports: true,
  canManagePermissions: true,
  canApproveRequests: true,
  canDenyRequests: true,
  canImportData: true,
  canConfigureInstitution: true,
  canManageUsers: true,
  canManageRoles: true
};

/**
 * Institutional write access for accreditation / document management UI.
 *
 * - Faculty/Staff roles never mutate institutional data (any shell).
 * - Inside `/open` Faculty portal, everyone is treated as read-only for
 *   institutional data (even an administrator previewing the Faculty UI).
 * - AppShell admin/QA keep existing `isAdmin` mutation rights.
 *
 * Prototype UI only — backend must enforce the same rules.
 */
export function useInstitutionalMutationAccess() {
  const { isAdmin } = usePortal();
  const facultyPortal = useFacultyPortal();
  const session = useSessionAccount();

  return useMemo(() => {
    const facultyStaffRole = isFacultyOrStaffRole(session?.role);
    const inFacultyPortal = facultyPortal?.isFacultyPortal === true;
    const canMutate = isAdmin && !facultyStaffRole && !inFacultyPortal;
    const capabilities: FacultyStaffCapabilities =
      facultyStaffRole || inFacultyPortal ? FACULTY_STAFF_CAPABILITIES : ADMIN_CAPABILITIES;

    return {
      canMutate,
      institutionalReadOnly: !canMutate,
      facultyStaffRole,
      inFacultyPortal,
      capabilities
    };
  }, [isAdmin, facultyPortal, session?.role]);
}
