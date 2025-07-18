import React, { useMemo } from 'react';

const StatusBadgeNew = ({ status, type = 'active' }) => {
    const config = useMemo(() => {
        if (type === 'active') {
            // Status aktif/nonaktif berdasarkan field status (1 = aktif, 0 = nonaktif)
            switch (status) {
                case 1:
                case 'Aktif':
                    return {
                        bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
                        text: 'text-white',
                        pulse: true,
                        label: 'Aktif'
                    };
                case 0:
                case 'Nonaktif':
                    return {
                        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
                        text: 'text-white', 
                        pulse: false,
                        label: 'Nonaktif'
                    };
                default:
                    return {
                        bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
                        text: 'text-white',
                        pulse: false,
                        label: 'Tidak Diketahui'
                    };
            }
        } else if (type === 'used') {
            // Status terpasang/belum terpasang berdasarkan field used_status (1 = terpasang, 0 = belum terpasang)
            switch (status) {
                case 1:
                case 'Sudah Terpasang':
                    return {
                        bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
                        text: 'text-white',
                        pulse: true,
                        label: 'Sudah Terpasang'
                    };
                case 0:
                case 'Belum Terpasang':
                    return {
                        bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
                        text: 'text-white', 
                        pulse: false,
                        label: 'Belum Terpasang'
                    };
                default:
                    return {
                        bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
                        text: 'text-white',
                        pulse: false,
                        label: 'Tidak Diketahui'
                    };
            }
        }
        
        // Fallback untuk compatibility dengan komponen lama
        switch (status) {
            case 'Aktif': return {
                bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
                text: 'text-white',
                pulse: true,
                label: 'Aktif'
            };
            case 'Nonaktif': return {
                bg: 'bg-gradient-to-r from-red-500 to-rose-500',
                text: 'text-white', 
                pulse: false,
                label: 'Nonaktif'
            };
            default: return {
                bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
                text: 'text-white',
                pulse: false,
                label: status || 'Tidak Diketahui'
            };
        }
    }, [status, type]);

    return (
        <div className="relative">
            <span className={`px-4 py-2 text-xs font-bold rounded-full inline-flex items-center shadow-lg ${config.bg} ${config.text} transition-all duration-300 hover:scale-105`}>
                {config.label}
                {config.pulse && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white bg-opacity-50 rounded-full animate-ping"></div>
                )}
            </span>
        </div>
    );
};

export default StatusBadgeNew;