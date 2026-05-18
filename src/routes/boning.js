import { lazy } from 'react';

const BoningLayout = lazy(() => import('../pages/boning/BoningLayout'));
const KeuanganPage = lazy(() => import('../pages/boning/KeuanganPage'));
const PembelianPage = lazy(() => import('../pages/boning/PembelianPage'));
const PenjualanPage = lazy(() => import('../pages/boning/PenjualanPage'));
const StokDagingPage = lazy(() => import('../pages/boning/StokDagingPage'));
const ReturnPage = lazy(() => import('../pages/boning/ReturnPage'));
const SuratJalanPage = lazy(() => import('../pages/boning/SuratJalanPage'));

export const boningRoutes = [
  {
    path: '/boning/*',
    element: <BoningLayout />,
    nestedRoutes: [
      {
        path: 'keuangan',
        element: <KeuanganPage />
      },
      {
        path: 'pembelian',
        element: <PembelianPage />
      },
      {
        path: 'penjualan',
        element: <PenjualanPage />
      },
      {
        path: 'stok-daging',
        element: <StokDagingPage />
      },
      {
        path: 'return',
        element: <ReturnPage />
      },
      {
        path: 'surat-jalan',
        element: <SuratJalanPage />
      }
    ]
  }
];
