import { lazy } from 'react';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));

export const dashboardRoutes = [
  {
    path: '/dashboard',
    element: <DashboardPage />
  }
];
