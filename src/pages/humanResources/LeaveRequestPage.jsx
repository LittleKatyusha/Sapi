import React from 'react';
import { AlertCircle } from 'lucide-react';

// ponytail: sambungkan ke hrisService.submitLeaveRequest / approveLeaveRequest saat backend siap.

const LeaveRequestPage = () => {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Pengajuan Cuti</h2>
            </div>

            <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle size={40} className="mb-3 text-yellow-400" />
                <p className="font-semibold text-gray-600">Belum terhubung ke API</p>
                <p className="text-sm mt-1 text-gray-400">Data pengajuan cuti akan tampil setelah integrasi backend selesai.</p>
            </div>
        </div>
    );
};

export default LeaveRequestPage;
