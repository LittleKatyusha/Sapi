import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LayoutSecure from './components/LayoutSecure';
import ProtectedRouteSecure from './components/ProtectedRouteSecure';
import { securityAudit } from './utils/security';

// Import halaman authentication yang sudah enhanced
import LoginPageSecure from './pages/LoginPageSecure';

// Import semua halaman
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/operations/SalesPage';
import PurchasePage from './pages/operations/PurchasePage';
import LivestockStockPage from './pages/inventory/LivestockStockPage';
import MeatStockPage from './pages/inventory/MeatStockPage';
import EmployeePage from './pages/humanResources/EmployeePage';
import ReportPage from './pages/reporting/ReportPage';
import SettingsPageSecure from './pages/SettingsPageSecure'; // Enhanced settings
import AttendancePage from './pages/humanResources/AttendancePage';
import LeaveRequestPage from './pages/humanResources/LeaveRequestPage';
import DeliveryOrderPage from './pages/operations/DeliveryOrderPage.jsx'; // Fixed import path

// Data Master
import KandangOfficePage from './pages/dataMaster/KandangOfficePage';
import JenisHewanPage from './pages/dataMaster/JenisHewanPage';
import KlasifikasiHewanPage from './pages/dataMaster/KlasifikasiHewanPage';
import SupplierPage from './pages/dataMaster/SupplierPage';
import PelangganPage from './pages/dataMaster/PelangganPage';
import OutletPage from './pages/dataMaster/OutletPage';
import ProdukGDSPage from './pages/dataMaster/ProdukGDSPage';
import EartagPage from './pages/dataMaster/EartagPage';

// Boning Pages
import BoningLayout from './pages/boning/BoningLayout';
import KeuanganPage from './pages/boning/KeuanganPage';
import PembelianPage from './pages/boning/PembelianPage';
import PenjualanPage from './pages/boning/PenjualanPage';
import StokDagingPage from './pages/boning/StokDagingPage';
import ReturnPage from './pages/boning/ReturnPage';
import SuratJalanPage from './pages/boning/SuratJalanPage';

// System Pages
import RolePage from './pages/system/RolePage';
import PermissionPage from './pages/system/PermissionPageNew';
import UsersPage from './pages/system/UsersPage';
import ParametersPage from './pages/system/ParametersPage';

// HO Pages
import PembelianHOPage from './pages/ho/pembelian/PembelianHOPage';
import PembelianDetailPage from './pages/ho/pembelian/PembelianDetailPage';
import AddEditPembelianPage from './pages/ho/pembelian/AddEditPembelianPage';
import DistribusiPage from './pages/ho/pembelian/DistribusiPage';
import PenjualanHOPage from './pages/ho/penjualan/PenjualanHOPage';
import AddEditPenjualanPage from './pages/ho/penjualan/AddEditPenjualanPage';
import PenjualanDetailPage from './pages/ho/penjualan/PenjualanDetailPage';

// Import halaman baru
import PembelianFeedmilPage from './pages/ho/pembelianFeedmil/PembelianFeedmilPage';
import AddEditPembelianFeedmilPage from './pages/ho/pembelianFeedmil/AddEditPembelianFeedmilPage';
import PembelianFeedmilDetailPage from './pages/ho/pembelianFeedmil/PembelianFeedmilDetailPage';
import PembelianOVKPage from './pages/ho/pembelianOVK/PembelianOVKPage';

const AppWrapperSecure = () => (
  <Router>
    <AppSecure />
  </Router>
);

