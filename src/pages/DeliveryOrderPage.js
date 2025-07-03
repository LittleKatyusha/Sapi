import React, { useState } from 'react';
import { PlusCircle, Printer, Truck, CheckCircle, Clock, XCircle, MoreVertical, Eye, Edit, Trash2, X as CloseIcon } from 'lucide-react';

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
    { id: 'SJ-202507-001', type: 'Penjualan', destination: 'Restoran Steak Enak', date: '2025-07-01', status: 'Diterima', items: '20kg Daging Sirloin, 15kg Ribeye' },
    { id: 'SJ-202507-002', type: 'Pembelian', destination: 'Peternakan Maju Jaya', date: '2025-07-02', status: 'Dalam Perjalanan', items: '5 Ekor Sapi Brahman' },
    { id: 'SJ-202507-003', type: 'Penjualan', destination: 'Hotel Bintang Lima', date: '2025-07-03', status: 'Disiapkan', items: '50kg Daging Giling' },
];

// --- Modal untuk Form Surat Jalan ---
const AddDeliveryOrderModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Buat Surat Jalan Baru</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat Jalan</label><select className="w-full input-field"><option>Penjualan</option><option>Pembelian</option></select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" className="w-full input-field"/></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tujuan (Pelanggan/Pemasok)</label><input type="text" placeholder="Nama tujuan" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Tujuan</label><textarea rows="2" placeholder="Alamat lengkap tujuan" className="w-full input-field"></textarea></div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Kendaraan (No. Polisi)</label><input type="text" placeholder="B 1234 ABC" className="w-full input-field"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Sopir</label><input type="text" placeholder="Nama pengemudi" className="w-full input-field"/></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Detail Barang</label><textarea rows="3" placeholder="Contoh: 5 Ekor Sapi Limousin, 20kg Daging Sirloin..." className="w-full input-field"></textarea></div>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button>
                            <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan & Cetak</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN UTAMA HALAMAN ---
const DeliveryOrderPage = () => {
    const [orders, setOrders] = useState(initialDeliveryOrders);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Data Surat Jalan</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <PlusCircle size={20} className="mr-2"/> Buat Surat Jalan
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">ID Surat Jalan</th>
                                <th className="px-6 py-3 whitespace-nowrap">Tujuan</th>
                                <th className="px-6 py-3 hidden md:table-cell whitespace-nowrap">Tanggal</th>
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
                                    <td className="px-6 py-4 hidden md:table-cell">{order.date}</td>
                                    <td className="px-6 py-4 text-center"><DeliveryStatusBadge status={order.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="p-2 text-blue-600 hover:text-blue-800" title="Cetak Surat Jalan">
                                            <Printer size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <AddDeliveryOrderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </>
    );
};

export default DeliveryOrderPage;
