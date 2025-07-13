import React, { useMemo } from 'react';

const StatusBadge = ({ status }) => {
    const config = useMemo(() => {
        switch (status) {
            case 'Aktif': return {
                bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
                text: 'text-white',
                pulse: true
            };
            case 'Nonaktif': return {
                bg: 'bg-gradient-to-r from-red-500 to-rose-500',
                text: 'text-white', 
                pulse: false
            };
            default: return {
                bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
                text: 'text-white',
                pulse: false
            };
        }
    }, [status]);

    return (
        <div className="relative">
            <span className={`px-4 py-2 text-xs font-bold rounded-full inline-flex items-center shadow-lg ${config.bg} ${config.text} transition-all duration-300 hover:scale-105`}>
                {status}
                {config.pulse && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                )}
            </span>
        </div>
    );
};

export default StatusBadge;