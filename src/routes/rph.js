import { lazy } from 'react';

const PembelianSapi = lazy(() => import('../pages/RPH/Pembelian/Pembelian Sapi/PembelianSapi'));
const PembelianSapiDetailPage = lazy(() => import('../pages/RPH/Pembelian/Pembelian Sapi/PembelianDetailPage'));

export const rphRoutes = [
  {
    path: '/rph/pembelian-sapi',
    element: <PembelianSapi />
  },
  {
    path: '/rph/pembelian-sapi/detail/:id',
    element: <PembelianSapiDetailPage />
  }
];
