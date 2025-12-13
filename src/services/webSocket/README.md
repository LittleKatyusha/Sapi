# WebSocket Architecture for React App

## Overview

This WebSocket architecture provides a robust, scalable, and secure real-time communication system for the React application with multiple routes. It supports message multiplexing, route-based subscriptions, authentication, and performance optimizations for enterprise-level applications.

## Architecture Components

### 1. WebSocketManager (`WebSocketManager.js`)
**Purpose**: Core connection management and multiplexing
- Singleton WebSocket connection with automatic reconnection
- Message queuing and routing
- Channel-based and route-based subscriptions
- Heartbeat monitoring and connection health checks

### 2. WebSocketContext (`WebSocketContext.jsx`)
**Purpose**: React integration layer
- React Context provider for global WebSocket state
- Custom hooks for component integration
- Automatic subscription management based on routes
- Component lifecycle cleanup

### 3. Message Types (`messageTypes.js`)
**Purpose**: Standardized message protocols
- Topic-based messaging system
- Route-specific topic mappings
- Message builders and validators
- Priority levels and error handling

### 4. Security Layer (`WebSocketSecurity.js`)
**Purpose**: Authentication and encryption
- JWT token authentication
- URL signing and client validation
- Optional payload encryption (production)
- Sensitive data sanitization

## Key Features

### Connection Management
- **Single Connection**: Uses one WebSocket connection multiplexed across multiple routes
- **Auto-reconnect**: Exponential backoff reconnection strategy
- **Connection Pooling**: Optimized for multiple concurrent users
- **Health Monitoring**: Heartbeat system with ping/pong

### Message Routing
- **Topic-based**: Publish/subscribe pattern with hierarchical topics
- **Route-aware**: Automatic subscription based on current React route
- **Channel-based**: Direct channel subscriptions for advanced use cases
- **Message Validation**: Client-side validation and error handling

### Security
- **Authentication**: JWT token authentication via query parameters
- **Authorization**: Topic-level permission validation
- **Encryption**: Optional AES-GCM payload encryption
- **Anti-replay**: Timestamp-based replay attack prevention

### Performance
- **Multiplexing**: Single connection for all routes and topics
- **Batch Processing**: Message queuing and batching
- **Compression**: Protocol-level message compression
- **Memory Management**: Automatic cleanup and resource management

## Usage Guide

### Basic Setup

1. **Wrap your app with WebSocketProvider**:

```jsx
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  return (
    <WebSocketProvider config={{ wsUrl: 'ws://localhost:8080' }}>
      <Router>
        {/* Your app routes */}
      </Router>
    </WebSocketProvider>
  );
}
```

2. **Use WebSocket hooks in components**:

```jsx
import { useWebSocket, useWebSocketTopic, useWebSocketRoute } from './contexts/WebSocketContext';
import { TOPICS } from './services/webSocket/messageTypes';

function DashboardPage() {
  const { isConnected, publish } = useWebSocket();

  // Route-based subscription
  useWebSocketRoute([
    TOPICS.BUSINESS.INVENTORY_UPDATE,
    TOPICS.USER.NOTIFICATION
  ]);

  // Topic subscription with handler
  useWebSocketTopic(TOPICS.BUSINESS.SALES_UPDATE, (message) => {
    console.log('Sales update received:', message.payload);
    // Update component state
  });

  const handlePublish = () => {
    publish(TOPICS.BUSINESS.SALES_UPDATE, {
      orderId: '123',
      amount: 1000
    });
  };

  return (
    <div>
      <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={handlePublish}>Publish Update</button>
    </div>
  );
}
```

### Route-Specific Topics

The architecture automatically maps routes to relevant topics:

```javascript
ROUTE_TOPICS: {
  '/dashboard': [
    'business.inventory.updated',
    'business.sales.updated',
    'user.notification',
    'system.announcement'
  ],
  '/sales': [
    'business.sales.updated',
    'business.order.status_changed'
  ],
  // ... more mappings
}
```

### Message Types and Topics

#### Pre-defined Topics
- **System**: `system.*` - Announcements, maintenance, version updates
- **User**: `user.*` - Profile updates, permissions, notifications
- **Business**: `business.*` - Inventory, sales, orders, pricing
- **Operations**: `operations.*` - Deliveries, payments, tasks
- **Master Data**: `master.*` - Suppliers, customers, employees

#### Message Builder Usage
```javascript
import { WebSocketMessageBuilder, TOPICS } from './services/webSocket/messageTypes';

// Create a notification
const notification = WebSocketMessageBuilder.createNotification(
  userId,
  'Order Completed',
  'Your order has been processed successfully',
  'success'
);

// Create an update message
const update = WebSocketMessageBuilder.createUpdate(
  'inventory',
  'item_123',
  { stock: 50, price: 100 }
);

// Publish to topic
websocket.publish(TOPICS.BUSINESS.INVENTORY_UPDATE, update);
```

### Advanced Usage

#### Custom Channel Subscriptions
```jsx
function ChatComponent() {
  const { subscribe, unsubscribe, sendMessage } = useWebSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handler = (message) => {
      setMessages(prev => [...prev, message]);
    };

    subscribe('chat.general', handler);

    return () => {
      unsubscribe('chat.general', handler);
    };
  }, []);

  const sendChatMessage = () => {
    sendMessage({
      type: 'custom',
      channel: 'chat.general',
      payload: { text: 'Hello!', user: currentUser }
    });
  };
}
```

