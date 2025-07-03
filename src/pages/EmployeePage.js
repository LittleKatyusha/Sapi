import React, { useState } from 'react';
import { PlusCircle, Users, User, Mail, Phone, MapPin, Calendar, X, MoreVertical, Eye, Edit, Trash2, AlertTriangle, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

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
                        {/* PERUBAHAN: Menampilkan alamat lengkap */}
                        <div className="flex items-start"><MapPin size={16} className="text-gray-500 mr-3 mt-1 flex-shrink-0"/><span className="text-gray-600"><strong>Alamat:</strong> {`${employee.address}, ${employee.kecamatan}, ${employee.kabupaten}, ${employee.provinsi}`}</span></div>
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Tambah Karyawan Baru</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 max-h-[70vh] overflow-y-auto"><form className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" placeholder="Masukkan nama" className="w-full input-field"/></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label><select className="w-full input-field"><option>Laki-laki</option><option>Perempuan</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label><input type="text" placeholder="Posisi di perusahaan" className="w-full input-field"/></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" placeholder="contoh@email.com" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label><input type="tel" placeholder="08xxxxxxxxxx" className="w-full input-field"/></div>
                    </div>
                    {/* PERUBAHAN: Menambahkan input untuk alamat lengkap */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                        <textarea rows="2" placeholder="Jalan, nomor rumah, RT/RW..." className="w-full input-field"></textarea>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label><input type="text" placeholder="Jawa Barat" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label><input type="text" placeholder="Bekasi" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label><input type="text" placeholder="Cikarang" className="w-full input-field"/></div>
                    </div>
                    <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan</button></div>
                </form></div>
            </div>
        </div>
    );
};

