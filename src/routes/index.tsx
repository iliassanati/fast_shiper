import AuthLayout from '@/layouts/Authlayout';
import MainLayout from '@/layouts/MainLayout';
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

// ADMIN