// Peta Judul Halaman dengan struktur baru
const pageTitleMap = {
  '/login': 'Secure Login',
  '/dashboard': 'Dashboard Aman',
  '/sales': 'Penjualan',
  '/purchases': 'Pembelian',
  '/delivery-orders': 'Surat Jalan',
  '/inventory/livestock': 'Stok Ternak',
  '/inventory/meat': 'Stok Daging',
  '/master-data/kandang-office': 'Data Master: Kandang & Office',
  '/master-data/jenis-hewan': 'Data Master: Jenis Hewan',
  '/master-data/klasifikasi-hewan': 'Data Master: Klasifikasi Hewan',
  '/master-data/supplier': 'Data Master: Supplier',
  '/master-data/pelanggan': 'Data Master: Pelanggan',
  '/master-data/outlet': 'Data Master: Outlet',
  '/master-data/produk-gds': 'Data Master: Produk Gudang',
  '/master-data/eartag': 'Data Master: Eartag',
  '/ho/pembelian': 'Head Office: Pembelian',
  '/ho/pembelian/add': 'Head Office: Tambah Pembelian',
  '/ho/pembelian/edit/:id': 'Head Office: Edit Pembelian',
  '/ho/pembelian/detail/:id': 'Head Office: Detail Pembelian',
  '/ho/distribusi/:id': 'Head Office: Distribusi Ternak',
  '/ho/penjualan': 'Head Office: Penjualan',
  '/ho/penjualan/add': 'Head Office: Tambah Penjualan',
  '/ho/penjualan/edit/:id': 'Head Office: Edit Penjualan',
  '/ho/penjualan/detail/:id': 'Head Office: Detail Penjualan',
  '/boning/keuangan': 'Boning: Keuangan',
  '/boning/pembelian': 'Boning: Pembelian',
  '/boning/penjualan': 'Boning: Penjualan',
  '/boning/stok-daging': 'Boning: Stok Daging',
  '/boning/return': 'Boning: Return',
  '/boning/surat-jalan': 'Boning: Surat Jalan',
  '/system/role': 'System: Role Management',
  '/system/permission': 'System: Permission Management',
  '/system/users': 'System: User Management',
  '/system/parameters': 'System: Parameter Management',
  '/reports': 'Laporan',
  '/hr/employees': 'Data Karyawan',
  '/hr/attendance': 'Absensi',
  '/hr/leave-requests': 'Pengajuan Cuti',
  '/settings': 'Pengaturan Keamanan',
  '/ho/pembelian-feedmil': 'Head Office: Pembelian Feedmil',
  '/ho/pembelian-feedmil/add': 'Head Office: Tambah Pembelian Feedmil',
  '/ho/pembelian-feedmil/edit/:id': 'Head Office: Edit Pembelian Feedmil',
  '/ho/pembelian-feedmil/detail/:id': 'Head Office: Detail Pembelian Feedmil',
  '/ho/pembelian-ovk': 'Head Office: Pembelian OVK',
};

