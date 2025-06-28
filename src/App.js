import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Bell, Search, ChevronDown, LayoutDashboard, ShoppingCart, DollarSign, Warehouse, Beef, FileText, Settings, PlusCircle, Filter, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Download, TrendingUp, UserCheck, Award, User, Building, Lock, Upload, Menu, X } from 'lucide-react';

// --- MOCK DATA LENGKAP ---
const salesData = [
  { name: 'Jan', penjualan: 400, pembelian: 240 }, { name: 'Feb', penjualan: 300, pembelian: 139 },
  { name: 'Mar', penjualan: 200, pembelian: 980 }, { name: 'Apr', penjualan: 278, pembelian: 390 },
  { name: 'Mei', penjualan: 189, pembelian: 480 }, { name: 'Jun', penjualan: 239, pembelian: 380 },
  { name: 'Jul', penjualan: 349, pembelian: 430 },
];

const allSalesData = [
    { id: 'TXN-S-7402', customer: 'Restoran Steak Enak', date: '2025-06-26', item: 'Daging Sirloin', total: 7500000, status: 'Selesai' },
    { id: 'TXN-S-7400', customer: 'Hotel Bintang Lima', date: '2025-06-25', item: 'Daging Ribeye', total: 5950000, status: 'Selesai' },
    { id: 'TXN-S-7399', customer: 'Catering Berkah', date: '2025-06-25', item: 'Karkas Sapi', total: 32000000, status: 'Tertunda' },
    { id: 'TXN-S-7397', customer: 'Supermarket Segar', date: '2025-06-24', item: 'Daging Giling', total: 12500000, status: 'Selesai' },
    { id: 'TXN-S-7395', customer: 'Ibu Rumah Tangga', date: '2025-06-23', item: 'Iga Sapi', total: 2500000, status: 'Dibatalkan' },
];

const allPurchasesData = [
    { id: 'TXN-P-8812', supplier: 'Peternakan Maju Jaya', date: '2025-06-25', item: '5 Ekor Sapi Brahman', total: 110000000, status: 'Diterima' },
    { id: 'TXN-P-8811', supplier: 'Supplier Pakan Ternak', date: '2025-06-24', item: 'Pakan Konsentrat 1 Ton', total: 8500000, status: 'Diterima' },
    { id: 'TXN-P-8810', supplier: 'Peternakan Sumber Rejeki', date: '2025-06-22', item: '2 Ekor Sapi Limousin', total: 45000000, status: 'Dipesan' },
    { id: 'TXN-P-8809', supplier: 'Distributor Obat Hewan', date: '2025-06-21', item: 'Vitamin Ternak', total: 1500000, status: 'Dibatalkan' },
];

const allLivestockData = [
    { id: 'L-001', breed: 'Limousin', age: '2 tahun', weight: 750, entryDate: '2025-04-15', status: 'Tersedia' },
    { id: 'B-012', breed: 'Brahman', age: '1.5 tahun', weight: 600, entryDate: '2025-05-01', status: 'Tersedia' },
    { id: 'S-005', breed: 'Simental', age: '2.5 tahun', weight: 800, entryDate: '2025-03-20', status: 'Terjual' },
    { id: 'A-003', breed: 'Angus', age: '2 tahun', weight: 720, entryDate: '2025-05-10', status: 'Karantina' },
];

const allMeatStockData = [
    { sku: 'DG-SIR-L001-01', type: 'Sirloin', origin: 'L-001', weight: 25.5, packDate: '2025-06-20', status: 'Tersedia' },
    { sku: 'DG-RIB-S005-01', type: 'Ribeye', origin: 'S-005', weight: 30.0, packDate: '2025-06-18', status: 'Terjual' },
    { sku: 'DG-GIL-B012-01', type: 'Giling', origin: 'B-012', weight: 150.2, packDate: '2025-06-22', status: 'Tersedia' },
];

const topProductsData = [ { name: 'Daging Giling', sold: 150.2 }, { name: 'Karkas Sapi', sold: 120.0 }, { name: 'Daging Sirloin', sold: 95.5 }, { name: 'Iga Sapi', sold: 65.0 }, { name: 'Daging Ribeye', sold: 45.8 },];
const topCustomersData = [ { name: 'Restoran Steak Enak', total: 55000000 }, { name: 'Supermarket Segar', total: 42500000 }, { name: 'Hotel Bintang Lima', total: 38000000 }, { name: 'Catering Berkah', total: 32000000 },];

