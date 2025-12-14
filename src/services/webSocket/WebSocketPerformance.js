/**
 * WebSocket Performance Optimization Service
 * Handles message batching, compression, and performance monitoring
 */

class WebSocketPerformance {
  constructor() {
    this.messageQueue = [];
    this.batchTimeout = null;
    this.compressionEnabled = this.shouldEnableCompression();
    this.batchSize = this.getOptimalBatchSize();
    this.messageCounters = new Map();

    // Performance metrics
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      connectionTime: 0,
      averageLatency: 0,
      batchSavings: 0
    };
  }

  /**
   * Determine if compression should be enabled
   */
  shouldEnableCompression() {
    // Enable compression for production and good network conditions
    return process.env.NODE_ENV === 'production' &&
           navigator.onLine &&
           !this.isSlowConnection();
  }

  /**
   * Check if connection is slow
   */
  isSlowConnection() {
    const connection = navigator.connection ||
                      navigator.mozConnection ||
                      navigator.webkitConnection;

    if (!connection) return false;

    return connection.effectiveType === 'slow-2g' ||
           connection.effectiveType === '2g' ||
           connection.saveData === true;
  }

  /**
   * Get optimal batch size based on device and connection
   */
  getOptimalBatchSize() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSlow = this.isSlowConnection();

    if (isSlow) return 5;        // Small batches for slow connections
    if (isMobile) return 10;      // Medium batches for mobile
    return 20;                   // Large batches for desktop
  }

  /**
   * Batch messages for efficient sending
   */
  batchMessages(messages, wsManager) {
    if (messages.length === 0) return null;

    const batchMessage = {
      type: 'batch',
      messages: messages,
      timestamp: Date.now(),
      batchId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Track batch savings
    const individualSize = messages.reduce((size, msg) => size + JSON.stringify(msg).length, 0);
    const batchSize = JSON.stringify(batchMessage).length;
    this.metrics.batchSavings += (individualSize - batchSize);

    return batchMessage;
  }

  /**
   * Queue message for batch processing
   */
  queueMessage(message, wsManager) {
    this.messageQueue.push(message);
    this.metrics.messagesSent++;

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // If queue is full, send immediately
    if (this.messageQueue.length >= this.batchSize) {
      this.flushBatch(wsManager);
    } else {
      // Schedule batch processing
      this.batchTimeout = setTimeout(() => {
        this.flushBatch(wsManager);
      }, 100); // 100ms batch window
    }
  }

  /**
   * Flush message batch to WebSocket
   */
  flushBatch(wsManager) {
    if (this.messageQueue.length === 0) return;

    if (this.messageQueue.length === 1) {
      // Single message, send directly
      wsManager.send(this.messageQueue[0]);
    } else {
      // Multiple messages, send as batch
      const batch = this.batchMessages(this.messageQueue, wsManager);
      wsManager.send(batch);
    }

    this.messageQueue = [];
  }

  /**
   * Compress message payload
   */
  static async compressMessage(message) {
    if (!message.payload || !this.compressionEnabled) {
      return message;
    }

    try {
      // Use native compression if available
      if (window.CompressionStream) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(new TextEncoder().encode(JSON.stringify(message.payload)));
        writer.close();

        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }

        return {
          ...message,
          payload: {
            compressed: true,
            algorithm: 'gzip',
            data: btoa(String.fromCharCode(...compressed)),
            originalSize: JSON.stringify(message.payload).length
          }
        };
      } else {
        // Fallback: simple LZ-style compression for basic fields
        return this.compressFallback(message);
      }
    } catch (error) {
      console.warn('Compression failed:', error);
      return message;
    }
  }

  /**
   * Fallback compression for unsupported browsers
   */
  static compressFallback(message) {
    // Simple string replacement compression for common patterns
    const compressString = (str) => {
      return str
        .replace(/true/g, '1')
        .replace(/false/g, '0')
        .replace(/null/g, 'N')
        .replace(/\s+/g, ' ')
        .slice(0, 1000); // Limit size
    };

    const originalPayload = JSON.stringify(message.payload);
    const compressedPayload = compressString(originalPayload);

    if (compressedPayload.length < originalPayload.length * 0.8) {
      return {
        ...message,
        payload: {
          compressed: true,
          algorithm: 'fallback',
          data: btoa(compressedPayload),
          originalSize: originalPayload.length
        }
      };
    }

    return message;
  }

  /**
   * Decompress incoming message
   */
  static async decompressMessage(message) {
    if (!message.payload?.compressed) {
      return message;
    }

    try {
      const { data, algorithm, originalSize } = message.payload;
      const compressedData = Uint8Array.from(atob(data), c => c.charCodeAt(0));

      let decompressed;
      if (window.DecompressionStream && algorithm === 'gzip') {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(compressedData);
        writer.close();

        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const result = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        decompressed = new TextDecoder().decode(result);
      } else {
        // Fallback decompression
        decompressed = atob(data);
        decompressed = decompressed
          .replace(/1/g, 'true')
          .replace(/0/g, 'false')
          .replace(/N/g, 'null');
      }

      return {
        ...message,
        payload: JSON.parse(decompressed)
      };
    } catch (error) {
      console.error('Decompression failed:', error);
      return message;
    }
  }

  /**
   * Optimize message based on content analysis
   */
  static optimizeMessage(message) {
    const optimized = { ...message };

    // Remove unnecessary fields for common message types
    if (message.type === 'publish' || message.type === 'update') {
      // Remove channel field if same as topic
      if (optimized.channel === optimized.topic) {
        delete optimized.channel;
      }

      // Compress timestamp if recent
      if (optimized.timestamp) {
        const age = Date.now() - optimized.timestamp;
        if (age < 60000) { // Within 1 minute
          optimized.timestamp = Math.floor(age / 1000); // Convert to seconds
          optimized.relativeTimestamp = true;
        }
      }
    }

    // Minify payload field names
    if (optimized.payload && typeof optimized.payload === 'object') {
      optimized.payload = this.minifyKeys(optimized.payload);
    }

    return optimized;
  }

  /**
   * Minify object keys for smaller payload
   */
  static minifyKeys(obj) {
    const keyMap = {
      'timestamp': 'ts',
      'message': 'msg',
      'type': 't',
      'data': 'd',
      'id': 'i',
      'user': 'u',
      'action': 'a'
    };

    const minifyObj = (o) => {
      if (Array.isArray(o)) {
        return o.map(item => minifyObj(item));
      }

      if (o && typeof o === 'object') {
        const minified = {};
        for (const [key, value] of Object.entries(o)) {
          const minifiedKey = keyMap[key] || key;
          minified[minifiedKey] = minifyObj(value);
        }
        return minified;
      }

      return o;
    };

    return minifyObj(obj);
  }

  /**
   * Track message statistics
   */
  trackMessage(message, direction = 'outbound') {
    const key = `${direction}_${message.type}`;
    this.messageCounters.set(key, (this.messageCounters.get(key) || 0) + 1);

    const size = JSON.stringify(message).length;
    if (direction === 'outbound') {
      this.metrics.bytesSent += size;
    } else {
      this.metrics.bytesReceived += size;
      this.metrics.messagesReceived++;
    }
  }

  /**
   * Measure message round-trip time
   */
  measureLatency(messageId, responseTimestamp) {
    // Implementation would track message IDs and response times
    // For heartbeat messages, update average latency
  }

  /**
   * Get performance profile
   */
  getPerformanceProfile() {
    const profile = {
      compressionEnabled: this.compressionEnabled,
      batchSize: this.batchSize,
      queuedMessages: this.messageQueue.length,
      messageCounters: Object.fromEntries(this.messageCounters),
      metrics: { ...this.metrics },
      compressionSavings: this.calculateCompressionSavings(),
      batchEfficiency: this.calculateBatchEfficiency()
    };

    // Add derived metrics
    profile.metrics.averageMessageSize = profile.metrics.messagesSent > 0
      ? profile.metrics.bytesSent / profile.metrics.messagesSent
      : 0;

    profile.metrics.totalMessages = profile.metrics.messagesSent + profile.metrics.messagesReceived;

    return profile;
  }

  /**
   * Calculate compression savings
   */
  calculateCompressionSavings() {
    // Would track original vs compressed sizes
    return 0; // Placeholder
  }

  /**
   * Calculate batch efficiency
   */
  calculateBatchEfficiency() {
    return this.metrics.batchSavings > 0
      ? (this.metrics.batchSavings / this.metrics.bytesSent) * 100
      : 0;
  }

  /**
   * Reset performance counters
   */
  resetMetrics() {
    this.messageCounters.clear();
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      connectionTime: 0,
      averageLatency: 0,
      batchSavings: 0
    };
  }

  /**
   * Adjust performance settings based on runtime conditions
   */
  adjustPerformance(networkConditions) {
    const { effectiveType, downlink } = networkConditions || {};

    // Adjust batch size based on connection
    if (effectiveType === '4g' && downlink > 5) {
      this.batchSize = Math.min(this.batchSize + 5, 30);
    } else if (effectiveType === '3g' || downlink < 2) {
      this.batchSize = Math.max(this.batchSize - 5, 3);
    }

    // Enable/disable compression
    this.compressionEnabled = this.shouldEnableCompression();
  }
}

// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  const [profile, setProfile] = useState({});

  useEffect(() => {
    const updateProfile = () => {
      const performanceInstance = new WebSocketPerformance();
      setProfile(performanceInstance.getPerformanceProfile());
    };

    const interval = setInterval(updateProfile, 30000); // Update every 30s
    updateProfile(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return profile;
};

// Singleton instance for global access
const performanceMonitor = new WebSocketPerformance();

export default performanceMonitor;
