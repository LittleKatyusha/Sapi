import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LayoutSecure from './components/LayoutSecure';
import ProtectedRouteSecure from './components/ProtectedRouteSecure';
import LoginPageSecure from './pages/LoginPageSecure';
import { useSecurityMonitoring } from './hooks/useSecurityMonitoring';
import { pageTitleMap } from './config/pageTitleMap';
import SecurityErrorBoundary from './components/SecurityErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import useDocumentTitle from './hooks/useDocumentTitle';
import { NotificationProvider } from './components/shared/Notification';

// Lazy load components for better performance
const DashboardPage = lazy(() => import('./pages/AdvancedAnalyticsPage'));
const SalesPage = lazy(() => import('./pages/operations/SalesPage'));
const PurchasePage = lazy(() => import('./pages/operations/PurchasePage'));
const LivestockStockPage = lazy(() => import('./pages/inventory/LivestockStockPage'));
const MeatStockPage = lazy(() => import('./pages/inventory/MeatStockPage'));
const EmployeePage = lazy(() => import('./pages/humanResources/EmployeePage'));
const AttendancePage = lazy(() => import('./pages/humanResources/AttendancePage'));
const LeaveRequestPage = lazy(() => import('./pages/humanResources/LeaveRequestPage'));
const DeliveryOrderPage = lazy(() => import('./pages/operations/DeliveryOrderPage'));
const SettingsPageSecure = lazy(() => import('./pages/SettingsPageSecure'));

// Data Master - Lazy loaded
const KandangOfficePage = lazy(() => import('./pages/dataMaster/KandangOfficePage'));
const JenisHewanPage = lazy(() => import('./pages/dataMaster/JenisHewanPage'));
const KlasifikasiHewanPage = lazy(() => import('./pages/dataMaster/KlasifikasiHewanPage'));
const KlasifikasiOvkPage = lazy(() => import('./pages/dataMaster/KlasifikasiOvkPage'));
const KlasifikasiFeedmilPage = lazy(() => import('./pages/dataMaster/KlasifikasiFeedmilPage'));
const KlasifikasiLainLainPage = lazy(() => import('./pages/dataMaster/KlasifikasiLainLainPage'));
const ItemKulitPage = lazy(() => import('./pages/dataMaster/ItemKulitPage'));
const ItemFeedmilPage = lazy(() => import('./pages/dataMaster/ItemFeedmilPage'));
const ItemOvkPage = lazy(() => import('./pages/dataMaster/ItemOvkPage'));
const ItemLainLainPage = lazy(() => import('./pages/dataMaster/ItemLainLainPage'));
const SupplierPage = lazy(() => import('./pages/dataMaster/SupplierPage'));
const PelangganPage = lazy(() => import('./pages/dataMaster/PelangganPage'));
const OutletPage = lazy(() => import('./pages/dataMaster/OutletPage'));
const ProdukGDSPage = lazy(() => import('./pages/dataMaster/ProdukGDSPage'));
const EartagPage = lazy(() => import('./pages/dataMaster/EartagPage'));
const PersetujuanHoPage = lazy(() => import('./pages/dataMaster/PersetujuanHoPage'));
const PersetujuanFeedmilPage = lazy(() => import('./pages/dataMaster/PersetujuanFeedmilPage'));
const PersetujuanRphPage = lazy(() => import('./pages/dataMaster/PersetujuanRphPage'));
const SatuanPage = lazy(() => import('./pages/dataMaster/SatuanPage'));
const BarangPage = lazy(() => import('./pages/dataMaster/BarangPage'));
const ItemPotongPage = lazy(() => import('./pages/dataMaster/ItemPotongPage'));
const MasterResellerPage = lazy(() => import('./pages/dataMaster/MasterResellerPage'));
const PembeliHoPage = lazy(() => import('./pages/dataMaster/PembeliHoPage'));
const TarifDofPage = lazy(() => import('./pages/dataMaster/TarifDofPage'));
const BoningMasterPage = lazy(() => import('./pages/dataMaster/BoningMasterPage'));
const DagingMasterPage = lazy(() => import('./pages/dataMaster/DagingMasterPage'));
const SopirPage = lazy(() => import('./pages/dataMaster/SopirPage'));
const KendaraanPage = lazy(() => import('./pages/dataMaster/KendaraanPage'));
const PedagangPage = lazy(() => import('./pages/RPH/pedagang'));
const StatistikPedagangPage = lazy(() => import('./pages/RPH/pedagang/StatistikPedagangPage'));

// Boning Pages - Lazy loaded
const BoningLayout = lazy(() => import('./pages/boning/BoningLayout'));
const KeuanganPage = lazy(() => import('./pages/boning/KeuanganPage'));
const PembelianPage = lazy(() => import('./pages/boning/PembelianPage'));
const PenjualanPage = lazy(() => import('./pages/boning/PenjualanPage'));
const StokDagingPage = lazy(() => import('./pages/boning/StokDagingPage'));
const ReturnPage = lazy(() => import('./pages/boning/ReturnPage'));
const SuratJalanPage = lazy(() => import('./pages/boning/SuratJalanPage'));