// --- KOMPONEN UTILITAS ---
const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    let specificClasses = "";
    switch (status.toLowerCase()) {
        case 'selesai': case 'diterima': case 'tersedia': specificClasses = 'bg-green-100 text-green-800'; break;
        case 'tertunda': specificClasses = 'bg-yellow-100 text-yellow-800'; break;
        case 'dipesan': specificClasses = 'bg-blue-100 text-blue-800'; break;
        case 'beku': specificClasses = 'bg-sky-100 text-sky-800'; break;
        case 'karantina': specificClasses = 'bg-purple-100 text-purple-800'; break;
        case 'dibatalkan': case 'kadaluarsa': specificClasses = 'bg-red-100 text-red-800'; break;
        case 'terjual': specificClasses = 'bg-gray-500 text-white'; break;
        default: specificClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// --- KOMPONEN UTAMA (RESPONSIVE) ---
const Sidebar = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'penjualan', label: 'Penjualan', icon: DollarSign },
        { id: 'pembelian', label: 'Pembelian', icon: ShoppingCart }, { id: 'stok_ternak', label: 'Stok Ternak', icon: Warehouse },
        { id: 'stok_daging', label: 'Stok Daging', icon: Beef }, { id: 'laporan', label: 'Laporan', icon: FileText },
    ];
    
    // Function to handle navigation and close sidebar on mobile
    const handleNavigate = (page) => {
        setCurrentPage(page);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };
    
    return (
        <>
            {/* Overlay for mobile */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
            
            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-red-800 text-white flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 text-xl font-bold text-center border-b border-red-700 flex justify-between items-center">
                    <span>CV <span className="font-extrabold">PuputBersaudara</span></span>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 rounded-full hover:bg-red-700">
                        <X size={20} />
                    </button>
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

const Header = ({ onMenuClick }) => (
    <header className="bg-white p-4 flex justify-between items-center rounded-xl shadow-md mb-6">
        <div className="flex items-center">
            {/* Hamburger menu button for mobile */}
            <button onClick={onMenuClick} className="md:hidden mr-4 p-2 rounded-md hover:bg-gray-100">
                <Menu size={24} className="text-gray-600"/>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Manajemen Aplikasi</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Cari..." className="pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 w-32 md:w-64"/>
          </div>
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell size={22} className="text-gray-600"/>
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <div className="flex items-center space-x-2 cursor-pointer">
            <img src="https://placehold.co/40x40/E2E8F0/4A5568?text=A" alt="Avatar" className="w-10 h-10 rounded-full"/>
            <div className="hidden md:block">
              <p className="font-semibold text-sm">Budi Santoso</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
    </header>
);

const StatCard = ({ icon, title, value, change }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
    <div className="bg-red-100 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {change && <p className={`text-xs ${change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>}
    </div>
  </div>
);

// --- SEMUA KONTEN HALAMAN (RESPONSIVE) ---

const DashboardContent = () => (
    <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard icon={<DollarSign size={24} className="text-red-500"/>} title="Penjualan (Bulan Ini)" value="Rp 345 Jt" change="+12%"/>
          <StatCard icon={<ShoppingCart size={24} className="text-red-500"/>} title="Pembelian (Bulan Ini)" value="Rp 243 Jt" change="+5%"/>
          <StatCard icon={<Warehouse size={24} className="text-red-500"/>} title="Jumlah Ternak" value="152 Ekor" change="+5 ekor"/>
          <StatCard icon={<Beef size={24} className="text-red-500"/>} title="Stok Daging" value="1.2 Ton" change="-50 kg"/>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
             <h3 className="font-bold text-lg text-gray-700 mb-4">Grafik Penjualan & Pembelian</h3>
             <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} stroke="#d1d5db"/><YAxis tick={{fill: '#6b7280', fontSize: 12}} stroke="#d1d5db" /><Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem' }}/><Legend wrapperStyle={{fontSize: "14px"}}/><Line type="monotone" dataKey="penjualan" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 8 }} name="Penjualan" /><Line type="monotone" dataKey="pembelian" stroke="#10b981" strokeWidth={2} name="Pembelian"/></LineChart>
            </ResponsiveContainer>
        </div>
    </>
);

const SalesPage = () => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4"><h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Penjualan</h2><button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Penjualan</button></div>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-600"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">ID Transaksi</th><th className="px-6 py-3">Pelanggan</th><th className="px-6 py-3 hidden md:table-cell">Tanggal</th><th className="px-6 py-3 text-right">Total</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Aksi</th></tr></thead><tbody>{allSalesData.map(sale => (<tr key={sale.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-red-600">{sale.id}</td><td className="px-6 py-4">{sale.customer}</td><td className="px-6 py-4 hidden md:table-cell">{sale.date}</td><td className="px-6 py-4 text-right font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(sale.total)}</td><td className="px-6 py-4 text-center"><StatusBadge status={sale.status} /></td><td className="px-6 py-4 flex justify-center space-x-2"><button className="p-1 text-blue-600 hover:text-blue-800"><Eye size={18}/></button><button className="p-1 text-green-600 hover:text-green-800"><Edit size={18}/></button><button className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
    </div>
);

