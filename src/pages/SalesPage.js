import React, { useState, useMemo } from 'react';
import { PlusCircle, Eye, Edit, Trash2, X, MoreVertical, AlertTriangle, ChevronLeft, ChevronRight, Printer, Filter, RotateCcw } from 'lucide-react';

// --- Komponen Lokal ---
const PaymentStatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    let specificClasses = "";
    switch (status) {
        case 'Lunas': specificClasses = 'bg-green-100 text-green-800'; break;
        case 'Kurang Bayar': specificClasses = 'bg-yellow-100 text-yellow-800'; break;
        case 'Hutang': specificClasses = 'bg-red-100 text-red-800'; break;
        default: specificClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// --- DATA CONTOH ---
const initialSalesData = [
    { id: 'TXN-S-7402', customer: 'Restoran Steak Enak', date: '2025-06-26', item: 'Daging Sirloin', total: 7500000, amountPaid: 7500000, type: 'Olahan', paymentStatus: 'Lunas' },
    { id: 'TXN-S-7400', customer: 'Hotel Bintang Lima', date: '2025-06-25', item: 'Daging Ribeye', total: 15000000, amountPaid: 10000000, type: 'Olahan', paymentStatus: 'Kurang Bayar' },
    { id: 'TXN-S-7399', customer: 'Catering Berkah', date: '2025-06-25', item: '1 Ekor Sapi Limousin', total: 32000000, amountPaid: 0, type: 'Hidup', paymentStatus: 'Hutang' },
    { id: 'TXN-S-7397', customer: 'Supermarket Segar', date: '2025-06-24', item: 'Karkas Sapi', total: 12500000, amountPaid: 12500000, type: 'Potong', paymentStatus: 'Lunas' },
    { id: 'TXN-S-7395', customer: 'Ibu Rumah Tangga', date: '2025-06-23', item: 'Iga Sapi', total: 2500000, amountPaid: 2500000, type: 'Olahan', paymentStatus: 'Lunas' },
    { id: 'TXN-S-7394', customer: 'Warung Sate Pak Budi', date: '2025-06-22', item: 'Daging Has Dalam', total: 4500000, amountPaid: 2000000, type: 'Olahan', paymentStatus: 'Kurang Bayar' },
];

// --- Modal-modal ---
const AddEditSalesModal = ({ isOpen, onClose, sale }) => {
    if (!isOpen) return null;
    const isEditMode = !!sale;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan</label><input type="text" defaultValue={isEditMode ? sale.customer : ''} placeholder="Nama Pelanggan" className="w-full input-field"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label><input type="date" defaultValue={isEditMode ? sale.date : ''} className="w-full input-field"/></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe Penjualan</label><select defaultValue={isEditMode ? sale.type : 'Olahan'} className="w-full input-field"><option>Hidup</option><option>Potong</option><option>Olahan</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Detail Item</label><textarea rows="2" defaultValue={isEditMode ? sale.item : ''} placeholder="Contoh: 1 Ekor Sapi Limousin, 20kg Daging Sirloin..." className="w-full input-field"></textarea></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Harga Jual (Rp)</label><input type="number" defaultValue={isEditMode ? sale.total : ''} placeholder="32000000" className="w-full input-field"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dibayar (Rp)</label><input type="number" defaultValue={isEditMode ? sale.amountPaid : ''} placeholder="0" className="w-full input-field"/></div>
                        </div>
                        <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">{isEditMode ? 'Simpan Perubahan' : 'Simpan Transaksi'}</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const SalesDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Detail Transaksi Penjualan</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">ID Transaksi</span><span className="font-mono text-gray-800">{item.id}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Pelanggan</span><span className="text-gray-800">{item.customer}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Tanggal</span><span className="text-gray-800">{item.date}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Item</span><span className="text-gray-800">{item.item}</span></div>
                    <hr/>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Total Harga</span><span className="font-semibold text-gray-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.total)}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Dibayar</span><span className="font-semibold text-green-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.amountPaid)}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Sisa Hutang</span><span className="font-semibold text-red-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.total - item.amountPaid)}</span></div>
                    <hr/>
                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">Status</span><PaymentStatusBadge status={item.paymentStatus} /></div>
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
                <h2 className="text-xl font-bold text-gray-800">Hapus Transaksi?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus transaksi <strong className="font-mono">{item.id}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
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
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Filter Penjualan</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 space-y-4">
                    <div><label className="text-sm font-medium text-gray-700">Pelanggan</label><input type="text" name="customer" value={localFilters.customer} onChange={handleInputChange} placeholder="Cari nama pelanggan..." className="w-full mt-1 input-field"/></div>
                    <div><label className="text-sm font-medium text-gray-700">Status Pembayaran</label><select name="paymentStatus" value={localFilters.paymentStatus} onChange={handleInputChange} className="w-full mt-1 input-field"><option>Semua</option><option>Lunas</option><option>Kurang Bayar</option><option>Hutang</option></select></div>
                    <div><label className="text-sm font-medium text-gray-700">Tipe Penjualan</label><select name="type" value={localFilters.type} onChange={handleInputChange} className="w-full mt-1 input-field"><option>Semua</option><option>Hidup</option><option>Potong</option><option>Olahan</option></select></div>
                    <div><label className="text-sm font-medium text-gray-700">Tanggal Transaksi</label><div className="flex items-center mt-1"><input type="date" name="startDate" value={localFilters.startDate} onChange={handleInputChange} className="w-full input-field"/><span className="mx-2">-</span><input type="date" name="endDate" value={localFilters.endDate} onChange={handleInputChange} className="w-full input-field"/></div></div>
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

