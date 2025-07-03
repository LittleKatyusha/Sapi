import React from 'react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    DollarSign, 
    Warehouse, 
    Beef, 
    FileText, 
    Settings, 
    Users, 
    X, 
    CalendarCheck, 
    Truck 
} from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'penjualan', label: 'Penjualan', icon: DollarSign },
        { id: 'pembelian', label: 'Pembelian', icon: ShoppingCart },
        { id: 'stok_ternak', label: 'Stok Ternak', icon: Warehouse },
        { id: 'stok_daging', label: 'Stok Daging', icon: Beef },
        { id: 'surat_jalan', label: 'Surat Jalan', icon: Truck },
        { id: 'laporan', label: 'Laporan', icon: FileText },
        { id: 'karyawan', label: 'Data Karyawan', icon: Users },
        { id: 'absensi', label: 'Absensi', icon: CalendarCheck },
        { id: 'pengajuan_cuti', label: 'Pengajuan Cuti', icon: FileText },
    ];
    
    const handleNavigate = (page) => {
        setCurrentPage(page);
        if (window.innerWidth < 768) { setIsSidebarOpen(false); }
    };
    
    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
            
            {/* Mengembalikan warna latar belakang ke merah */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-red-800 text-white flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Bagian Header/Logo */}
                <div className="p-6 h-[6.5rem] flex justify-between items-center border-b border-red-700">
                    <span className="text-2xl font-bold text-white">CV <span className="font-extrabold">PuputBersaudara</span></span>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 rounded-full text-white hover:bg-red-700">
                        <X size={20} />
                    </button>
                </div>
                
                {/* PERUBAHAN: Menambahkan kelas untuk styling scrollbar */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-900">
                    {navItems.map(item => {
                        const isActive = currentPage === item.id;
                        return (
                            <a 
                               key={item.id} 
                               href="#" 
                               onClick={(e) => {e.preventDefault(); handleNavigate(item.id)}} 
                               className={`flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                                   isActive 
                                   ? 'bg-red-700' 
                                   : 'hover:bg-red-700'
                               }`}
                            >
                                <item.icon className="mr-3" size={20} /> 
                                <span className="font-medium">{item.label}</span>
                            </a>
                        );
                    })}
                </nav>
                
                {/* Link Pengaturan di bagian bawah */}
                <div className="p-4 border-t border-red-700">
                   <a 
                      href="#" 
                      onClick={(e) => {e.preventDefault(); handleNavigate('pengaturan')}}
                      className={`flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                          currentPage === 'pengaturan' 
                          ? 'bg-red-700' 
                          : 'hover:bg-red-700'
                      }`}
                   >
                    <Settings className="mr-3" size={20} /> 
                    <span className="font-medium">Pengaturan</span>
                  </a>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
