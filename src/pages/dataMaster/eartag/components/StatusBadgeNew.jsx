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
        <div className="relative flex items-center justify-center">
            <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center ${config.bg} ${config.text} transition-all duration-200 whitespace-nowrap`}>
                {config.label}
                {config.pulse && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white bg-opacity-60 rounded-full animate-ping"></div>
                )}
            </span>
        </div>
    );
};

export default StatusBadgeNew;