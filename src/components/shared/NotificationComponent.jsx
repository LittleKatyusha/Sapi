import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const Notification = ({ notification, onClose }) => {
    useEffect(() => {
        if (notification && !onClose) {
            const timer = setTimeout(() => {
                // Auto-hide if no onClose provided (though it should be provided)
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClose]);

    if (!notification) return null;

    const getConfig = () => {
        switch (notification.type) {
            case 'success':
                return {
                    container: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300',
                    icon: <CheckCircle size={22} className="text-emerald-500" />,
                    iconBg: 'bg-emerald-100',
                    title: 'Berhasil!',
                    titleColor: 'text-emerald-800',
                    textColor: 'text-emerald-700',
                    dotColor: 'bg-emerald-400',
                };
            case 'error':
                return {
                    container: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300',
                    icon: <AlertTriangle size={22} className="text-red-500" />,
                    iconBg: 'bg-red-100',
                    title: 'Gagal!',
                    titleColor: 'text-red-800',
                    textColor: 'text-red-700',
                    dotColor: 'bg-red-400',
                };
            case 'info':
            default:
                return {
                    container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300',
                    icon: <Info size={22} className="text-blue-500" />,
                    iconBg: 'bg-blue-100',
                    title: 'Informasi',
                    titleColor: 'text-blue-800',
                    textColor: 'text-blue-700',
                    dotColor: 'bg-blue-400',
                };
        }
    };

    const config = getConfig();

    // Normalize details into an array of strings
    const detailItems = notification.details
        ? Array.isArray(notification.details)
            ? notification.details.map(d => (typeof d === 'string' ? d : JSON.stringify(d)))
            : typeof notification.details === 'string'
                ? notification.details.split('\n').filter(Boolean)
                : Object.values(notification.details).map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
        : [];

    const hasDetails = detailItems.length > 0;

    return (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
            <div className={`max-w-md w-full rounded-xl shadow-xl border ${config.container} backdrop-blur-sm`}>
                <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}>
                            {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-bold ${config.titleColor}`}>
                                {config.title}
                            </h3>
                            <p className={`mt-1 text-sm leading-relaxed ${config.textColor}`}>
                                {notification.message}
                            </p>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.iconBg} hover:opacity-70 transition-opacity`}
                            >
                                <X size={16} className={config.textColor} />
                            </button>
                        )}
                    </div>

                    {/* Details list */}
                    {hasDetails && (
                        <div className="mt-4 ml-[52px]">
                            <div className={`rounded-lg border ${config.iconBg} p-3 space-y-2`}>
                                {detailItems.map((detail, index) => (
                                    <div key={index} className="flex items-start gap-2.5">
                                        <span className={`mt-2 w-1.5 h-1.5 rounded-full ${config.dotColor} flex-shrink-0`}></span>
                                        <p className={`text-sm leading-relaxed ${config.textColor}`}>
                                            {detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export { Notification };
export default Notification;
