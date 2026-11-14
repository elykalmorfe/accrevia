import { Navigate, useLocation } from 'react-router-dom';
import { useSessionAccount } from '../../utils/auth';

/** Frontend route guard — prototype only; backend must enforce authentication. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useSessionAccount();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
