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
  ]);
}

// MAIN
const HomePage = Loadable(lazy(() => import('@/pages/HomePage')));
