// client/src/components/auth/ProtectedRoute.tsx
import { useAuthStore } from '@/stores';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';
import LoadingScreen from '../common/LoadingScreen';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
  requireAdmin = false,
}: ProtectedRouteProps) {
  const clientAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();

  // Use admin auth if requireAdmin is true
  const { isAuthenticated, loading, initialized } = requireAdmin
    ? adminAuth
    : clientAuth;

  const loginPath = requireAdmin ? '/admin/login' : '/auth/login';

  // ✅ FIXED: Wait for initialization (was: if (!loading) which is wrong)
  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
