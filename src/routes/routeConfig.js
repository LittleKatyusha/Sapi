// Production Route Configuration - Integrates all route modules
import { routeBuilder } from './routeBuilder';
import { ROUTE_GROUPS, ROUTE_METADATA } from './constants';

// Import all route modules
import { dashboardRoutes } from './dashboard';
import { operationsRoutes } from './operations';
import { inventoryRoutes } from './inventory';
import { reportingRoutes } from './reporting';
import { hrRoutes } from './hr';
import { settingsRoutes } from './settings';
import { masterDataRoutes } from './masterData';
import { boningRoutes } from './boning';
import { hoRoutes } from './ho';
import { rphRoutes } from './rph';
import { paymentRoutes } from './payment';
import { systemRoutes } from './system';

// Build production-ready route configurations
function buildRouteConfiguration() {
  // Dashboard routes
  dashboardRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.DASHBOARD,
        cache: ROUTE_METADATA.CACHE_STRATEGY.ALWAYS_FRESH,
        priority: ROUTE_METADATA.LOAD_PRIORITY.CRITICAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED,
        features: {
          breadcrumb: false, // Dashboard is typically root
          navigation: true,
          bookmark: false
        },
        performance: {
          preload: true, // Always preload dashboard
          prefetch: false
        },
        labels: {
          dashboard: 'Dashboard'
        }
      }
    });
  });

  // Operations routes
  operationsRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.OPERATIONS,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: ROUTE_METADATA.LOAD_PRIORITY.HIGH,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED,
        performance: {
          preload: false,
          prefetch: true
        }
      }
    });
  });

  // Inventory routes
  inventoryRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.INVENTORY,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED
      }
    });
  });

  // Reporting routes
  reportingRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.REPORTING,
        cache: ROUTE_METADATA.CACHE_STRATEGY.LONG_TERM, // Reports can be cached longer
        priority: ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED,
        validation: {
          searchParams: ['date_from', 'date_to', 'format', 'export'],
          performance_budget: 3000 // 3 second budget for reports
        }
      }
    });
  });

  // Human Resources routes
  hrRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.HUMAN_RESOURCES,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED
      }
    });
  });

  // Settings routes
  settingsRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.SETTINGS,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: ROUTE_METADATA.LOAD_PRIORITY.LOW,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED
      }
    });
  });

  // Master Data routes (high frequency, short cache)
  masterDataRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.MASTER_DATA,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED,
        features: {
          breadcrumb: true,
          bookmark: false // Master data usually not bookmarked
        },
        validation: {
          searchParams: ['search', 'page', 'limit', 'sort', 'filter'],
          performance_budget: 2000
        }
      }
    });
  });

  // Boning routes (nested)
  boningRoutes.forEach(route => {
    routeBuilder.addNestedRoute({
      prefix: '/boning/*',
      children: route.nestedRoutes
    });
  });

  // Head Office routes
  hoRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.HEAD_OFFICE,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED,
        validation: {
          searchParams: ['search', 'status', 'date_from', 'date_to', 'page', 'limit']
        }
      }
    });
  });

  // RPH routes
  rphRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.RPH,
        cache: ROUTE_METADATA.CACHE_STRATEGY.SHORT_TERM,
        priority: ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED
      }
    });
  });

  // Payment routes
  paymentRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.PAYMENTS,
        cache: ROUTE_METADATA.CACHE_STRATEGY.LONG_TERM, // Payment history doesn't change frequently
        priority: ROUTE_METADATA.LOAD_PRIORITY.NORMAL,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.AUTHENTICATED
      }
    });
  });

  // System administration routes
  systemRoutes.forEach(route => {
    routeBuilder.addRoute({
      ...route,
      metadata: {
        group: ROUTE_GROUPS.SYSTEM,
        cache: ROUTE_METADATA.CACHE_STRATEGY.STATIC, // Admin configs change rarely
        priority: ROUTE_METADATA.LOAD_PRIORITY.LOW,
        permission: ROUTE_METADATA.PERMISSION_LEVEL.ROLE_BASED,
        features: {
          breadcrumb: true,
          navigation: false, // Admin routes might not show in main nav
          bookmark: false
        }
      }
    });
  });

  return routeBuilder;
}

// Build the configuration
export const routeConfiguration = buildRouteConfiguration();

// Validate configuration in development
if (process.env.NODE_ENV === 'development') {
  const validation = routeConfiguration.validate();
  if (!validation.valid) {
    console.error('❌ Route configuration validation failed:', validation.errors);
  } else {
    console.log('✅ Route configuration validated successfully');
  }
}

// Export utilities for production use
export const getRoutes = () => routeConfiguration.getRoutes();
export const getRoutesByGroup = (group) => routeConfiguration.getRoutesByGroup(group);
export const getCriticalPaths = () => routeConfiguration.getCriticalPaths();
export const getAuthenticatedRoutes = () => routeConfiguration.getAuthenticatedRoutes();
