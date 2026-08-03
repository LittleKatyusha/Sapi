import { lazy } from 'react';

const PembelianSapi = lazy(() => import('../pages/RPH/Pembelian/Pembelian Sapi/PembelianSapi'));
const PembelianSapiDetailPage = lazy(() => import('../pages/RPH/Pembelian/Pembelian Sapi/PembelianDetailPage'));
const StokSapiPage = lazy(() => import('../pages/RPH/StokSapi/StokSapiPage'));
const PenjualanBoningPage = lazy(() => import('../pages/RPH/Penjualan/Boning/PenjualanBoningPage'));
const PenjualanKarkasPage = lazy(() => import('../pages/RPH/Penjualan/Karkas/PenjualanKarkasPage'));
const PersediaanHasilPotongRphPage = lazy(() => import('../pages/RPH/Persediaan/PersediaanHasilPotongRph/PersediaanHasilPotongRphPage'));
const PenjualanSapiUtuhPage = lazy(() => import('../pages/RPH/PenjualanSapiUtuh/PenjualanSapiUtuhPage'));
const AddPenjualanSapiUtuhPage = lazy(() => import('../pages/RPH/PenjualanSapiUtuh/AddPenjualanSapiUtuhPageV2'));
const DetailPenjualanSapiUtuhPage = lazy(() => import('../pages/RPH/PenjualanSapiUtuh/DetailPenjualanSapiUtuhPage'));
const ReturnPenjualanPage = lazy(() => import('../pages/RPH/PenjualanSapiUtuh/ReturnPenjualanPage'));
const ReturnHistoryPage = lazy(() => import('../pages/RPH/PenjualanSapiUtuh/ReturnHistoryPage'));
const PenerimaanRphPage = lazy(() => import('../pages/RPH/Keuangan/Penerimaan/PenerimaanRphPage'));
const BayarPage = lazy(() => import('../pages/RPH/Keuangan/Penerimaan/Bayar/BayarPage'));
const PengeluaranRphPage = lazy(() => import('../pages/RPH/Keuangan/Pengeluaran/PengeluaranRphPage'));
const BayarPengeluaranPage = lazy(() => import('../pages/RPH/Keuangan/Pengeluaran/Bayar/BayarPage'));
const PengirimanPage = lazy(() => import('../pages/RPH/PenjualanSapiUtuh/Pengiriman/PengirimanPage'));
const PenawaranPage = lazy(() => import('../pages/RPH/Penawaran/PenawaranPage'));
const AddEditPenawaranPage = lazy(() => import('../pages/RPH/Penawaran/AddEditPenawaranPage'));
const DetailPenawaranPage = lazy(() => import('../pages/RPH/Penawaran/DetailPenawaranPage'));
const StokSapiQurbanPage = lazy(() => import('../pages/RPH/Qurban/StokSapiQurbanPage'));
const StokDokaPage = lazy(() => import('../pages/RPH/Persediaan/StokDoka/StokDokaPage'));
const PerpindahanTernakPage = lazy(() => import('../pages/RPH/Perpindahan/PerpindahanTernakPage'));
const AddEditPerpindahanTernakPage = lazy(() => import('../pages/RPH/Perpindahan/AddEditPerpindahanTernakPage'));

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
  },
  {
    path: '/rph/persediaan-hasil-potong',
    element: <PersediaanHasilPotongRphPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh',
    element: <PenjualanSapiUtuhPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh/add',
    element: <AddPenjualanSapiUtuhPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh/detail/:pid',
    element: <DetailPenjualanSapiUtuhPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh/edit/:pid',
    element: <AddPenjualanSapiUtuhPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh/return/:pid',
    element: <ReturnPenjualanPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh/return-history',
    element: <ReturnHistoryPage />
  },
  {
    path: '/rph/keuangan/penerimaan',
    element: <PenerimaanRphPage />
  },
  {
    path: '/rph/keuangan/penerimaan/bayar/:pid',
    element: <BayarPage />
  },
  {
    path: '/rph/keuangan/pengeluaran',
    element: <PengeluaranRphPage />
  },
  {
    path: '/rph/keuangan/pengeluaran/bayar/:pid',
    element: <BayarPengeluaranPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh/pengiriman/:pid',
    element: <PengirimanPage />
  },
  {
    path: '/rph/penawaran',
    element: <PenawaranPage />
  },
  {
    path: '/rph/penawaran/add',
    element: <AddEditPenawaranPage />
  },
  {
    path: '/rph/penawaran/edit/:pid',
    element: <AddEditPenawaranPage />
  },
  {
    path: '/rph/penawaran/detail/:pid',
    element: <DetailPenawaranPage />
  },
  {
    path: '/rph/stok-sapi-qurban',
    element: <StokSapiQurbanPage />
  },
  {
    path: '/rph/stok-doka',
    element: <StokDokaPage />
  },
  {
    path: '/rph/perpindahan-ternak',
    element: <PerpindahanTernakPage />
  },
  {
    path: '/rph/perpindahan-ternak/tambah',
    element: <AddEditPerpindahanTernakPage />
  },
  {
    path: '/rph/perpindahan-ternak/edit/:pid',
    element: <AddEditPerpindahanTernakPage />
  }
];