// --- Komponen Utama Halaman ---
const SalesPage = () => {
    const [sales, setSales] = useState(initialSalesData);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [filters, setFilters] = useState({
        paymentStatus: 'Semua', type: 'Semua', customer: '', startDate: '', endDate: ''
    });

    const resetFilters = () => {
        setFilters({ paymentStatus: 'Semua', type: 'Semua', customer: '', startDate: '', endDate: '' });
        setCurrentPage(1);
    };

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if (startDate) startDate.setHours(0,0,0,0);
            if (endDate) endDate.setHours(23,59,59,999);

            return (
                (filters.paymentStatus === 'Semua' || sale.paymentStatus === filters.paymentStatus) &&
                (filters.type === 'Semua' || sale.type === filters.type) &&
                (sale.customer.toLowerCase().includes(filters.customer.toLowerCase())) &&
                (!startDate || saleDate >= startDate) &&
                (!endDate || saleDate <= endDate)
            );
        });
    }, [sales, filters]);

    const handleConfirmDelete = () => {
        console.log("Deleting item:", itemToDelete.id);
        setItemToDelete(null);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    
    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Penjualan</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"><Filter size={16} className="mr-2"/> Filter</button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Penjualan</button>
                    </div>
                </div>
                
                {/* Tampilan Tabel untuk Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Pelanggan</th>
                                <th className="px-6 py-3 whitespace-nowrap">Tipe</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Harga Jual</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Dibayar</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Sisa Hutang</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Status Bayar</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentSales.map(sale => {
                                const debt = sale.total - sale.amountPaid;
                                return (
                                <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4"><div className="font-semibold text-gray-800">{sale.customer}</div><div className="text-xs text-gray-500">{sale.date}</div></td>
                                    <td className="px-6 py-4">{sale.type}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sale.total)}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-green-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sale.amountPaid)}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-red-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(debt)}</td>
                                    <td className="px-6 py-4 text-center"><PaymentStatusBadge status={sale.paymentStatus} /></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="relative flex justify-center">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === sale.id ? null : sale.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                                                <MoreVertical size={18}/>
                                            </button>
                                            {openActionMenuId === sale.id && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                                    <button onClick={() => {setItemToView(sale); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14} className="mr-2"/> Lihat Detail</button>
                                                    <button onClick={() => {alert('Mencetak kwitansi...'); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Printer size={14} className="mr-2"/> Cetak Kwitansi</button>
                                                    <button onClick={() => {setItemToEdit(sale); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14} className="mr-2"/> Edit Data</button>
                                                    <button onClick={() => {setItemToDelete(sale); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14} className="mr-2"/> Hapus Data</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {/* Tampilan Kartu untuk Mobile */}
                <div className="md:hidden space-y-4">
                    {currentSales.map(sale => {
                        const debt = sale.total - sale.amountPaid;
                        return (
                        <div key={sale.id} className="bg-gray-50 p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{sale.customer}</p>
                                    <p className="text-xs text-gray-500">{sale.date} &bull; {sale.type}</p>
                                </div>
                                <PaymentStatusBadge status={sale.paymentStatus} />
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-500">Total Harga</p>
                                    <p className="font-semibold text-gray-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sale.total)}</p>
                                </div>
                                {debt > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs text-red-600">Sisa Hutang</p>
                                        <p className="font-bold text-red-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(debt)}</p>
                                    </div>
                                )}
                            </div>
                             <div className="mt-3 flex gap-2">
                                <button onClick={() => setItemToView(sale)} className="w-full flex-1 text-sm bg-gray-200 py-1.5 rounded-md flex items-center justify-center"><Eye size={14} className="mr-2"/> Detail</button>
                                <button onClick={() => alert('Mencetak kwitansi...')} className="w-full flex-1 text-sm bg-gray-200 py-1.5 rounded-md flex items-center justify-center"><Printer size={14} className="mr-2"/> Cetak</button>
                                <button onClick={() => setItemToEdit(sale)} className="w-full flex-1 text-sm bg-gray-600 text-white py-1.5 rounded-md flex items-center justify-center"><Edit size={14} className="mr-2"/> Edit</button>
                            </div>
                        </div>
                    )})}
                </div>

                <Pagination totalItems={filteredSales.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={handlePageChange} />
            </div>
            
            <AddEditSalesModal isOpen={isAddModalOpen || !!itemToEdit} sale={itemToEdit} onClose={() => {setIsAddModalOpen(false); setItemToEdit(null)}} />
            <SalesDetailModal item={itemToView} onClose={() => setItemToView(null)} />
            <DeleteConfirmationModal item={itemToDelete} onCancel={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={filters} onApplyFilters={setFilters} />
        </>
    );
};

export default SalesPage;
