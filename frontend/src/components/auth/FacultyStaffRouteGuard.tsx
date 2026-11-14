import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isFacultyStaffBlockedPath } from '../../config/facultyStaffCapabilities';
import { AccessDenied } from '../../pages/AccessDenied';
import { useSessionAccount } from '../../utils/auth';

/**
 * Blocks Faculty/Staff sessions from AppShell management routes
 * (upload, reports, permissions, admin settings, etc.).
 * Does not affect privileged roles.
 *
 * Prototype UI only — backend must enforce the same restrictions.
 */
export function FacultyStaffRouteGuard() {
  const session = useSessionAccount();
  const location = useLocation();
  const isFacultyStaff = session?.role === 'Faculty' || session?.role === 'Staff';

  if (!isFacultyStaff) return <Outlet />;

  if (isFacultyStaffBlockedPath(location.pathname)) {
    return (
      <AccessDenied
        title="Management access denied"
        description="Faculty/Staff users cannot open document creation, upload, report generation, or permission-management pages."
        homeTo="/open"
        homeLabel="Go to Faculty/Staff Portal"
      />
    );
  }

  // Prefer the Faculty/Staff portal for accreditation browsing rather than AppShell mutation UIs.
  if (location.pathname.startsWith('/frameworks')) {
    const rest = location.pathname.replace(/^\/frameworks/, '') || '/ia';
    const target = rest === '' || rest === '/' ? '/open/frameworks/ia' : `/open/frameworks${rest}`;
    return <Navigate to={target} replace />;
  }

  if (location.pathname === '/evidence' || location.pathname.startsWith('/evidence/')) {
    return <Navigate to="/open" replace />;
  }

  return <Outlet />;
}
