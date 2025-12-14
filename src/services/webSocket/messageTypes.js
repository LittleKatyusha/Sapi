/**
 * WebSocket Message Types and Constants
 * Defines standardized message protocols for the WebSocket architecture
 */

/**
 * Message Types
 */
export const MESSAGE_TYPES = {
  // Connection management
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIBE_ROUTE: 'subscribe_route',
  UNSUBSCRIBE_ROUTE: 'unsubscribe_route',

  // Messaging
  PUBLISH: 'publish',
  BROADCAST: 'broadcast',
  NOTIFICATION: 'notification',

  // Heartbeat and health
  PING: 'ping',
  PONG: 'pong',
  HEARTBEAT: 'heartbeat',

  // Error handling
  ERROR: 'error',
  ACK: 'ack',

  // Real-time updates
  UPDATE: 'update',
  CREATE: 'create',
  DELETE: 'delete',
  PATCH: 'patch',

  // Authentication
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',

  // Custom application messages
  CUSTOM: 'custom'
};

/**
 * Topic Categories
 */
export const TOPICS = {
  // System-wide topics
  SYSTEM: {
    ANNOUNCEMENT: 'system.announcement',
    MAINTENANCE: 'system.maintenance',
    VERSION_UPDATE: 'system.version_update',
    CONNECTION_STATUS: 'system.connection_status'
  },

  // User-specific topics
  USER: {
    PROFILE_UPDATE: 'user.profile_updated',
    PERMISSION_CHANGE: 'user.permission_changed',
    NOTIFICATION: 'user.notification',
    STATUS_CHANGE: 'user.status_changed'
  },

  // Business domain topics
  BUSINESS: {
    INVENTORY_UPDATE: 'business.inventory.updated',
    PRICE_CHANGE: 'business.pricing.changed',
    ORDER_STATUS: 'business.order.status_changed',
    STOCK_LOW: 'business.inventory.stock_low',
    NEW_PURCHASE: 'business.purchase.created',
    SALES_UPDATE: 'business.sales.updated'
  },

  // Operations topics
  OPERATIONS: {
    DELIVERY_UPDATE: 'operations.delivery.updated',
    PAYMENT_RECEIVED: 'operations.payment.received',
    SCHEDULE_CHANGE: 'operations.schedule.changed',
    TASK_COMPLETED: 'operations.task.completed'
  },

  // Data master topics
  MASTER_DATA: {
    SUPPLIER_UPDATED: 'master.supplier.updated',
    CUSTOMER_UPDATED: 'master.customer.updated',
    PRODUCT_UPDATED: 'master.product.updated',
    EMPLOYEE_UPDATED: 'master.employee.updated'
  }
};

/**
 * Route-Specific Topics Map
 * Maps React routes to relevant WebSocket topics
 */
export const ROUTE_TOPICS = {
  '/dashboard': [
    TOPICS.BUSINESS.INVENTORY_UPDATE,
    TOPICS.BUSINESS.SALES_UPDATE,
    TOPICS.USER.NOTIFICATION,
    TOPICS.SYSTEM.ANNOUNCEMENT
  ],

  '/sales': [
    TOPICS.BUSINESS.SALES_UPDATE,
    TOPICS.BUSINESS.ORDER_STATUS
  ],

  '/purchases': [
    TOPICS.BUSINESS.NEW_PURCHASE,
    TOPICS.BUSINESS.PRICE_CHANGE
  ],

  '/delivery-orders': [
    TOPICS.OPERATIONS.DELIVERY_UPDATE,
    TOPICS.BUSINESS.ORDER_STATUS
  ],

  '/inventory/livestock': [
    TOPICS.BUSINESS.INVENTORY_UPDATE,
    TOPICS.BUSINESS.STOCK_LOW
  ],

  '/inventory/meat': [
    TOPICS.BUSINESS.INVENTORY_UPDATE,
    TOPICS.BUSINESS.STOCK_LOW
  ],

  '/hr/employees': [
    TOPICS.MASTER_DATA.EMPLOYEE_UPDATED,
    TOPICS.USER.PERMISSION_CHANGE
  ],

  '/hr/attendance': [
    TOPICS.USER.STATUS_CHANGE
  ],

  '/hr/leave-requests': [
    TOPICS.OPERATIONS.TASK_COMPLETED
  ],

  '/master-data/supplier': [
    TOPICS.MASTER_DATA.SUPPLIER_UPDATED
  ],

  '/master-data/pelanggan': [
    TOPICS.MASTER_DATA.CUSTOMER_UPDATED
  ],

  '/boning/*': [
    TOPICS.BUSINESS.STOCK_LOW,
    TOPICS.OPERATIONS.TASK_COMPLETED
  ],

  '/ho/*': [
    TOPICS.OPERATIONS.PAYMENT_RECEIVED,
    TOPICS.BUSINESS.ORDER_STATUS
  ],

  '/rph/pembelian-sapi': [
    TOPICS.BUSINESS.NEW_PURCHASE,
    TOPICS.BUSINESS.PRICE_CHANGE
  ]
};

