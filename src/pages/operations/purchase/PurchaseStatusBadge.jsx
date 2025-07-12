import React, { useMemo } from 'react';
import { PackageCheck, ClipboardList, XCircle } from 'lucide-react';

/**
 * Badge component for displaying purchase status with appropriate styling and icons
 * @param {string} status - Purchase status (Diterima, Dipesan, Dibatalkan)
 */
const PurchaseStatusBadge = ({ status }) => {
    const config = useMemo(() => {
        const statusConfigs = {
            'Diterima': { 
                className: 'bg-green-100 text-green-800', 
                icon: <PackageCheck size={12} /> 
            },
            'Dipesan': { 
                className: 'bg-blue-100 text-blue-800', 
                icon: <ClipboardList size={12} /> 
            },
            'Dibatalkan': { 
                className: 'bg-red-100 text-red-800', 
                icon: <XCircle size={12} /> 
            }
        };
        
        return statusConfigs[status] || { 
            className: 'bg-gray-100 text-gray-800', 
            icon: null 
        };
    }, [status]);

    return (
        <span className={`flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.className}`}>
            {config.icon && <span className="mr-1.5">{config.icon}</span>}
            {status}
        </span>
    );
};

export default PurchaseStatusBadge;
