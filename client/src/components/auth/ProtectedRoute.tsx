// client/src/components/auth/ProtectedRoute.tsx
import { useAuthStore } from '@/stores';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';
import LoadingScreen from '../common/LoadingScreen';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean; // Add this
}

export default function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
  requireAdmin = false, // Add this
}: ProtectedRouteProps) {
  const clientAuth = useAuthStore();

  const adminAuth = useAdminAuthStore();

  // Use admin auth if requireAdmin is true
  const { isAuthenticated, loading, initialized } = requireAdmin
    ? adminAuth
    : clientAuth;

  const loginPath = requireAdmin ? '/admin/login' : '/auth/login';

  // Wait for initialization
  if (!loading) {
    return <LoadingScreen />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
