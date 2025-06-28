import React, { useState } from 'react';
import { PlusCircle, Users, User, Mail, Phone, MapPin, Calendar, X, MoreVertical, Eye, Edit, Trash2, AlertTriangle, Upload } from 'lucide-react';

// --- MODAL-MODAL ---

const EmployeeDetailModal = ({ employee, onClose }) => {
    if (!employee) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button>
                <div className="p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6">
                        <img src={employee.photoUrl} alt={`Foto ${employee.name}`} className="w-24 h-24 rounded-full object-cover ring-4 ring-red-200"/>
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-gray-800">{employee.name}</h2>
                            <p className="text-md text-red-600 font-semibold">{employee.position}</p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-4 text-sm">
                        <div className="flex items-center"><User size={16} className="text-gray-500 mr-3"/><span className="text-gray-600"><strong>ID Karyawan:</strong> {employee.id}</span></div>
                        <div className="flex items-center"><Users size={16} className="text-gray-500 mr-3"/><span className="text-gray-600"><strong>Jenis Kelamin:</strong> {employee.gender}</span></div>
                        <div className="flex items-center"><Mail size={16} className="text-gray-500 mr-3"/><span className="text-gray-600"><strong>Email:</strong> {employee.email}</span></div>
                        <div className="flex items-center"><Phone size={16} className="text-gray-500 mr-3"/><span className="text-gray-600"><strong>No. Telepon:</strong> {employee.phone}</span></div>
                        <div className="flex items-start"><MapPin size={16} className="text-gray-500 mr-3 mt-1 flex-shrink-0"/><span className="text-gray-600"><strong>Alamat:</strong> {employee.address}</span></div>
                        <div className="flex items-center"><Calendar size={16} className="text-gray-500 mr-3"/><span className="text-gray-600"><strong>Tanggal Bergabung:</strong> {employee.joinDate}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddEmployeeModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Tambah Karyawan Baru</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" placeholder="Masukkan nama" className="w-full input-field"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label><select className="w-full input-field"><option>Laki-laki</option><option>Perempuan</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label><input type="text" placeholder="Posisi di perusahaan" className="w-full input-field"/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" placeholder="contoh@email.com" className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label><input type="tel" placeholder="08xxxxxxxxxx" className="w-full input-field"/></div></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan</button></div></form></div>
            </div>
        </div>
    );
};

const EditEmployeeModal = ({ employee, onClose }) => {
    if (!employee) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Edit Data Karyawan</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6"><form className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" defaultValue={employee.name} className="w-full input-field"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label><select defaultValue={employee.gender} className="w-full input-field"><option>Laki-laki</option><option>Perempuan</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label><input type="text" defaultValue={employee.position} className="w-full input-field"/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" defaultValue={employee.email} className="w-full input-field"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label><input type="tel" defaultValue={employee.phone} className="w-full input-field"/></div></div><div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan Perubahan</button></div></form></div>
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
                <h2 className="text-xl font-bold text-gray-800">Hapus Karyawan?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus data untuk <strong className="text-gray-900">{item.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-center mt-6 space-x-4"><button onClick={onCancel} className="px-8 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Tidak, Batal</button><button onClick={onConfirm} className="px-8 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Ya, Hapus</button></div>
            </div>
        </div>
    );
};


// --- Komponen Utama Halaman ---
const allEmployeeData = [
    { id: 'KRY-001', name: 'Ahmad Subarjo', gender: 'Laki-laki', position: 'Manajer Peternakan', email: 'ahmad.s@example.com', phone: '0812-1111-2222', address: 'Jl. Merdeka No. 1, Jakarta', joinDate: '2020-01-15', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=AS' },
    { id: 'KRY-002', name: 'Siti Aminah', gender: 'Perempuan', position: 'Staf Administrasi', email: 'siti.a@example.com', phone: '0812-3333-4444', address: 'Jl. Mawar No. 2, Bogor', joinDate: '2021-03-20', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=SA' },
    { id: 'KRY-003', name: 'ahmad jundi', gender: 'Laki-laki', position: 'Kepala Bagian Penjualan', email: 'ahmad.j@example.com', phone: '0812-5555-6666', address: 'Jl. Kenanga No. 3, Depok', joinDate: '2019-11-10', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=JW' },
    { id: 'KRY-004', name: 'Dewi Lestari', gender: 'Perempuan', position: 'Dokter Hewan', email: 'dewi.l@example.com', phone: '0812-7777-8888', address: 'Jl. Anggrek No. 4, Bekasi', joinDate: '2022-02-01', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=DL' },
];

const EmployeePage = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);

    const handleConfirmDelete = () => {
        console.log("Deleting employee:", itemToDelete.id);
        setItemToDelete(null);
    };
    
    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Karyawan</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <PlusCircle size={20} className="mr-2"/> Tambah Karyawan
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Nama Karyawan</th>
                                <th className="px-6 py-3 hidden sm:table-cell">Jabatan</th>
                                <th className="px-6 py-3 hidden md:table-cell">Kontak</th>
                                <th className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allEmployeeData.map(employee => (
                                <tr key={employee.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <img src={employee.photoUrl} alt={`Foto ${employee.name}`} className="w-10 h-10 rounded-full mr-4"/>
                                            <div>
                                                <div className="font-semibold text-gray-800">{employee.name}</div>
                                                <div className="text-xs text-gray-500 sm:hidden">{employee.position}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">{employee.position}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div>{employee.email}</div>
                                        <div className="text-xs text-gray-500">{employee.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="hidden md:flex justify-center space-x-2">
                                            <button onClick={() => setItemToView(employee)} className="p-1 text-blue-600 hover:text-blue-800" title="Lihat Detail"><Eye size={18}/></button>
                                            <button onClick={() => setItemToEdit(employee)} className="p-1 text-green-600 hover:text-green-800" title="Edit Data"><Edit size={18}/></button>
                                            <button onClick={() => setItemToDelete(employee)} className="p-1 text-red-600 hover:text-red-800" title="Hapus Data"><Trash2 size={18}/></button>
                                        </div>
                                        <div className="md:hidden relative">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === employee.id ? null : employee.id)} className="p-2 rounded-full hover:bg-gray-100"><MoreVertical size={18}/></button>
                                            {openActionMenuId === employee.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                                    <button onClick={() => {setItemToView(employee); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Eye size={14} className="mr-2"/> Lihat Detail</button>
                                                    <button onClick={() => {setItemToEdit(employee); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit size={14} className="mr-2"/> Edit Data</button>
                                                    <button onClick={() => {setItemToDelete(employee); setOpenActionMenuId(null);}} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"><Trash2 size={14} className="mr-2"/> Hapus Data</button>
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
            
            <EmployeeDetailModal employee={itemToView} onClose={() => setItemToView(null)} />
            <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditEmployeeModal employee={itemToEdit} onClose={() => setItemToEdit(null)} />
            <DeleteConfirmationModal item={itemToDelete} onCancel={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
        </>
    );
};

export default EmployeePage;
