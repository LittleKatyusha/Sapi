import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

// ponytail: sambungkan ke hrisService.getAttendanceEvents saat backend siap.

const AttendancePage = () => {
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {['Hadir', 'Sakit', 'Izin', 'Alpa'].map(s => (
                        <div key={s} className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-gray-300">-</p>
                            <p className="text-sm text-gray-400">{s}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center justify-center py-16">
                    <AlertCircle size={40} className="mb-3 text-yellow-400" />
                    <p className="font-semibold text-gray-600">Belum terhubung ke API</p>
                    <p className="text-sm mt-1 text-gray-400">Data absensi akan tampil setelah integrasi backend selesai.</p>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
