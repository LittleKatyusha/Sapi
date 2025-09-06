import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './AppSecure.jsx';
import reportWebVitals from './reportWebVitals';
import performanceMonitor from './utils/performanceMonitor';
import { initializeCorsMonitoring } from './utils/corsHelper';

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

// Initialize performance monitoring
performanceMonitor.init();

// Initialize CORS monitoring
initializeCorsMonitoring();

// Render application
// Note: StrictMode removed to prevent double rendering issues with certain components
performanceMonitor.startTiming('app-render');
root.render(<App />);
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
