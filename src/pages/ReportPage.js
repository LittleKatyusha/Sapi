import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, TrendingUp, UserCheck, Award, Filter, DollarSign, ShoppingCart } from 'lucide-react';

// Data untuk halaman ini
const topProductsData = [
    { name: 'Daging Giling', sold: 150.2 },
    { name: 'Karkas Sapi', sold: 120.0 },
    { name: 'Daging Sirloin', sold: 95.5 },
    { name: 'Iga Sapi', sold: 65.0 },
    { name: 'Daging Ribeye', sold: 45.8 },
];

const topCustomersData = [
    { name: 'Restoran Steak Enak', total: 55000000 },
    { name: 'Supermarket Segar', total: 42500000 },
    { name: 'Hotel Bintang Lima', total: 38000000 },
    { name: 'Catering Berkah', total: 32000000 },
];

const ReportPage = () => (
    <div className="space-y-6">
        {/* Header dan Filter */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Pusat Laporan</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <input type="date" className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" defaultValue="2025-01-01"/>
                        <span className="text-gray-500 font-medium">-</span>
                        <input type="date" className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" defaultValue="2025-06-28"/>
                    </div>
                    <button className="flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                        <Filter size={20} className="mr-2"/> Terapkan
                    </button>
                </div>
            </div>
             {/* Ringkasan Keuangan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-700">Total Penjualan</p>
                    <p className="text-2xl font-bold text-red-900">Rp 689 Jt</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">Total Pembelian</p>
                    <p className="text-2xl font-bold text-blue-900">Rp 455 Jt</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-700">Perkiraan Laba</p>
                    <p className="text-2xl font-bold text-green-900">Rp 234 Jt</p>
                </div>
            </div>
        </div>
        
        {/* Laporan Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Grafik Produk Terlaris */}
            <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700 flex items-center"><Award className="mr-2 text-red-500"/>Produk Terlaris (berdasarkan berat)</h3>
                    <button className="text-sm flex items-center text-gray-600 hover:text-red-600"><Download size={16} className="mr-1"/> Unduh Grafik</button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" unit="kg" tick={{fill: '#6b7280', fontSize: 12}} />
                        <YAxis type="category" dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} width={100} />
                        <Tooltip cursor={{fill: '#fef2f2'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem'}}/>
                        <Legend wrapperStyle={{paddingTop: '10px'}}/>
                        <Bar dataKey="sold" name="Terjual" fill="#ef4444" radius={[0, 4, 4, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Laporan Pelanggan Terbaik */}
             <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700 flex items-center"><UserCheck className="mr-2 text-red-500"/>Pelanggan Terbaik</h3>
                    <button className="text-sm flex items-center text-gray-600 hover:text-red-600"><Download size={16} className="mr-1"/> Unduh Daftar</button>
                </div>
                 <div className="space-y-4">
                    {topCustomersData.map((customer, index) => (
                         <div key={index} className="flex items-center text-sm border-b pb-2 last:border-b-0">
                            <span className="font-bold text-gray-500 w-8">{index + 1}.</span>
                            <div className="flex-1">
                                <p className="text-gray-800 font-semibold">{customer.name}</p>
                                <p className="font-semibold text-red-600 text-xs">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(customer.total)}</p>
                            </div>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default ReportPage;
