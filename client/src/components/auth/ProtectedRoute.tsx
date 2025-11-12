// client/src/components/auth/ProtectedRoute.tsx - FIXED
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, initialized } = useAuthStore();
  const location = useLocation();

  // FIX: Wait for auth to initialize before showing anything
  if (!initialized || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-600 font-semibold'>Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect after we know the auth state
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
