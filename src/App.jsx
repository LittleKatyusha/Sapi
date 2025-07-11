// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

// Import semua halaman
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/operations/SalesPage';
import PurchasePage from './pages/operations/PurchasePage';
import LivestockStockPage from './pages/inventory/LivestockStockPage';
import MeatStockPage from './pages/inventory/MeatStockPage';
import EmployeePage from './pages/humanResources/EmployeePage';
import ReportPage from './pages/reporting/ReportPage';
import SettingsPage from './pages/SettingsPage';
import AttendancePage from './pages/humanResources/AttendancePage';
import LeaveRequestPage from './pages/humanResources/LeaveRequestPage';
import DeliveryOrderPage from './pages/operations/DeliveryOrderPage';

// Data Master
import KandangOfficePage from './pages/dataMaster/KandangOfficePage';
import JenisHewanPage from './pages/dataMaster/JenisHewanPage';
import KlasifikasiHewanPage from './pages/dataMaster/KlasifikasiHewanPage';
import SupplierPage from './pages/dataMaster/SupplierPage';
import PelangganPage from './pages/dataMaster/PelangganPage';
import OutletPage from './pages/dataMaster/OutletPage';
import ProdukGDSPage from './pages/dataMaster/ProdukGDSPage';
import EartagPage from './pages/dataMaster/EartagPage';

const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

// Peta Judul Halaman dengan struktur baru
const pageTitleMap = {
    '/dashboard': 'Dashboard',
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
    '/reports': 'Laporan',
    '/hr/employees': 'Data Karyawan',
    '/hr/attendance': 'Absensi',
    '/hr/leave-requests': 'Pengajuan Cuti',
    '/settings': 'Pengaturan',
};

function App() {
    const location = useLocation();
    const title = pageTitleMap[location.pathname] || 'Dashboard';

    return (
        <Layout title={title}>
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
            `}</style>

            <Routes>
                {/* Rute Utama */}
                <Route path="/" element={<DashboardPage />} />
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

                {/* Rute Pengaturan */}
                <Route path="/settings" element={<SettingsPage />} />

                {/* Rute Data Master */}
                <Route path="/master-data/kandang-office" element={<KandangOfficePage />} />
                <Route path="/master-data/jenis-hewan" element={<JenisHewanPage />} />
                <Route path="/master-data/klasifikasi-hewan" element={<KlasifikasiHewanPage />} />
                <Route path="/master-data/supplier" element={<SupplierPage />} />
                <Route path="/master-data/pelanggan" element={<PelangganPage />} />
                <Route path="/master-data/outlet" element={<OutletPage />} />
                <Route path="/master-data/produk-gds" element={<ProdukGDSPage />} />
                <Route path="/master-data/eartag" element={<EartagPage />} />

                {/* Rute Fallback */}
                <Route path="*" element={<DashboardPage />} />
            </Routes>
        </Layout>
    );
}

export default AppWrapper;
