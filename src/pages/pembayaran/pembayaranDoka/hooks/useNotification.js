import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing notification state with auto-hide functionality
 */
export const useNotification = (autoHideDelay = 5000) => {
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  // Show success notification
  const showSuccess = useCallback((message) => {
    showNotification('success', message);
  }, [showNotification]);

  // Show error notification
  const showError = useCallback((message) => {
    showNotification('error', message);
  }, [showNotification]);

  // Show info notification
  const showInfo = useCallback((message) => {
    showNotification('info', message);
  }, [showNotification]);

  // Hide notification
  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Auto-hide notification after specified delay
  useEffect(() => {
    if (notification && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [notification, autoHideDelay]);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    hideNotification
  };
};