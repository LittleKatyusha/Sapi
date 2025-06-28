import React, { useState } from 'react';

// 1. Import komponen layout utama
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// 2. Import semua halaman dari folder 'pages'
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import PurchasePage from './pages/PurchasePage';
import LivestockStockPage from './pages/LivestockStockPage';
import MeatStockPage from './pages/MeatStockPage';
import EmployeePage from './pages/EmployeePage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';

// --- KOMPONEN APLIKASI UTAMA ---
// File ini sekarang menjadi pusat kendali aplikasi
export default function App() {
  // State untuk melacak halaman yang sedang aktif
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // State untuk mengontrol menu samping di tampilan mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fungsi untuk menentukan komponen halaman mana yang akan ditampilkan
  const renderContent = () => {
    switch (currentPage) {
        case 'dashboard':
            return <DashboardPage />;
        case 'penjualan':
            return <SalesPage />;
        case 'pembelian':
            return <PurchasePage />;
        case 'stok_ternak':
            return <LivestockStockPage />;
        case 'stok_daging':
            return <MeatStockPage />;
        case 'laporan':
            return <ReportPage />;
        case 'karyawan':
            return <EmployeePage />;
        case 'pengaturan':
            return <SettingsPage />;
        default:
            // Halaman default jika tidak ada yang cocok
            return <DashboardPage />;
    }
  };

  return (
    <div className="flex bg-gray-100 font-sans h-screen overflow-hidden">
      {/* Menambahkan beberapa style global di sini */}
      <style>{`
        .input-field { background-color: #F9FAFB; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; border-radius: 0.5rem; } 
        .input-field:focus { outline: none; --tw-ring-color: #F87171; box-shadow: 0 0 0 2px var(--tw-ring-color); border-color: #EF4444; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
      
      {/* 3. Render komponen layout utama */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col transition-all duration-300 relative">
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
              {/* 4. Render konten halaman yang aktif */}
              {renderContent()}
          </main>
      </div>
    </div>
  );
}