/**
 * Message Priority Levels
 */
export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Message Builder Utilities
 */
export class WebSocketMessageBuilder {
  /**
   * Create a subscription message
   */
  static createSubscription(channel, options = {}) {
    return {
      type: MESSAGE_TYPES.SUBSCRIBE,
      channel,
      timestamp: Date.now(),
      ...options
    };
  }

  /**
   * Create a route subscription message
   */
  static createRouteSubscription(route, topics, options = {}) {
    return {
      type: MESSAGE_TYPES.SUBSCRIBE_ROUTE,
      route,
      topics,
      timestamp: Date.now(),
      ...options
    };
  }

  /**
   * Create a publish message
   */
  static createPublish(topic, payload, options = {}) {
    return {
      type: MESSAGE_TYPES.PUBLISH,
      topic,
      payload,
      priority: PRIORITY_LEVELS.NORMAL,
      timestamp: Date.now(),
      ...options
    };
  }

  /**
   * Create a notification message
   */
  static createNotification(userId, title, message, type = 'info', options = {}) {
    return {
      type: MESSAGE_TYPES.NOTIFICATION,
      recipient: userId,
      notification: {
        title,
        message,
        type, // 'info', 'success', 'warning', 'error'
        timestamp: Date.now()
      },
      ...options
    };
  }

  /**
   * Create an update message
   */
  static createUpdate(resourceType, resourceId, changes, options = {}) {
    return {
      type: MESSAGE_TYPES.UPDATE,
      resource: {
        type: resourceType,
        id: resourceId,
        changes
      },
      timestamp: Date.now(),
      ...options
    };
  }

  /**
   * Create a real-time update for a specific route
   */
  static createRouteUpdate(route, topic, data, options = {}) {
    return {
      type: MESSAGE_TYPES.UPDATE,
      route,
      topic,
      payload: data,
      timestamp: Date.now(),
      ...options
    };
  }
}

/**
 * Message Validation
 */
export class MessageValidator {
  /**
   * Validate incoming message structure
   */
  static validateMessage(message) {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message format: message must be an object');
    }

    if (!message.type) {
      throw new Error('Invalid message: missing type field');
    }

    if (!Object.values(MESSAGE_TYPES).includes(message.type)) {
      throw new Error(`Invalid message type: ${message.type}`);
    }

    // Type-specific validation
    switch (message.type) {
      case MESSAGE_TYPES.PUBLISH:
        if (!message.topic || !message.payload) {
          throw new Error('Publish message must have topic and payload');
        }
        break;

      case MESSAGE_TYPES.SUBSCRIBE:
        if (!message.channel) {
          throw new Error('Subscribe message must have channel');
        }
        break;

      case MESSAGE_TYPES.UPDATE:
        if (!message.resource && !message.route) {
          throw new Error('Update message must have resource or route');
        }
        break;

      default:
        break;
    }

    return true;
  }
}

/**
 * Default Route Topic Resolver
 */
export class RouteTopicResolver {
  /**
   * Get topics for a given route
   */
  static getTopicsForRoute(route) {
    // Exact match first
    if (ROUTE_TOPICS[route]) {
      return ROUTE_TOPICS[route];
    }

    // Wildcard matching for dynamic routes
    for (const [routePattern, topics] of Object.entries(ROUTE_TOPICS)) {
      if (routePattern.includes('*')) {
        const pattern = routePattern.replace('*', '.*');
        if (new RegExp(`^${pattern}$`).test(route)) {
          return topics;
        }
      }
    }

    // Default topics for unknown routes
    return [
      TOPICS.USER.NOTIFICATION,
      TOPICS.SYSTEM.ANNOUNCEMENT
    ];
  }
}

export default {
  MESSAGE_TYPES,
  TOPICS,
  ROUTE_TOPICS,
  PRIORITY_LEVELS,
  WebSocketMessageBuilder,
  MessageValidator,
  RouteTopicResolver
};
