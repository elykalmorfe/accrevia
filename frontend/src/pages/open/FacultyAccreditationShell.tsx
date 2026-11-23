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
        <p className="font-semibold text-ink">Your assigned accreditation areas</p>
        <p className="mt-1">Editors can manage their assigned areas. Viewers can browse and preview. Contact the Super Admin for access changes.</p>
      </div>
      {children}
    </div>
  );
}
