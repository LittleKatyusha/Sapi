import { useEffect, useRef } from 'react';
import { AUTO_REFRESH_INTERVAL } from '../constants';

/**
 * Custom hook for auto-refresh functionality
 * @param {Function} fetchData - Function to fetch data
 * @param {Object} pagination - Pagination object
 * @param {string} searchTerm - Current search term
 */
export const useAutoRefresh = (fetchData, pagination, searchTerm) => {
  const lastRefreshTime = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
        if (timeSinceLastRefresh > AUTO_REFRESH_INTERVAL) {
          fetchData(pagination.currentPage, pagination.perPage, searchTerm, false, true);
          lastRefreshTime.current = Date.now();
        }
      }
    };

    const handleFocus = () => {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
      if (timeSinceLastRefresh > AUTO_REFRESH_INTERVAL) {
        fetchData(pagination.currentPage, pagination.perPage, searchTerm, false, true);
        lastRefreshTime.current = Date.now();
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for window focus (backup method)
    window.addEventListener('focus', handleFocus);

    // Cleanup listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, pagination.currentPage, pagination.perPage, searchTerm]);

  const refreshNow = () => {
    fetchData(pagination.currentPage, pagination.perPage, searchTerm, false, true);
    lastRefreshTime.current = Date.now();
  };

  return { refreshNow };
};
