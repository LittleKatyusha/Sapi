/**
 * WebSocket Services Index
 * Centralized exports for all WebSocket-related functionality
 */

import wsManager from './WebSocketManager';
import WebSocketSecurity from './WebSocketSecurity';
import { MESSAGE_TYPES, TOPICS, ROUTE_TOPICS, WebSocketMessageBuilder, MessageValidator, RouteTopicResolver } from './messageTypes';
import performanceMonitor, { usePerformanceMonitoring } from './WebSocketPerformance';
import { WebSocketProvider, useWebSocket, useWebSocketTopic, useWebSocketRoute } from '../../contexts/WebSocketContext';

// Core services
export {
  wsManager as WebSocketManager,
  WebSocketSecurity,
  performanceMonitor as WebSocketPerformance
};

// Context and hooks
export {
  WebSocketProvider,
  useWebSocket,
  useWebSocketTopic,
  useWebSocketRoute
};

// Message types and utilities
export {
  MESSAGE_TYPES,
  TOPICS,
  ROUTE_TOPICS,
  WebSocketMessageBuilder,
  MessageValidator,
  RouteTopicResolver
};

// Performance monitoring
export {
  usePerformanceMonitoring
};

// Convenience functions for common operations
export const WebSocketUtils = {
  /**
   * Create a secure WebSocket URL
   */
  createSecureUrl: (baseUrl, token, options = {}) =>
    WebSocketSecurity.buildSecureWebSocketUrl(token, options),

  /**
   * Create a notification message
   */
  createNotification: (userId, title, message, type = 'info', options = {}) =>
    WebSocketMessageBuilder.createNotification(userId, title, message, type, options),

  /**
   * Create an update message
   */
  createUpdate: (resourceType, resourceId, changes, options = {}) =>
    WebSocketMessageBuilder.createUpdate(resourceType, resourceId, changes, options),

  /**
   * Create a publish message
   */
  createPublish: (topic, payload, options = {}) =>
    WebSocketMessageBuilder.createPublish(topic, payload, options),

  /**
   * Validate message structure
   */
  validateMessage: (message) => MessageValidator.validateMessage(message),

  /**
   * Get topics for a route
   */
  getTopicsForRoute: (route) => RouteTopicResolver.getTopicsForRoute(route),

  /**
   * Get connection state
   */
  getConnectionState: () => wsManager.getConnectionState(),

  /**
   * Get performance profile
   */
  getPerformanceProfile: () => performanceMonitor.getPerformanceProfile(),

  /**
   * Force reconnection
   */
  reconnect: (url, token) => wsManager.connect(url, token),

  /**
   * Disconnect from WebSocket
   */
  disconnect: () => wsManager.disconnect()
};

// Default export for convenience
export default {
  manager: wsManager,
  security: WebSocketSecurity,
  performance: performanceMonitor,
  utils: WebSocketUtils,
  hooks: {
    useWebSocket,
    useWebSocketTopic,
    useWebSocketRoute,
    usePerformanceMonitoring
  },
  types: {
    MESSAGE_TYPES,
    TOPICS,
    ROUTE_TOPICS
  },
  builders: {
    WebSocketMessageBuilder,
    MessageValidator,
    RouteTopicResolver
  }
};
