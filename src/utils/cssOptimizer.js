/**
 * CSS Optimization Utilities
 * Provides utilities for optimizing CSS loading and performance
 */

/**
 * Critical CSS inlining utility
 */
export const inlineCriticalCSS = (css) => {
  if (typeof window === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
};

/**
 * Load non-critical CSS asynchronously
 */
export const loadCSS = (href, media = 'all') => {
  if (typeof window === 'undefined') return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print'; // Load as print first to avoid render blocking
    link.onload = () => {
      link.media = media; // Switch to target media after load
      resolve(link);
    };
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    
    document.head.appendChild(link);
  });
};

/**
 * Preload CSS files
 */
export const preloadCSS = (href) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  
  document.head.appendChild(link);
};

/**
 * Optimize CSS custom properties (CSS variables)
 */
export const optimizeCSSVariables = (variables = {}) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(`--${property}`, value);
  });
};

/**
 * Create CSS media query observer
 */
export const createMediaQueryObserver = (queries = {}) => {
  if (typeof window === 'undefined') return {};
  
  const observers = {};
  
  Object.entries(queries).forEach(([name, query]) => {
    const mediaQuery = window.matchMedia(query);
    
    observers[name] = {
      matches: mediaQuery.matches,
      addListener: (callback) => {
        if (mediaQuery.addListener) {
          mediaQuery.addListener(callback);
        } else {
          mediaQuery.addEventListener('change', callback);
        }
      },
      removeListener: (callback) => {
        if (mediaQuery.removeListener) {
          mediaQuery.removeListener(callback);
        } else {
          mediaQuery.removeEventListener('change', callback);
        }
      }
    };
  });
  
  return observers;
};

/**
 * CSS animation performance optimizer
 */
export const optimizeAnimations = () => {
  if (typeof window === 'undefined') return;
  
  // Prefer transform and opacity for animations
  const style = document.createElement('style');
  style.textContent = `
    .optimized-animation {
      will-change: transform, opacity;
      transform: translateZ(0); /* Force hardware acceleration */
    }
    
    .optimized-animation.animate {
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    
    /* Reduce motion for users who prefer it */
    @media (prefers-reduced-motion: reduce) {
      .optimized-animation {
        transition: none !important;
        animation: none !important;
      }
    }
  `;
  
  document.head.appendChild(style);
};

/**
 * CSS containment utility
 */
export const applyContainment = (selector, containment = 'layout style paint') => {
  if (typeof window === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = `
    ${selector} {
      contain: ${containment};
    }
  `;
  
  document.head.appendChild(style);
};

/**
 * Responsive image CSS generator
 */
export const generateResponsiveImageCSS = (breakpoints = {}) => {
  const defaultBreakpoints = {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)'
  };
  
  const bp = { ...defaultBreakpoints, ...breakpoints };
  
  return `
    .responsive-image {
      width: 100%;
      height: auto;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }
    
    .responsive-image.loading {
      opacity: 0.5;
    }
    
    .responsive-image.loaded {
      opacity: 1;
    }
    
    @media ${bp.mobile} {
      .responsive-image {
        max-width: 100vw;
      }
    }
    
    @media ${bp.tablet} {
      .responsive-image {
        max-width: 50vw;
      }
    }
    
    @media ${bp.desktop} {
      .responsive-image {
        max-width: 33vw;
      }
    }
  `;
};

/**
 * CSS performance monitoring
 */
export const monitorCSSPerformance = () => {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.initiatorType === 'css' || entry.name.includes('.css')) {
        console.log('CSS Performance:', {
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
 * CSS minification utility (basic)
 */
export const minifyCSS = (css) => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
    .replace(/\s*{\s*/g, '{') // Clean up braces
    .replace(/}\s*/g, '}') // Clean up closing braces
    .replace(/;\s*/g, ';') // Clean up semicolons
    .trim();
};

export default {
  inlineCriticalCSS,
  loadCSS,
  preloadCSS,
  optimizeCSSVariables,
  createMediaQueryObserver,
  optimizeAnimations,
  applyContainment,
  generateResponsiveImageCSS,
  monitorCSSPerformance,
  minifyCSS
};
