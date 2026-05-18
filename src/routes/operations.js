import { lazy } from 'react';

const SalesPage = lazy(() => import('../pages/operations/SalesPage'));
const PurchasePage = lazy(() => import('../pages/operations/PurchasePage'));
const DeliveryOrderPage = lazy(() => import('../pages/operations/DeliveryOrderPage'));

export const operationsRoutes = [
  {
    path: '/sales',
    element: <SalesPage />
  },
  {
    path: '/purchases',
    element: <PurchasePage />
  },
  {
    path: '/delivery-orders',
    element: <DeliveryOrderPage />
  }
];
