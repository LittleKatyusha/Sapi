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
const ItemPotongPage = lazy(() => import('../pages/dataMaster/ItemPotongPage'));
const MasterResellerPage = lazy(() => import('../pages/dataMaster/MasterResellerPage'));
const BoningMasterPage = lazy(() => import('../pages/dataMaster/BoningMasterPage'));
const DagingMasterPage = lazy(() => import('../pages/dataMaster/DagingMasterPage'));
const PembeliHoPage = lazy(() => import('../pages/dataMaster/PembeliHoPage'));
const TarifDofPage = lazy(() => import('../pages/dataMaster/TarifDofPage'));
const SopirPage = lazy(() => import('../pages/dataMaster/SopirPage'));
const KendaraanPage = lazy(() => import('../pages/dataMaster/KendaraanPage'));

// ============================================================
// MASTER DATA ROUTES — TERURUT & LENGKAP
// ============================================================
// 1. Organisasi → 2. Hewan → 3. Item & Barang → 4. Boning & Daging
// 5. Persetujuan → 6. Lainnya
export const masterDataRoutes = [
  // 1. Organisasi
  {
    path: '/master-data/kandang-office',
    element: <KandangOfficePage />
  },
  {
    path: '/master-data/outlet',
    element: <OutletPage />
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
    path: '/master-data/pembeli-ho',
    element: <PembeliHoPage />
  },
  {
    path: '/master-data/reseller',
    element: <MasterResellerPage />
  },

  // 2. Hewan & Klasifikasi
  {
    path: '/master-data/jenis-hewan',
    element: <JenisHewanPage />
  },
  {
    path: '/master-data/klasifikasi-hewan',
    element: <KlasifikasiHewanPage />
  },
  {
    path: '/master-data/eartag',
    element: <EartagPage />
  },

  // 3. Item & Barang
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
    path: '/master-data/klasifikasi-feedmil',
    element: <KlasifikasiFeedmilPage />
  },
  {
    path: '/master-data/klasifikasi-ovk',
    element: <KlasifikasiOvkPage />
  },
  {
    path: '/master-data/item-lain-lain',
    element: <ItemLainLainPage />
  },
  {
    path: '/master-data/klasifikasi-lain-lain',
    element: <KlasifikasiLainLainPage />
  },
  {
    path: '/master-data/barang',
    element: <BarangPage />
  },
  {
    path: '/master-data/item-potong',
    element: <ItemPotongPage />
  },
  {
    path: '/master-data/satuan',
    element: <SatuanPage />
  },
  {
    path: '/master-data/produk-gds',
    element: <ProdukGDSPage />
  },

  // 4. Boning & Daging
  {
    path: '/master-data/boning',
    element: <BoningMasterPage />
  },
  {
    path: '/master-data/daging',
    element: <DagingMasterPage />
  },
  {
    path: '/sopir',
    element: <SopirPage />
  },
  {
    path: '/kendaraan',
    element: <KendaraanPage />
  },

  // 5. Persetujuan
  {
    path: '/master-data/persetujuan-ho',
    element: <PersetujuanHoPage />
  },
  {
    path: '/master-data/persetujuan-rph',
    element: <PersetujuanRphPage />
  },
  {
    path: '/master-data/persetujuan-feedmil',
    element: <PersetujuanFeedmilPage />
  },

  // 6. Lainnya
  {
    path: '/master-data/tarif-dof',
    element: <TarifDofPage />
  }
];
