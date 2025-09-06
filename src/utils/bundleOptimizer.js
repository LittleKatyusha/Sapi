/**
 * Bundle Optimization Utilities
 * Provides utilities for optimizing bundle size and loading performance
 */

/**
 * Dynamic import wrapper with error handling and loading states
 */
export const dynamicImport = (importFn, fallback = null) => {
  return async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      if (fallback) {
        return fallback;
      }
      throw error;
    }
  };
};

/**
 * Preload critical resources
 */
export const preloadResource = (href, as = 'script', crossorigin = null) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (crossorigin) {
    link.crossOrigin = crossorigin;
  }
  
  document.head.appendChild(link);
};

/**
 * Prefetch non-critical resources
 */
export const prefetchResource = (href) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  
  document.head.appendChild(link);
};

/**
 * Tree-shaking helper for conditional imports
 */
export const conditionalImport = async (condition, importFn) => {
  if (!condition) return null;
  
  try {
    return await importFn();
  } catch (error) {
    console.error('Conditional import failed:', error);
    return null;
  }
};

/**
 * Chunk loading optimization
 */
export const optimizeChunkLoading = () => {
  // Preload critical chunks based on route patterns
  const criticalRoutes = ['/dashboard', '/login'];
  const currentPath = window.location.pathname;
  
  if (criticalRoutes.includes(currentPath)) {
    // Preload commonly accessed routes
    const commonRoutes = ['/settings', '/reports'];
    commonRoutes.forEach(route => {
      // This would be implemented based on your routing structure
      console.log(`Preloading route: ${route}`);
    });
  }
};

/**
 * Service Worker registration for caching
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Critical CSS inlining helper
 */
export const inlineCriticalCSS = (css) => {
  if (typeof window === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

/**
 * Font loading optimization
 */
export const optimizeFontLoading = (fontFamilies = []) => {
  if (typeof window === 'undefined' || !('fonts' in document)) return;
  
  fontFamilies.forEach(async (fontFamily) => {
    try {
      await document.fonts.load(`1em ${fontFamily}`);
      console.log(`Font loaded: ${fontFamily}`);
    } catch (error) {
      console.warn(`Font loading failed: ${fontFamily}`, error);
    }
  });
};

/**
 * Image optimization helpers
 */
export const generateSrcSet = (baseUrl, sizes = [320, 640, 1024, 1280]) => {
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
};

export const generateSizes = (breakpoints = {
  mobile: '100vw',
  tablet: '50vw',
  desktop: '33vw'
}) => {
  const queries = [];
  
  if (breakpoints.desktop) {
    queries.push(`(min-width: 1024px) ${breakpoints.desktop}`);
  }
  if (breakpoints.tablet) {
    queries.push(`(min-width: 768px) ${breakpoints.tablet}`);
  }
  if (breakpoints.mobile) {
    queries.push(breakpoints.mobile);
  }
  
  return queries.join(', ');
};

/**
 * Bundle analyzer helper (development only)
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  // This would integrate with webpack-bundle-analyzer or similar
  console.log('Bundle analysis would run here in development');
  
  // Log current bundle information
  if (performance && performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));
    
    console.log('JS Resources:', jsResources.length);
    console.log('CSS Resources:', cssResources.length);
    
    const totalSize = resources.reduce((acc, resource) => {
      return acc + (resource.transferSize || 0);
    }, 0);
    
    console.log(`Total transferred: ${(totalSize / 1024).toFixed(2)} KB`);
  }
};

/**
 * Memory cleanup utilities
 */
export const cleanupMemory = () => {
  // Clear any global caches
  if (window.caches) {
    // Clean old cache entries
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old-') || name.includes('temp-')) {
          caches.delete(name);
        }
      });
    });
  }
  
  // Force garbage collection if available (Chrome DevTools)
  if (window.gc && process.env.NODE_ENV === 'development') {
    window.gc();
  }
};

/**
 * Performance budget checker
 */
export const checkPerformanceBudget = (budgets = {
  firstContentfulPaint: 2000,
  largestContentfulPaint: 4000,
  firstInputDelay: 100,
  cumulativeLayoutShift: 0.1
}) => {
  if (!('PerformanceObserver' in window)) return;
  
  // Check FCP
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        const fcp = entry.startTime;
        if (fcp > budgets.firstContentfulPaint) {
          console.warn(`FCP budget exceeded: ${fcp}ms > ${budgets.firstContentfulPaint}ms`);
        }
      }
    }
  }).observe({ entryTypes: ['paint'] });
  
  // Check LCP
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const lcp = entry.startTime;
      if (lcp > budgets.largestContentfulPaint) {
        console.warn(`LCP budget exceeded: ${lcp}ms > ${budgets.largestContentfulPaint}ms`);
      }
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });
  
  // Check CLS
  new PerformanceObserver((list) => {
    let cls = 0;
    for (const entry of list.getEntries()) {
      cls += entry.value;
    }
    if (cls > budgets.cumulativeLayoutShift) {
      console.warn(`CLS budget exceeded: ${cls} > ${budgets.cumulativeLayoutShift}`);
    }
  }).observe({ entryTypes: ['layout-shift'] });
};

export default {
  dynamicImport,
  preloadResource,
  prefetchResource,
  conditionalImport,
  optimizeChunkLoading,
  registerServiceWorker,
  inlineCriticalCSS,
  optimizeFontLoading,
  generateSrcSet,
  generateSizes,
  analyzeBundleSize,
  cleanupMemory,
  checkPerformanceBudget
};
