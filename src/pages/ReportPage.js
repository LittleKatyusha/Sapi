import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Download, Filter, Award, UserCheck, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
    { name: 'Warung Sate Pak Budi', total: 28500000 },
    { name: 'Ibu Rumah Tangga', total: 12000000 },
];

// Data baru untuk laporan piutang
const customerDebtData = [
    { name: 'Catering Berkah', debt: 32000000, lastTransaction: '2025-06-25' },
    { name: 'Hotel Bintang Lima', debt: 5000000, lastTransaction: '2025-06-25' },
    { name: 'Warung Sate Pak Budi', debt: 2500000, lastTransaction: '2025-06-22' },
    { name: 'Pelanggan Baru', debt: 750000, lastTransaction: '2025-06-28' },
    { name: 'Toko Daging Jaya', debt: 1200000, lastTransaction: '2025-06-15' },
];

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <span className="text-sm text-gray-700">
                Halaman <span className="font-semibold">{currentPage}</span> dari <span className="font-semibold">{totalPages}</span>
            </span>
            <div className="flex space-x-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16}/>
                </button>
                 <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <ChevronRight size={16}/>
                </button>
            </div>
        </div>
    );
};


const ReportPage = () => {
    const [debtPage, setDebtPage] = useState(1);
    const [topCustomerPage, setTopCustomerPage] = useState(1);
    const itemsPerPage = 4;

    // Menghitung total piutang
    const totalDebt = customerDebtData.reduce((acc, customer) => acc + customer.debt, 0);

    // Logika Paging untuk Laporan Piutang
    const indexOfLastDebt = debtPage * itemsPerPage;
    const indexOfFirstDebt = indexOfLastDebt - itemsPerPage;
    const currentDebtData = customerDebtData.slice(indexOfFirstDebt, indexOfLastDebt);

    // Logika Paging untuk Pelanggan Terbaik
    const indexOfLastTopCustomer = topCustomerPage * itemsPerPage;
    const indexOfFirstTopCustomer = indexOfLastTopCustomer - itemsPerPage;
    const currentTopCustomers = topCustomersData.slice(indexOfFirstTopCustomer, indexOfLastTopCustomer);

    return (
        <div className="space-y-6">
            {/* Header dan Filter */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Pusat Laporan</h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <input type="date" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" defaultValue="2025-01-01"/>
                            <span className="text-gray-500 font-medium">-</span>
                            <input type="date" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" defaultValue="2025-06-28"/>
                        </div>
                        <button className="flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <Filter size={20} className="mr-2"/> Terapkan
                        </button>
                    </div>
                </div>
                 {/* Ringkasan Keuangan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-700">Total Penjualan</p>
                        <p className="text-2xl font-bold text-red-900">Rp 689 Jt</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">Total Pembelian</p>
                        <p className="text-2xl font-bold text-blue-900">Rp 455 Jt</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-700">Total Piutang</p>
                        <p className="text-2xl font-bold text-yellow-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact', compactDisplay: 'short' }).format(totalDebt)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">Perkiraan Laba</p>
                        <p className="text-2xl font-bold text-green-900">Rp 234 Jt</p>
                    </div>
                </div>
            </div>
            
            {/* Laporan Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {/* Laporan Piutang Pelanggan */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-700 flex items-center"><AlertCircle className="mr-2 text-red-500"/>Laporan Piutang Pelanggan</h3>
                        <button className="text-sm flex items-center text-gray-600 hover:text-red-600"><Download size={16} className="mr-1"/> Unduh</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Nama Pelanggan</th>
                                    <th className="px-6 py-3 text-right">Jumlah Hutang</th>
                                    <th className="px-6 py-3 text-center">Transaksi Terakhir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentDebtData.map((customer, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-800">{customer.name}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(customer.debt)}</td>
                                        <td className="px-6 py-4 text-center text-gray-500">{customer.lastTransaction}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={customerDebtData.length} itemsPerPage={itemsPerPage} currentPage={debtPage} onPageChange={setDebtPage} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Grafik Produk Terlaris */}
                <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-700 flex items-center"><Award className="mr-2 text-red-500"/>Produk Terlaris</h3>
                        <button className="text-sm flex items-center text-gray-600 hover:text-red-600"><Download size={16} className="mr-1"/> Unduh</button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" unit="kg" tick={{fill: '#6b7280', fontSize: 12}} />
                            <YAxis type="category" dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} width={90} dx={-5} />
                            <Tooltip cursor={{fill: '#fef2f2'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem'}}/>
                            <Bar dataKey="sold" name="Terjual" fill="#ef4444" radius={[0, 4, 4, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Laporan Pelanggan Terbaik */}
                 <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-700 flex items-center"><UserCheck className="mr-2 text-red-500"/>Pelanggan Terbaik</h3>
                        <button className="text-sm flex items-center text-gray-600 hover:text-red-600"><Download size={16} className="mr-1"/> Unduh</button>
                    </div>
                     <div className="space-y-3">
                        {currentTopCustomers.map((customer, index) => (
                             <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                <div className="flex items-center">
                                    <span className="font-bold text-gray-500 w-8">{(indexOfFirstTopCustomer + index + 1)}.</span>
                                    <p className="text-gray-800 font-semibold">{customer.name}</p>
                                </div>
                                <p className="font-semibold text-red-600 text-sm">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact', compactDisplay: 'short' }).format(customer.total)}</p>
                             </div>
                        ))}
                    </div>
                    <Pagination totalItems={topCustomersData.length} itemsPerPage={itemsPerPage} currentPage={topCustomerPage} onPageChange={setTopCustomerPage} />
                </div>
            </div>
        </div>
    );
};

export default ReportPage;
