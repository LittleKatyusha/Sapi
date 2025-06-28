import React, { useState } from 'react';
import { PlusCircle, Eye, Edit, Trash2, X, MoreVertical, AlertTriangle } from 'lucide-react';

// Mengimpor komponen StatusBadge dari file terpisah
import StatusBadge from '../components/StatusBadge';

// --- MODAL-MODAL TETAP DI SINI, SESUAI PERMINTAAN ---

const AddLivestockModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Tambah Data Ternak Baru</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">ID Ternak</label><input type="text" placeholder="Contoh: L-004" className="w-full input-field"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Ternak</label><select className="w-full input-field"><option>Limousin</option><option>Brahman</option><option>Simental</option><option>Angus</option><option>Peranakan Ongole</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Umur</label><input type="text" placeholder="Contoh: 1.5 tahun" className="w-full input-field"/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Bobot (kg)</label><input type="number" step="1" placeholder="650" className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk</label><input type="date" className="w-full input-field"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select className="w-full input-field"><option>Tersedia</option><option>Karantina</option></select></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan</button></div></form></div>
            </div>
        </div>
    );
};

const LivestockDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Detail Stok Ternak</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">ID Ternak</span><span className="font-mono text-gray-800">{item.id}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Jenis</span><span className="text-gray-800">{item.breed}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Umur</span><span className="text-gray-800">{item.age}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Bobot</span><span className="text-gray-800">{item.weight} kg</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-500">Tanggal Masuk</span><span className="text-gray-800">{item.entryDate}</span></div>
                    <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">Status</span><StatusBadge status={item.status} /></div>
                </div>
                 <div className="p-6 border-t text-right"><button type="button" onClick={onClose} className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg">Tutup</button></div>
            </div>
        </div>
    );
};

const EditLivestockModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Edit Data Ternak</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">ID Ternak</label><input type="text" defaultValue={item.id} readOnly className="w-full input-field bg-gray-200 cursor-not-allowed"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Ternak</label><select defaultValue={item.breed} className="w-full input-field"><option>Limousin</option><option>Brahman</option><option>Simental</option><option>Angus</option><option>Peranakan Ongole</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Umur</label><input type="text" defaultValue={item.age} className="w-full input-field"/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Bobot (kg)</label><input type="number" defaultValue={item.weight} className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk</label><input type="date" defaultValue={item.entryDate} className="w-full input-field"/></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select defaultValue={item.status} className="w-full input-field"><option>Tersedia</option><option>Karantina</option><option>Terjual</option></select></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan Perubahan</button></div></form></div>
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
                <h2 className="text-xl font-bold text-gray-800">Hapus Data Ternak?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus data untuk <strong className="font-mono">{item.id}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-center mt-6 space-x-4"><button onClick={onCancel} className="px-8 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Tidak, Batal</button><button onClick={onConfirm} className="px-8 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Ya, Hapus</button></div>
            </div>
        </div>
    );
};

// --- Data untuk halaman ini ---
const allLivestockData = [
    { id: 'L-001', breed: 'Limousin', age: '2 tahun', weight: 750, entryDate: '2025-04-15', status: 'Tersedia' },
    { id: 'B-012', breed: 'Brahman', age: '1.5 tahun', weight: 600, entryDate: '2025-05-01', status: 'Tersedia' },
    { id: 'S-005', breed: 'Simental', age: '2.5 tahun', weight: 800, entryDate: '2025-03-20', status: 'Terjual' },
    { id: 'A-003', breed: 'Angus', age: '2 tahun', weight: 720, entryDate: '2025-05-10', status: 'Karantina' },
    { id: 'P-007', breed: 'Peranakan Ongole', age: '2.2 tahun', weight: 650, entryDate: '2025-05-20', status: 'Tersedia' },
];

// --- Komponen Utama Halaman ---
const LivestockStockPage = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    const handleConfirmDelete = () => {
        console.log("Menghapus item:", itemToDelete.id);
        setItemToDelete(null); 
    };
    
    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Stok Ternak</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"><PlusCircle size={20} className="mr-2"/> Tambah Ternak</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3">ID Ternak</th><th className="px-6 py-3">Jenis</th><th className="px-6 py-3 hidden md:table-cell text-right">Bobot (kg)</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Aksi</th></tr></thead>
                        <tbody>
                            {allLivestockData.map(cow => (
                                <tr key={cow.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-red-600">{cow.id}</td>
                                    <td className="px-6 py-4">{cow.breed}</td>
                                    <td className="px-6 py-4 hidden md:table-cell text-right">{cow.weight} kg</td>
                                    <td className="px-6 py-4 text-center"><StatusBadge status={cow.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="hidden md:flex justify-center space-x-2">
                                            <button onClick={() => setItemToView(cow)} className="p-1 text-blue-600 hover:text-blue-800" title="Lihat Detail"><Eye size={18}/></button>
                                            <button onClick={() => setItemToEdit(cow)} className="p-1 text-green-600 hover:text-green-800" title="Edit Data"><Edit size={18}/></button>
                                            <button onClick={() => setItemToDelete(cow)} className="p-1 text-red-600 hover:text-red-800" title="Hapus Data"><Trash2 size={18}/></button>
                                        </div>
                                        <div className="md:hidden relative">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === cow.id ? null : cow.id)} className="p-2 rounded-full hover:bg-gray-100"><MoreVertical size={18}/></button>
                                            {openActionMenuId === cow.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                                    <button onClick={() => {setItemToView(cow); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14} className="mr-2"/> Lihat Detail</button>
                                                    <button onClick={() => {setItemToEdit(cow); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14} className="mr-2"/> Edit Data</button>
                                                    <button onClick={() => {setItemToDelete(cow); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14} className="mr-2"/> Hapus Data</button>
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
            
            <AddLivestockModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <LivestockDetailModal item={itemToView} onClose={() => setItemToView(null)} />
            <EditLivestockModal item={itemToEdit} onClose={() => setItemToEdit(null)} />
            <DeleteConfirmationModal item={itemToDelete} onCancel={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
        </>
    );
};

export default LivestockStockPage;
