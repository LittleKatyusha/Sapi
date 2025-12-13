import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useWebSocket, useWebSocketTopic, useWebSocketRoute } from '../contexts/WebSocketContext';
import { TOPICS, WebSocketMessageBuilder, MESSAGE_TYPES } from '../services/webSocket/messageTypes';
import { WebSocketSecurity } from '../services/webSocket/WebSocketSecurity';

/**
 * Example component demonstrating WebSocket integration
 * This component shows real-time updates, notifications, and messaging
 */
const WebSocketExampleComponent = () => {
  const location = useLocation();
  const {
    isConnected,
    connectionState,
    publish,
    sendMessage,
    subscribe,
    unsubscribe
  } = useWebSocket();

  // Component state
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    pendingOrders: 0,
    inventoryAlerts: 0
  });
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  /**
   * Route-based subscriptions
   * Automatically subscribe to relevant topics based on current route
   */
  useWebSocketRoute([
    TOPICS.BUSINESS.INVENTORY_UPDATE,
    TOPICS.BUSINESS.ORDER_STATUS,
    TOPICS.OPERATIONS.PAYMENT_RECEIVED,
    TOPICS.USER.NOTIFICATION
  ]);

  /**
   * Topic-specific handlers with automatic cleanup
   */
  useWebSocketTopic(TOPICS.SYSTEM.ANNOUNCEMENT, useCallback((message) => {
    console.log('📢 System announcement:', message.payload);
    addNotification(message.payload, 'info');
  }, []));

  useWebSocketTopic(TOPICS.USER.NOTIFICATION, useCallback((message) => {
    const { title, message: text, type } = message.payload.notification;
    addNotification(`${title}: ${text}`, type);
  }, []));

  useWebSocketTopic(`${TOPICS.BUSINESS.INVENTORY_UPDATE}.${location.pathname}`, useCallback((message) => {
    // Route-specific inventory updates
    console.log('📊 Inventory update for current route:', message.payload);
    updateInventoryData(message.payload);
  }, [location.pathname]));

  // Activity monitoring topic
  useWebSocketTopic('activity.users', useCallback((message) => {
    setRealTimeData(prev => ({
      ...prev,
      activeUsers: message.payload.count
    }));
  }, []));

  /**
   * Channel subscription for direct messaging
   */
  useEffect(() => {
    const channelHandler = (message) => {
      if (message.type === MESSAGE_TYPES.UPDATE) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          ...message.payload,
          timestamp: new Date()
        }]);
      }
    };

    subscribe('chat.support', channelHandler);

    return () => {
      unsubscribe('chat.support', channelHandler);
    };
  }, [subscribe, unsubscribe]);

  /**
   * Add notification to local state
   */
  const addNotification = useCallback((message, type = 'info') => {
    setNotifications(prev => [{
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }, ...prev.slice(0, 4)]); // Keep only last 5 notifications
  }, []);

  /**
   * Update inventory alerts
   */
  const updateInventoryData = useCallback((data) => {
    setRealTimeData(prev => ({
      ...prev,
      inventoryAlerts: data.lowStockItems || prev.inventoryAlerts
    }));
  }, []);

  /**
   * Send a message via WebSocket
   */
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      // Sanitize message before sending
      const message = WebSocketMessageBuilder.createPublish(
        'chat.support',
        {
          text: messageInput,
          user: 'User',
          route: location.pathname,
          userAgent: navigator.userAgent
        }
      );

      // Encrypt in production
      const sanitizedMessage = WebSocketSecurity.sanitizeMessage(message);
      const secureMessage = await WebSocketSecurity.encryptMessage(sanitizedMessage);

      // Send via WebSocket
      const success = sendMessage(secureMessage);

      if (success) {
        setMessageInput('');
        setIsTyping(false);
        addNotification('Message sent successfully', 'success');
      } else {
        addNotification('Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      addNotification('Error sending message', 'error');
    }
  };

  /**
   * Broadcast user activity
   */
  const broadcastTyping = useCallback(() => {
    if (!isTyping) {
      publish('activity.typing', {
        route: location.pathname,
        action: 'started'
      });
      setIsTyping(true);
    }
  }, [isTyping, publish, location.pathname]);

  /**
   * Publish real-time update
   */
  const publishUpdate = useCallback(() => {
    const update = WebSocketMessageBuilder.createRouteUpdate(
      location.pathname,
      TOPICS.BUSINESS.INVENTORY_UPDATE,
      {
        itemId: 'example_item',
        stockLevel: Math.floor(Math.random() * 100),
        lastUpdated: new Date().toISOString()
      }
    );

    publish(TOPICS.BUSINESS.INVENTORY_UPDATE, update.payload);
    addNotification('Update published', 'success');
  }, [publish, location.pathname, addNotification]);

  /**
   * Clear notifications
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Connection status indicator
   */
  const ConnectionStatus = () => (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className="status-indicator" />
      <span>{isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
      {connectionState.reconnectAttempts > 0 && (
        <span> (Reconnecting... {connectionState.reconnectAttempts})</span>
      )}
    </div>
  );

  return (
    <div className="websocket-example">
      <h2>WebSocket Real-Time Features</h2>

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Connection Details (Debug info) */}
      <details className="debug-info">
        <summary>Connection Details</summary>
        <pre>{JSON.stringify(connectionState, null, 2)}</pre>
      </details>

      {/* Real-time Dashboard */}
      <div className="real-time-dashboard">
        <h3>Live Data</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Active Users</span>
            <span className="stat-value">{realTimeData.activeUsers}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending Orders</span>
            <span className="stat-value">{realTimeData.pendingOrders}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Inventory Alerts</span>
            <span className="stat-value">{realTimeData.inventoryAlerts}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications-section">
        <div className="notifications-header">
          <h3>Notifications ({notifications.length})</h3>
          <button onClick={clearNotifications} disabled={notifications.length === 0}>
            Clear All
          </button>
        </div>
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <p className="no-notifications">No notifications</p>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification notification--${notification.type}`}
              >
                <span className="notification-message">{notification.message}</span>
                <span className="notification-time">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messaging Interface */}
      <div className="messaging-section">
        <h3>Support Chat</h3>
        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="no-messages">No messages yet</p>
          ) : (
            messages.slice(-10).map(message => (
              <div key={message.id} className="message">
                <strong>{message.user}:</strong> {message.text}
                <small>{message.timestamp?.toLocaleTimeString()}</small>
              </div>
            ))
          )}
        </div>

        <div className="message-input">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={broadcastTyping}
            placeholder="Type your message..."
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || !messageInput.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions-section">
        <h3>Test Actions</h3>
        <div className="action-buttons">
          <button onClick={publishUpdate} disabled={!isConnected}>
            📤 Publish Update
          </button>
          <button onClick={() => publish('activity.test', { test: true })} disabled={!isConnected}>
            🔔 Send Notification
          </button>
        </div>
        <p className="info-text">
          Current route: <strong>{location.pathname}</strong> |
          Topics subscribed: {connectionState.routeSubscriptionCount}
        </p>
      </div>

      {/* CSS Styles (inline for demo) */}
      <style jsx>{`
        .websocket-example {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .connection-status {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .connection-status.connected {
          background-color: #d4edda;
          color: #155724;
        }

        .connection-status.disconnected {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .real-time-dashboard {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-label {
          display: block;
          color: #666;
          font-size: 0.9em;
          margin-bottom: 5px;
        }

        .stat-value {
          display: block;
          font-size: 1.5em;
          font-weight: bold;
          color: #007bff;
        }

        .notifications-section,
        .messaging-section,
        .actions-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .notification {
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification--info { background: #d1ecf1; color: #0c5460; }
        .notification--success { background: #d4edda; color: #155724; }
        .notification--warning { background: #fff3cd; color: #856404; }
        .notification--error { background: #f8d7da; color: #721c24; }

        .message-input {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        input {
          flex: 1;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
          font-weight: 500;
        }

        button:hover:not(:disabled) {
          background: #0056b3;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .info-text {
          margin-top: 15px;
          color: #666;
          font-size: 0.9em;
        }

        .debug-info {
          margin-bottom: 20px;
        }

        .debug-info summary {
          cursor: pointer;
          font-weight: 500;
        }

        .debug-info pre {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default WebSocketExampleComponent;
