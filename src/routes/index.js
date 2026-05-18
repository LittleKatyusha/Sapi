// Production Router Configuration - Clean Architecture
import { getRoutes } from './routeConfig';
import { Routes, Route } from 'react-router-dom';
import { RouteCache } from './routeBuilder';
import { lazy } from 'react';

// Fallback route for unknown paths
const DashboardFallback = lazy(() => import('../pages/DashboardPage'));

/**
 * Rendering utility for production routes with metadata support
 */
const renderNestedRoutes = (routes) => {
  return routes.map((route, index) => {
    if (route.nestedRoutes) {
      // Handle nested routes (like boning with Layout)
      return (
        <Route key={index} path={route.path} element={route.element}>
          {route.nestedRoutes.map((nestedRoute, nestedIndex) => (
            <Route
              key={nestedIndex}
              index={nestedRoute.path === 'index'}
              path={nestedRoute.path === 'index' ? undefined : nestedRoute.path}
              element={nestedRoute.element}
            />
          ))}
        </Route>
      );
    }

    // Regular routes
    return (
      <Route
        key={index}
        path={route.path}
        element={route.element}
      />
    );
  });
};

/**
 * Production-ready route renderer with error handling and performance
 */
export const renderRoutes = () => {
  try {
    const routes = getRoutes();

    // Add fallback route
    const routesWithFallback = [
      ...routes,
      {
        path: '*',
        element: <DashboardFallback />,
        metadata: {
          group: 'fallback',
          priority: 'low'
        }
      }
    ];

    return <Routes>{renderNestedRoutes(routesWithFallback)}</Routes>;
  } catch (error) {
    console.error('❌ Route rendering error:', error);
    // Fallback to minimal route configuration
    return (
      <Routes>
        <Route path="/dashboard" element={<DashboardFallback />} />
        <Route path="*" element={<div>Route Configuration Error</div>} />
      </Routes>
    );
  }
};

// Export route utilities for components
export { useRoute, useRoutePreloading, useRouteError } from './useRoute';

// Re-export route configuration for programmatic access
export { getRoutes } from './routeConfig';
export { ROUTE_PATHS, ROUTE_GROUPS, ROUTE_METADATA } from './constants';

// Export route cache utilities
export { RouteCache } from './routeBuilder';

/**
 * Route system initialization (call in App startup)
 */
export const initializeRoutes = () => {
  // Preload critical routes on app start
  if (process.env.NODE_ENV === 'production') {
    RouteCache.preloadCritical().catch(console.error);
  }

  // Validation logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Route system initialized with clean architecture');
  }

  return {
    routes: getRoutes(),
    utilities: {
      navigate: (path) => {
        // Could integrate with router history
        window.location.href = path;
      },
      preload: RouteCache.preloadCritical
    }
  };
};
