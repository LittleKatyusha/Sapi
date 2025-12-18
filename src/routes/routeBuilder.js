// Production-Ready Route Builder with Clean Architecture
import { ROUTE_GROUPS, ROUTE_METADATA } from './constants';

/**
 * Route Builder - Creates production-ready route configurations
 * Supports metadata, caching, permissions, and performance optimization
 */
export class RouteBuilder {
  constructor() {
    this.routes = [];
  }

  /**
   * Add route with metadata
   * @param {Object} config - Route configuration
   * @param {string} config.path - Route path
   * @param {React.Component} config.element - Route component (lazy loaded)
   * @param {Object} config.metadata - Route metadata
   */
  addRoute({ path, element, nestedRoutes, metadata = {} }) {
    const routeConfig = {
      path,
      element,
      nestedRoutes,
      // Default metadata with production features
      metadata: {
        group: metadata.group || ROUTE_GROUPS.AUTH,
        cache: metadata.cache || ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: metadata.priority || ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: metadata.permission || ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED,
        analytics: {
          track: true,
          category: metadata.group || ROUTE_GROUPS.AUTH,
          ...metadata.analytics
        },
        performance: {
          preload: metadata.preload || false,
          prefetch: metadata.prefetch || false,
          ...metadata.performance
        },
        features: {
          breadcrumb: true,
          navigation: true,
          bookmark: true,
          ...metadata.features
        },
        validation: {
          searchParams: metadata.searchParams || [],
          performance_budget: metadata.performance_budget || null,
          ...metadata.validation
        },
        ...metadata
      }
    };

    this.routes.push(routeConfig);
    return this;
  }

  /**
   * Add nested routes configuration
   */
  addNestedRoute({ prefix, children }) {
    const nestedConfig = {
      path: prefix,
      nestedRoutes: children,
      metadata: {
        group: ROUTE_GROUPS.BONING,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED
      }
    };

    this.routes.push(nestedConfig);
    return this;
  }

  /**
   * Get all routes with standardized configuration
   */
  getRoutes() {
    return Object.freeze([...this.routes]);
  }

  /**
   * Get routes by group for analytics/permission handling
   */
  getRoutesByGroup(group) {
    return this.routes.filter(route => route.metadata.group === group);
  }

  /**
   * Get critical paths (for preloading)
   */
  getCriticalPaths() {
    return this.routes.filter(route =>
      route.metadata.priority === ROUTE_METADATA.LOAD_PRIORITY.CRITICAL
    );
  }

  /**
   * Get routes requiring authentication
   */
  getAuthenticatedRoutes() {
    return this.routes.filter(route =>
      route.metadata.permission !== ROUTE_METADATA.PERMISSION_LEVEL.PUBLIC
    );
  }

  /**
   * Validate route configuration (development/production sanity checks)
   */
  validate() {
    const errors = [];

    this.routes.forEach((route, index) => {
      // Path validation
      if (!route.path || typeof route.path !== 'string') {
        errors.push(`Route ${index}: Invalid path`);
      }

      // Element validation
      if (!route.element && !route.nestedRoutes) {
        errors.push(`Route ${index} (${route.path}): Missing element or nestedRoutes`);
      }

      // Metadata validation
      if (!route.metadata.group) {
        errors.push(`Route ${index} (${route.path}): Missing route group`);
      }
    });

    if (errors.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Route Configuration Errors:', errors);
      }
      return { valid: false, errors };
    }

    return { valid: true };
  }
}

// Export singleton builder instance
export const routeBuilder = new RouteBuilder();

// Performance and caching utilities
export const RouteCache = {
  /**
   * Preload critical routes
   */
  async preloadCritical() {
    const criticalRoutes = routeBuilder.getCriticalPaths();

    const preloadPromises = criticalRoutes.map(route => {
      // Preload logic - in production this could be more sophisticated
      if (route.metadata.performance.preload && route.element) {
        return import(route.element.lazyPath || route.path);
      }
      return Promise.resolve();
    });

    try {
      await Promise.all(preloadPromises);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Critical routes preloaded');
      }
    } catch (error) {
      console.warn('⚠️ Some critical routes failed to preload:', error);
    }
  },

  /**
   * Analytics tracking for route changes
   */
  trackRouteChange(path, metadata) {
    // Production analytics integration point
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('config', process.env.REACT_APP_GA_TRACKING_ID, {
        page_path: path,
        custom_map: {
          route_group: metadata.group,
          route_priority: metadata.priority
        }
      });
    }
  }
};

// Route utilities for navigation
export const RouteUtils = {
  /**
   * Generate breadcrumb from path
   */
  generateBreadcrumb(path, routeMetadata) {
    const segments = path.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      label: routeMetadata.labels?.[segment] || segment.replace('-', ' ').toUpperCase(),
      path: '/' + segments.slice(0, index + 1).join('/'),
      active: index === segments.length - 1
    }));
  },

  /**
   * Check if route requires authentication
   */
  requiresAuth(metadata) {
    return metadata.permission !== ROUTE_METADATA.PERMISSION_LEVEL.PUBLIC;
  },

  /**
   * Validate search params for route
   */
  validateSearchParams(path, searchParams, routeValidation) {
    if (!routeValidation || !routeValidation.searchParams) return true;

    const allowedParams = routeValidation.searchParams;
    const currentParams = new URLSearchParams(searchParams);

    for (let [key] of currentParams) {
      if (!allowedParams.includes(key)) {
        console.warn(`⛔ Invalid search param '${key}' for route '${path}'`);
        return false;
      }
    }

    return true;
  },

  /**
   * Performance budget validation
   */
  validatePerformance(path, routeMetadata) {
    if (!routeMetadata.validation?.performance_budget) return;

    const budget = routeMetadata.validation.performance_budget;

    // Measure route load time (simplified - would be more comprehensive in production)
    const loadTime = performance.now();

    if (loadTime > budget) {
      console.warn(`🐌 Route '${path}' exceeded performance budget: ${loadTime.toFixed(2)}ms > ${budget}ms`);
      // Could send to monitoring service in production
    }
  }
};
