/**
 * Performance Monitoring Utilities
 * Provides comprehensive performance tracking and optimization helpers
 */

// Performance metrics collection
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.REACT_APP_MEASURE_PERFORMANCE === 'true';
  }

  // Start timing a operation
  startTiming(label) {
    if (!this.isEnabled) return;
    
    this.metrics.set(label, {
      startTime: performance.now(),
      startMark: `${label}-start`
    });
    
    performance.mark(`${label}-start`);
  }

  // End timing and log results
  endTiming(label) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(label);
    if (!metric) return;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    this.metrics.delete(label);
    return duration;
  }

  // Monitor component render times
  measureRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();
    
    this.startTiming(`render-${componentName}`);
    const result = renderFn();
    this.endTiming(`render-${componentName}`);
    
    return result;
  }

  // Monitor API call performance
  measureApiCall(endpoint, apiCall) {
    if (!this.isEnabled) return apiCall();
    
    this.startTiming(`api-${endpoint}`);
    
    if (apiCall instanceof Promise) {
      return apiCall.finally(() => {
        this.endTiming(`api-${endpoint}`);
      });
    } else {
      const result = apiCall();
      this.endTiming(`api-${endpoint}`);
      return result;
    }
  }

  // Setup Intersection Observer for lazy loading
  setupIntersectionObserver(callback, options = {}) {
    if (!('IntersectionObserver' in window)) return null;
    
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    const observer = new IntersectionObserver(callback, defaultOptions);
    return observer;
  }

  // Memory usage monitoring
  getMemoryUsage() {
    if (!performance.memory) return null;
    
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
    };
  }

  // Log memory usage
  logMemoryUsage(label = 'Memory Usage') {
    if (!this.isEnabled || process.env.NODE_ENV !== 'development') return;
    
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`🧠 ${label}:`, memory);
    }
  }

  // Setup performance observer for long tasks
  setupLongTaskObserver() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (error) {
      console.warn('Long task observer not supported');
    }
  }

  // Setup layout shift observer
  setupLayoutShiftObserver() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.value > 0.1) { // CLS threshold
            console.warn(`📐 Layout shift detected: ${entry.value.toFixed(4)}`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', observer);
    } catch (error) {
      console.warn('Layout shift observer not supported');
    }
  }

  // Initialize all observers
  init() {
    if (!this.isEnabled) return;
    
    this.setupLongTaskObserver();
    this.setupLayoutShiftObserver();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance monitoring initialized');
    }
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React component performance HOC
export const withPerformanceMonitoring = (WrappedComponent) => {
  const ComponentWithPerformanceMonitoring = (props) => {
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    
    return performanceMonitor.measureRender(componentName, () => (
      <WrappedComponent {...props} />
    ));
  };
  
  ComponentWithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithPerformanceMonitoring;
};

// Hook for performance monitoring
export const usePerformanceMonitoring = () => {
  return {
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    endTiming: performanceMonitor.endTiming.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    logMemoryUsage: performanceMonitor.logMemoryUsage.bind(performanceMonitor),
    getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor)
  };
};

export default performanceMonitor;
