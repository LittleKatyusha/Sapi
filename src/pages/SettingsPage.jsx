import React, { useState } from 'react';
import { User, Building, Lock, Upload, X, Home, Plus, Trash2, Edit } from 'lucide-react';

// --- KOMPONEN MODAL ---

const ChangePasswordModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Ubah Kata Sandi</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Lama</label><input type="password" placeholder="Masukkan kata sandi lama" className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label><input type="password" placeholder="Masukkan kata sandi baru" className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label><input type="password" placeholder="Konfirmasi kata sandi baru" className="w-full input-field"/></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan</button></div></form></div>
            </div>
        </div>
    );
};

const DeletePenModal = ({ pen, onCancel, onConfirm }) => {
    if (!pen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4 relative animate-fade-in-up p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Hapus Kandang?</h2>
                <p className="text-gray-600 mt-2">
                    Apakah Anda yakin ingin menghapus <strong className="text-red-600">{pen.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex justify-center mt-6 space-x-4">
                    <button onClick={onCancel} className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">
                        Batal
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- KOMPONEN UTAMA HALAMAN ---

const SettingsPage = () => {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    // State untuk data kandang (nantinya ini akan diambil dari API)
    const [pens, setPens] = useState([
        { id: 1, name: 'Kandang A' },
        { id: 2, name: 'Kandang B' },
        { id: 3, name: 'Kandang C (Karantina)' }
    ]);
    const [newPenName, setNewPenName] = useState('');
    const [penToDelete, setPenToDelete] = useState(null);

    const handleAddPen = () => {
        if (newPenName.trim() === '') return; // Jangan tambahkan jika nama kosong
        const newPen = {
            id: pens.length > 0 ? Math.max(...pens.map(p => p.id)) + 1 : 1, // Buat ID unik sederhana
            name: newPenName.trim()
        };
        setPens([...pens, newPen]);
        setNewPenName(''); // Kosongkan input setelah ditambah
        console.log("Menambahkan kandang baru:", newPen);
        // Di aplikasi nyata, Anda akan mengirim request POST ke backend di sini
    };
    
    const handleDeletePen = (penId) => {
        setPens(pens.filter(p => p.id !== penId));
        console.log("Menghapus kandang dengan ID:", penId);
        // Di aplikasi nyata, Anda akan mengirim request DELETE ke backend di sini
    };

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
                
                {/* Profil Pengguna */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center"><User className="mr-3 text-red-500"/> Profil Pengguna</h2>
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8"><div className="flex-shrink-0 text-center"><img src="https://placehold.co/120x120/EFEFEF/4A5568?text=Foto" alt="Foto Profil" className="w-32 h-32 rounded-full object-cover ring-4 ring-red-100"/><button className="w-full mt-3 text-sm text-red-600 hover:underline flex items-center justify-center"><Upload size={14} className="mr-1"/> Ganti Foto</button></div><div className="flex-1 w-full space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" defaultValue="Budi Santoso" className="mt-1 block w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label><input type="email" defaultValue="budi.santoso@example.com" className="mt-1 block w-full input-field"/></div></div><div className="pt-2"><button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors"><Lock size={16} className="mr-2"/>Ubah Kata Sandi</button></div></div></div>
                </div>

                {/* Manajemen Kandang */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center"><Home className="mr-3 text-red-500"/> Manajemen Kandang</h2>
                    <div className="space-y-4">
                        <div className="font-semibold text-gray-600">Daftar Kandang</div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {pens.map(pen => (
                                <div key={pen.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-800">{pen.name}</span>
                                    <button 
                                    onClick={() => setPenToDelete(pen)} 
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"
                                    title={`Hapus ${pen.name}`}>
                                    <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4">
                           <label className="block text-sm font-medium text-gray-700 mb-1">Tambah Kandang Baru</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newPenName}
                                    onChange={(e) => setNewPenName(e.target.value)}
                                    placeholder="Nama kandang baru, contoh: Kandang D" 
                                    className="w-full input-field"
                                />
                                <button onClick={handleAddPen} className="flex-shrink-0 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center">
                                    <Plus size={16} className="mr-1"/> Tambah
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informasi Perusahaan */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center"><Building className="mr-3 text-red-500"/> Informasi Perusahaan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label><input type="text" defaultValue="CV PuputBersaudara" className="mt-1 block w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label><input type="text" defaultValue="0812-3456-7890" className="mt-1 block w-full input-field"/></div><div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea rows="3" className="mt-1 block w-full input-field" defaultValue="Jl. Raya Peternakan No. 12, Jakarta Timur, Indonesia"></textarea></div></div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <button className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors shadow-lg transform hover:scale-105">
                        Simpan Semua Perubahan
                    </button>
                </div>
            </div>

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
            <DeletePenModal pen={penToDelete} onCancel={() => setPenToDelete(null)}onConfirm={() => { handleDeletePen(penToDelete.id); setPenToDelete(null);}}/>
</>
    );
};

export default SettingsPage;
