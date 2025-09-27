import { useState, useEffect } from 'react';
import { NOTIFICATION_TYPES } from '../constants';

/**
 * Custom hook for managing notifications
 * @returns {Object} Notification state and handlers
 */
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const showSuccess = (message) => {
    showNotification(NOTIFICATION_TYPES.SUCCESS, message);
  };

  const showError = (message) => {
    showNotification(NOTIFICATION_TYPES.ERROR, message);
  };

  const showInfo = (message) => {
    showNotification(NOTIFICATION_TYPES.INFO, message);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    hideNotification
  };
};
