import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 1:
                return {
                    text: 'Aktif',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-200',
                    icon: CheckCircle,
                    iconColor: 'text-green-600'
                };
            case 0:
                return {
                    text: 'Tidak Aktif',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    borderColor: 'border-red-200',
                    icon: XCircle,
                    iconColor: 'text-red-600'
                };
            default:
                return {
                    text: 'Unknown',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-200',
                    icon: XCircle,
                    iconColor: 'text-gray-600'
                };
        }
    };

    const config = getStatusConfig();
    const IconComponent = config.icon;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} transition-all duration-200 hover:scale-105`}>
            <IconComponent className={`w-3 h-3 mr-1.5 ${config.iconColor}`} />
            {config.text}
        </span>
    );
};

export default StatusBadge;