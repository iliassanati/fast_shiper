import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import type { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * PublicRoute - Redirects authenticated users away from auth pages
 * Use this for login/register pages
 */
export default function PublicRoute({
  children,
  redirectTo = '/dashboard',
}: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