// System Pages
const PermissionManagementPage = lazy(() => import('./pages/system/PermissionManagementPage'));
const RolePage = lazy(() => import('./pages/system/RolePage'));
const MenuManagementPage = lazy(() => import('./pages/system/MenuManagementPage'));
const UsersPage = lazy(() => import('./pages/system/UsersPage'));
const ManualJobPage = lazy(() => import('./pages/system/ManualJobPage'));

// HO Pages - Lazy loaded
const PembelianHOPage = lazy(() => import('./pages/ho/pembelian/PembelianHOPage'));
const PembelianDetailPage = lazy(() => import('./pages/ho/pembelian/PembelianDetailPage'));
const AddEditPembelianPage = lazy(() => import('./pages/ho/pembelian/AddEditPembelianPage'));
// const PenjualanHOPage = lazy(() => import('./pages/ho/penjualan/PenjualanHOPage'));
// const AddEditPenjualanPage = lazy(() => import('./pages/ho/penjualan/AddEditPenjualanPage'));
// const PenjualanDetailPage = lazy(() => import('./pages/ho/penjualan/PenjualanDetailPage'));

// HO Penjualan Sapi Pages - Lazy loaded
const PenjualanSapiHOPage = lazy(() => import('./pages/ho/penjualan/penjualanSapi/PenjualanSapiHOPage'));
// Removed AddEditPenjualanSapiPage and PenjualanSapiDetailPage as they are not needed

// RPH Pembelian Sapi Pages - Lazy loaded
const PembelianSapi = lazy(() => import('./pages/RPH/Pembelian/Pembelian Sapi/PembelianSapi'));
const AddPoRphPage = lazy(() => import('./pages/RPH/Pembelian/Pembelian Sapi/AddPoRphPage.jsx'));
const PembelianSapiDetailPage = lazy(() => import('./pages/RPH/Pembelian/Pembelian Sapi/PembelianDetailPage'));

// RPH Pembelian Sapi Qurban Pages - Lazy loaded
const PembelianSapiQurbanPage = lazy(() => import('./pages/RPH/Pembelian/pembelian sapi qurban/PembelianSapiQurbanPage'));
const AddEditPembelianQurbanPage = lazy(() => import('./pages/RPH/Pembelian/pembelian sapi qurban/AddEditPembelianQurbanPage'));
const DetailSapiQurbanPage = lazy(() => import('./pages/RPH/Pembelian/pembelian sapi qurban/DetailSapiQurbanPage'));

// RPH Pembelian Pakan dan OVK Page - Lazy loaded
const PembelianPakanOvkPage = lazy(() => import('./pages/RPH/Pembelian/pembelian pakan dan ovk/PembelianPakanOvkPage'));
const AddPembelianPakanOvkPage = lazy(() => import('./pages/RPH/Pembelian/pembelian pakan dan ovk/AddPembelianPakanOvkPage'));

// RPH Bahan Pembantu Pages - Lazy loaded
const BahanPembantuRphPage = lazy(() => import('./pages/RPH/BahanPembantuRph/BahanPembantuRphPage'));
const AddEditBahanPembantuRphPage = lazy(() => import('./pages/RPH/BahanPembantuRph/AddEditBahanPembantuRphPage'));
const AddEditBiayaRphPage = lazy(() => import('./pages/RPH/BahanPembantuRph/AddEditBiayaRphPage'));
const BahanPembantuRphDetailPage = lazy(() => import('./pages/RPH/BahanPembantuRph/BahanPembantuRphDetailPage'));

// RPH Persediaan OVK Page - Lazy loaded
const PersediaanOvkPage = lazy(() => import('./pages/RPH/Persediaan/PersediaanOvk/PersediaanOvkPage'));
const BeriMakanSapiPage = lazy(() => import('./pages/RPH/Persediaan/PersediaanOvk/BeriMakanSapiPage'));
const RiwayatPemberianPakanPage = lazy(() => import('./pages/RPH/Persediaan/PersediaanOvk/RiwayatPemberianPakanPage'));

// RPH Persediaan Pakan Page - Lazy loaded
const PersediaanPakanPage = lazy(() => import('./pages/RPH/Persediaan/PersediaanPakan/PersediaanPakanPage'));

// RPH Master Kandang Page - Lazy loaded
const KandangPage = lazy(() => import('./pages/RPH/Master/Kandang/KandangPage'));

// RPH Persediaan Hasil Potong Page - Lazy loaded
const PersediaanHasilPotongRphPage = lazy(() => import('./pages/RPH/Persediaan/PersediaanHasilPotongRph/PersediaanHasilPotongRphPage'));

// RPH DOF Page - Lazy loaded
const DofRphPage = lazy(() => import('./pages/RPH/Dof/DofRphPage'));

// RPH Penjualan Sapi Utuh Pages - Lazy loaded
const PenjualanSapiUtuhPage = lazy(() => import('./pages/RPH/PenjualanSapiUtuh/PenjualanSapiUtuhPage'));
const AddPenjualanSapiUtuhPage = lazy(() => import('./pages/RPH/PenjualanSapiUtuh/AddPenjualanSapiUtuhPageV2'));
const DetailPenjualanSapiUtuhPage = lazy(() => import('./pages/RPH/PenjualanSapiUtuh/DetailPenjualanSapiUtuhPage'));
const ReturnPenjualanPage = lazy(() => import('./pages/RPH/PenjualanSapiUtuh/ReturnPenjualanPage'));
const ReturnHistoryPage = lazy(() => import('./pages/RPH/PenjualanSapiUtuh/ReturnHistoryPage'));
const PenjualanBoningPage = lazy(() => import('./pages/RPH/Penjualan/Boning/PenjualanBoningPage'));
const PenjualanKarkasPage = lazy(() => import('./pages/RPH/Penjualan/Karkas/PenjualanKarkasPage'));
const PenjualanKulitPage = lazy(() => import('./pages/RPH/Penjualan/Kulit/PenjualanKulitPage.jsx'));

