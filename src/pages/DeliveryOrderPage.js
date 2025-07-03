import React, { useState, useMemo } from 'react';
import { PlusCircle, Printer, Truck, CheckCircle, Clock, X as CloseIcon, MoreVertical, Eye, Edit, Trash2, AlertTriangle, Home, ShieldQuestion, ShieldCheck, PackageCheck, ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-react';

// --- Komponen Lokal ---
const DeliveryStatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    let specificClasses = "";
    let icon = null;
    switch (status) {
        case 'Selesai': 
            specificClasses = 'bg-green-100 text-green-800';
            icon = <PackageCheck size={12} className="mr-1"/>;
            break;
        case 'Dalam Pengantaran': 
            specificClasses = 'bg-blue-100 text-blue-800';
            icon = <Truck size={12} className="mr-1"/>;
            break;
        case 'Disetujui': 
            specificClasses = 'bg-cyan-100 text-cyan-800';
            icon = <ShieldCheck size={12} className="mr-1"/>;
            break;
        case 'Menunggu Persetujuan': 
            specificClasses = 'bg-yellow-100 text-yellow-800';
            icon = <ShieldQuestion size={12} className="mr-1"/>;
            break;
        default: 
            specificClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`flex items-center justify-center ${baseClasses} ${specificClasses}`}>{icon}{status}</span>;
};

// --- DATA CONTOH ---
const initialDeliveryOrders = [
    { id: 'SJ-202507-001', type: 'Penjualan', origin: 'Gudang Pusat', destination: 'Restoran Steak Enak', date: '2025-07-01', completionDate: '2025-07-02', status: 'Selesai', items: '20kg Daging Sirloin, 15kg Ribeye' },
    { id: 'SJ-202507-002', type: 'Antar Kandang', origin: 'Kandang A', destination: 'Kandang C (Karantina)', date: '2025-07-02', completionDate: null, status: 'Dalam Pengantaran', items: '1 Ekor Sapi Angus (A-004)' },
    { id: 'SJ-202507-003', type: 'Pembelian', origin: 'Peternakan Maju Jaya', destination: 'Gudang Pusat', date: '2025-07-02', completionDate: null, status: 'Disetujui', items: '5 Ekor Sapi Brahman' },
    { id: 'SJ-202507-004', type: 'Penjualan', origin: 'Gudang Pusat', destination: 'Hotel Bintang Lima', date: '2025-07-03', completionDate: null, status: 'Menunggu Persetujuan', items: '50kg Daging Giling' },
    { id: 'SJ-202507-005', type: 'Antar Kandang', origin: 'Kandang B', destination: 'Kandang A', date: '2025-07-04', completionDate: null, status: 'Disetujui', items: '2 Ekor Sapi Simental' },
    { id: 'SJ-202507-006', type: 'Penjualan', origin: 'Gudang Pusat', destination: 'Catering Berkah', date: '2025-07-05', completionDate: null, status: 'Menunggu Persetujuan', items: '1 Karkas Sapi Utuh' },
];

// --- Modal-modal ---
const AddEditDeliveryOrderModal = ({ isOpen, onClose, order }) => {
    if (!isOpen) return null;
    const isEditMode = !!order;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Surat Jalan' : 'Buat Surat Jalan Baru'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <form className="space-y-4">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat Jalan</label><select defaultValue={isEditMode ? order.type : 'Penjualan'} className="w-full input-field"><option>Penjualan</option><option>Pembelian</option><option>Antar Kandang</option></select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" defaultValue={isEditMode ? order.date : ''} className="w-full input-field"/></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Asal</label><input type="text" defaultValue={isEditMode ? order.origin : ''} placeholder="Kandang A / Pemasok" className="w-full input-field"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label><input type="text" defaultValue={isEditMode ? order.destination : ''} placeholder="Kandang B / Pelanggan" className="w-full input-field"/></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Detail Barang</label><textarea rows="3" defaultValue={isEditMode ? order.items : ''} placeholder="Contoh: 5 Ekor Sapi Limousin..." className="w-full input-field"></textarea></div>
                        {isEditMode && (
                             <div><label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label><select defaultValue={order.status} className="w-full input-field"><option>Menunggu Persetujuan</option><option>Disetujui</option><option>Dalam Pengantaran</option><option>Selesai</option></select></div>
                        )}
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button>
                            <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">{isEditMode ? 'Simpan Perubahan' : 'Buat Surat Jalan'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const DeliveryOrderDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Detail Surat Jalan</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button>
                </div>
                <div className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">ID Surat Jalan</span><span className="font-mono text-gray-800">{item.id}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Jenis</span><span className="text-gray-800">{item.type}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Tanggal Kirim</span><span className="text-gray-800">{item.date}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Tanggal Sampai</span><span className="text-gray-800 font-semibold">{item.status === 'Selesai' && item.completionDate ? item.completionDate : '-'}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Asal</span><span className="text-gray-800">{item.origin}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Tujuan</span><span className="text-gray-800">{item.destination}</span></div>
                    <hr/>
                    <div><span className="font-semibold text-gray-500">Detail Barang</span><p className="text-gray-800 mt-1 bg-gray-50 p-2 rounded">{item.items}</p></div>
                    <hr/>
                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">Status</span><DeliveryStatusBadge status={item.status} /></div>
                </div>
                 <div className="p-6 border-t text-right"><button type="button" onClick={onClose} className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg">Tutup</button></div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ item, onConfirm, onCancel }) => {
    if (!item) return null;
    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4 relative animate-fade-in-up p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4"><AlertTriangle className="h-8 w-8 text-red-600" /></div>
                <h2 className="text-xl font-bold text-gray-800">Hapus Surat Jalan?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus surat jalan <strong className="font-mono">{item.id}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-center mt-6 space-x-4"><button onClick={onCancel} className="px-8 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Tidak, Batal</button><button onClick={onConfirm} className="px-8 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Ya, Hapus</button></div>
            </div>
        </div>
    );
};

