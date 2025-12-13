import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification } from './NotificationComponent'; // Import the component

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
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

    const value = {
        notification,
        showSuccess,
        showError,
        showInfo,
        hideNotification,
        setNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <Notification
                notification={notification}
                onClose={hideNotification}
            />
        </NotificationContext.Provider>
    );
};

// Hook to use notification
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Export the component as default for backward compatibility if needed
export default Notification;