// RPH Keuangan Penerimaan Page - Lazy loaded
const PenerimaanRphPage = lazy(() => import('./pages/RPH/Keuangan/Penerimaan/PenerimaanRphPage'));
const BayarPage = lazy(() => import('./pages/RPH/Keuangan/Penerimaan/Bayar/BayarPage.jsx'));
// RPH Keuangan Pengeluaran Page - Lazy loaded
const PengeluaranRphPage = lazy(() => import('./pages/RPH/Keuangan/Pengeluaran/PengeluaranRphPage.jsx'));
const BayarPengeluaranPage = lazy(() => import('./pages/RPH/Keuangan/Pengeluaran/Bayar/BayarPage.jsx'));
const PengirimanPage = lazy(() => import('./pages/RPH/PenjualanSapiUtuh/Pengiriman/PengirimanPage'));

// RPH Penawaran Pages - Lazy loaded
const PenawaranPage = lazy(() => import('./pages/RPH/Penawaran/PenawaranPage'));
const AddEditPenawaranPage = lazy(() => import('./pages/RPH/Penawaran/AddEditPenawaranPage'));
const DetailPenawaranPage = lazy(() => import('./pages/RPH/Penawaran/DetailPenawaranPage'));

// RPH Qurban Pages - Lazy loaded
const StokSapiQurbanPage = lazy(() => import('./pages/RPH/Qurban/StokSapiQurbanPage'));
const StokDokaPage = lazy(() => import('./pages/RPH/Persediaan/StokDoka/StokDokaPage'));

// RPH Perpindahan Ternak Page - Lazy loaded
const PerpindahanTernakPage = lazy(() => import('./pages/RPH/Perpindahan/PerpindahanTernakPage'));
const AddEditPerpindahanTernakPage = lazy(() => import('./pages/RPH/Perpindahan/AddEditPerpindahanTernakPage'));

// RPH Stok Sapi Page - Lazy loaded
const StokSapi = lazy(() => import('./pages/RPH/StokSapi/StokSapiPage'));
const PemberianOvkSapiPage = lazy(() => import('./pages/RPH/StokSapi/PemberianOvkSapiPage'));
const AddEditPemberianOvkSapiPage = lazy(() => import('./pages/RPH/StokSapi/AddEditPemberianOvkSapiPage'));

// Reporting Pages - Lazy loaded
const LaporanNotaSupplierPage = lazy(() => import('./pages/reporting/LaporanNotaSupplierPage'));
const LaporanSemuaSupplierPage = lazy(() => import('./pages/reporting/LaporanSemuaSupplierPage'));
const LaporanPajakPage = lazy(() => import('./pages/reporting/LaporanPajakPage'));
const LaporanPembelianLainLainPage = lazy(() => import('./pages/reporting/LaporanPembelianLainLainPage'));
const ReportHoPage = lazy(() => import('./pages/reporting/ho/ReportHoPage'));
const EartagHoPage = lazy(() => import('./pages/ho/eartag/EartagHoPage'));

// RPH Hutang Piutang & Payment (P4)
const HutangRphPage = lazy(() => import('./pages/RPH/hutangPiutang/HutangRphPage'));
const PiutangRphPage = lazy(() => import('./pages/RPH/hutangPiutang/PiutangRphPage'));
const PaymentRphPage = lazy(() => import('./pages/RPH/payment/PaymentRphPage'));

// Warehouse (P5)
const StokFeedmilWarehousePage = lazy(() => import('./pages/warehouse/stok/StokFeedmilWarehousePage'));
const StokOvkWarehousePage = lazy(() => import('./pages/warehouse/stok/StokOvkWarehousePage'));
const PenerimaanWarehousePage = lazy(() => import('./pages/warehouse/penerimaan/PenerimaanWarehousePage'));
const DistribusiWarehousePage = lazy(() => import('./pages/warehouse/distribusi/DistribusiWarehousePage'));

// Laporan RPH (P6)
const ReportRphPage = lazy(() => import('./pages/reporting/rph/ReportRphPage'));

// New HO Pages - Lazy loaded
const PembelianFeedmilPage = lazy(() => import('./pages/ho/pembelianFeedmil/PembelianFeedmilPage'));
const AddEditPembelianFeedmilPage = lazy(() => import('./pages/ho/pembelianFeedmil/AddEditPembelianFeedmilPage'));
const PembelianFeedmilDetailPage = lazy(() => import('./pages/ho/pembelianFeedmil/PembelianFeedmilDetailPage'));
const PembelianOVKPage = lazy(() => import('./pages/ho/pembelianOVK/PembelianOVKPage'));
const AddEditPembelianOVKPage = lazy(() => import('./pages/ho/pembelianOVK/addEditPembelianOVK'));
const PembelianOVKDetailPage = lazy(() => import('./pages/ho/pembelianOVK/PembelianOVKDetailPage'));

