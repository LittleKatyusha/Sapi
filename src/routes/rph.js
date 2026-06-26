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
const PenerimaanRphPage = lazy(() => import('../pages/RPH/Keuangan/Penerimaan/PenerimaanRphPage'));
const BayarPage = lazy(() => import('../pages/RPH/Keuangan/Penerimaan/Bayar/BayarPage'));
const PengirimanPage = lazy(() => import('../pages/RPH/PenjualanSapiUtuh/Pengiriman/PengirimanPage'));

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
    path: '/rph/keuangan/penerimaan',
    element: <PenerimaanRphPage />
  },
  {
    path: '/rph/keuangan/penerimaan/bayar/:pid',
    element: <BayarPage />
  },
  {
    path: '/rph/penjualan-sapi-utuh/pengiriman/:pid',
    element: <PengirimanPage />
  }
];
