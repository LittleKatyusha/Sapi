import React, { useEffect } from 'react';

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

    const getStyles = () => {
        switch (notification.type) {
            case 'success':
                return {
                    container: 'border-green-400 bg-green-50 text-green-800',
                    bgIcon: 'bg-green-100',
                    iconColor: 'text-green-600',
                    title: 'Berhasil!'
                };
            case 'error':
                return {
                    container: 'border-red-400 bg-red-50 text-red-800',
                    bgIcon: 'bg-red-100',
                    iconColor: 'text-red-600',
                    title: 'Error!'
                };
            case 'info':
            default:
                return {
                    container: 'border-blue-400 bg-blue-50 text-blue-800',
                    bgIcon: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    title: 'Informasi'
                };
        }
    };

    const styles = getStyles();

    return (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
            <div className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${styles.container}`}>
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <div className={`w-6 h-6 ${styles.bgIcon} rounded-full flex items-center justify-center`}>
                                {notification.type === 'success' ? (
                                    <svg className={`w-4 h-4 ${styles.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : notification.type === 'error' ? (
                                    <svg className={`w-4 h-4 ${styles.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${styles.iconColor}`}></div>
                                )}
                            </div>
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium">
                                {styles.title}
                            </p>
                            <p className="mt-1 text-sm opacity-90">
                                {notification.message}
                            </p>
                        </div>
                        {onClose && (
                            <div className="ml-4 flex-shrink-0 flex">
                                <button
                                    onClick={onClose}
                                    className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    <span className="sr-only">Tutup</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { Notification };
export default Notification;
