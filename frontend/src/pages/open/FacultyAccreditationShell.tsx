import { ReactNode } from 'react';
import {
  FACULTY_STAFF_CAPABILITY_NOTE
} from '../../config/facultyStaffCapabilities';

/**
 * Faculty/Staff Accreditation wrapper.
 * Shared System Administrator layouts remain; institutional mutation is forced
 * off via FacultyPortalProvider + useInstitutionalMutationAccess.
 */
export function FacultyAccreditationShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
        <p className="font-semibold text-ink">Read-only Accreditation view</p>
        <p className="mt-1">
          You can browse authorized records, search, preview, and download when permitted. Creating, editing, uploading,
          deleting, and generating reports are not available in the Faculty/Staff Portal.
        </p>
        <p className="mt-1">{FACULTY_STAFF_CAPABILITY_NOTE}</p>
      </div>
      {children}
    </div>
  );
}