// Security Error Boundary
class SecurityErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log security-related errors
    securityAudit.log('SECURITY_ERROR_BOUNDARY', {
      error: error.message,
      stack: error.stack,
      errorInfo: JSON.stringify(errorInfo),
      url: window.location.href
    });

    console.error('Security Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4 p-8 bg-red-50 rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-900 mb-4">
              Kesalahan Keamanan
            </h2>
            <p className="text-red-700 mb-6">
              Terjadi kesalahan dalam sistem keamanan. Tim teknis telah diberitahu.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppSecure() {
  const location = useLocation();
  const title = pageTitleMap[location.pathname] || 'Dashboard Aman';
  const isLoginPage = location.pathname === '/login';

  // Debug logging
  useEffect(() => {
    console.log('📍 AppSecure Route Change:', {
      pathname: location.pathname,
      isLoginPage,
      timestamp: new Date().toISOString()
    });
  }, [location.pathname, isLoginPage]);

  // Initialize security pada app startup
  useEffect(() => {
    try {
      // Set up global error handling
      window.addEventListener('error', (event) => {
        // Error handling without logging
      });

      // Set up unhandled promise rejection handling
      window.addEventListener('unhandledrejection', (event) => {
        // Promise rejection handling without logging
      });

      // Monitor for suspicious activities
      let clickCount = 0;
      let lastClickTime = 0;
      
      document.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastClickTime < 100) {
          clickCount++;
          if (clickCount > 10) {
            // Suspicious activity detected without logging
          }
        } else {
          clickCount = 0;
        }
        lastClickTime = now;
      });

      // Monitor for console access (basic detection)
      let devtools = false;
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
          if (!devtools) {
            devtools = true;
            // DevTools detected without logging
          }
        } else {
          devtools = false;
        }
      }, 1000);

      // Disable right-click context menu pada production
      if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENABLE_RIGHT_CLICK !== 'true') {
        document.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });

        // Disable common developer shortcuts
        document.addEventListener('keydown', (e) => {
          // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
          if (e.key === 'F12' || 
              (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
              (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            // Developer shortcut blocked without logging
          }
        });
      }

      // Check for browser security features
      const securityFeatures = {
        localStorage: typeof Storage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        crypto: typeof crypto !== 'undefined',
        webCrypto: typeof crypto?.subtle !== 'undefined',
        geolocation: typeof navigator.geolocation !== 'undefined',
        userMedia: typeof navigator.mediaDevices?.getUserMedia !== 'undefined'
      };

      // Browser security features checked without logging

    } catch (error) {
      // Security init error without logging
    }

    // Cleanup function
    return () => {
      // Application cleanup without logging
    };
  }, []);

  // Monitor route changes untuk security
  useEffect(() => {
    // Route change monitoring without logging
  }, [location.pathname]);

  // Jika halaman login, tampilkan tanpa layout
  if (isLoginPage) {
    console.log('🔐 Rendering login page');
    return (
      <SecurityErrorBoundary>
        <style>{`
          .input-field {
            background-color: #F9FAFB; border: 1px solid #D1D5DB;
            padding: 0.5rem 0.75rem; border-radius: 0.5rem;
            transition: all 0.2s ease-in-out;
          }
          .input-field:focus {
            outline: none; --tw-ring-color: #F87171;
            box-shadow: 0 0 0 2px var(--tw-ring-color);
            border-color: #EF4444;
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
          @keyframes fade-out {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
          .animate-fade-out { animation: fade-out 0.3s ease-in; }
          
          /* Disable text selection pada production untuk keamanan */
          ${process.env.NODE_ENV === 'production' ? `
            * {
              -webkit-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }
            input, textarea {
              -webkit-user-select: text;
              -moz-user-select: text;
              -ms-user-select: text;
              user-select: text;
            }
          ` : ''}
        `}</style>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPageSecure />} />
        </Routes>
      </SecurityErrorBoundary>
    );
  }

  console.log('🛡️ Rendering protected routes');
  return (
    <SecurityErrorBoundary>
      <ProtectedRouteSecure>
        <LayoutSecure title={title}>
          <style>{`
            .input-field {
              background-color: #F9FAFB; border: 1px solid #D1D5DB;
              padding: 0.5rem 0.75rem; border-radius: 0.5rem;
              transition: all 0.2s ease-in-out;
            }
            .input-field:focus {
              outline: none; --tw-ring-color: #F87171;
              box-shadow: 0 0 0 2px var(--tw-ring-color);
              border-color: #EF4444;
            }
            @keyframes fade-in-up {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
            @keyframes fade-out {
              0% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-20px); }
            }
            .animate-fade-out { animation: fade-out 0.3s ease-in; }
            
            /* Security-enhanced styling */
            .security-border {
              border: 2px solid #10B981;
              box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
            }
            
            /* Text selection enabled untuk semua elemen */
            * {
              -webkit-user-select: auto;
              -moz-user-select: auto;
              -ms-user-select: auto;
              user-select: auto;
            }
            
            /* Pastikan input dan textarea tetap bisa di-select */
            input, textarea, [contenteditable] {
              -webkit-user-select: text;
              -moz-user-select: text;
              -ms-user-select: text;
              user-select: text;
            }
          `}</style>

          <Routes>
            {/* Rute Dashboard (setelah login) */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Rute Operasional */}
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/purchases" element={<PurchasePage />} />
            <Route path="/delivery-orders" element={<DeliveryOrderPage />} />
            
            {/* Rute Inventaris */}
            <Route path="/inventory/livestock" element={<LivestockStockPage />} />
            <Route path="/inventory/meat" element={<MeatStockPage />} />
            
            {/* Rute Laporan */}
            <Route path="/reports" element={<ReportPage />} />

            {/* Rute SDM */}
            <Route path="/hr/employees" element={<EmployeePage />} />
            <Route path="/hr/attendance" element={<AttendancePage />} />
            <Route path="/hr/leave-requests" element={<LeaveRequestPage />} />

            {/* Rute Pengaturan - Enhanced Security */}
            <Route path="/settings" element={<SettingsPageSecure />} />

            {/* Rute Data Master */}
            <Route path="/master-data/kandang-office" element={<KandangOfficePage />} />
            <Route path="/master-data/jenis-hewan" element={<JenisHewanPage />} />
            <Route path="/master-data/klasifikasi-hewan" element={<KlasifikasiHewanPage />} />
            <Route path="/master-data/supplier" element={<SupplierPage />} />
            <Route path="/master-data/pelanggan" element={<PelangganPage />} />
            <Route path="/master-data/outlet" element={<OutletPage />} />
            <Route path="/master-data/produk-gds" element={<ProdukGDSPage />} />
            <Route path="/master-data/eartag" element={<EartagPage />} />

            {/* Rute Boning */}
            <Route path="/boning/*" element={<BoningLayout />}>
              <Route path="keuangan" element={<KeuanganPage />} />
              <Route path="pembelian" element={<PembelianPage />} />
              <Route path="penjualan" element={<PenjualanPage />} />
              <Route path="stok-daging" element={<StokDagingPage />} />
              <Route path="return" element={<ReturnPage />} />
              <Route path="surat-jalan" element={<SuratJalanPage />} />
            </Route>

            {/* Rute HO (Head Office) */}
            <Route path="/ho/pembelian" element={<PembelianHOPage />} />
            <Route path="/ho/pembelian/add" element={<AddEditPembelianPage />} />
            <Route path="/ho/pembelian/edit/:id" element={<AddEditPembelianPage />} />
            <Route path="/ho/pembelian/detail/:id" element={<PembelianDetailPage />} />
            <Route path="/ho/distribusi/:id" element={<DistribusiPage />} />
            
            {/* Routes baru untuk Pembelian Feedmil dan OVK */}
            <Route path="/ho/pembelian-feedmil" element={<PembelianFeedmilPage />} />
            <Route path="/ho/pembelian-feedmil/add" element={<AddEditPembelianFeedmilPage />} />
            <Route path="/ho/pembelian-feedmil/edit/:id" element={<AddEditPembelianFeedmilPage />} />
            <Route path="/ho/pembelian-feedmil/detail/:id" element={<PembelianFeedmilDetailPage />} />
            <Route path="/ho/pembelian-ovk" element={<PembelianOVKPage />} />
            
            <Route path="/ho/penjualan" element={<PenjualanHOPage />} />
            <Route path="/ho/penjualan/add" element={<AddEditPenjualanPage />} />
            <Route path="/ho/penjualan/edit/:id" element={<AddEditPenjualanPage />} />
            <Route path="/ho/penjualan/detail/:id" element={<PenjualanDetailPage />} />

            {/* Rute System */}
            <Route path="/system/role" element={<RolePage />} />
            <Route path="/system/permission" element={<PermissionPage />} />
            <Route path="/system/users" element={<UsersPage />} />
            <Route path="/system/parameters" element={<ParametersPage />} />

            {/* Rute Fallback */}
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </LayoutSecure>
      </ProtectedRouteSecure>
    </SecurityErrorBoundary>
  );
}

export default AppWrapperSecure;