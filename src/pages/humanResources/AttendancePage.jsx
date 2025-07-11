import React, { useState } from 'react';
import { Check, X, Coffee, Calendar, User, Clock } from 'lucide-react';

// --- Komponen Lokal ---
const AttendanceStatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block";
    let specificClasses = "";
    switch (status) {
        case 'Hadir': specificClasses = 'bg-green-100 text-green-800'; break;
        case 'Sakit': specificClasses = 'bg-yellow-100 text-yellow-800'; break;
        case 'Izin': specificClasses = 'bg-blue-100 text-blue-800'; break;
        case 'Alpa': specificClasses = 'bg-red-100 text-red-800'; break;
        default: specificClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// --- DATA CONTOH (nantinya dari API) ---
const initialAttendanceData = [
    { id: 'KRY-001', name: 'Ahmad Subarjo', position: 'Manajer Peternakan', status: 'Hadir', checkIn: '08:05', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=AS' },
    { id: 'KRY-002', name: 'Siti Aminah', position: 'Staf Administrasi', status: 'Sakit', checkIn: null, photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=SA' },
    { id: 'KRY-003', name: 'ahmad jundi', position: 'Kepala Penjualan', status: 'Hadir', checkIn: '07:55', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=JW' },
    { id: 'KRY-004', name: 'Dewi Lestari', position: 'Dokter Hewan', status: 'Alpa', checkIn: null, photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=DL' },
    { id: 'KRY-005', name: 'Bambang Pamungkas', position: 'Staf Kandang', status: 'Izin', checkIn: null, photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=BP' },
];

// --- KOMPONEN UTAMA HALAMAN ---
const AttendancePage = () => {
    const [attendance, setAttendance] = useState(initialAttendanceData);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

    const handleStatusChange = (employeeId, newStatus) => {
        setAttendance(attendance.map(emp => 
            emp.id === employeeId ? { ...emp, status: newStatus, checkIn: newStatus === 'Hadir' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null } : emp
        ));
    };

    const summary = attendance.reduce((acc, emp) => {
        acc[emp.status] = (acc[emp.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Absensi</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="attendance-date" className="text-sm font-medium">Tanggal:</label>
                        <input 
                            type="date" 
                            id="attendance-date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="input-field p-2"
                        />
                    </div>
                </div>

                {/* Ringkasan Absensi */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-800">{summary['Hadir'] || 0}</p>
                        <p className="text-sm text-green-700">Hadir</p>
                    </div>
                     <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-800">{summary['Sakit'] || 0}</p>
                        <p className="text-sm text-yellow-700">Sakit</p>
                    </div>
                     <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-800">{summary['Izin'] || 0}</p>
                        <p className="text-sm text-blue-700">Izin</p>
                    </div>
                     <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-800">{summary['Alpa'] || 0}</p>
                        <p className="text-sm text-red-700">Alpa</p>
                    </div>
                </div>

                {/* Daftar Karyawan */}
                <div className="space-y-3">
                    {attendance.map(employee => (
                        <div key={employee.id} className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center">
                                <img src={employee.photoUrl} alt={employee.name} className="w-12 h-12 rounded-full mr-4"/>
                                <div>
                                    <p className="font-bold text-gray-800">{employee.name}</p>
                                    <p className="text-xs text-gray-500">{employee.position}</p>
                                    {employee.checkIn && <p className="text-xs text-green-600 font-semibold mt-1 flex items-center"><Clock size={12} className="mr-1"/> Masuk: {employee.checkIn}</p>}
                                </div>
                            </div>
                            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="w-full sm:w-28 text-center mb-2 sm:mb-0">
                                    <AttendanceStatusBadge status={employee.status} />
                                </div>
                                <div className="flex justify-center gap-1">
                                    <button onClick={() => handleStatusChange(employee.id, 'Hadir')} className="p-2 bg-green-200 text-green-800 rounded-md hover:bg-green-300" title="Hadir"><Check size={16}/></button>
                                    <button onClick={() => handleStatusChange(employee.id, 'Sakit')} className="p-2 bg-yellow-200 text-yellow-800 rounded-md hover:bg-yellow-300" title="Sakit"><User size={16}/></button>
                                    <button onClick={() => handleStatusChange(employee.id, 'Izin')} className="p-2 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300" title="Izin"><Coffee size={16}/></button>
                                    <button onClick={() => handleStatusChange(employee.id, 'Alpa')} className="p-2 bg-red-200 text-red-800 rounded-md hover:bg-red-300" title="Alpa"><X size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
