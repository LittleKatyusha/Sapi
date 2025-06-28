import React, { useState } from 'react';
import { PlusCircle, Eye, Edit, Trash2, X, MoreVertical, AlertTriangle } from 'lucide-react';

// --- Komponen-komponen ---

import StatusBadge from '../components/StatusBadge';

// --- MODAL UNTUK SETIAP AKSI ---

const AddMeatStockModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Tambah Stok Daging Baru</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">SKU / ID Produk</label><input type="text" placeholder="Contoh: DG-SIR-L003-01" className="w-full input-field"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Daging</label><select className="w-full input-field"><option>Sirloin</option><option>Ribeye</option><option>Giling</option><option>Tenderloin</option><option>Iga</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Asal Ternak (ID)</label><input type="text" placeholder="Contoh: L-003" className="w-full input-field"/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Bobot (kg)</label><input type="number" step="0.1" placeholder="25.5" className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kemas</label><input type="date" className="w-full input-field"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select className="w-full input-field"><option>Tersedia</option><option>Beku</option></select></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan</button></div></form></div>
            </div>
        </div>
    );
};

const MeatDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Detail Stok Daging</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">ID Produk (SKU)</span><span className="font-mono text-gray-800">{item.sku}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Jenis Daging</span><span className="text-gray-800">{item.type}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Asal Ternak</span><span className="font-mono text-gray-800">{item.origin}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Bobot</span><span className="text-gray-800">{item.weight.toFixed(1)} kg</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Tanggal Kemas</span><span className="text-gray-800">{item.packDate}</span></div>
                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">Status</span><StatusBadge status={item.status} /></div>
                </div>
                 <div className="p-6 border-t text-right"><button type="button" onClick={onClose} className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg">Tutup</button></div>
            </div>
        </div>
    );
};

const EditMeatStockModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Edit Stok Daging</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">SKU / ID Produk</label><input type="text" defaultValue={item.sku} readOnly className="w-full input-field bg-gray-200 cursor-not-allowed"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Daging</label><select defaultValue={item.type} className="w-full input-field"><option>Sirloin</option><option>Ribeye</option><option>Giling</option><option>Tenderloin</option><option>Iga</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Asal Ternak (ID)</label><input type="text" defaultValue={item.origin} className="w-full input-field"/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Bobot (kg)</label><input type="number" step="0.1" defaultValue={item.weight} className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kemas</label><input type="date" defaultValue={item.packDate} className="w-full input-field"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select defaultValue={item.status} className="w-full input-field"><option>Tersedia</option><option>Beku</option><option>Terjual</option><option>Kadaluarsa</option></select></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan Perubahan</button></div></form></div>
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
                <h2 className="text-xl font-bold text-gray-800">Hapus Data Stok?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus data untuk <strong className="font-mono">{item.sku}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-center mt-6 space-x-4"><button onClick={onCancel} className="px-8 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Tidak, Batal</button><button onClick={onConfirm} className="px-8 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Ya, Hapus</button></div>
            </div>
        </div>
    );
};


// --- Komponen Utama Halaman ---
const allMeatStockData = [
    { sku: 'DG-SIR-L001-01', type: 'Sirloin', origin: 'L-001', weight: 25.5, packDate: '2025-06-20', status: 'Tersedia' },
    { sku: 'DG-RIB-S005-01', type: 'Ribeye', origin: 'S-005', weight: 30.0, packDate: '2025-06-18', status: 'Terjual' },
    { sku: 'DG-GIL-B012-01', type: 'Giling', origin: 'B-012', weight: 150.2, packDate: '2025-06-22', status: 'Tersedia' },
    { sku: 'DG-TEN-A003-01', type: 'Tenderloin', origin: 'A-003', weight: 15.8, packDate: '2025-06-19', status: 'Tersedia' },
    { sku: 'DG-IGA-P007-01', type: 'Iga', origin: 'P-007', weight: 45.0, packDate: '2025-06-21', status: 'Beku' },
    { sku: 'DG-SIR-L002-01', type: 'Sirloin', origin: 'L-002', weight: 28.3, packDate: '2025-05-15', status: 'Kadaluarsa' },
];

const MeatStockPage = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    const handleConfirmDelete = () => {
        console.log("Deleting item:", itemToDelete.sku);
        setItemToDelete(null);
    };
    
    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Stok Daging</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Stok</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Jenis</th><th className="px-6 py-3 hidden md:table-cell text-right">Bobot (kg)</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Aksi</th></tr></thead>
                        <tbody>
                            {allMeatStockData.map(meat => (
                                <tr key={meat.sku} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-red-600">{meat.sku}</td>
                                    <td className="px-6 py-4">{meat.type}</td>
                                    <td className="px-6 py-4 hidden md:table-cell text-right">{meat.weight.toFixed(1)} kg</td>
                                    <td className="px-6 py-4 text-center"><StatusBadge status={meat.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="hidden md:flex justify-center space-x-2">
                                            <button onClick={() => setItemToView(meat)} className="p-1 text-blue-600 hover:text-blue-800" title="Lihat Detail"><Eye size={18}/></button>
                                            <button onClick={() => setItemToEdit(meat)} className="p-1 text-green-600 hover:text-green-800" title="Edit Data"><Edit size={18}/></button>
                                            <button onClick={() => setItemToDelete(meat)} className="p-1 text-red-600 hover:text-red-800" title="Hapus Data"><Trash2 size={18}/></button>
                                        </div>
                                        <div className="md:hidden relative">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === meat.sku ? null : meat.sku)} className="p-2 rounded-full hover:bg-gray-100"><MoreVertical size={18}/></button>
                                            {openActionMenuId === meat.sku && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                                    <button onClick={() => {setItemToView(meat); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14} className="mr-2"/> Lihat Detail</button>
                                                    <button onClick={() => {setItemToEdit(meat); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14} className="mr-2"/> Edit Data</button>
                                                    <button onClick={() => {setItemToDelete(meat); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14} className="mr-2"/> Hapus Data</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <AddMeatStockModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <MeatDetailModal item={itemToView} onClose={() => setItemToView(null)} />
            <EditMeatStockModal item={itemToEdit} onClose={() => setItemToEdit(null)} />
            <DeleteConfirmationModal item={itemToDelete} onCancel={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
        </>
    );
};

export default MeatStockPage;
