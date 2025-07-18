import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const Notification = ({ show, message, type = 'success', onClose, autoClose = true, duration = 3000 }) => {
    useEffect(() => {
        if (show && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, autoClose, duration, onClose]);

    if (!show) return null;

    const typeConfig = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-100',
            borderColor: 'border-green-200',
            iconColor: 'text-green-600',
            textColor: 'text-green-800'
        },
        error: {
            icon: XCircle,
            bgColor: 'bg-red-100',
            borderColor: 'border-red-200',
            iconColor: 'text-red-600',
            textColor: 'text-red-800'
        }
    };

    const config = typeConfig[type] || typeConfig.success;
    const Icon = config.icon;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full">
            <div className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Icon className={`w-5 h-5 ${config.iconColor} mr-3`} />
                        <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`ml-4 ${config.textColor} hover:opacity-70 transition-opacity`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notification;