import { lazy } from 'react';

const PembelianHOPage = lazy(() => import('../pages/ho/pembelian/PembelianHOPage'));
const PembelianDetailPage = lazy(() => import('../pages/ho/pembelian/PembelianDetailPage'));
const AddEditPembelianPage = lazy(() => import('../pages/ho/pembelian/AddEditPembelianPage'));

const PembelianFeedmilPage = lazy(() => import('../pages/ho/pembelianFeedmil/PembelianFeedmilPage'));
const AddEditPembelianFeedmilPage = lazy(() => import('../pages/ho/pembelianFeedmil/AddEditPembelianFeedmilPage'));
const PembelianFeedmilDetailPage = lazy(() => import('../pages/ho/pembelianFeedmil/PembelianFeedmilDetailPage'));

const PembelianOVKPage = lazy(() => import('../pages/ho/pembelianOVK/PembelianOVKPage'));
const AddEditPembelianOVKPage = lazy(() => import('../pages/ho/pembelianOVK/addEditPembelianOVK'));
const PembelianOVKDetailPage = lazy(() => import('../pages/ho/pembelianOVK/PembelianOVKDetailPage'));

const PembelianKulitPage = lazy(() => import('../pages/ho/pembelianKulit/PembelianKulitPage'));
const AddEditPembelianKulitPage = lazy(() => import('../pages/ho/pembelianKulit/AddEditPembelianKulitPage'));
const PembelianKulitDetailPage = lazy(() => import('../pages/ho/pembelianKulit/PembelianKulitDetailPage'));

const PembelianLainLainPage = lazy(() => import('../pages/ho/pembelianLainLain/PembelianLainLainPage'));
const AddEditPembelianLainLainPage = lazy(() => import('../pages/ho/pembelianLainLain/addEditPembelianLainLain'));
const PembelianLainLainDetailPage = lazy(() => import('../pages/ho/pembelianLainLain/PembelianLainLainDetailPage'));

const PengajuanPage = lazy(() => import('../pages/ho/pengajuan/PengajuanPage'));

const KeuanganKasDetailPage = lazy(() => import('../pages/ho/keuanganKas/KeuanganKasDetailPage'));

const KeuanganBankDetailPage = lazy(() => import('../pages/ho/keuanganBank/KeuanganBankDetailPage'));

const KeuanganPage = lazy(() => import('../pages/ho/keuangan/KeuanganPage'));

const PenerimaanHoPage = lazy(() => import('../pages/ho/keuangan/Penerimaan/PenerimaanHoPage'));

const PenjualanSapiHOPage = lazy(() => import('../pages/ho/penjualan/penjualanSapi/PenjualanSapiHOPage'));

export const hoRoutes = [
  // General HO Pembelian
  {
    path: '/ho/pembelian',
    element: <PembelianHOPage />
  },
  {
    path: '/ho/pembelian/add',
    element: <AddEditPembelianPage />
  },
  {
    path: '/ho/pembelian/edit/:id',
    element: <AddEditPembelianPage />
  },
  {
    path: '/ho/pembelian/detail/:id',
    element: <PembelianDetailPage />
  },

  // HO Feedmil Pembelian
  {
    path: '/ho/pembelian-feedmil',
    element: <PembelianFeedmilPage />
  },
  {
    path: '/ho/pembelian-feedmil/add',
    element: <AddEditPembelianFeedmilPage />
  },
  {
    path: '/ho/pembelian-feedmil/edit/:id',
    element: <AddEditPembelianFeedmilPage />
  },
  {
    path: '/ho/pembelian-feedmil/detail/:id',
    element: <PembelianFeedmilDetailPage />
  },

  // HO OVK Pembelian
  {
    path: '/ho/pembelian-ovk',
    element: <PembelianOVKPage />
  },
  {
    path: '/ho/pembelian-ovk/add',
    element: <AddEditPembelianOVKPage />
  },
  {
    path: '/ho/pembelian-ovk/edit/:id',
    element: <AddEditPembelianOVKPage />
  },
  {
    path: '/ho/pembelian-ovk/detail/:id',
    element: <PembelianOVKDetailPage />
  },

  // HO Kulit Pembelian
  {
    path: '/ho/pembelian-kulit',
    element: <PembelianKulitPage />
  },
  {
    path: '/ho/pembelian-kulit/add',
    element: <AddEditPembelianKulitPage />
  },
  {
    path: '/ho/pembelian-kulit/edit/:id',
    element: <AddEditPembelianKulitPage />
  },
  {
    path: '/ho/pembelian-kulit/detail/:id',
    element: <PembelianKulitDetailPage />
  },

  // HO Lain-Lain Pembelian
  {
    path: '/ho/pembelian-lain-lain',
    element: <PembelianLainLainPage />
  },
  {
    path: '/ho/pembelian-lain-lain/add',
    element: <AddEditPembelianLainLainPage />
  },
  {
    path: '/ho/pembelian-lain-lain/edit/:id',
    element: <AddEditPembelianLainLainPage />
  },
  {
    path: '/ho/pembelian-lain-lain/detail/:id',
    element: <PembelianLainLainDetailPage />
  },

  // HO Pengajuan
  {
    path: '/ho/pengajuan',
    element: <PengajuanPage />
  },

  // HO Keuangan (unified)
  {
    path: '/ho/keuangan/pengeluaran',
    element: <KeuanganPage />
  },
  {
    path: '/ho/keuangan/penerimaan',
    element: <PenerimaanHoPage />
  },
  {
    path: '/ho/keuangan-kas/detail/:id',
    element: <KeuanganKasDetailPage />
  },
  {
    path: '/ho/keuangan-bank/detail/:id',
    element: <KeuanganBankDetailPage />
  },

  // HO Penjualan
  {
    path: '/ho/penjualan-sapi',
    element: <PenjualanSapiHOPage />
  }
];