#### Route-based Conditional Subscriptions
```jsx
function DynamicSubscriber() {
  const { currentRoute } = useWebSocket();

  // Subscribe to different topics based on route
  useWebSocketRoute(
    currentRoute === '/inventory'
      ? [TOPICS.BUSINESS.INVENTORY_UPDATE, TOPICS.BUSINESS.STOCK_LOW]
      : currentRoute === '/sales'
      ? [TOPICS.BUSINESS.SALES_UPDATE]
      : [TOPICS.USER.NOTIFICATION] // Default
  );
}
```

## Configuration

### Environment Variables
```env
# WebSocket URL
REACT_APP_WS_URL=ws://localhost:8080/ws

# Security (production only)
REACT_APP_WS_SECRET=your-websocket-secret-key

# WebSocket connection settings
REACT_APP_WS_MAX_RECONNECT_ATTEMPTS=5
REACT_APP_WS_RECONNECT_DELAY=1000
REACT_APP_WS_PING_INTERVAL=30000
```

### Provider Configuration
```jsx
<WebSocketProvider config={{
  wsUrl: process.env.REACT_APP_WS_URL,
  maxReconnectAttempts: 5,
  enableEncryption: process.env.NODE_ENV === 'production',
  topics: {
    // Custom topic mappings
    '/custom-route': ['custom.topic']
  }
}}>
```

## Security Considerations

### Authentication
- JWT tokens are validated on connection establishment
- Tokens are refreshed automatically before expiry
- Invalid tokens trigger reconnection attempts

### Authorization
- Sensitive topics require authentication
- Client-side permission validation
- Server-side enforcement required

### Encryption
- Optional payload encryption in production
- Uses Web Crypto API with AES-GCM
- Session keys for key rotation

### Anti-abuse Measures
- Rate limiting at connection level
- Timestamp validation for replay attack prevention
- Client ID tracking for session management

## Performance Optimization

### Connection Optimization
- **Multiplexing**: Single connection for all routes
- **Lazy Loading**: Components subscribe only when mounted
- **Cleanup**: Automatic unsubscription on component unmount

### Message Optimization
- **Topic-based routing**: Clients only receive relevant messages
- **Message queuing**: Buffer messages during disconnection
- **Batch processing**: Group small messages where possible

### Memory Management
- **Reference counting**: Automatic cleanup of unused subscriptions
- **Debounced updates**: Prevent excessive re-renders
- **Connection pooling**: Share connections across components

## Monitoring and Debugging

### Connection State
```jsx
const { isConnected, connectionState } = useWebSocket();

console.log('Connection state:', connectionState);
// {
//   isConnected: true,
//   reconnectAttempts: 0,
//   channelCount: 5,
//   routeSubscriptionCount: 3,
//   queuedMessageCount: 0
// }
```

### Error Handling
```jsx
useWebSocketTopic(TOPICS.SYSTEM.ERROR, (error) => {
  console.error('WebSocket error:', error);
  // Handle error, show notification, etc.
});
```

### Development Tools
```jsx
// Log all messages in development
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const handler = (message) => {
      console.log('🔗 WS Message:', message);
    };
    subscribe('debug.all', handler);
  }
}, []);
```

## Server-side Integration

The server should implement complementary functionality:

### Authentication Endpoint
```javascript
// WebSocket authentication middleware
app.ws('/ws', (ws, req) => {
  const token = req.query.token;
  const clientId = req.query.client_id;

  // Validate token, establish session
  if (validateToken(token)) {
    ws.userId = getUserIdFromToken(token);
    ws.clientId = clientId;

    // Send auth success
    ws.send(JSON.stringify({
      type: 'auth_success',
      userId: ws.userId
    }));
  }
});
```

### Topic Broadcasting
```javascript
// Broadcast to topic subscribers
function broadcastToTopic(topic, message, route = null) {
  const subscribers = topicSubscribers.get(topic);

  subscribers.forEach(ws => {
    if (!route || ws.currentRoute === route) {
      ws.send(JSON.stringify({
        type: 'update',
        topic,
        payload: message,
        timestamp: Date.now()
      }));
    }
  });
}
```

## Migration Guide

### From REST-only API
1. Identify real-time features (notifications, live updates, collaboration)
2. Map current API endpoints to WebSocket topics
3. Replace polling with topic subscriptions
4. Add error boundaries for network disconnections

### From Existing WebSocket Implementation
1. Wrap existing WebSocket code with WebSocketManager
2. Update topic naming convention
3. Implement authentication layer
4. Add React context integration

## Troubleshooting

### Common Issues
1. **Connection fails**: Check WebSocket URL, CORS, and network connectivity
2. **Messages not received**: Verify topic subscriptions and route mappings
3. **Authentication errors**: Check token validity and server configuration
4. **Performance issues**: Monitor connection count and message frequency

### Debugging Commands
```javascript
// Force reconnection
wsManager.disconnect();
wsManager.connect(url, token);

// Log current subscriptions
console.log('Route subscriptions:', routeSubscriptions);
console.log('Topic subscriptions:', topicSubscriptions);

// Test message sending
sendMessage({
  type: 'test',
  topic: 'debug.test',
  payload: { test: 'data' }
});
```

## Future Enhancements

- **Load Balancing**: Support for multiple WebSocket servers
- **Compression**: Protocol-level message compression
- **Offline Support**: Message queuing for offline periods
- **Metrics**: Connection monitoring and analytics
- **Clustering**: Distributed WebSocket management
