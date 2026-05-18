import { lazy } from 'react';

const KandangOfficePage = lazy(() => import('../pages/dataMaster/KandangOfficePage'));
const JenisHewanPage = lazy(() => import('../pages/dataMaster/JenisHewanPage'));
const KlasifikasiHewanPage = lazy(() => import('../pages/dataMaster/KlasifikasiHewanPage'));
const KlasifikasiOvkPage = lazy(() => import('../pages/dataMaster/KlasifikasiOvkPage'));
const KlasifikasiFeedmilPage = lazy(() => import('../pages/dataMaster/KlasifikasiFeedmilPage'));
const KlasifikasiLainLainPage = lazy(() => import('../pages/dataMaster/KlasifikasiLainLainPage'));
const ItemKulitPage = lazy(() => import('../pages/dataMaster/ItemKulitPage'));
const ItemFeedmilPage = lazy(() => import('../pages/dataMaster/ItemFeedmilPage'));
const ItemOvkPage = lazy(() => import('../pages/dataMaster/ItemOvkPage'));
const ItemLainLainPage = lazy(() => import('../pages/dataMaster/ItemLainLainPage'));
const SupplierPage = lazy(() => import('../pages/dataMaster/SupplierPage'));
const PelangganPage = lazy(() => import('../pages/dataMaster/PelangganPage'));
const OutletPage = lazy(() => import('../pages/dataMaster/OutletPage'));
const ProdukGDSPage = lazy(() => import('../pages/dataMaster/ProdukGDSPage'));
const EartagPage = lazy(() => import('../pages/dataMaster/EartagPage'));
const PersetujuanHoPage = lazy(() => import('../pages/dataMaster/PersetujuanHoPage'));
const PersetujuanFeedmilPage = lazy(() => import('../pages/dataMaster/PersetujuanFeedmilPage'));
const PersetujuanRphPage = lazy(() => import('../pages/dataMaster/PersetujuanRphPage'));
const SatuanPage = lazy(() => import('../pages/dataMaster/SatuanPage'));
const BarangPage = lazy(() => import('../pages/dataMaster/BarangPage'));

export const masterDataRoutes = [
  {
    path: '/master-data/kandang-office',
    element: <KandangOfficePage />
  },
  {
    path: '/master-data/jenis-hewan',
    element: <JenisHewanPage />
  },
  {
    path: '/master-data/klasifikasi-hewan',
    element: <KlasifikasiHewanPage />
  },
  {
    path: '/master-data/klasifikasi-ovk',
    element: <KlasifikasiOvkPage />
  },
  {
    path: '/master-data/klasifikasi-feedmil',
    element: <KlasifikasiFeedmilPage />
  },
  {
    path: '/data-master/klasifikasi-lain-lain',
    element: <KlasifikasiLainLainPage />
  },
  {
    path: '/master-data/item-kulit',
    element: <ItemKulitPage />
  },
  {
    path: '/master-data/item-feedmil',
    element: <ItemFeedmilPage />
  },
  {
    path: '/master-data/item-ovk',
    element: <ItemOvkPage />
  },
  {
    path: '/master-data/item-lain-lain',
    element: <ItemLainLainPage />
  },
  {
    path: '/master-data/supplier',
    element: <SupplierPage />
  },
  {
    path: '/master-data/pelanggan',
    element: <PelangganPage />
  },
  {
    path: '/master-data/outlet',
    element: <OutletPage />
  },
  {
    path: '/master-data/produk-gds',
    element: <ProdukGDSPage />
  },
  {
    path: '/master-data/eartag',
    element: <EartagPage />
  },
  {
    path: '/master-data/persetujuan-ho',
    element: <PersetujuanHoPage />
  },
  {
    path: '/master-data/persetujuan-feedmil',
    element: <PersetujuanFeedmilPage />
  },
  {
    path: '/master-data/persetujuan-rph',
    element: <PersetujuanRphPage />
  },
  {
    path: '/master-data/satuan',
    element: <SatuanPage />
  },
  {
    path: '/master-data/barang',
    element: <BarangPage />
  }
];
