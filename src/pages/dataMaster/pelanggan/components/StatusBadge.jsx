import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    // status: 1 = aktif, 0 = tidak aktif
    const isActive = status === 1;
    
    return (
        <div className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
            isActive 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
            {isActive ? (
                <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
                <XCircle className="w-3 h-3 mr-1" />
            )}
            {isActive ? 'Aktif' : 'Tidak Aktif'}
        </div>
    );
};

export default StatusBadge;