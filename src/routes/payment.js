import { lazy } from 'react';

const PembayaranDetailPage = lazy(() => import('../pages/pembayaran/pembayaranDoka/PembayaranDetailPage'));
const PembayaranOvkDetailPage = lazy(() => import('../pages/pembayaran/pembayaranOvk/PembayaranDetailPage'));
const PembayaranFeedmillDetailPage = lazy(() => import('../pages/pembayaran/pembayaranFeedmil/PembayaranDetailPage'));
const PembayaranKulitDetailPage = lazy(() => import('../pages/pembayaran/pembayaranKulit/PembayaranDetailPage'));
const PembayaranLainLainDetailPage = lazy(() => import('../pages/pembayaran/pembayaranLainLain/PembayaranDetailPage'));

export const paymentRoutes = [
  {
    path: '/pembayaran/doka/detail/:id',
    element: <PembayaranDetailPage />
  },
  {
    path: '/pembayaran/ovk/detail/:id',
    element: <PembayaranOvkDetailPage />
  },
  {
    path: '/pembayaran/feedmill/detail/:id',
    element: <PembayaranFeedmillDetailPage />
  },
  {
    path: '/pembayaran/kulit/detail/:id',
    element: <PembayaranKulitDetailPage />
  },
  {
    path: '/pembayaran/lain-lain/detail/:id',
    element: <PembayaranLainLainDetailPage />
  }
];
