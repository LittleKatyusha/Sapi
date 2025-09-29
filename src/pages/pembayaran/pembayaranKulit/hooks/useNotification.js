import { useState, useCallback, useEffect } from 'react';

export const useNotification = () => {
    const [notification, setNotification] = useState(null);

    const showSuccess = useCallback((message) => {
        setNotification({ type: 'success', message });
    }, []);

    const showError = useCallback((message) => {
        setNotification({ type: 'error', message });
    }, []);

    const showInfo = useCallback((message) => {
        setNotification({ type: 'info', message });
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(null);
    }, []);

    // Auto-hide notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                hideNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, hideNotification]);

    return {
        notification,
        showSuccess,
        showError,
        showInfo,
        hideNotification,
        setNotification
    };
};

export default useNotification;