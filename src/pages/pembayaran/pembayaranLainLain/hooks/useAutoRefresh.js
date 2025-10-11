import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useAutoRefresh = (fetchData, refreshInterval = 30000, dependencies = []) => {
    const lastRefreshTime = useRef(Date.now());
    const location = useLocation();

    const refreshData = useCallback(() => {
        fetchData();
        lastRefreshTime.current = Date.now();
    }, [fetchData]);

    // Auto-refresh when user returns to the page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Check if it's been more than the refresh interval since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
                if (timeSinceLastRefresh > refreshInterval) {
                    refreshData();
                }
            }
        };

        const handleFocus = () => {
            // Check if it's been more than the refresh interval since last refresh
            const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
            if (timeSinceLastRefresh > refreshInterval) {
                refreshData();
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
    }, [refreshInterval, refreshData]);

    // Refresh data when returning from edit page
    useEffect(() => {
        // Check if we're returning from an edit page
        if (location.state?.fromEdit) {
            console.log('🔄 Auto-refreshing data after returning from edit page');
            refreshData();
            
            // Clear the state to prevent unnecessary refreshes
            window.history.replaceState({}, document.title);
        }
    }, [location.state, refreshData]);

    // Optional: Auto-refresh at intervals
    useEffect(() => {
        if (refreshInterval && refreshInterval > 0) {
            const intervalId = setInterval(() => {
                if (!document.hidden) {
                    refreshData();
                }
            }, refreshInterval);

            return () => clearInterval(intervalId);
        }
    }, [refreshInterval, refreshData]);

    return {
        refreshData,
        lastRefreshTime: lastRefreshTime.current
    };
};

export default useAutoRefresh;