const FilterModal = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
    const [localFilters, setLocalFilters] = useState(currentFilters);
    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Filter Surat Jalan</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button></div>
                <div className="p-6 space-y-4">
                    <div><label className="text-sm font-medium text-gray-700">Asal</label><input type="text" name="origin" value={localFilters.origin} onChange={handleInputChange} placeholder="Cari asal..." className="w-full mt-1 input-field"/></div>
                    <div><label className="text-sm font-medium text-gray-700">Tujuan</label><input type="text" name="destination" value={localFilters.destination} onChange={handleInputChange} placeholder="Cari tujuan..." className="w-full mt-1 input-field"/></div>
                    <div><label className="text-sm font-medium text-gray-700">Status</label><select name="status" value={localFilters.status} onChange={handleInputChange} className="w-full mt-1 input-field"><option>Semua</option><option>Menunggu Persetujuan</option><option>Disetujui</option><option>Dalam Pengantaran</option><option>Selesai</option></select></div>
                    <div><label className="text-sm font-medium text-gray-700">Tanggal</label><div className="flex items-center mt-1"><input type="date" name="startDate" value={localFilters.startDate} onChange={handleInputChange} className="w-full input-field"/><span className="mx-2">-</span><input type="date" name="endDate" value={localFilters.endDate} onChange={handleInputChange} className="w-full input-field"/></div></div>
                    <div className="flex justify-end pt-4 gap-3">
                        <button onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button>
                        <button onClick={handleApply} className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Terapkan Filter</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return ( <div className="flex justify-between items-center mt-6"><span className="text-sm text-gray-700"> Halaman <span className="font-semibold">{currentPage}</span> dari <span className="font-semibold">{totalPages}</span></span><div className="flex space-x-2"><button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16}/></button><button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16}/></button></div></div> );
};

// --- KOMPONEN UTAMA HALAMAN ---
const DeliveryOrderPage = () => {
    const [orders, setOrders] = useState(initialDeliveryOrders);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [filters, setFilters] = useState({
        status: 'Semua', origin: '', destination: '', startDate: '', endDate: '',
    });

    const resetFilters = () => {
        setFilters({ status: 'Semua', origin: '', destination: '', startDate: '', endDate: '' });
        setCurrentPage(1);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const orderDate = new Date(order.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if (startDate) startDate.setHours(0,0,0,0);
            if (endDate) endDate.setHours(23,59,59,999);

            // PERBAIKAN: Menggunakan pengecekan yang lebih aman
            return (
                (filters.status === 'Semua' || order.status === filters.status) &&
                ((order.origin || '').toLowerCase().includes(filters.origin.toLowerCase())) &&
                ((order.destination || '').toLowerCase().includes(filters.destination.toLowerCase())) &&
                (!startDate || orderDate >= startDate) &&
                (!endDate || orderDate <= endDate)
            );
        });
    }, [orders, filters]);

    const handleConfirmDelete = () => {
        setOrders(orders.filter(order => order.id !== itemToDelete.id));
        setItemToDelete(null);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Data Surat Jalan</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"><Filter size={16} className="mr-2"/> Filter</button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Buat Surat Jalan</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">ID Surat Jalan</th>
                                <th className="px-6 py-3 whitespace-nowrap">Rute Pengiriman</th>
                                <th className="px-6 py-3 hidden md:table-cell whitespace-nowrap">Tanggal</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.map(order => (
                                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-red-600">{order.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-600">{order.origin}</span>
                                            <Truck size={14} className="text-gray-400"/>
                                            <span className="font-semibold text-gray-800">{order.destination}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">{order.type}</div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">{order.date}</td>
                                    <td className="px-6 py-4 text-center"><DeliveryStatusBadge status={order.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                         <div className="relative flex justify-center">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === order.id ? null : order.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"><MoreVertical size={18}/></button>
                                            {openActionMenuId === order.id && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                                    <button onClick={() => {setItemToView(order); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14} className="mr-2"/> Lihat Detail</button>
                                                    <button onClick={() => {setItemToEdit(order); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14} className="mr-2"/> Edit Data</button>
                                                    <button onClick={() => {setItemToDelete(order); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14} className="mr-2"/> Hapus Data</button>
                                                    <button onClick={() => {alert('Mencetak...'); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Printer size={14} className="mr-2"/> Cetak</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <Pagination totalItems={filteredOrders.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>
            
            <AddEditDeliveryOrderModal isOpen={isAddModalOpen || !!itemToEdit} order={itemToEdit} onClose={() => {setIsAddModalOpen(false); setItemToEdit(null);}} />
            <DeliveryOrderDetailModal item={itemToView} onClose={() => setItemToView(null)} />
            <DeleteConfirmationModal item={itemToDelete} onCancel={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filters} onApplyFilters={setFilters} />
        </>
    );
};

export default DeliveryOrderPage;
