import React, { useState } from 'react';

// Import komponen layout utama
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Import semua halaman dari folder 'pages'
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import PurchasePage from './pages/PurchasePage';
import LivestockStockPage from './pages/LivestockStockPage';
import MeatStockPage from './pages/MeatStockPage';
import EmployeePage from './pages/EmployeePage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';
import AttendancePage from './pages/AttendancePage';
import LeaveRequestPage from './pages/LeaveRequestPage';
import DeliveryOrderPage from './pages/DeliveryOrderPage'; // <-- IMPORT HALAMAN BARU

// --- KOMPONEN APLIKASI UTAMA ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (currentPage) {
        case 'dashboard': return <DashboardPage />;
        case 'penjualan': return <SalesPage />;
        case 'pembelian': return <PurchasePage />;
        case 'stok_ternak': return <LivestockStockPage />;
        case 'stok_daging': return <MeatStockPage />;
        case 'surat_jalan': return <DeliveryOrderPage />; // <-- TAMBAHKAN CASE BARU
        case 'laporan': return <ReportPage />;
        case 'karyawan': return <EmployeePage />;
        case 'absensi': return <AttendancePage />;
        case 'pengajuan_cuti': return <LeaveRequestPage />;
        case 'pengaturan': return <SettingsPage />;
        default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex bg-gray-100 font-sans h-screen overflow-hidden">
      <style>{`
        .input-field { background-color: #F9FAFB; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; border-radius: 0.5rem; } 
        .input-field:focus { outline: none; --tw-ring-color: #F87171; box-shadow: 0 0 0 2px var(--tw-ring-color); border-color: #EF4444; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
      
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col transition-all duration-300 relative">
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
              {renderContent()}
          </main>
      </div>
    </div>
  );
}
