import { lazy } from 'react';

const DashboardPage = lazy(() => import('../pages/AdvancedAnalyticsPage'));

export const dashboardRoutes = [
  {
    path: '/dashboard',
    element: <DashboardPage />
  }
];
