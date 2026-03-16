import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface ProtectedRouteProps {
  requiredRoles?: Array<'ADMIN' | 'STAFF'>;
  redirectTo?: string;
  forbiddenRedirectTo?: string;
}

export function ProtectedRoute({
  requiredRoles,
  redirectTo = '/staff/login',
  forbiddenRedirectTo,
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRoles?.length && (!user?.role || !requiredRoles.includes(user.role))) {
    const fallback = forbiddenRedirectTo ?? (user?.role === 'ADMIN' ? '/admin/dashboard' : '/staff/classic');
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
