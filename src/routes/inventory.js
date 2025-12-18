import { lazy } from 'react';

const LivestockStockPage = lazy(() => import('../pages/inventory/LivestockStockPage'));
const MeatStockPage = lazy(() => import('../pages/inventory/MeatStockPage'));

export const inventoryRoutes = [
  {
    path: '/inventory/livestock',
    element: <LivestockStockPage />
  },
  {
    path: '/inventory/meat',
    element: <MeatStockPage />
  }
];