const PurchasePage = () => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4"><h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Pembelian</h2><button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Pembelian</button></div>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-600"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">ID Transaksi</th><th className="px-6 py-3">Pemasok</th><th className="px-6 py-3 hidden md:table-cell">Tanggal</th><th className="px-6 py-3 text-right">Total</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Aksi</th></tr></thead><tbody>{allPurchasesData.map(purchase => (<tr key={purchase.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-red-600">{purchase.id}</td><td className="px-6 py-4">{purchase.supplier}</td><td className="px-6 py-4 hidden md:table-cell">{purchase.date}</td><td className="px-6 py-4 text-right font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(purchase.total)}</td><td className="px-6 py-4 text-center"><StatusBadge status={purchase.status} /></td><td className="px-6 py-4 flex justify-center space-x-2"><button className="p-1 text-blue-600 hover:text-blue-800"><Eye size={18}/></button><button className="p-1 text-green-600 hover:text-green-800"><Edit size={18}/></button><button className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
    </div>
);

const LivestockStockPage = () => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4"><h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Stok Ternak</h2><button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Ternak</button></div>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-600"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">ID Ternak</th><th className="px-6 py-3">Jenis</th><th className="px-6 py-3 hidden md:table-cell text-right">Bobot (kg)</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Aksi</th></tr></thead><tbody>{allLivestockData.map(cow => (<tr key={cow.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-red-600">{cow.id}</td><td className="px-6 py-4">{cow.breed}</td><td className="px-6 py-4 hidden md:table-cell text-right">{cow.weight} kg</td><td className="px-6 py-4 text-center"><StatusBadge status={cow.status} /></td><td className="px-6 py-4 flex justify-center space-x-2"><button className="p-1 text-blue-600 hover:text-blue-800" title="Lihat Detail"><Eye size={18}/></button><button className="p-1 text-green-600 hover:text-green-800" title="Edit Data"><Edit size={18}/></button><button className="p-1 text-red-600 hover:text-red-800" title="Hapus Data"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
    </div>
);

