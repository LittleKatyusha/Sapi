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

// Lazy load components for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
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
const SupplierPage = lazy(() => import('./pages/dataMaster/SupplierPage'));
const PelangganPage = lazy(() => import('./pages/dataMaster/PelangganPage'));
const OutletPage = lazy(() => import('./pages/dataMaster/OutletPage'));
const ProdukGDSPage = lazy(() => import('./pages/dataMaster/ProdukGDSPage'));
const EartagPage = lazy(() => import('./pages/dataMaster/EartagPage'));

// Boning Pages - Lazy loaded
const BoningLayout = lazy(() => import('./pages/boning/BoningLayout'));
const KeuanganPage = lazy(() => import('./pages/boning/KeuanganPage'));
const PembelianPage = lazy(() => import('./pages/boning/PembelianPage'));
const PenjualanPage = lazy(() => import('./pages/boning/PenjualanPage'));
const StokDagingPage = lazy(() => import('./pages/boning/StokDagingPage'));
const ReturnPage = lazy(() => import('./pages/boning/ReturnPage'));
const SuratJalanPage = lazy(() => import('./pages/boning/SuratJalanPage'));

// System Pages - Removed

// HO Pages - Lazy loaded
const PembelianHOPage = lazy(() => import('./pages/ho/pembelian/PembelianHOPage'));
const PembelianDetailPage = lazy(() => import('./pages/ho/pembelian/PembelianDetailPage'));
const AddEditPembelianPage = lazy(() => import('./pages/ho/pembelian/AddEditPembelianPage'));
const PenjualanHOPage = lazy(() => import('./pages/ho/penjualan/PenjualanHOPage'));
const AddEditPenjualanPage = lazy(() => import('./pages/ho/penjualan/AddEditPenjualanPage'));
const PenjualanDetailPage = lazy(() => import('./pages/ho/penjualan/PenjualanDetailPage'));

// Reporting Pages - Lazy loaded
const LaporanNotaSupplierPage = lazy(() => import('./pages/reporting/LaporanNotaSupplierPage'));
const LaporanSemuaSupplierPage = lazy(() => import('./pages/reporting/LaporanSemuaSupplierPage'));
const LaporanPajakPage = lazy(() => import('./pages/reporting/LaporanPajakPage'));

// New HO Pages - Lazy loaded
const PembelianFeedmilPage = lazy(() => import('./pages/ho/pembelianFeedmil/PembelianFeedmilPage'));
const AddEditPembelianFeedmilPage = lazy(() => import('./pages/ho/pembelianFeedmil/AddEditPembelianFeedmilPage'));
const PembelianFeedmilDetailPage = lazy(() => import('./pages/ho/pembelianFeedmil/PembelianFeedmilDetailPage'));
const PembelianOVKPage = lazy(() => import('./pages/ho/pembelianOVK/PembelianOVKPage'));
const AddEditPembelianOVKPage = lazy(() => import('./pages/ho/pembelianOVK/addEditPembelianOVK'));
const PembelianOVKDetailPage = lazy(() => import('./pages/ho/pembelianOVK/PembelianOVKDetailPage'));

const AppWrapperSecure = () => (
  <Router>
    <AppSecure />
  </Router>
);

function AppSecure() {
  const location = useLocation();
  const title = pageTitleMap[location.pathname] || 'Dashboard Aman';
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
              <Route path="/master-data/supplier" element={<SupplierPage />} />
              <Route path="/master-data/pelanggan" element={<PelangganPage />} />
              <Route path="/master-data/outlet" element={<OutletPage />} />
              <Route path="/master-data/produk-gds" element={<ProdukGDSPage />} />
              <Route path="/master-data/eartag" element={<EartagPage />} />

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
              
              {/* HO Feedmil and OVK Routes */}
              <Route path="/ho/pembelian-feedmil" element={<PembelianFeedmilPage />} />
              <Route path="/ho/pembelian-feedmil/add" element={<AddEditPembelianFeedmilPage />} />
              <Route path="/ho/pembelian-feedmil/edit/:id" element={<AddEditPembelianFeedmilPage />} />
              <Route path="/ho/pembelian-feedmil/detail/:id" element={<PembelianFeedmilDetailPage />} />
              <Route path="/ho/pembelian-ovk" element={<PembelianOVKPage />} />
              <Route path="/ho/pembelian-ovk/add" element={<AddEditPembelianOVKPage />} />
              <Route path="/ho/pembelian-ovk/edit/:id" element={<AddEditPembelianOVKPage />} />
              <Route path="/ho/pembelian-ovk/detail/:id" element={<PembelianOVKDetailPage />} />
              
              {/* HO Sales Routes */}
              <Route path="/ho/penjualan" element={<PenjualanHOPage />} />
              <Route path="/ho/penjualan/add" element={<AddEditPenjualanPage />} />
              <Route path="/ho/penjualan/edit/:id" element={<AddEditPenjualanPage />} />
              <Route path="/ho/penjualan/detail/:id" element={<PenjualanDetailPage />} />

              {/* System Routes - Removed */}

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
