import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
    LayoutDashboard, ShoppingCart, DollarSign, Warehouse, Beef, FileText, Settings,
    Users, X, CalendarCheck, Truck, Home, List, Store, Package, Tag, ChevronDown, Menu
} from 'lucide-react';
// MobileBottomNav import is removed as it's no longer used.

// --- Konfigurasi Menu (Struktur Baru yang Profesional) ---
const menuConfig = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { id: 'sales', label: 'Penjualan', icon: DollarSign, to: '/sales' },
    { id: 'purchases', label: 'Pembelian', icon: ShoppingCart, to: '/purchases' },
    { id: 'delivery-orders', label: 'Surat Jalan', icon: Truck, to: '/delivery-orders' },
    { 
        id: 'inventory', 
        label: 'Inventaris', 
        icon: Warehouse,
        items: [
            { id: 'inventory/livestock', label: 'Stok Ternak', icon: Warehouse, to: '/inventory/livestock' },
            { id: 'inventory/meat', label: 'Stok Daging', icon: Beef, to: '/inventory/meat' },
        ]
    },
    { 
        id: 'master-data', 
        label: 'Data Master', 
        icon: List,
        items: [
            { id: 'master-data/kandang-office', label: 'Kandang/Office', icon: Home, to: '/master-data/kandang-office' },
            { id: 'master-data/jenis-hewan', label: 'Jenis Hewan', icon: List, to: '/master-data/jenis-hewan' },
            { id: 'master-data/klasifikasi-hewan', label: 'Klasifikasi Hewan', icon: Beef, to: '/master-data/klasifikasi-hewan' },
            { id: 'master-data/supplier', label: 'Supplier', icon: Truck, to: '/master-data/supplier' },
            { id: 'master-data/pelanggan', label: 'Pelanggan', icon: Users, to: '/master-data/pelanggan' },
            { id: 'master-data/outlet', label: 'Outlet', icon: Store, to: '/master-data/outlet' },
            { id: 'master-data/produk-gds', label: 'Produk GDS', icon: Package, to: '/master-data/produk-gds' },
            { id: 'master-data/eartag', label: 'Eartag', icon: Tag, to: '/master-data/eartag' },
        ]
    },
    { id: 'reports', label: 'Laporan', icon: FileText, to: '/reports' },
    { 
        id: 'hr', 
        label: 'Sumber Daya Manusia', 
        icon: Users,
        items: [
            { id: 'hr/employees', label: 'Data Karyawan', icon: Users, to: '/hr/employees' },
            { id: 'hr/attendance', label: 'Absensi', icon: CalendarCheck, to: '/hr/attendance' },
            { id: 'hr/leave-requests', label: 'Pengajuan Cuti', icon: FileText, to: '/hr/leave-requests' },
        ]
    },
];


// --- Komponen Internal untuk Navigasi ---

const SidebarLink = ({ item, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === item.to;

    return (
        <Link
            to={item.to}
            onClick={onClick}
            className={`flex items-center p-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                ? 'bg-red-900 text-white shadow-inner'
                : 'text-red-200 hover:bg-red-700/50'
            }`}
        >
            <item.icon className="mr-3 flex-shrink-0" size={20} />
            <span className="flex-1 text-left">{item.label}</span>
        </Link>
    );
};

const SidebarAccordion = ({ item, onClick }) => {
    const location = useLocation();
    const isChildActive = item.items.some(child => location.pathname.startsWith(child.to));
    const [isOpen, setIsOpen] = useState(isChildActive);

    useEffect(() => {
        if (isChildActive) {
            setIsOpen(true);
        }
    }, [isChildActive]);

    return (
        <div>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                    isChildActive ? 'text-white' : 'text-red-200 hover:bg-red-700/50'
                }`}
            >
                <div className="flex items-center">
                    <item.icon className="mr-3 flex-shrink-0" size={20} />
                    <span className="flex-1 text-left">{item.label}</span>
                </div>
                <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] mt-1' : 'max-h-0'}`}>
                <div className="pl-7 space-y-1 border-l border-red-700 ml-4 py-1">
                    {item.items.map(child => (
                        <SidebarLink key={child.id} item={child} onClick={onClick} />
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Komponen Layout Utama ---

const Layout = ({ children, title = "Dashboard" }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCloseSidebar = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden ${
                    isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            />

            <aside
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-screen w-64 bg-red-800 text-white flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="p-5 border-b border-red-700/50">
                    <div className="flex items-center mb-6">
                        <h1 className="text-xl font-bold tracking-tight">
                           CV Puput<span className="text-red-300">Bersaudara</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <img 
                           src="https://placehold.co/40x40/FFD5D5/B91C1C?text=A" 
                           alt="Admin User" 
                           className="w-10 h-10 rounded-full border-2 border-red-600"
                        />
                        <div>
                            <p className="font-semibold text-sm">Admin User</p>
                            <p className="text-xs text-red-300">Administrator</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-900/50">
                    <div className="space-y-2">
                        {menuConfig.map(item => (
                            item.items 
                                ? <SidebarAccordion key={item.id} item={item} onClick={handleCloseSidebar} />
                                : <SidebarLink key={item.id} item={item} onClick={handleCloseSidebar} />
                        ))}
                    </div>
                </nav>

                <div className="p-3 border-t border-red-700/50">
                    <SidebarLink item={{ id: 'settings', label: 'Pengaturan', icon: Settings, to: '/settings' }} onClick={handleCloseSidebar} />
                </div>
            </aside>

            <div className="flex-1 flex flex-col md:ml-64">
                <header className="bg-white shadow-sm sticky top-0 z-20">
                    <div className="px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100"
                                aria-label="Toggle menu"
                            >
                                <Menu size={24} />
                            </button>
                            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                        </div>
                    </div>
                </header>

                {/* PERUBAHAN DI SINI: padding-bottom (pb) disesuaikan */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-6">
                    {children}
                </main>
                
                {/* PERUBAHAN DI SINI: MobileBottomNav dihapus */}
            </div>
        </div>
    );
};

export default Layout;
