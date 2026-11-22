import { ReactNode } from 'react';

/**
 * Faculty/Staff Accreditation wrapper.
 * Shared System Administrator layouts remain; institutional mutation is forced
 * off via FacultyPortalProvider + useInstitutionalMutationAccess.
 */
export function FacultyAccreditationShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
        <p className="font-semibold text-ink">Read-only</p>
        <p className="mt-1">Browse, preview, and download when a file is available. Uploading and editing stay with the QA Office.</p>
      </div>
      {children}
    </div>
  );
}