// Pembelian Kulit Pages - Lazy loaded
const PembelianKulitPage = lazy(() => import('./pages/ho/pembelianKulit/PembelianKulitPage'));
const AddEditPembelianKulitPage = lazy(() => import('./pages/ho/pembelianKulit/AddEditPembelianKulitPage'));
const PembelianKulitDetailPage = lazy(() => import('./pages/ho/pembelianKulit/PembelianKulitDetailPage'));

// Pembelian Lain Lain Pages - Lazy loaded
const PembelianLainLainPage = lazy(() => import('./pages/ho/pembelianLainLain/PembelianLainLainPage'));
const AddEditPembelianLainLainPage = lazy(() => import('./pages/ho/pembelianLainLain/addEditPembelianLainLain'));
const PembelianLainLainDetailPage = lazy(() => import('./pages/ho/pembelianLainLain/PembelianLainLainDetailPage'));
const PembelianBebanBiayaPage = lazy(() => import('./pages/ho/pembelianBebanBiaya/PembelianBebanBiayaPage'));
const PembelianBahanPembantuPage = lazy(() => import('./pages/ho/pembelianBahanPembantu/PembelianBahanPembantuPage'));

// Pengajuan Pages - Lazy loaded
const PengajuanPage = lazy(() => import('./pages/ho/pengajuan/PengajuanPage'));

// Keuangan Pages - Lazy loaded (unified HO)
const HOKeuanganPage = lazy(() => import('./pages/ho/keuangan/KeuanganPage'));
const PenerimaanHoPage = lazy(() => import('./pages/ho/keuangan/Penerimaan/PenerimaanHoPage.jsx'));
const BayarPenerimaanHoPage = lazy(() => import('./pages/ho/keuangan/Penerimaan/Bayar/BayarPage.jsx'));
const BayarPengeluaranHoPage = lazy(() => import('./pages/ho/keuangan/Pengeluaran/Bayar/BayarPage.jsx'));
const KeuanganKasDetailPage = lazy(() => import('./pages/ho/keuanganKas/KeuanganKasDetailPage'));
const KeuanganBankDetailPage = lazy(() => import('./pages/ho/keuanganBank/KeuanganBankDetailPage'));

// HO Penjualan Pages - Lazy loaded
const PenjualanHOPage = lazy(() => import('./pages/ho/penjualan/PenjualanPage'));
const AddEditPenjualanHOPage = lazy(() => import('./pages/ho/penjualan/AddEditPenjualanPage'));

// Pembayaran Pages - Lazy loaded
const PembayaranDetailPage = lazy(() => import('./pages/pembayaran/pembayaranDoka/PembayaranDetailPage'));

// Pembayaran OVK Pages - Lazy loaded
const PembayaranOvkDetailPage = lazy(() => import('./pages/pembayaran/pembayaranOvk/PembayaranDetailPage'));

// Pembayaran Feedmill Pages - Lazy loaded
const PembayaranFeedmillDetailPage = lazy(() => import('./pages/pembayaran/pembayaranFeedmil/PembayaranDetailPage'));

// Pembayaran Kulit Pages - Lazy loaded
const PembayaranKulitDetailPage = lazy(() => import('./pages/pembayaran/pembayaranKulit/PembayaranDetailPage'));

// Pembayaran Lain-Lain Pages - Lazy loaded
const PembayaranLainLainDetailPage = lazy(() => import('./pages/pembayaran/pembayaranLainLain/PembayaranDetailPage'));

// HO Hutang & Piutang Pages - Lazy loaded
const HutangVendorPage = lazy(() => import('./pages/ho/hutangVendor/HutangVendorPage'));
const PiutangCabangPage = lazy(() => import('./pages/ho/piutangCabang/PiutangCabangPage'));

// HO Stok Pages - Lazy loaded
const StokFeedmilHoPage = lazy(() => import('./pages/ho/stokFeedmil/StokFeedmilHoPage'));
const StokOvkHoPage = lazy(() => import('./pages/ho/stokOvk/StokOvkHoPage'));

// HO Bank Deposit Page - Lazy loaded
const BankDepositPage = lazy(() => import('./pages/ho/bankDeposit/BankDepositPage'));

// HO Payment Page - Lazy loaded
const PaymentHoPage = lazy(() => import('./pages/ho/paymentHo/PaymentHoPage'));

const AppWrapperSecure = () => (
  <NotificationProvider>
    <Router>
      <AppSecure />
    </Router>
  </NotificationProvider>
);

