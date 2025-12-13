/**
 * WebSocket Connection Manager
 * Handles WebSocket lifecycle, reconnection, and multiplexing for multiple routes
 */

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.url = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pingInterval = null;
    this.pingTimeout = null;
    this.channels = new Map(); // Map<channelId, Set<handlers>>
    this.routeSubscriptions = new Map(); // Map<route, Set<topics>>
    this.messageQueue = [];
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onMessageCallbacks = [];
    this.onErrorCallbacks = [];
    this.authToken = null;
  }

  /**
   * Initialize WebSocket connection
   */
  async connect(wsUrl, token = null) {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.url = wsUrl;
    this.authToken = token;
    this.isConnecting = true;

    try {
      // Build WebSocket URL with authentication
      const fullUrl = this.buildAuthenticatedUrl(wsUrl);

      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Set connection timeout
      setTimeout(() => {
        if (!this.isConnected && this.isConnecting) {
          this.handleError(new Error('WebSocket connection timeout'));
        }
      }, 10000);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Build authenticated WebSocket URL
   */
  buildAuthenticatedUrl(baseUrl) {
    const url = new URL(baseUrl.startsWith('ws') ? baseUrl : `ws://${baseUrl}`);

    if (this.authToken) {
      url.searchParams.set('token', this.authToken);
    }

    // Add client info
    url.searchParams.set('client', 'react-app');
    url.searchParams.set('version', process.env.REACT_APP_VERSION || '1.0.0');

    return url.toString();
  }

  /**
   * Handle successful connection
   */
  handleOpen(event) {
    console.log('🔗 WebSocket connected');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // Start heartbeat
    this.startHeartbeat();

    // Send queued messages
    this.flushQueuedMessages();

    // Notify listeners
    this.onConnectCallbacks.forEach(callback => callback());
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);

      // Handle protocol messages
      if (message.type === 'heartbeat') {
        this.handleHeartbeat(message);
        return;
      }

      // Route message to subscribed channels
      this.routeMessage(message);

      // Notify global listeners
      this.onMessageCallbacks.forEach(callback => callback(message));

    } catch (error) {
      console.error('⚠️ Failed to parse WebSocket message:', error);
      this.onErrorCallbacks.forEach(callback => callback(error, event.data));
    }
  }

  /**
   * Route message to subscribed channels
   */
  routeMessage(message) {
    const { channel, topic, route } = message;

    // Route-specific subscriptions
    if (route && this.routeSubscriptions.has(route)) {
      const routeTopics = this.routeSubscriptions.get(route);
      if (!topic || routeTopics.has(topic)) {
        // Broadcast to route subscribers
        this.broadcastToRoute(route, message);
      }
    }

    // Channel-based routing
    if (channel && this.channels.has(channel)) {
      const channelHandlers = this.channels.get(channel);
      channelHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('⚠️ Channel handler error:', error);
        }
      });
    }

    // Topic-based routing
    if (topic) {
      this.broadcastToTopic(topic, message);
    }
  }

  /**
   * Handle connection closure
   */
  handleClose(event) {
    console.log('📴 WebSocket disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.isConnecting = false;
    this.stopHeartbeat();

    // Notify listeners
    this.onDisconnectCallbacks.forEach(callback => callback(event));

    // Attempt reconnection
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection errors
   */
  handleError(error) {
    console.error('🚨 WebSocket error:', error);
    this.isConnecting = false;

    // Notify listeners
    this.onErrorCallbacks.forEach(callback => callback(error));

    // Cleanup on fatal errors
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Send message through WebSocket
   */
  send(message) {
    if (!this.isConnected) {
      // Queue message for later sending
      this.messageQueue.push(message);
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.ws.send(messageStr);
      return true;
    } catch (error) {
      console.error('⚠️ Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel, handler) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }

    this.channels.get(channel).add(handler);

    // Send subscription message
    this.send({
      type: 'subscribe',
      channel
    });
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel, handler) {
    if (this.channels.has(channel)) {
      const handlers = this.channels.get(channel);
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.channels.delete(channel);

        // Send unsubscription message
        this.send({
          type: 'unsubscribe',
          channel
        });
      }
    }
  }

  /**
   * Subscribe to route-specific topics
   */
  subscribeToRoute(route, topics = []) {
    if (!this.routeSubscriptions.has(route)) {
      this.routeSubscriptions.set(route, new Set());
    }

    const routeTopics = this.routeSubscriptions.get(route);
    topics.forEach(topic => routeTopics.add(topic));

    // Send route subscription
    this.send({
      type: 'subscribe_route',
      route,
      topics: Array.from(routeTopics)
    });
  }

  /**
   * Unsubscribe from route
   */
  unsubscribeFromRoute(route) {
    if (this.routeSubscriptions.has(route)) {
      this.routeSubscriptions.delete(route);

      this.send({
        type: 'unsubscribe_route',
        route
      });
    }
  }

  /**
   * Broadcast to route subscribers
   */
  broadcastToRoute(route, message) {
    if (this.routeSubscriptions.has(route)) {
      const topics = this.routeSubscriptions.get(route);
      // Handlers are managed by React components via context
    }
  }

  /**
   * Start heartbeat for connection health
   */
  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });

        // Set ping timeout
        this.pingTimeout = setTimeout(() => {
          console.warn('⚠️ WebSocket ping timeout');
          this.reconnect();
        }, 5000);
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  /**
   * Handle heartbeat response
   */
  handleHeartbeat(message) {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Exponential backoff

    console.log(`🔄 Scheduling WebSocket reconnect in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.reconnect();
    }, this.reconnectDelay);
  }

  /**
   * Reconnect to WebSocket
   */
  reconnect() {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    console.log(`🔄 Reconnecting WebSocket (attempt ${this.reconnectAttempts})`);
    this.connect(this.url, this.authToken);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }

  /**
   * Flush queued messages
   */
  flushQueuedMessages() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Add connection event listeners
   */
  onConnect(callback) {
    this.onConnectCallbacks.push(callback);
  }

  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
  }

  onMessage(callback) {
    this.onMessageCallbacks.push(callback);
  }

  onError(callback) {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * Get connection state
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      channelCount: this.channels.size,
      routeSubscriptionCount: this.routeSubscriptions.size,
      queuedMessageCount: this.messageQueue.length
    };
  }
}

// Create singleton instance
const wsManager = new WebSocketManager();

export default wsManager;
