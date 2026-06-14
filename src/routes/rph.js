import { lazy } from 'react';

const PembelianSapi = lazy(() => import('../pages/RPH/Pembelian/Pembelian Sapi/PembelianSapi'));
const PembelianSapiDetailPage = lazy(() => import('../pages/RPH/Pembelian/Pembelian Sapi/PembelianDetailPage'));
const StokSapiPage = lazy(() => import('../pages/RPH/StokSapi/StokSapiPage'));
const PenjualanBoningPage = lazy(() => import('../pages/RPH/Penjualan/Boning/PenjualanBoningPage'));
const PenjualanKarkasPage = lazy(() => import('../pages/RPH/Penjualan/Karkas/PenjualanKarkasPage'));

export const rphRoutes = [
  {
    path: '/rph/pembelian-sapi',
    element: <PembelianSapi />
  },
  {
    path: '/rph/pembelian-sapi/detail/:id',
    element: <PembelianSapiDetailPage />
  },
  {
    path: '/rph/stok-sapi',
    element: <StokSapiPage />
  },
  {
    path: '/rph/penjualan-boning',
    element: <PenjualanBoningPage />
  },
  {
    path: '/rph/penjualan-karkas',
    element: <PenjualanKarkasPage />
  }
];
