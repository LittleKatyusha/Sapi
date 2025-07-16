import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    if (status === 1) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Aktif
            </span>
        );
    } else {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                Tidak Aktif
            </span>
        );
    }
};

export default StatusBadge;