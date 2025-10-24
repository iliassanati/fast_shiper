import AuthLayout from '@/layouts/Authlayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PublicRoute from '@/components/auth/PublicRoute';
import { lazy, Suspense, type ElementType } from 'react';
import { useRoutes, Link } from 'react-router-dom';

// -------------------------------------------------------------------------
// LOADING COMPONENT
// -------------------------------------------------------------------------
const LoadingFallback = () => (
  <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50'>
    <div className='text-center'>
      <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
      <p className='text-slate-600 font-semibold'>Loading...</p>
    </div>
  </div>
);

// -------------------------------------------------------------------------
// LOADABLE WRAPPER
// -------------------------------------------------------------------------
const Loadable = (Component: ElementType) => (props: any) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};

// -------------------------------------------------------------------------
// LAZY LOADED PAGES
// -------------------------------------------------------------------------

// Public Pages
const HomePage = Loadable(lazy(() => import('@/pages/HomePage')));

// Auth Pages
const SignInPage = Loadable(lazy(() => import('@/pages/auth/SignInPage')));
const SignUpPage = Loadable(lazy(() => import('@/pages/auth/SignUpPage')));

// Client Pages
const ClientDashboardPage = Loadable(
  lazy(() => import('@/pages/client/ClientDashboardPage'))
);
const PackagesPage = Loadable(
  lazy(() => import('@/pages/client/PackagesPage'))
);
const PackageDetailsPage = Loadable(
  lazy(() => import('@/pages/client/PackageDetailsPage'))
);
const ShipmentsPage = Loadable(
  lazy(() => import('@/pages/client/ShipmentsPage'))
);
const ShipmentDetailsPage = Loadable(
  lazy(() => import('@/pages/client/ShipmentDetailsPage'))
);
const ProfilePage = Loadable(lazy(() => import('@/pages/client/ProfilePage')));
const SettingsPage = Loadable(
  lazy(() => import('@/pages/client/SettingsPage'))
);

// Workflow Pages
const ConsolidationPage = Loadable(
  lazy(() => import('@/pages/client/ConsolidationPage'))
);
const RequestInfoPage = Loadable(
  lazy(() => import('@/pages/client/RequestInfoPage'))
);
const ShippingPage = Loadable(
  lazy(() => import('@/pages/client/ShippingPage'))
);

// -------------------------------------------------------------------------
// ROUTER CONFIGURATION
// -------------------------------------------------------------------------
export default function Router() {
  return useRoutes([
    // ==================== PUBLIC ROUTES ====================
    {
      path: '/',
      element: <MainLayout />,
      children: [{ element: <HomePage />, index: true }],
    },

    // ==================== AUTH ROUTES ====================
    {
      path: 'auth',
      element: (
        <PublicRoute>
          <AuthLayout />
        </PublicRoute>
      ),
      children: [
        { path: 'login', element: <SignInPage /> },
        { path: 'register', element: <SignUpPage /> },
      ],
    },

    // ==================== PROTECTED CLIENT ROUTES ====================
    {
      path: 'dashboard',
      element: (
        <ProtectedRoute>
          <ClientDashboardPage />
        </ProtectedRoute>
      ),
    },

    // Packages Routes
    {
      path: 'packages',
      element: (
        <ProtectedRoute>
          <PackagesPage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'packages/:id',
      element: (
        <ProtectedRoute>
          <PackageDetailsPage />
        </ProtectedRoute>
      ),
    },

    // Shipments Routes
    {
      path: 'shipments',
      element: (
        <ProtectedRoute>
          <ShipmentsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'shipments/:id',
      element: (
        <ProtectedRoute>
          <ShipmentDetailsPage />
        </ProtectedRoute>
      ),
    },

    // Workflow Routes
    {
      path: 'consolidation',
      element: (
        <ProtectedRoute>
          <ConsolidationPage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'request-info',
      element: (
        <ProtectedRoute>
          <RequestInfoPage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'shipping',
      element: (
        <ProtectedRoute>
          <ShippingPage />
        </ProtectedRoute>
      ),
    },

    // Profile & Settings Routes
    {
      path: 'profile',
      element: (
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      ),
    },
    {
      path: 'settings',
      element: (
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      ),
    },

    // ==================== 404 NOT FOUND ====================
    {
      path: '*',
      element: (
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50'>
          <div className='text-center'>
            <h1 className='text-6xl font-bold text-slate-900 mb-4'>404</h1>
            <p className='text-xl text-slate-600 mb-8'>Page Not Found</p>
            <Link
              to='/'
              className='px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors'
            >
              Go Home
            </Link>
          </div>
        </div>
      ),
    },
  ]);
}
