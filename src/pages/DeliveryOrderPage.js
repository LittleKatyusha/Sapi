import React, { useState } from 'react';
import { PlusCircle, Printer, Truck, CheckCircle, Clock, X as CloseIcon } from 'lucide-react';

// --- Komponen Lokal ---
const DeliveryStatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    let specificClasses = "";
    let icon = null;
    switch (status) {
        case 'Diterima': 
            specificClasses = 'bg-green-100 text-green-800';
            icon = <CheckCircle size={12} className="mr-1"/>;
            break;
        case 'Dalam Perjalanan': 
            specificClasses = 'bg-blue-100 text-blue-800';
            icon = <Truck size={12} className="mr-1"/>;
            break;
        case 'Disiapkan': 
            specificClasses = 'bg-yellow-100 text-yellow-800';
            icon = <Clock size={12} className="mr-1"/>;
            break;
        default: 
            specificClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`flex items-center justify-center ${baseClasses}`}>{icon}{status}</span>;
};

// --- DATA CONTOH ---
const initialDeliveryOrders = [
    { id: 'SJ-202507-001', type: 'Penjualan', destination: 'Restoran Steak Enak', date: '2025-07-01', status: 'Diterima' },
    { id: 'SJ-202507-002', type: 'Pembelian', destination: 'Peternakan Maju Jaya', date: '2025-07-02', status: 'Dalam Perjalanan' },
    { id: 'SJ-202507-003', type: 'Penjualan', destination: 'Hotel Bintang Lima', date: '2025-07-03', status: 'Disiapkan' },
];

// --- KOMPONEN UTAMA HALAMAN ---
const DeliveryOrderPage = () => {
    const [orders, setOrders] = useState(initialDeliveryOrders);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Data Surat Jalan</h2>
                <button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    <PlusCircle size={20} className="mr-2"/> Buat Surat Jalan
                </button>
            </div>

            {/* Tampilan Tabel untuk Desktop */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-max text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 whitespace-nowrap">ID Surat Jalan</th>
                            <th className="px-6 py-3 whitespace-nowrap">Tujuan</th>
                            <th className="px-6 py-3 whitespace-nowrap">Tanggal</th>
                            <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                            <th className="px-6 py-3 text-center whitespace-nowrap">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-red-600">{order.id}</td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-800">{order.destination}</div>
                                    <div className="text-xs text-gray-500">{order.type}</div>
                                </td>
                                <td className="px-6 py-4">{order.date}</td>
                                <td className="px-6 py-4 text-center"><DeliveryStatusBadge status={order.status} /></td>
                                <td className="px-6 py-4 text-center">
                                    <button className="p-2 text-blue-600 hover:text-blue-800" title="Cetak Surat Jalan"><Printer size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tampilan Kartu untuk Mobile */}
            <div className="md:hidden space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-gray-50 p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-red-600 text-sm">{order.id}</p>
                                <p className="text-gray-800">{order.destination}</p>
                                <p className="text-xs text-gray-500">{order.type}</p>
                            </div>
                            <button className="p-2 text-blue-600" title="Cetak"><Printer size={20}/></button>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <p className="text-xs text-gray-500">{order.date}</p>
                            <DeliveryStatusBadge status={order.status} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeliveryOrderPage;
