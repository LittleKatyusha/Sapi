import React from 'react';
import { LayoutDashboard, ShoppingCart, DollarSign, Warehouse, Beef, FileText, Settings, Users, X } from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'penjualan', label: 'Penjualan', icon: DollarSign },
        { id: 'pembelian', label: 'Pembelian', icon: ShoppingCart },
        { id: 'stok_ternak', label: 'Stok Ternak', icon: Warehouse },
        { id: 'stok_daging', label: 'Stok Daging', icon: Beef },
        { id: 'laporan', label: 'Laporan', icon: FileText },
        { id: 'karyawan', label: 'Data Karyawan', icon: Users },
    ];
    
    const handleNavigate = (page) => {
        setCurrentPage(page);
        if (window.innerWidth < 768) { setIsSidebarOpen(false); }
    };
    
    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`fixed top-0 left-0 h-full w-64 bg-red-800 text-white flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 text-xl font-bold text-center border-b border-red-700 flex justify-between items-center">
                    <span>CV <span className="font-extrabold">PuputBersaudara</span></span>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 rounded-full hover:bg-red-700"><X size={20} /></button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (
                        <a key={item.id} href="#" onClick={(e) => {e.preventDefault(); handleNavigate(item.id)}} 
                           className={`flex items-center p-3 rounded-lg transition-colors ${currentPage === item.id ? 'bg-red-700' : 'hover:bg-red-700'}`}>
                            <item.icon className="mr-3" size={20} /> {item.label}
                        </a>
                    ))}
                </nav>
                <div className="p-4 border-t border-red-700">
                   <a href="#" onClick={(e) => {e.preventDefault(); handleNavigate('pengaturan')}}
                      className={`flex items-center p-3 rounded-lg transition-colors ${currentPage === 'pengaturan' ? 'bg-red-700' : 'hover:bg-red-700'}`}>
                    <Settings className="mr-3" size={20} /> Pengaturan
                  </a>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
