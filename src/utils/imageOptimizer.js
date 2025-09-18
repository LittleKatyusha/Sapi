/**
 * Image Optimization Utilities
 * Provides utilities for optimizing image loading and performance
 */

/**
 * Generate responsive image srcSet
 */
export const generateSrcSet = (baseUrl, sizes = [320, 640, 1024, 1280, 1920]) => {
  return sizes.map(size => `${baseUrl}?w=${size}&q=80 ${size}w`).join(', ');
};

/**
 * Generate responsive image sizes attribute
 */
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
 * Preload critical images
 */
export const preloadImage = (src, crossorigin = null) => {
  if (typeof window === 'undefined') return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    if (crossorigin) {
      link.crossOrigin = crossorigin;
    }
    
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    
    document.head.appendChild(link);
  });
};

/**
 * Lazy load image with Intersection Observer
 */
export const createLazyImageObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };
  
  const observerOptions = { ...defaultOptions, ...options };
  
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without Intersection Observer
    return {
      observe: (element) => callback([{ target: element, isIntersecting: true }]),
      unobserve: () => {},
      disconnect: () => {}
    };
  }
  
  return new IntersectionObserver(callback, observerOptions);
};

/**
 * Check WebP support
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * Get optimized image URL based on device capabilities
 */
export const getOptimizedImageUrl = (baseUrl, options = {}) => {
  const {
    width = 800,
    height = null,
    quality = 80,
    format = 'auto'
  } = options;
  
  const params = new URLSearchParams();
  params.set('w', width.toString());
  params.set('q', quality.toString());
  
  if (height) {
    params.set('h', height.toString());
  }
  
  if (format === 'auto') {
    params.set('f', supportsWebP() ? 'webp' : 'jpg');
  } else {
    params.set('f', format);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Create placeholder image (base64 encoded)
 */
export const createPlaceholder = (width = 400, height = 300, color = '#f0f0f0') => {
  if (typeof window === 'undefined') return '';
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/png');
};

/**
 * Image performance monitoring
 */
export const monitorImagePerformance = () => {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.initiatorType === 'img') {
        console.log('Image Performance:', {
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize,
          decodedBodySize: entry.decodedBodySize
        });
      }
    }
  });
  
  observer.observe({ entryTypes: ['resource'] });
  
  return observer;
};

/**
 * Batch image preloader
 */
export const preloadImages = (urls, options = {}) => {
  const { concurrency = 3, timeout = 10000 } = options;
  
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let completed = 0;
    let index = 0;
    
    const loadNext = () => {
      if (index >= urls.length) {
        if (completed === urls.length) {
          resolve({ results, errors });
        }
        return;
      }
      
      const url = urls[index++];
      const img = new Image();
      
      const timeoutId = setTimeout(() => {
        errors.push({ url, error: 'Timeout' });
        completed++;
        loadNext();
      }, timeout);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        results.push({ url, img });
        completed++;
        loadNext();
      };
      
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        errors.push({ url, error });
        completed++;
        loadNext();
      };
      
      img.src = url;
    };
    
    // Start concurrent loading
    for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
      loadNext();
    }
  });
};

export default {
  generateSrcSet,
  generateSizes,
  preloadImage,
  createLazyImageObserver,
  supportsWebP,
  getOptimizedImageUrl,
  createPlaceholder,
  monitorImagePerformance,
  preloadImages
};
