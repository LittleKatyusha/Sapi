import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    // status: 1 = aktif, 0 = tidak aktif
    const isActive = status === 1;
    
    return (
        <div className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium ${
            isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
        }`}>
            {isActive ? 'Aktif' : 'Tidak Aktif'}
        </div>
    );
};

export default StatusBadge;