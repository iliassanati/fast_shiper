// src/routes/index.tsx
import AuthLayout from '@/layouts/Authlayout';
import MainLayout from '@/layouts/MainLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { lazy, Suspense, type ElementType } from 'react';
import { useRoutes } from 'react-router-dom';

// -------------------------------------------------------------------------
const Loadable = (Component: ElementType) => (props: any) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );
};

// -------------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <MainLayout />,
      children: [{ element: <HomePage />, index: true }],
    },
    {
      path: 'auth',
      element: <AuthLayout />,
      children: [
        { path: 'login', element: <SignInPage /> },
        { path: 'register', element: <SignUpPage /> },
      ],
    },
    {
      path: 'client',
      children: [
        { path: 'dashboard', index: true, element: <ClientDashboardPage /> },
        { path: 'consolidation', element: <ConsolidationPage /> },
        { path: 'repack', element: <RepackPage /> },
        { path: 'request-info', element: <RequestInfoPage /> },
        { path: 'shipping', element: <ShippingPage /> },
      ],
    },
  ]);
}

// MAIN
const HomePage = Loadable(lazy(() => import('@/pages/HomePage')));

// AUTH
const SignInPage = Loadable(lazy(() => import('@/pages/auth/SignInPage')));
const SignUpPage = Loadable(lazy(() => import('@/pages/auth/SignUpPage')));

// CLIENT
const ClientDashboardPage = Loadable(
  lazy(() => import('@/pages/client/ClientDashboardPage'))
);
const ConsolidationPage = Loadable(
  lazy(() => import('@/pages/client/ConsolidationPage'))
);
const RepackPage = Loadable(lazy(() => import('@/pages/client/RepackPage')));
const RequestInfoPage = Loadable(
  lazy(() => import('@/pages/client/RequestInfoPage'))
);
const ShippingPage = Loadable(
  lazy(() => import('@/pages/client/ShippingPage'))
);