const MeatStockPage = () => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4"><h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Stok Daging</h2><button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Stok</button></div>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-600"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Jenis</th><th className="px-6 py-3 hidden md:table-cell text-right">Bobot (kg)</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Aksi</th></tr></thead><tbody>{allMeatStockData.map(meat => (<tr key={meat.sku} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-red-600">{meat.sku}</td><td className="px-6 py-4">{meat.type}</td><td className="px-6 py-4 hidden md:table-cell text-right">{meat.weight.toFixed(1)} kg</td><td className="px-6 py-4 text-center"><StatusBadge status={meat.status} /></td><td className="px-6 py-4 flex justify-center space-x-2"><button className="p-1 text-blue-600 hover:text-blue-800" title="Lihat Detail"><Eye size={18}/></button><button className="p-1 text-green-600 hover:text-green-800" title="Edit Data"><Edit size={18}/></button><button className="p-1 text-red-600 hover:text-red-800" title="Hapus Data"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
    </div>
);

const ReportPage = () => (
    <div className="space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4"><h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Pusat Laporan</h2><button className="flex items-center text-sm bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"><Download size={16} className="mr-2"/> Unduh Laporan Lengkap</button></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"><div className="bg-red-50 p-4 rounded-lg"><p className="text-sm text-red-700">Total Penjualan</p><p className="text-2xl font-bold text-red-900">Rp 689 Jt</p></div><div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-700">Total Pembelian</p><p className="text-2xl font-bold text-blue-900">Rp 455 Jt</p></div><div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-700">Perkiraan Laba</p><p className="text-2xl font-bold text-green-900">Rp 234 Jt</p></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-md"><h3 className="text-lg font-bold text-gray-700 flex items-center mb-4"><Award className="mr-2 text-red-500"/>Produk Terlaris</h3><ResponsiveContainer width="100%" height={300}><BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" unit="kg" tick={{fill: '#6b7280', fontSize: 12}} /><YAxis type="category" dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} width={90} dx={-5} /><Tooltip cursor={{fill: '#fef2f2'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem'}}/><Bar dataKey="sold" name="Terjual" fill="#ef4444" radius={[0, 4, 4, 0]}/></BarChart></ResponsiveContainer></div>
            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-md"><h3 className="text-lg font-bold text-gray-700 flex items-center mb-4"><UserCheck className="mr-2 text-red-500"/>Pelanggan Terbaik</h3><div className="space-y-4">{topCustomersData.map((customer, index) => ( <div key={index} className="flex items-center text-sm border-b pb-2 last:border-b-0"><span className="font-bold text-gray-500 w-8">{index + 1}.</span><div className="flex-1"><p className="text-gray-800 font-semibold">{customer.name}</p><p className="font-semibold text-red-600 text-xs">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(customer.total)}</p></div></div>))}</div></div>
        </div>
    </div>
);

const SettingsPage = () => (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md"><h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center"><User className="mr-3 text-red-500"/> Profil Pengguna</h2><div className="flex flex-col md:flex-row items-center gap-6 md:gap-8"><div className="flex-shrink-0 text-center"><img src="https://placehold.co/120x120/EFEFEF/4A5568?text=Foto" alt="Foto Profil" className="w-32 h-32 rounded-full object-cover ring-4 ring-red-100"/><button className="w-full mt-3 text-sm text-red-600 hover:underline flex items-center justify-center"><Upload size={14} className="mr-1"/> Ganti Foto</button></div><div className="flex-1 w-full space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" defaultValue="Budi Santoso" className="mt-1 block w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label><input type="email" defaultValue="budi.santoso@example.com" className="mt-1 block w-full input-field"/></div></div><div className="pt-2"><button className="text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors"><Lock size={16} className="mr-2"/>Ubah Kata Sandi</button></div></div></div></div>
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md"><h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center"><Building className="mr-3 text-red-500"/> Informasi Perusahaan</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label><input type="text" defaultValue="CV PuputBersaudara" className="mt-1 block w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label><input type="text" defaultValue="0812-3456-7890" className="mt-1 block w-full input-field"/></div><div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea rows="3" className="mt-1 block w-full input-field" defaultValue="Jl. Raya Peternakan No. 12, Jakarta Timur, Indonesia"></textarea></div></div></div>
        <div className="flex justify-end pt-4"><button className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors shadow-lg transform hover:scale-105">Simpan Perubahan</button></div>
    </div>
);

// --- KOMPONEN APLIKASI UTAMA (RESPONSIVE) ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (currentPage) {
        case 'dashboard': return <DashboardContent />;
        case 'penjualan': return <SalesPage />;
        case 'pembelian': return <PurchasePage />;
        case 'stok_ternak': return <LivestockStockPage />;
        case 'stok_daging': return <MeatStockPage />;
        case 'laporan': return <ReportPage />;
        case 'pengaturan': return <SettingsPage />;
        default: return <DashboardContent />;
    }
  };

  return (
    <div className="flex bg-gray-100 font-sans h-screen overflow-hidden">
      <style>{`.input-field { background-color: #F9FAFB; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; border-radius: 0.5rem; } .input-field:focus { outline: none; --tw-ring-color: #F87171; box-shadow: 0 0 0 2px var(--tw-ring-color); border-color: #EF4444; }`}</style>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col transition-all duration-300 relative overflow-y-auto">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6">
              {renderContent()}
          </main>
      </div>
    </div>
  );
}
