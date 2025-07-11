import React, { useState } from 'react';
import { PlusCircle, Check, X, Calendar, User } from 'lucide-react';

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

    const handleApprove = (id) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: 'Disetujui' } : req));
    };

    const handleReject = (id) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: 'Ditolak' } : req));
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Pengajuan Cuti</h2>
                <button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    <PlusCircle size={20} className="mr-2"/> Buat Pengajuan
                </button>
            </div>

            {/* Tampilan Tabel untuk Desktop */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-max text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 whitespace-nowrap">Nama Karyawan</th>
                            <th className="px-6 py-3 whitespace-nowrap">Jenis Cuti</th>
                            <th className="px-6 py-3 whitespace-nowrap">Tanggal</th>
                            <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                            <th className="px-6 py-3 text-center whitespace-nowrap">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-semibold text-gray-800">{req.employeeName}</td>
                                <td className="px-6 py-4">{req.leaveType}</td>
                                <td className="px-6 py-4">{req.startDate} s/d {req.endDate}</td>
                                <td className="px-6 py-4 text-center"><LeaveStatusBadge status={req.status} /></td>
                                <td className="px-6 py-4 text-center">
                                    {req.status === 'Menunggu' ? (
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => handleApprove(req.id)} className="p-2 bg-green-200 text-green-800 rounded-md hover:bg-green-300" title="Setujui"><Check size={16}/></button>
                                            <button onClick={() => handleReject(req.id)} className="p-2 bg-red-200 text-red-800 rounded-md hover:bg-red-300" title="Tolak"><X size={16}/></button>
                                        </div>
                                    ) : ( <span className="text-xs text-gray-400 italic">Selesai</span> )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tampilan Kartu untuk Mobile */}
            <div className="md:hidden space-y-4">
                {requests.map(req => (
                    <div key={req.id} className="bg-gray-50 p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-800">{req.employeeName}</p>
                                <p className="text-sm text-gray-600">{req.leaveType}</p>
                            </div>
                            <LeaveStatusBadge status={req.status} />
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-gray-500 flex items-center mb-2"><Calendar size={14} className="mr-2"/>{req.startDate} s/d {req.endDate}</p>
                            {req.status === 'Menunggu' && (
                                <div className="flex items-center gap-2 mt-2">
                                    <button onClick={() => handleApprove(req.id)} className="w-full flex-1 text-sm bg-green-500 text-white py-1.5 rounded-md">Setujui</button>
                                    <button onClick={() => handleReject(req.id)} className="w-full flex-1 text-sm bg-red-500 text-white py-1.5 rounded-md">Tolak</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveRequestPage;
