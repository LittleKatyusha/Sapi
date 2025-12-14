import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './AppSecure.jsx';
import reportWebVitals from './reportWebVitals';
import performanceMonitor from './utils/performanceMonitor';
import { initializeCorsMonitoring } from './utils/corsHelper';
import bundleOptimizer from './utils/bundleOptimizer';
import { monitorImagePerformance } from './utils/imageOptimizer';
import { optimizeAnimations } from './utils/cssOptimizer';

// Environment validation
if (process.env.NODE_ENV === 'development') {
  // Suppress React DevTools console message in development
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('Download the React DevTools') || 
        message.includes('reactjs.org/link/react-devtools')) {
      return; // Suppress React DevTools message
    }
    originalLog.apply(console, args);
  };

  // Development environment checks
  console.log('🚀 Application starting in development mode');
  
  // Check for required environment variables
  const requiredEnvVars = ['REACT_APP_API_URL'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingEnvVars);
  }
}

// Production environment setup
if (process.env.NODE_ENV === 'production') {
  // Disable console logs in production (optional)
  if (process.env.REACT_APP_DISABLE_CONSOLE === 'true') {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Create Query Client with optimized default options for preventing redundant API calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - Keep in cache for 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3; // Retry up to 3 times for network/server errors
      },
      refetchOnWindowFocus: 'always', // Always refetch when window gains focus
      refetchOnMount: true, // Always refetch on mount (prevents stale data)
      refetchOnReconnect: 'always', // Always refetch on network reconnect
      networkMode: 'offlineFirst', // Try cache first, then network
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      networkMode: 'always', // Mutations always go to network
    },
  },
});

// Initialize performance monitoring
performanceMonitor.init();

// Initialize CORS monitoring
initializeCorsMonitoring();

// Initialize production optimizations
if (process.env.NODE_ENV === 'production') {
  // Register service worker for caching
  bundleOptimizer.registerServiceWorker();
  
  // Check performance budgets
  bundleOptimizer.checkPerformanceBudget({
    firstContentfulPaint: parseInt(process.env.REACT_APP_PERFORMANCE_BUDGET_FCP) || 2000,
    largestContentfulPaint: parseInt(process.env.REACT_APP_PERFORMANCE_BUDGET_LCP) || 4000,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1
  });
  
  // Optimize chunk loading
  bundleOptimizer.optimizeChunkLoading();
  
  // Clean up memory periodically
  setInterval(() => {
    bundleOptimizer.cleanupMemory();
  }, 300000); // Every 5 minutes
}

// Initialize CSS optimizations
optimizeAnimations();

// Initialize image performance monitoring
if (process.env.REACT_APP_MEASURE_PERFORMANCE === 'true') {
  monitorImagePerformance();
}

// Enable bundle analysis in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_ENABLE_BUNDLE_ANALYSIS === 'true') {
  bundleOptimizer.analyzeBundleSize();
}

// Render application
// Note: StrictMode removed to prevent double rendering issues with certain components
performanceMonitor.startTiming('app-render');
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
performanceMonitor.endTiming('app-render');

// Performance monitoring
// Only measure performance if explicitly enabled
if (process.env.REACT_APP_MEASURE_PERFORMANCE === 'true') {
  reportWebVitals(console.log);
  
  // Log initial memory usage
  performanceMonitor.logMemoryUsage('Initial Load');
} else {
  reportWebVitals();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.cleanup();
});