const EditEmployeeModal = ({ employee, onClose }) => {
    if (!employee) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b"><h2 className="text-xl font-bold text-gray-800">Edit Data Karyawan</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600" /></button></div>
                <div className="p-6 max-h-[70vh] overflow-y-auto"><form className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" defaultValue={employee.name} className="w-full input-field"/></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label><select defaultValue={employee.gender} className="w-full input-field"><option>Laki-laki</option><option>Perempuan</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label><input type="text" defaultValue={employee.position} className="w-full input-field"/></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" defaultValue={employee.email} className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label><input type="tel" defaultValue={employee.phone} className="w-full input-field"/></div>
                    </div>
                    {/* PERUBAHAN: Menambahkan input untuk alamat lengkap */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                        <textarea rows="2" defaultValue={employee.address} className="w-full input-field"></textarea>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label><input type="text" defaultValue={employee.provinsi} className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label><input type="text" defaultValue={employee.kabupaten} className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label><input type="text" defaultValue={employee.kecamatan} className="w-full input-field"/></div>
                    </div>
                    <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button><button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Simpan Perubahan</button></div>
                </form></div>
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

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange, onItemsPerPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalItems === 0) return <div className="text-center text-gray-500 py-4">Tidak ada data untuk ditampilkan.</div>;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 sm:mb-0">
                <span>Tampilkan</span>
                <select id="items-per-page" value={itemsPerPage} onChange={(e) => onItemsPerPageChange(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                </select>
                <span>entri</span>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700"> Halaman <span className="font-semibold">{currentPage}</span> dari <span className="font-semibold">{totalPages}</span></span>
                    <div className="flex space-x-1">
                        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16}/></button>
                        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16}/></button>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Komponen Utama Halaman ---
const allEmployeeData = [
    { id: 'KRY-001', name: 'Ahmad Subarjo', gender: 'Laki-laki', position: 'Manajer Peternakan', email: 'ahmad.subarjo@example.com', phone: '0812-1111-2222', address: 'Jl. Merdeka No. 1, RT 01/RW 02', provinsi: 'DKI Jakarta', kabupaten: 'Jakarta Pusat', kecamatan: 'Gambir', joinDate: '2020-01-15', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=AS' },
    { id: 'KRY-002', name: 'Siti Aminah', gender: 'Perempuan', position: 'Staf Administrasi', email: 'siti.aminah@example.com', phone: '0812-3333-4444', address: 'Jl. Mawar No. 2, RT 03/RW 01', provinsi: 'Jawa Barat', kabupaten: 'Bogor', kecamatan: 'Bogor Tengah', joinDate: '2021-03-20', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=SA' },
    { id: 'KRY-003', name: 'Joko Widodo', gender: 'Laki-laki', position: 'Kepala Penjualan', email: 'joko.widodo@example.com', phone: '0812-5555-6666', address: 'Jl. Kenanga No. 3, RT 05/RW 04', provinsi: 'Jawa Barat', kabupaten: 'Depok', kecamatan: 'Pancoran Mas', joinDate: '2019-11-10', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=JW' },
    { id: 'KRY-004', name: 'Dewi Lestari', gender: 'Perempuan', position: 'Dokter Hewan', email: 'dewi.lestari@example.com', phone: '0812-7777-8888', address: 'Jl. Anggrek No. 4, RT 02/RW 07', provinsi: 'Jawa Barat', kabupaten: 'Bekasi', kecamatan: 'Bekasi Timur', joinDate: '2022-02-01', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=DL' },
    { id: 'KRY-005', name: 'Bambang Susanto', gender: 'Laki-laki', position: 'Staf Kandang', email: 'bambang.s@example.com', phone: '0812-9999-0000', address: 'Jl. Melati No. 5, RT 01/RW 03', provinsi: 'Banten', kabupaten: 'Tangerang', kecamatan: 'Cipondoh', joinDate: '2023-01-05', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=BS' },
    { id: 'KRY-006', name: 'Rina Hartati', gender: 'Perempuan', position: 'Staf Keuangan', email: 'rina.h@example.com', phone: '0813-1234-5678', address: 'Jl. Cendana No. 6, RT 04/RW 05', provinsi: 'DKI Jakarta', kabupaten: 'Jakarta Selatan', kecamatan: 'Kebayoran Baru', joinDate: '2022-08-11', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=RH' },
    { id: 'KRY-007', name: 'Eko Prasetyo', gender: 'Laki-laki', position: 'Staf Logistik', email: 'eko.p@example.com', phone: '0815-8765-4321', address: 'Jl. Flamboyan No. 7, RT 06/RW 08', provinsi: 'Jawa Barat', kabupaten: 'Bekasi', kecamatan: 'Tambun', joinDate: '2021-06-20', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=EP' },
    { id: 'KRY-008', name: 'Fitriani', gender: 'Perempuan', position: 'Customer Service', email: 'fitriani@example.com', phone: '0817-1122-3344', address: 'Jl. Kamboja No. 8, RT 03/RW 09', provinsi: 'DKI Jakarta', kabupaten: 'Jakarta Timur', kecamatan: 'Cakung', joinDate: '2023-02-18', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=F' },
    { id: 'KRY-009', name: 'Agus Salim', gender: 'Laki-laki', position: 'Staf Kandang', email: 'agus.s@example.com', phone: '0819-5555-1234', address: 'Jl. Dahlia No. 9, RT 02/RW 01', provinsi: 'Banten', kabupaten: 'Tangerang', kecamatan: 'Karawaci', joinDate: '2020-05-30', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=AS' },
    { id: 'KRY-010', name: 'Wulan Sari', gender: 'Perempuan', position: 'Staf Pemasaran', email: 'wulan.s@example.com', phone: '0811-9876-5432', address: 'Jl. Teratai No. 10, RT 07/RW 06', provinsi: 'Jawa Barat', kabupaten: 'Bogor', kecamatan: 'Cibinong', joinDate: '2022-11-01', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=WS' },
];

const EmployeePage = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [itemToView, setItemToView] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const handleConfirmDelete = () => {
        console.log("Deleting employee:", itemToDelete.id);
        setItemToDelete(null);
    };
    
    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = allEmployeeData.slice(indexOfFirstItem, indexOfLastItem);
    
    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Karyawan</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <PlusCircle size={20} className="mr-2"/> Tambah Karyawan
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 sticky left-0 bg-gray-50 z-20 min-w-[250px]">Nama Karyawan</th>
                                <th className="px-6 py-3 min-w-[150px]">Jabatan</th>
                                <th className="px-6 py-3 min-w-[200px]">Email</th>
                                <th className="px-6 py-3 min-w-[150px]">No. Telepon</th>
                                <th className="px-6 py-3 min-w-[150px]">Provinsi</th>
                                <th className="px-6 py-3 min-w-[150px]">Kabupaten/Kota</th>
                                <th className="px-6 py-3 min-w-[150px]">Kecamatan</th>
                                <th className="px-6 py-3 text-center sticky right-0 bg-gray-50 z-20 min-w-[100px]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {currentEmployees.map(employee => (
                                <tr key={employee.id} className="border-b hover:bg-gray-50 group">
                                    <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r">
                                        <div className="flex items-center">
                                            <img src={employee.photoUrl} alt={`Foto ${employee.name}`} className="w-10 h-10 rounded-full mr-4"/>
                                            <div>
                                                <div className="font-semibold text-gray-800">{employee.name}</div>
                                                <div className="text-xs text-gray-500">{employee.gender}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{employee.position}</td>
                                    <td className="px-6 py-4">{employee.email}</td>
                                    <td className="px-6 py-4">{employee.phone}</td>
                                    <td className="px-6 py-4">{employee.provinsi}</td>
                                    <td className="px-6 py-4">{employee.kabupaten}</td>
                                    <td className="px-6 py-4">{employee.kecamatan}</td>
                                    <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l">
                                        <div className="relative flex justify-center">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === employee.id ? null : employee.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                                                <MoreVertical size={18}/>
                                            </button>
                                            {openActionMenuId === employee.id && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
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
                 <Pagination 
                    totalItems={allEmployeeData.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            </div>
            
            <EmployeeDetailModal employee={itemToView} onClose={() => setItemToView(null)} />
            <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditEmployeeModal employee={itemToEdit} onClose={() => setItemToEdit(null)} />
            <DeleteConfirmationModal item={itemToDelete} onCancel={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
        </>
    );
};

export default EmployeePage;
