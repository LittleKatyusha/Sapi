import React, { useState } from 'react';
import { PlusCircle, Check, X, MoreVertical, Eye, Calendar, User, FileText as FileIcon } from 'lucide-react';

// --- Komponen Lokal ---
const LeaveStatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    let specificClasses = "";
    switch (status) {
        case 'Disetujui': specificClasses = 'bg-green-100 text-green-800'; break;
        case 'Menunggu': specificClasses = 'bg-yellow-100 text-yellow-800'; break;
        case 'Ditolak': specificClasses = 'bg-red-100 text-red-800'; break;
        default: specificClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// --- Modal untuk Form Pengajuan Cuti ---
const AddLeaveRequestModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Formulir Pengajuan Cuti</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Karyawan</label>
                            {/* Di aplikasi nyata, ini bisa berupa dropdown yang datanya dari API */}
                            <select className="w-full input-field">
                                <option>Ahmad Subarjo</option>
                                <option>Siti Aminah</option>
                                <option>ahmad jundi</option>
                                <option>Dewi Lestari</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Cuti</label>
                            <select className="w-full input-field">
                                <option>Cuti Tahunan</option>
                                <option>Sakit</option>
                                <option>Izin Khusus</option>
                                <option>Cuti Melahirkan</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                <input type="date" className="w-full input-field"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                                <input type="date" className="w-full input-field"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan</label>
                            <textarea rows="3" placeholder="Tuliskan alasan pengajuan cuti..." className="w-full input-field"></textarea>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Batal</button>
                            <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Ajukan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- DATA CONTOH ---
const initialLeaveRequests = [
    { id: 'CT-001', employeeName: 'Ahmad Subarjo', leaveType: 'Cuti Tahunan', startDate: '2025-08-01', endDate: '2025-08-05', reason: 'Liburan keluarga.', status: 'Disetujui' },
    { id: 'CT-002', employeeName: 'Siti Aminah', leaveType: 'Sakit', startDate: '2025-07-28', endDate: '2025-07-29', reason: 'Perlu istirahat sesuai anjuran dokter.', status: 'Disetujui' },
    { id: 'CT-003', employeeName: 'ahmad jundi', leaveType: 'Cuti Tahunan', startDate: '2025-09-10', endDate: '2025-09-15', reason: 'Acara pernikahan saudara.', status: 'Menunggu' },
    { id: 'CT-004', employeeName: 'Dewi Lestari', leaveType: 'Izin Khusus', startDate: '2025-07-25', endDate: '2025-07-25', reason: 'Mengurus keperluan mendadak.', status: 'Ditolak' },
];

// --- KOMPONEN UTAMA HALAMAN ---
const LeaveRequestPage = () => {
    const [requests, setRequests] = useState(initialLeaveRequests);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleApprove = (id) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: 'Disetujui' } : req));
    };

    const handleReject = (id) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: 'Ditolak' } : req));
    };

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Pengajuan Cuti</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <PlusCircle size={20} className="mr-2"/> Buat Pengajuan
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Nama Karyawan</th>
                                <th className="px-6 py-3 whitespace-nowrap">Jenis Cuti</th>
                                <th className="px-6 py-3 hidden md:table-cell whitespace-nowrap">Tanggal</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-800">{req.employeeName}</div>
                                        <div className="text-xs text-gray-500 md:hidden">{req.startDate} - {req.endDate}</div>
                                    </td>
                                    <td className="px-6 py-4">{req.leaveType}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{req.startDate} s/d {req.endDate}</td>
                                    <td className="px-6 py-4 text-center"><LeaveStatusBadge status={req.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                        {req.status === 'Menunggu' ? (
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => handleApprove(req.id)} className="p-2 bg-green-200 text-green-800 rounded-md hover:bg-green-300" title="Setujui"><Check size={16}/></button>
                                                <button onClick={() => handleReject(req.id)} className="p-2 bg-red-200 text-red-800 rounded-md hover:bg-red-300" title="Tolak"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Selesai</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <AddLeaveRequestModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </>
    );
};

export default LeaveRequestPage;
