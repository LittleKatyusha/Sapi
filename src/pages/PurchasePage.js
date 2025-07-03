import React, { useState } from 'react';
import { PlusCircle, Eye, Edit, Trash2, X, MoreVertical, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

// Mengimpor komponen StatusBadge dari file terpisah
import StatusBadge from '../components/StatusBadge';

// --- KOMPONEN-KOMPONEN ---

const AddPurchaseModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Tambah Transaksi Pembelian</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Pemasok</label><input type="text" placeholder="Nama Pemasok" className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Item yang Dibeli</label><textarea rows="2" placeholder="Contoh: 5 Ekor Sapi Brahman" className="w-full input-field"></textarea></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Total Biaya (Rp)</label><input type="number" placeholder="110000000" className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label><input type="date" className="w-full input-field"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select className="w-full input-field"><option>Dipesan</option><option>Diterima</option><option>Dibatalkan</option></select></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan</button></div></form></div>
            </div>
        </div>
    );
};

const PurchaseDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Detail Transaksi Pembelian</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">ID Transaksi</span><span className="font-mono text-gray-800">{item.id}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Pemasok</span><span className="text-gray-800">{item.supplier}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Tanggal</span><span className="text-gray-800">{item.date}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Item</span><span className="text-gray-800">{item.item}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Total Biaya</span><span className="font-semibold text-gray-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.total)}</span></div>
                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">Status</span><StatusBadge status={item.status} /></div>
                </div>
                 <div className="p-6 border-t text-right"><button type="button" onClick={onClose} className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg">Tutup</button></div>
            </div>
        </div>
    );
};

const EditPurchaseModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Edit Transaksi Pembelian</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Pemasok</label><input type="text" defaultValue={item.supplier} className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Item yang Dibeli</label><textarea rows="2" defaultValue={item.item} className="w-full input-field"></textarea></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Total Biaya (Rp)</label><input type="number" defaultValue={item.total} className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label><input type="date" defaultValue={item.date} className="w-full input-field"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select defaultValue={item.status} className="w-full input-field"><option>Dipesan</option><option>Diterima</option><option>Dibatalkan</option></select></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan Perubahan</button></div></form></div>
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

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-between items-center mt-6">
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


// --- Komponen Utama Halaman ---
const allPurchasesData = [
    { id: 'TXN-P-8812', supplier: 'Peternakan Maju Jaya', date: '2025-06-25', item: '5 Ekor Sapi Brahman', total: 110000000, status: 'Diterima' },
    { id: 'TXN-P-8811', supplier: 'Supplier Pakan Ternak', date: '2025-06-24', item: 'Pakan Konsentrat 1 Ton', total: 8500000, status: 'Diterima' },
    { id: 'TXN-P-8810', supplier: 'Peternakan Sumber Rejeki', date: '2025-06-22', item: '2 Ekor Sapi Limousin', total: 45000000, status: 'Dipesan' },
    { id: 'TXN-P-8809', supplier: 'Distributor Obat Hewan Nasional', date: '2025-06-21', item: 'Vitamin Ternak', total: 1500000, status: 'Dibatalkan' },
    { id: 'TXN-P-8808', supplier: 'Peternakan Sejahtera', date: '2025-06-20', item: '10 Ekor Sapi Simental', total: 220000000, status: 'Diterima' },
    { id: 'TXN-P-8807', supplier: 'CV Pakan Abadi', date: '2025-06-19', item: 'Dedak Padi 500kg', total: 2500000, status: 'Diterima' },
];

const PurchasePage = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    // State untuk paging
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const handleConfirmDelete = () => {
        console.log("Deleting item:", itemToDelete.id);
        setItemToDelete(null);
    };

    // Logika untuk memotong data sesuai halaman
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPurchases = allPurchasesData.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    
    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Pembelian</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Pembelian</button>
                </div>
                
                {/* Tampilan Tabel untuk Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">ID Transaksi</th>
                                <th className="px-6 py-3 whitespace-nowrap">Pemasok</th>
                                <th className="px-6 py-3 whitespace-nowrap">Tanggal</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Total</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPurchases.map(purchase => (
                                <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-red-600">{purchase.id}</td>
                                    <td className="px-6 py-4">{purchase.supplier}</td>
                                    <td className="px-6 py-4">{purchase.date}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(purchase.total)}</td>
                                    <td className="px-6 py-4 text-center"><StatusBadge status={purchase.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button onClick={() => setItemToView(purchase)} className="p-1 text-blue-600 hover:text-blue-800" title="Lihat Detail"><Eye size={18}/></button>
                                            <button onClick={() => setItemToEdit(purchase)} className="p-1 text-green-600 hover:text-green-800" title="Edit Data"><Edit size={18}/></button>
                                            <button onClick={() => setItemToDelete(purchase)} className="p-1 text-red-600 hover:text-red-800" title="Hapus Data"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Tampilan Kartu untuk Mobile */}
                <div className="md:hidden space-y-4">
                    {currentPurchases.map(purchase => (
                        <div key={purchase.id} className="bg-gray-50 p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-red-600 text-sm">{purchase.id}</p>
                                    <p className="text-gray-800 font-semibold">{purchase.supplier}</p>
                                </div>
                                <div className="relative">
                                    <button onClick={() => setOpenActionMenuId(openActionMenuId === purchase.id ? null : purchase.id)} className="p-2 rounded-full hover:bg-gray-200"><MoreVertical size={18}/></button>
                                    {openActionMenuId === purchase.id && (
                                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                                            <button onClick={() => {setItemToView(purchase); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14} className="mr-2"/> Lihat Detail</button>
                                            <button onClick={() => {setItemToEdit(purchase); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14} className="mr-2"/> Edit Data</button>
                                            <button onClick={() => {setItemToDelete(purchase); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14} className="mr-2"/> Hapus Data</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500">{purchase.date}</p>
                                    <p className="font-semibold text-gray-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(purchase.total)}</p>
                                </div>
                                <StatusBadge status={purchase.status} />
                            </div>
                        </div>
                    ))}
                </div>

                <Pagination 
                    totalItems={allPurchasesData.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>
            
            <AddPurchaseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <PurchaseDetailModal item={itemToView} onClose={() => setItemToView(null)} />
            <EditPurchaseModal item={itemToEdit} onClose={() => setItemToEdit(null)} />
            <DeleteConfirmationModal item={itemToDelete} onCancel={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
        </>
    );
};

export default PurchasePage;
