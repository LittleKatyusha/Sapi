// Production Route Hook - React hook for route metadata and utilities
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback, useMemo, useEffect } from 'react';
import { getRoutes, getRoutesByGroup } from './routeConfig';
import { RouteUtils, RouteCache } from './routeBuilder';
import { ROUTE_PATHS, ROUTE_GROUPS } from './constants';

/**
 * Production-ready route hook for React components
 * Provides route metadata, navigation utilities, and production features
 */
export function useRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Find current route metadata
  const currentRoute = useMemo(() => {
    const routes = getRoutes();
    return routes.find(route => {
      // Handle dynamic routes
      const routePattern = route.path.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern.replace(/\*/g, '.*')}$`);
      return regex.test(location.pathname);
    }) || null;
  }, [location.pathname]);

  // Route metadata
  const routeMetadata = useMemo(() => {
    return currentRoute?.metadata || {};
  }, [currentRoute]);

  // Breadcrumb generation
  const breadcrumb = useMemo(() => {
    if (!routeMetadata.features?.breadcrumb) return null;
    return RouteUtils.generateBreadcrumb(location.pathname, routeMetadata);
  }, [location.pathname, routeMetadata]);

  // Search params validation
  useEffect(() => {
    if (routeMetadata.validation?.searchParams) {
      const isValid = RouteUtils.validateSearchParams(
        location.pathname,
        location.search,
        routeMetadata.validation
      );

      if (!isValid && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Route search params validation failed - consider cleaning up URL');
      }
    }
  }, [location.pathname, location.search, routeMetadata.validation]);

  // Performance tracking
  useEffect(() => {
    if (routeMetadata.validation?.performance_budget) {
      // Track route load performance
      RouteUtils.validatePerformance(location.pathname, routeMetadata);
    }

    // Track route change for analytics
    if (process.env.NODE_ENV === 'production') {
      RouteCache.trackRouteChange(location.pathname, routeMetadata);
    }
  }, [location.pathname, routeMetadata]);

  // Navigation utilities (simplified to avoid hook violations)
  const navigation = useMemo(() => ({
    // Navigate to route using constants
    goToDashboard: () => navigate(ROUTE_PATHS.DASHBOARD),
    goToSales: () => navigate(ROUTE_PATHS.SALES),
    goToPurchases: () => navigate(ROUTE_PATHS.PURCHASES),
    goToReports: () => navigate(ROUTE_PATHS.REPORTS_NOTA_SUPPLIER),
    goToSettings: () => navigate(ROUTE_PATHS.SETTINGS),
    goToHR: () => navigate(ROUTE_PATHS.HR_EMPLOYEES),
    goToInventory: () => navigate(ROUTE_PATHS.LIVESTOCK_STOCK),
    goToMasterData: () => navigate(ROUTE_PATHS.MASTER_OFFICE_KANDANG),
    goToSystem: () => navigate(ROUTE_PATHS.SYSTEM_ROLES),

    // Navigate with parameters
    goToDetail: (type, id) => {
      const detailRoutes = {
        purchase: `${ROUTE_PATHS.HO_PURCHASE_DETAIL.replace(':id', id)}`,
        payment: `${ROUTE_PATHS.PAYMENT_DOKA_DETAIL.replace(':id', id)}`,
        // Add more as needed
      };
      const path = detailRoutes[type];
      if (path) navigate(path);
    },

    // Go back
    goBack: () => navigate(-1),

    // Go home
    goHome: () => navigate(ROUTE_PATHS.DASHBOARD),

    // Navigate with state
    navigateWithState: (path, state) => navigate(path, { state }),

    // Replace current history entry
    replace: (path, state) => navigate(path, { replace: true, state })
  }), [navigate]);

  // Route permissions
  const permissions = useMemo(() => ({
    requiresAuth: () => RouteUtils.requiresAuth(routeMetadata),
    requiresRole: () => routeMetadata.permission === 'role_based',
    canAccess: (userRoles = []) => {
      // Simplified permission check - integrate with your auth system
      if (routeMetadata.permission === 'public') return true;
      if (routeMetadata.permission === 'auth') return Boolean(userRoles.length);
      if (routeMetadata.permission === 'role_based') {
        // Check against required roles (extend as needed)
        return userRoles.some(role => ['admin', 'superadmin'].includes(role));
      }
      return false;
    }
  }), [routeMetadata.permission]);

  // Search params utilities
  const searchParamUtils = useMemo(() => ({
    get: (key, defaultValue = null) => searchParams.get(key) || defaultValue,
    getAll: (key) => searchParams.getAll(key),
    has: (key) => searchParams.has(key),
    set: (key, value) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (value === null) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
      setSearchParams(newSearchParams);
    },
    setMultiple: (params) => {
      const newSearchParams = new URLSearchParams(searchParams);
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });
      setSearchParams(newSearchParams);
    },
    remove: (key) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete(key);
      setSearchParams(newSearchParams);
    },
    clear: () => setSearchParams(new URLSearchParams()),
    toObject: () => Object.fromEntries(searchParams),
    toString: () => searchParams.toString()
  }), [searchParams, setSearchParams]);

  // Analytics and tracking
  const analytics = useMemo(() => ({
    track: (event, data) => {
      if (process.env.NODE_ENV === 'production' && routeMetadata.analytics?.track) {
        // Integrate with analytics service
        console.log('📊 Analytics:', { event, route: location.pathname, ...data });
      }
    },
    pageView: () => {
      analytics.track('page_view', {
        group: routeMetadata.group,
        priority: routeMetadata.priority
      });
    }
  }), [routeMetadata, location.pathname]);

  return {
    // Current route info
    currentRoute,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state,

    // Route metadata
    metadata: routeMetadata,
    group: routeMetadata.group,
    cache: routeMetadata.cache,
    priority: routeMetadata.priority,

    // UI features
    breadcrumb,
    features: routeMetadata.features || {},

    // Navigation
    navigation,
    navigate,

    // Permissions
    permissions,

    // Search parameters
    searchParams: searchParamUtils,

    // Analytics
    analytics,

    // Validation
    isValid: () => !routeMetadata.validation?.searchParams ||
      RouteUtils.validateSearchParams(location.pathname, location.search, routeMetadata.validation),

    // Utility functions
    reload: () => window.location.reload(),
    refresh: () => navigate(location.pathname, { replace: true }),

    // Route groups for navigation/menu building
    groups: {
      [ROUTE_GROUPS.DASHBOARD]: getRoutesByGroup(ROUTE_GROUPS.DASHBOARD),
      [ROUTE_GROUPS.OPERATIONS]: getRoutesByGroup(ROUTE_GROUPS.OPERATIONS),
      [ROUTE_GROUPS.INVENTORY]: getRoutesByGroup(ROUTE_GROUPS.INVENTORY),
      [ROUTE_GROUPS.REPORTING]: getRoutesByGroup(ROUTE_GROUPS.REPORTING),
      [ROUTE_GROUPS.HUMAN_RESOURCES]: getRoutesByGroup(ROUTE_GROUPS.HUMAN_RESOURCES),
      [ROUTE_GROUPS.MASTER_DATA]: getRoutesByGroup(ROUTE_GROUPS.MASTER_DATA),
      [ROUTE_GROUPS.HEAD_OFFICE]: getRoutesByGroup(ROUTE_GROUPS.HEAD_OFFICE),
      [ROUTE_GROUPS.SYSTEM]: getRoutesByGroup(ROUTE_GROUPS.SYSTEM),
    }
  };
}

// Hook for route preloading
export function useRoutePreloading() {
  const { metadata } = useRoute();

  useEffect(() => {
    if (metadata.performance?.prefetch) {
      // Prefetch logic could be implemented here
      // For example: prefetch images, dropdown data, etc.
    }
  }, [metadata.performance?.prefetch]);

  return {
    isPrefetching: false, // Would track prefetching state
    preloadRoutes: useCallback((routes) => {
      // Preload multiple routes
      routes.forEach(route => {
        if (route.element && typeof route.element.then === 'function') {
          route.element.catch(() => {
            // Handle preload errors silently
          });
        }
      });
    }, [])
  };
}

// Hook for route error boundary
export function useRouteError() {
  const { pathname, metadata } = useRoute();
  const navigate = useNavigate();

  const handleError = useCallback((error, errorInfo) => {
    console.error('🚨 Route Error:', {
      path: pathname,
      error: error.message,
      metadata,
      ...errorInfo
    });

    // Navigate to error page or show error UI
    // navigate('/error', { state: { error, path: pathname } });

    // For now, just log
    return {
      hasError: true,
      error,
      path: pathname,
      canRetry: metadata.group !== ROUTE_GROUPS.SYSTEM
    };
  }, [pathname, metadata, navigate]);

  return { handleError };
}
