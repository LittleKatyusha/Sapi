import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import wsManager from '../services/webSocket/WebSocketManager';
import { useAuthSecure } from '../hooks/useAuthSecure';

/**
 * WebSocket Context for React components
 */
const WebSocketContext = createContext({
  isConnected: false,
  isConnecting: false,
  connectionState: {},
  subscribe: () => {},
  unsubscribe: () => {},
  subscribeToRoute: () => {},
  subscribeToTopic: () => {},
  unsubscribeFromRoute: () => {},
  unsubscribeFromTopic: () => {},
  sendMessage: () => {},
  publish: () => {},
  currentRoute: null,
  routeSubscriptions: new Map(),
  topicSubscriptions: new Map()
});

/**
 * WebSocket Provider Component
 */
export const WebSocketProvider = ({ children, config = {} }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState(wsManager.getConnectionState());

  const location = useLocation();
  const currentRoute = location.pathname;
  const auth = useAuthSecure();

  // Track route subscriptions: Map<route, Set<topics>>
  const [routeSubscriptions, setRouteSubscriptions] = useState(new Map());

  // Track topic subscriptions: Map<topic, Set<handlers>>
  const [topicSubscriptions, setTopicSubscriptions] = useState(new Map());

  // Track component subscribers: Map<componentId, Map<topic, handler>>
  const componentSubscriptions = useRef(new Map());

  // Component ID generator
  const componentIdRef = useRef(0);

  /**
   * Initialize WebSocket connection when authenticated
   */
  useEffect(() => {
    if (auth.isAuthenticated && auth.token && !isConnected && !isConnecting) {
      const wsUrl = config.wsUrl || process.env.REACT_APP_WS_URL;

      if (wsUrl) {
        console.log('🚀 Initializing WebSocket connection');
        wsManager.connect(wsUrl, auth.token);
      } else {
        console.warn('⚠️ WebSocket URL not configured');
      }
    }
  }, [auth.isAuthenticated, auth.token, isConnected, isConnecting, config.wsUrl]);

  /**
   * Setup WebSocket event handlers
   */
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionState(wsManager.getConnectionState());
      console.log('🔗 WebSocket connected successfully');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionState(wsManager.getConnectionState());
      console.log('📴 WebSocket disconnected');
    };

    const handleError = (error) => {
      console.error('🚨 WebSocket error:', error);
      setConnectionState(wsManager.getConnectionState());
    };

    // Register event handlers
    wsManager.onConnect(handleConnect);
    wsManager.onDisconnect(handleDisconnect);
    wsManager.onError(handleError);

    // Cleanup on unmount
    return () => {
      wsManager.disconnect();
    };
  }, []);

  /**
   * Route change handler - manage route subscriptions
   */
  useEffect(() => {
    const routeTopics = routeSubscriptions.get(currentRoute);
    if (routeTopics && routeTopics.size > 0) {
      wsManager.subscribeToRoute(currentRoute, Array.from(routeTopics));
    }

    return () => {
      // Unsubscribe from previous route on change
      const previousRoute = location.state?.from || null;
      if (previousRoute) {
        wsManager.unsubscribeFromRoute(previousRoute);
      }
    };
  }, [currentRoute, routeSubscriptions]);

  /**
   * Subscribe to route-specific topics
   */
  const subscribeToRoute = useCallback((route, topics) => {
    setRouteSubscriptions(prev => {
      const newSubscriptions = new Map(prev);

      if (!newSubscriptions.has(route)) {
        newSubscriptions.set(route, new Set());
      }

      topics.forEach(topic => newSubscriptions.get(route).add(topic));
      return newSubscriptions;
    });

    // If subscribing to current route, notify server immediately
    if (route === currentRoute) {
      wsManager.subscribeToRoute(route, topics);
    }
  }, [currentRoute]);

  /**
   * Unsubscribe from route-specific topics
   */
  const unsubscribeFromRoute = useCallback((route, topics = null) => {
    setRouteSubscriptions(prev => {
      const newSubscriptions = new Map(prev);
      const routeTopics = newSubscriptions.get(route);

      if (routeTopics) {
        if (topics) {
          topics.forEach(topic => routeTopics.delete(topic));
          if (routeTopics.size === 0) {
            newSubscriptions.delete(route);
          }
        } else {
          newSubscriptions.delete(route);
        }
      }

      return newSubscriptions;
    });
  }, []);

  /**
   * Subscribe to global topic for a component
   */
  const subscribeToTopic = useCallback((topic, handler, componentId = null) => {
    const id = componentId || `component_${++componentIdRef.current}`;

    setTopicSubscriptions(prev => {
      const newSubscriptions = new Map(prev);

      if (!newSubscriptions.has(topic)) {
        newSubscriptions.set(topic, new Set());
      }

      newSubscriptions.get(topic).add({ handler, componentId: id });
      return newSubscriptions;
    });

    // Store component reference for cleanup
    if (!componentSubscriptions.current.has(id)) {
      componentSubscriptions.current.set(id, new Map());
    }
    componentSubscriptions.current.get(id).set(topic, handler);

    // Subscribe to topic on WebSocket
    wsManager.subscribe(topic, (message) => {
      if (message.topic === topic) {
        handler(message);
      }
    });

    return id; // Return component ID for cleanup
  }, []);

  /**
   * Unsubscribe from topic for a component
   */
  const unsubscribeFromTopic = useCallback((topic, componentId) => {
    setTopicSubscriptions(prev => {
      const newSubscriptions = new Map(prev);

      if (newSubscriptions.has(topic)) {
        const handlers = newSubscriptions.get(topic);
        handlers.forEach(sub => {
          if (sub.componentId === componentId) {
            handlers.delete(sub);
          }
        });

        if (handlers.size === 0) {
          newSubscriptions.delete(topic);
        }
      }

      return newSubscriptions;
    });

    // Remove from component subscriptions
    if (componentSubscriptions.current.has(componentId)) {
      componentSubscriptions.current.get(componentId).delete(topic);
    }
  }, []);

  /**
   * Subscribe to channel (for advanced use cases)
   */
  const subscribe = useCallback((channel, handler) => {
    return wsManager.subscribe(channel, handler);
  }, []);

  /**
   * Unsubscribe from channel
   */
  const unsubscribe = useCallback((channel, handler) => {
    wsManager.unsubscribe(channel, handler);
  }, []);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message) => {
    return wsManager.send(message);
  }, []);

  /**
   * Publish message to topic
   */
  const publish = useCallback((topic, data, options = {}) => {
    const message = {
      type: 'publish',
      topic,
      payload: data,
      route: currentRoute,
      timestamp: Date.now(),
      ...options
    };

    return wsManager.send(message);
  }, [currentRoute]);

  /**
   * Context value
   */
  const contextValue = {
    isConnected,
    isConnecting,
    connectionState,
    subscribe,
    unsubscribe,
    subscribeToRoute,
    subscribeToTopic,
    unsubscribeFromRoute,
    unsubscribeFromTopic,
    sendMessage,
    publish,
    currentRoute,
    routeSubscriptions,
    topicSubscriptions
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to access WebSocket context
 */
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

/**
 * Hook for topic subscriptions with automatic cleanup
 */
export const useWebSocketTopic = (topic, handler, dependencies = []) => {
  const { subscribeToTopic, unsubscribeFromTopic } = useWebSocket();
  const componentIdRef = useRef(null);

  useEffect(() => {
    if (topic && handler) {
      componentIdRef.current = subscribeToTopic(topic, handler);
    }

    return () => {
      if (componentIdRef.current) {
        unsubscribeFromTopic(topic, componentIdRef.current);
      }
    };
  }, [topic, handler, subscribeToTopic, unsubscribeFromTopic, ...dependencies]);

  return componentIdRef.current;
};

/**
 * Hook for route-specific subscriptions
 */
export const useWebSocketRoute = (topics = []) => {
  const { subscribeToRoute, unsubscribeFromRoute, currentRoute } = useWebSocket();

  useEffect(() => {
    if (currentRoute && topics.length > 0) {
      subscribeToRoute(currentRoute, topics);

      return () => {
        unsubscribeFromRoute(currentRoute, topics);
      };
    }
  }, [currentRoute, topics, subscribeToRoute, unsubscribeFromRoute]);

  return { currentRoute, topics };
};

export default WebSocketContext;
