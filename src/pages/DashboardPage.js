import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShoppingCart, DollarSign, Warehouse, Beef } from 'lucide-react';

// Mengimpor komponen StatCard dari folder components
import StatCard from '../components/StatCard';

// --- DATA KHUSUS UNTUK HALAMAN INI ---
const salesData = [
  { name: 'Jan', penjualan: 400, pembelian: 240 }, { name: 'Feb', penjualan: 300, pembelian: 139 },
  { name: 'Mar', penjualan: 200, pembelian: 980 }, { name: 'Apr', penjualan: 278, pembelian: 390 },
  { name: 'Mei', penjualan: 189, pembelian: 480 }, { name: 'Jun', penjualan: 239, pembelian: 380 },
  { name: 'Jul', penjualan: 349, pembelian: 430 },
];

// --- KOMPONEN UTAMA HALAMAN ---
const DashboardPage = () => (
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
                <LineChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} stroke="#d1d5db"/>
                    <YAxis tick={{fill: '#6b7280', fontSize: 12}} stroke="#d1d5db" />
                    <Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem' }}/>
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                    <Line type="monotone" dataKey="penjualan" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 8 }} name="Penjualan" />
                    <Line type="monotone" dataKey="pembelian" stroke="#10b981" strokeWidth={2} name="Pembelian"/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    </>
);

export default DashboardPage;
