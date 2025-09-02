import { useEffect } from 'react';

export const useSecurityMonitoring = () => {
  useEffect(() => {
    // Only apply security measures in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const cleanup = [];

    try {
      // Basic error handling
      const handleError = (event) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Global error:', event.error);
        }
        // In production, you might want to send this to a logging service
      };

      const handleUnhandledRejection = (event) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Unhandled promise rejection:', event.reason);
        }
        // In production, you might want to send this to a logging service
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      cleanup.push(() => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      });

      // Optional: Disable right-click in production (only if explicitly enabled)
      if (process.env.REACT_APP_DISABLE_RIGHT_CLICK === 'true') {
        const handleContextMenu = (e) => {
          e.preventDefault();
        };

        document.addEventListener('contextmenu', handleContextMenu);
        cleanup.push(() => {
          document.removeEventListener('contextmenu', handleContextMenu);
        });
      }

      // Optional: Disable developer shortcuts (only if explicitly enabled)
      if (process.env.REACT_APP_DISABLE_DEV_SHORTCUTS === 'true') {
        const handleKeyDown = (e) => {
          // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
          if (e.key === 'F12' || 
              (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
              (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        cleanup.push(() => {
          document.removeEventListener('keydown', handleKeyDown);
        });
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Security monitoring initialization failed:', error);
      }
    }

    // Cleanup function
    return () => {
      cleanup.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Cleanup error:', error);
          }
        }
      });
    };
  }, []);
};
