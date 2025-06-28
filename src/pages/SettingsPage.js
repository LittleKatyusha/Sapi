import React, { useState } from 'react';
import { User, Building, Lock, Upload, X } from 'lucide-react';

// --- KOMPONEN MODAL UNTUK HALAMAN INI ---
const ChangePasswordModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Ubah Kata Sandi</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Lama</label>
                            <input type="password" placeholder="Masukkan kata sandi lama" className="w-full input-field"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label>
                            <input type="password" placeholder="Masukkan kata sandi baru" className="w-full input-field"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                            <input type="password" placeholder="Konfirmasi kata sandi baru" className="w-full input-field"/>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button>
                            <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- KOMPONEN UTAMA HALAMAN ---
const SettingsPage = () => {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
                
                {/* Profil Pengguna */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
                        <User className="mr-3 text-red-500"/> Profil Pengguna
                    </h2>
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        <div className="flex-shrink-0 text-center">
                            <img src="https://placehold.co/120x120/EFEFEF/4A5568?text=Foto" alt="Foto Profil" className="w-32 h-32 rounded-full object-cover ring-4 ring-red-100"/>
                            <button className="w-full mt-3 text-sm text-red-600 hover:underline flex items-center justify-center">
                                <Upload size={14} className="mr-1"/> Ganti Foto
                            </button>
                        </div>
                        <div className="flex-1 w-full space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                    <input type="text" defaultValue="Budi Santoso" className="mt-1 block w-full input-field"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
                                    <input type="email" defaultValue="budi.santoso@example.com" className="mt-1 block w-full input-field"/>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors">
                                    <Lock size={16} className="mr-2"/>Ubah Kata Sandi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informasi Perusahaan */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
                        <Building className="mr-3 text-red-500"/> Informasi Perusahaan
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label><input type="text" defaultValue="CV PuputBersaudara" className="mt-1 block w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label><input type="text" defaultValue="0812-3456-7890" className="mt-1 block w-full input-field"/></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea rows="3" className="mt-1 block w-full input-field" defaultValue="Jl. Raya Peternakan No. 12, Jakarta Timur, Indonesia"></textarea></div>
                    </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <button className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-colors shadow-lg transform hover:scale-105">
                        Simpan Semua Perubahan
                    </button>
                </div>
            </div>

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </>
    );
};

export default SettingsPage;
