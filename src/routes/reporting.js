import { lazy } from 'react';

const LaporanNotaSupplierPage = lazy(() => import('../pages/reporting/LaporanNotaSupplierPage'));
const LaporanSemuaSupplierPage = lazy(() => import('../pages/reporting/LaporanSemuaSupplierPage'));
const LaporanPajakPage = lazy(() => import('../pages/reporting/LaporanPajakPage'));
const LaporanPembelianLainLainPage = lazy(() => import('../pages/reporting/LaporanPembelianLainLainPage'));

export const reportingRoutes = [
  {
    path: '/reports/nota-supplier',
    element: <LaporanNotaSupplierPage />
  },
  {
    path: '/reports/semua-supplier',
    element: <LaporanSemuaSupplierPage />
  },
  {
    path: '/reports/pajak',
    element: <LaporanPajakPage />
  },
  {
    path: '/reports/pembelian-lain-lain',
    element: <LaporanPembelianLainLainPage />
  }
];
