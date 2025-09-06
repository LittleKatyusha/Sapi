/**
 * Dynamic Document Title Hook
 * Updates the document title based on current route and application state
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { pageTitleMap } from '../config/pageTitleMap';

const DEFAULT_TITLE = 'TernaSys - Dashboard CV Puput Bersaudara';
const TITLE_SEPARATOR = ' | ';

export const useDocumentTitle = (customTitle = null, options = {}) => {
  const location = useLocation();
  const previousTitle = useRef(document.title);
  
  const {
    suffix = 'TernaSys',
    prefix = '',
    separator = TITLE_SEPARATOR,
    updateOnRouteChange = true,
    resetOnUnmount = false
  } = options;

  useEffect(() => {
    let newTitle = DEFAULT_TITLE;

    if (customTitle) {
      // Use custom title if provided
      newTitle = customTitle;
    } else if (updateOnRouteChange) {
      // Use route-based title from pageTitleMap
      const routeTitle = pageTitleMap[location.pathname];
      if (routeTitle) {
        newTitle = routeTitle;
      }
    }

    // Add prefix and suffix if provided
    if (prefix) {
      newTitle = `${prefix}${separator}${newTitle}`;
    }
    
    if (suffix && !newTitle.includes(suffix)) {
      newTitle = `${newTitle}${separator}${suffix}`;
    }

    // Update document title
    document.title = newTitle;

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📄 Title updated: "${newTitle}"`);
    }

    // Cleanup function
    return () => {
      if (resetOnUnmount) {
        document.title = previousTitle.current;
      }
    };
  }, [customTitle, location.pathname, prefix, suffix, separator, updateOnRouteChange, resetOnUnmount]);

  // Return function to manually update title
  const setTitle = (title, temporary = false) => {
    const fullTitle = suffix && !title.includes(suffix) 
      ? `${title}${separator}${suffix}` 
      : title;
    
    document.title = fullTitle;
    
    if (temporary) {
      // Reset to default after a delay
      setTimeout(() => {
        const routeTitle = pageTitleMap[location.pathname] || DEFAULT_TITLE;
        const resetTitle = suffix && !routeTitle.includes(suffix)
          ? `${routeTitle}${separator}${suffix}`
          : routeTitle;
        document.title = resetTitle;
      }, 3000);
    }
  };

  return { setTitle, currentTitle: document.title };
};

/**
 * Hook for notification-style title updates
 * Useful for showing temporary notifications in the title
 */
export const useNotificationTitle = () => {
  const { setTitle } = useDocumentTitle();

  const showNotification = (message, duration = 3000) => {
    const originalTitle = document.title;
    setTitle(`🔔 ${message}`);
    
    setTimeout(() => {
      document.title = originalTitle;
    }, duration);
  };

  const showError = (message, duration = 5000) => {
    const originalTitle = document.title;
    setTitle(`❌ ${message}`);
    
    setTimeout(() => {
      document.title = originalTitle;
    }, duration);
  };

  const showSuccess = (message, duration = 3000) => {
    const originalTitle = document.title;
    setTitle(`✅ ${message}`);
    
    setTimeout(() => {
      document.title = originalTitle;
    }, duration);
  };

  return {
    showNotification,
    showError,
    showSuccess
  };
};

/**
 * Hook for loading state in title
 */
export const useLoadingTitle = (isLoading, loadingText = 'Memuat...') => {
  const { setTitle } = useDocumentTitle();
  const originalTitle = useRef(document.title);

  useEffect(() => {
    if (isLoading) {
      originalTitle.current = document.title;
      setTitle(`⏳ ${loadingText}`);
    } else {
      document.title = originalTitle.current;
    }
  }, [isLoading, loadingText, setTitle]);
};

export default useDocumentTitle;
