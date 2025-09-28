import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for managing auto-refresh functionality
 */
export const useAutoRefresh = (
  refreshFunction,
  refreshInterval = 30000, // 30 seconds
  dependencies = []
) => {
  const location = useLocation();
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Refresh data with timestamp update
  const refreshData = useCallback((...args) => {
    refreshFunction(...args);
    setLastRefreshTime(Date.now());
  }, [refreshFunction]);

  // Check if enough time has passed since last refresh
  const shouldRefresh = useCallback(() => {
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    return timeSinceLastRefresh > refreshInterval;
  }, [lastRefreshTime, refreshInterval]);

  // Handle visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && shouldRefresh()) {
        refreshData(...dependencies, false, true);
      }
    };

    const handleFocus = () => {
      if (shouldRefresh()) {
        refreshData(...dependencies, false, true);
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
  }, [refreshData, shouldRefresh, dependencies]);

  // Refresh data when returning from edit page
  useEffect(() => {
    // Check if we're returning from an edit page
    if (location.state?.fromEdit) {
      console.log('🔄 Auto-refreshing data after returning from edit page');
      console.log('🔄 Current dependencies:', dependencies);
      refreshData(...dependencies, false, true);
      
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refreshData, dependencies]);

  return {
    lastRefreshTime,
    refreshData,
    shouldRefresh
  };
};