function AppSecure() {
  const location = useLocation();
  const title = pageTitleMap[location.pathname] || 'Advanced Analytics';
  const isLoginPage = location.pathname === '/login';

  // Initialize security monitoring
  useSecurityMonitoring();

  // Initialize dynamic document title
  useDocumentTitle();

  // Debug logging only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 AppSecure Route Change:', {
        pathname: location.pathname,
        isLoginPage,
        title: document.title,
        timestamp: new Date().toISOString()
      });
    }
  }, [location.pathname, isLoginPage]);

  // Login page rendering
  if (isLoginPage) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Rendering login page');
    }
    
    return (
      <SecurityErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPageSecure />} />
        </Routes>
      </SecurityErrorBoundary>
    );
  }

  // Protected routes rendering
  if (process.env.NODE_ENV === 'development') {
    console.log('🛡️ Rendering protected routes');
  }

  return (
    <SecurityErrorBoundary>
      <ProtectedRouteSecure>
        <LayoutSecure title={title}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Dashboard Route */}
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Operations Routes */}
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/purchases" element={<PurchasePage />} />
              <Route path="/delivery-orders" element={<DeliveryOrderPage />} />
              
              {/* Inventory Routes */}
              <Route path="/inventory/livestock" element={<LivestockStockPage />} />
              <Route path="/inventory/meat" element={<MeatStockPage />} />
              
              {/* Reporting Routes */}
              <Route path="/reports/nota-supplier" element={<LaporanNotaSupplierPage />} />
              <Route path="/reports/semua-supplier" element={<LaporanSemuaSupplierPage />} />
              <Route path="/reports/pajak" element={<LaporanPajakPage />} />
              <Route path="/reports/pembelian-lain-lain" element={<LaporanPembelianLainLainPage />} />
              <Route path="/reports/ho" element={<ReportHoPage />} />
              <Route path="/rph/hutang" element={<HutangRphPage />} />
              <Route path="/rph/piutang" element={<PiutangRphPage />} />
              <Route path="/rph/payment" element={<PaymentRphPage />} />
              <Route path="/warehouse/stok/feedmil" element={<StokFeedmilWarehousePage />} />
              <Route path="/warehouse/stok/ovk" element={<StokOvkWarehousePage />} />
              <Route path="/warehouse/penerimaan" element={<PenerimaanWarehousePage />} />
              <Route path="/warehouse/distribusi" element={<DistribusiWarehousePage />} />
              <Route path="/reports/rph" element={<ReportRphPage />} />

              {/* HR Routes */}
              <Route path="/hr/employees" element={<EmployeePage />} />
              <Route path="/hr/attendance" element={<AttendancePage />} />
              <Route path="/hr/leave-requests" element={<LeaveRequestPage />} />

              {/* Settings Route */}
              <Route path="/settings" element={<SettingsPageSecure />} />

              {/* Master Data Routes */}
              <Route path="/master-data/kandang-office" element={<KandangOfficePage />} />
              <Route path="/master-data/jenis-hewan" element={<JenisHewanPage />} />
              <Route path="/master-data/klasifikasi-hewan" element={<KlasifikasiHewanPage />} />
              <Route path="/master-data/klasifikasi-ovk" element={<KlasifikasiOvkPage />} />
              <Route path="/master-data/klasifikasi-feedmil" element={<KlasifikasiFeedmilPage />} />
              <Route path="/data-master/klasifikasi-lain-lain" element={<KlasifikasiLainLainPage />} />
              <Route path="/master-data/item-kulit" element={<ItemKulitPage />} />
              <Route path="/master-data/item-feedmil" element={<ItemFeedmilPage />} />
              <Route path="/master-data/item-ovk" element={<ItemOvkPage />} />
              <Route path="/master-data/item-lain-lain" element={<ItemLainLainPage />} />
              <Route path="/master-data/supplier" element={<SupplierPage />} />
              <Route path="/master-data/pelanggan" element={<PelangganPage />} />
              <Route path="/master-data/outlet" element={<OutletPage />} />
              <Route path="/master-data/produk-gds" element={<ProdukGDSPage />} />
              <Route path="/master-data/eartag" element={<EartagPage />} />
              <Route path="/master-data/persetujuan-ho" element={<PersetujuanHoPage />} />
              <Route path="/master-data/persetujuan-feedmil" element={<PersetujuanFeedmilPage />} />
              <Route path="/master-data/persetujuan-rph" element={<PersetujuanRphPage />} />
              <Route path="/master-data/satuan" element={<SatuanPage />} />
              <Route path="/master-data/barang" element={<BarangPage />} />
              <Route path="/master-data/item-potong" element={<ItemPotongPage />} />
              <Route path="/master-data/reseller" element={<MasterResellerPage />} />
              <Route path="/master-data/pembeli-ho" element={<PembeliHoPage />} />
              <Route path="/master-data/tarif-dof" element={<TarifDofPage />} />
              <Route path="/master-data/boning" element={<BoningMasterPage />} />
              <Route path="/master-data/daging" element={<DagingMasterPage />} />
              <Route path="/sopir" element={<SopirPage />} />
              <Route path="/kendaraan" element={<KendaraanPage />} />
              <Route path="/rph/pedagang" element={<PedagangPage />} />
              <Route path="/rph/pedagang/statistik" element={<StatistikPedagangPage />} />

              {/* Boning Routes */}
              <Route path="/boning/*" element={<BoningLayout />}>
                <Route path="keuangan" element={<KeuanganPage />} />
                <Route path="pembelian" element={<PembelianPage />} />
                <Route path="penjualan" element={<PenjualanPage />} />
                <Route path="stok-daging" element={<StokDagingPage />} />
                <Route path="return" element={<ReturnPage />} />
                <Route path="surat-jalan" element={<SuratJalanPage />} />
              </Route>

              {/* HO Routes */}
              <Route path="/ho/pembelian" element={<PembelianHOPage />} />
              <Route path="/ho/pembelian/add" element={<AddEditPembelianPage />} />
              <Route path="/ho/pembelian/edit/:id" element={<AddEditPembelianPage />} />
              <Route path="/ho/pembelian/detail/:id" element={<PembelianDetailPage />} />
              
              {/* RPH Pembelian Sapi Routes */}
              <Route path="/rph/pembelian-sapi" element={<PembelianSapi />} />
              <Route path="/rph/pembelian-sapi/add" element={<AddPoRphPage />} />
              <Route path="/rph/pembelian-sapi/detail/:id" element={<PembelianSapiDetailPage />} />
              {/* Alias redirect: /rph/pembelian/doka → /rph/pembelian-sapi */}
              <Route path="/rph/pembelian/doka" element={<Navigate to="/rph/pembelian-sapi" replace />} />
              <Route path="/rph/pembelian/doka/detail/:id" element={<Navigate to="/rph/pembelian-sapi/detail/:id" replace />} />
              
              {/* RPH Pembelian Sapi Qurban Routes */}
              <Route path="/rph/pembelian-sapi-qurban" element={<PembelianSapiQurbanPage />} />
              <Route path="/rph/pembelian-sapi-qurban/add" element={<AddEditPembelianQurbanPage />} />
              <Route path="/rph/pembelian-sapi-qurban/edit/:id" element={<AddEditPembelianQurbanPage />} />
              <Route path="/rph/pembelian-sapi-qurban/detail-sapi/:id" element={<DetailSapiQurbanPage />} />

              {/* RPH Pembelian Pakan dan OVK Routes */}
              <Route path="/rph/pembelian-pakan-ovk" element={<PembelianPakanOvkPage />} />
              <Route path="/rph/pembelian-pakan-ovk/add/:type" element={<AddPembelianPakanOvkPage />} />
              <Route path="/rph/pembelian-pakan-ovk/edit/:id" element={<AddPembelianPakanOvkPage />} />
              <Route path="/rph/pembelian-pakan-ovk/detail/:id" element={<AddPembelianPakanOvkPage />} />

              {/* RPH Bahan Pembantu Routes */}
              <Route path="/rph/bahan-pembantu-rph" element={<BahanPembantuRphPage />} />
              <Route path="/rph/bahan-pembantu-rph/add" element={<AddEditBahanPembantuRphPage />} />
              <Route path="/rph/bahan-pembantu-rph/edit/:id" element={<AddEditBahanPembantuRphPage />} />
              <Route path="/rph/bahan-pembantu-rph/biaya/add" element={<AddEditBiayaRphPage />} />
              <Route path="/rph/bahan-pembantu-rph/biaya/edit/:id" element={<AddEditBiayaRphPage />} />
              <Route path="/rph/bahan-pembantu-rph/detail/:id" element={<BahanPembantuRphDetailPage />} />

              {/* RPH Stok Sapi Route */}
              <Route path="/rph/stok-sapi" element={<StokSapi />} />
              <Route path="/rph/pemberian-ovk-sapi" element={<PemberianOvkSapiPage />} />
              <Route path="/rph/pemberian-ovk-sapi/add" element={<AddEditPemberianOvkSapiPage />} />
              <Route path="/rph/pemberian-ovk-sapi/edit/:pid" element={<AddEditPemberianOvkSapiPage />} />
              
              {/* RPH Persediaan OVK Route */}
              <Route path="/rph/persediaan-ovk" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PersediaanOvkPage />
                </Suspense>
              } />
              <Route path="/rph/persediaan-ovk/beri-makan/:pid" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <BeriMakanSapiPage />
                </Suspense>
              } />
              <Route path="/rph/persediaan-ovk/riwayat-pemberian/:pid" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <RiwayatPemberianPakanPage />
                </Suspense>
              } />

              {/* RPH Persediaan Pakan Route */}
              <Route path="/rph/persediaan-pakan" element={<PersediaanPakanPage />} />

              {/* RPH Master Kandang Route */}
              <Route path="/rph/kandang" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <KandangPage />
                </Suspense>
              } />

              {/* RPH Persediaan Hasil Potong Route */}
              <Route path="/rph/persediaan-boning" element={<PersediaanHasilPotongRphPage />} />
              <Route path="/rph/persediaan-hasil-potong" element={<PersediaanHasilPotongRphPage />} />

              {/* RPH DOF Route */}
              <Route path="/rph/dof" element={<DofRphPage />} />

              {/* RPH Penjualan Sapi Utuh Routes */}
              <Route path="/rph/penjualan-sapi-utuh" element={<PenjualanSapiUtuhPage />} />
              <Route path="/rph/penjualan-sapi-utuh/add" element={<AddPenjualanSapiUtuhPage />} />
              <Route path="/rph/penjualan-sapi-utuh/detail/:pid" element={<DetailPenjualanSapiUtuhPage />} />
              <Route path="/rph/penjualan-sapi-utuh/edit/:pid" element={<AddPenjualanSapiUtuhPage />} />
              <Route path="/rph/penjualan-sapi-utuh/return/:pid" element={<ReturnPenjualanPage />} />
              <Route path="/rph/penjualan-sapi-utuh/return-history" element={<ReturnHistoryPage />} />
              <Route path="/rph/penjualan-boning" element={<PenjualanBoningPage />} />
              <Route path="/rph/penjualan-boning/add" element={<PenjualanBoningPage />} />
              <Route path="/rph/penjualan-boning/edit/:pid" element={<PenjualanBoningPage />} />
              <Route path="/rph/penjualan-karkas" element={<PenjualanKarkasPage />} />
              <Route path="/rph/penjualan-karkas/add" element={<PenjualanKarkasPage />} />
              <Route path="/rph/penjualan-karkas/edit/:pid" element={<PenjualanKarkasPage />} />
              <Route path="/rph/penjualan-kulit" element={<PenjualanKulitPage />} />
              <Route path="/rph/penjualan-kulit/add" element={<PenjualanKulitPage />} />
              <Route path="/rph/penjualan-kulit/edit/:pid" element={<PenjualanKulitPage />} />

              {/* RPH Keuangan Routes */}
              <Route path="/rph/keuangan/penerimaan" element={<PenerimaanRphPage />} />
              <Route path="/rph/keuangan/penerimaan/bayar/:pid" element={<BayarPage />} />
              <Route path="/rph/keuangan/pengeluaran" element={<PengeluaranRphPage />} />
              <Route path="/rph/keuangan/pengeluaran/bayar/:pid" element={<BayarPengeluaranPage />} />

              {/* RPH Penjualan Sapi Utuh Pengiriman Route */}
              <Route path="/rph/penjualan-sapi-utuh/pengiriman/:pid" element={<PengirimanPage />} />

              {/* RPH Penawaran Routes */}
              <Route path="/rph/penawaran" element={<PenawaranPage />} />
              <Route path="/rph/penawaran/add" element={<AddEditPenawaranPage />} />
              <Route path="/rph/penawaran/edit/:pid" element={<AddEditPenawaranPage />} />
              <Route path="/rph/penawaran/detail/:pid" element={<DetailPenawaranPage />} />

              {/* RPH Qurban Routes */}
              <Route path="/rph/stok-sapi-qurban" element={<StokSapiQurbanPage />} />
              <Route path="/rph/stok-doka" element={<StokDokaPage />} />

              {/* RPH Perpindahan Ternak Route */}
              <Route path="/rph/perpindahan-ternak" element={<PerpindahanTernakPage />} />
              <Route path="/rph/perpindahan-ternak/tambah" element={<AddEditPerpindahanTernakPage />} />
              <Route path="/rph/perpindahan-ternak/edit/:pid" element={<AddEditPerpindahanTernakPage />} />

              {/* HO Feedmil and OVK Routes */}
              <Route path="/ho/pembelian-feedmil" element={<PembelianFeedmilPage />} />
              <Route path="/ho/pembelian-feedmil/add" element={<AddEditPembelianFeedmilPage />} />
              <Route path="/ho/pembelian-feedmil/edit/:id" element={<AddEditPembelianFeedmilPage />} />
              <Route path="/ho/pembelian-feedmil/detail/:id" element={<PembelianFeedmilDetailPage />} />
              <Route path="/ho/pembelian-ovk" element={<PembelianOVKPage />} />
              <Route path="/ho/pembelian-ovk/add" element={<AddEditPembelianOVKPage />} />
              <Route path="/ho/pembelian-ovk/edit/:id" element={<AddEditPembelianOVKPage />} />
              <Route path="/ho/pembelian-ovk/detail/:id" element={<PembelianOVKDetailPage />} />
              
              {/* HO Pembelian Kulit Routes */}
              <Route path="/ho/pembelian-kulit" element={<PembelianKulitPage />} />
              <Route path="/ho/pembelian-kulit/add" element={<AddEditPembelianKulitPage />} />
              <Route path="/ho/pembelian-kulit/edit/:id" element={<AddEditPembelianKulitPage />} />
              <Route path="/ho/pembelian-kulit/detail/:id" element={<PembelianKulitDetailPage />} />
              <Route path="/pembelian-kulit" element={<Navigate to="/ho/pembelian-kulit" replace />} />
              <Route path="/pembelian-kulit/add" element={<Navigate to="/ho/pembelian-kulit/add" replace />} />
              <Route path="/pembelian-kulit/edit/:id" element={<Navigate to="/ho/pembelian-kulit/edit/:id" replace />} />
              <Route path="/pembelian-kulit/detail/:id" element={<Navigate to="/ho/pembelian-kulit/detail/:id" replace />} />
            
              {/* HO Pembelian Lain Lain Routes */}
              <Route path="/ho/pembelian-lain-lain" element={<PembelianLainLainPage />} />
              <Route path="/ho/pembelian-lain-lain/add" element={<AddEditPembelianLainLainPage />} />
              <Route path="/ho/pembelian-lain-lain/edit/:id" element={<AddEditPembelianLainLainPage />} />
              <Route path="/ho/pembelian-lain-lain/detail/:id" element={<PembelianLainLainDetailPage />} />
              <Route path="/pembelian-lain-lain" element={<Navigate to="/ho/pembelian-lain-lain" replace />} />
              <Route path="/pembelian-lain-lain/add" element={<Navigate to="/ho/pembelian-lain-lain/add" replace />} />
              <Route path="/pembelian-lain-lain/edit/:id" element={<Navigate to="/ho/pembelian-lain-lain/edit/:id" replace />} />
              <Route path="/pembelian-lain-lain/detail/:id" element={<Navigate to="/ho/pembelian-lain-lain/detail/:id" replace />} />
              <Route path="/ho/pembelian-beban-biaya" element={<PembelianBebanBiayaPage />} />
              <Route path="/ho/pembelian-bahan-pembantu" element={<PembelianBahanPembantuPage />} />

              {/* HO Pengajuan Routes */}
              <Route path="/ho/pengajuan" element={<PengajuanPage />} />
              
              {/* HO Keuangan Routes (unified) */}
              <Route path="/ho/keuangan/pengeluaran" element={<HOKeuanganPage />} />
              <Route path="/ho/keuangan/pengeluaran/bayar/:pid" element={<BayarPengeluaranHoPage />} />
              <Route path="/ho/keuangan/penerimaan" element={<PenerimaanHoPage />} />
              <Route path="/ho/keuangan/penerimaan/bayar/:pid" element={<BayarPenerimaanHoPage />} />
              <Route path="/ho/keuangan-kas/detail/:id" element={<KeuanganKasDetailPage />} />
              <Route path="/ho/keuangan-bank/detail/:id" element={<KeuanganBankDetailPage />} />

              {/* HO Penjualan Routes */}
              <Route path="/ho/penjualan" element={<PenjualanHOPage />} />
              <Route path="/ho/penjualan/add" element={<AddEditPenjualanHOPage />} />
              <Route path="/ho/penjualan/edit" element={<AddEditPenjualanHOPage />} />

              {/* Pembayaran Doka Routes */}
              <Route path="/pembayaran/doka/detail/:id" element={<PembayaranDetailPage />} />

              {/* Pembayaran OVK Routes */}
              <Route path="/pembayaran/ovk/detail/:id" element={<PembayaranOvkDetailPage />} />

              {/* Pembayaran Feedmill Routes */}
              <Route path="/pembayaran/feedmill/detail/:id" element={<PembayaranFeedmillDetailPage />} />

              {/* Pembayaran Kulit Routes */}
              <Route path="/pembayaran/kulit/detail/:id" element={<PembayaranKulitDetailPage />} />

              {/* Pembayaran Lain-Lain Routes */}
              <Route path="/pembayaran/lain-lain/detail/:id" element={<PembayaranLainLainDetailPage />} />
              
              {/* HO Sales Routes - Commented out as files don't exist */}
              {/* <Route path="/ho/penjualan" element={<PenjualanHOPage />} />
              <Route path="/ho/penjualan/add" element={<AddEditPenjualanPage />} />
              <Route path="/ho/penjualan/edit/:id" element={<AddEditPenjualanPage />} />
              <Route path="/ho/penjualan/detail/:id" element={<PenjualanDetailPage />} /> */}
              
              {/* HO Eartag Route */}
              <Route path="/ho/eartag" element={<EartagHoPage />} />

              {/* HO Hutang & Piutang Routes */}
              <Route path="/ho/hutang-vendor" element={<HutangVendorPage />} />
              <Route path="/report/ho/hutang-vendor" element={<HutangVendorPage />} />
              <Route path="/ho/piutang-cabang" element={<PiutangCabangPage />} />
              <Route path="/report/ho/piutang-cabang" element={<PiutangCabangPage />} />

              {/* HO Stok Routes */}
              <Route path="/ho/stok-feedmil" element={<StokFeedmilHoPage />} />
              <Route path="/report/ho/stok-feedmil" element={<StokFeedmilHoPage />} />
              <Route path="/ho/stok-ovk" element={<StokOvkHoPage />} />
              <Route path="/report/ho/stok-ovk" element={<StokOvkHoPage />} />

              {/* HO Bank Deposit Routes */}
              <Route path="/ho/bank-deposit" element={<BankDepositPage />} />

              {/* HO Payment Routes */}
              <Route path="/ho/pembayaran" element={<PaymentHoPage />} />

              {/* HO Penjualan Sapi Routes */}
              <Route path="/ho/penjualan-sapi" element={<PenjualanSapiHOPage />} />
              <Route path="/penjualan-sapi" element={<Navigate to="/ho/penjualan-sapi" replace />} />
              {/* Add and Edit routes removed - handled by modals in the main page */}

              {/* System Routes */}
              <Route path="/system/permission-management" element={<PermissionManagementPage />} />
              <Route path="/system/roles" element={<RolePage />} />
              <Route path="/system/users" element={<UsersPage />} />
              <Route path="/system/menu-management" element={<MenuManagementPage />} />
              <Route path="/system/manual-job" element={<ManualJobPage />} />

              {/* Legacy redirect: keuangan/pengeluaran → /ho/keuangan/pengeluaran */}
              <Route path="/keuangan/pengeluaran" element={<Navigate to="/ho/keuangan/pengeluaran" replace />} />
              <Route path="/keuangan-pengeluaran" element={<Navigate to="/ho/keuangan/pengeluaran" replace />} />
              <Route path="/keuangan/penerimaan" element={<Navigate to="/ho/keuangan/penerimaan" replace />} />
              <Route path="/keuangan-penerimaan" element={<Navigate to="/ho/keuangan/penerimaan" replace />} />

              {/* Alias redirect: /pengajuan → /ho/pengajuan */}
              <Route path="/pengajuan" element={<Navigate to="/ho/pengajuan" replace />} />

              {/* Fallback Route */}
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </Suspense>
        </LayoutSecure>
      </ProtectedRouteSecure>
    </SecurityErrorBoundary>
  );
}

export default AppWrapperSecure;

