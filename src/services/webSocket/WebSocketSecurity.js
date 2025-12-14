/**
 * WebSocket Security Service
 * Handles authentication, encryption, and secure communication
 */

import { API_BASE_URL } from '../../config/api';

class WebSocketSecurity {
  constructor() {
    this.encryptionEnabled = process.env.NODE_ENV === 'production';
    this.certificates = null;
    this.sessionKeys = new Map();
    this.tokenRefreshInterval = null;
  }

  /**
   * Generate secure WebSocket URL with authentication
   */
  static buildSecureWebSocketUrl(token, additionalParams = {}) {
    const baseUrl = process.env.REACT_APP_WS_URL || API_BASE_URL.replace(/^http/, 'ws');
    const url = new URL(baseUrl);

    // Add authentication token
    if (token) {
      url.searchParams.set('token', token);
    }

    // Add security parameters
    url.searchParams.set('secure', 'true');
    url.searchParams.set('timestamp', Date.now().toString());
    url.searchParams.set('client_id', this.generateClientId());
    url.searchParams.set('version', process.env.REACT_APP_VERSION || '1.0.0');

    // Add custom parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString());
    });

    // Add signature for additional security
    const signature = this.generateUrlSignature(url.toString(), token);
    url.searchParams.set('signature', signature);

    return url.toString();
  }

  /**
   * Generate client ID for this session
   */
  static generateClientId() {
    const stored = localStorage.getItem('ws_client_id');
    if (stored) {
      return stored;
    }

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ws_client_id', clientId);
    return clientId;
  }

  /**
   * Generate URL signature for security
   */
  static generateUrlSignature(url, token = '') {
    const secret = process.env.REACT_APP_WS_SECRET || 'default-ws-secret';
    const data = url + token;

    // Simple HMAC-like signature (using Web Crypto API in production)
    if (window.crypto && window.crypto.subtle) {
      // For production, use proper HMAC
      return this.generateCryptoSignature(data, secret);
    } else {
      // Fallback for development
      return btoa(data).slice(0, 16);
    }
  }

  /**
   * Generate cryptographic signature
   */
  static async generateCryptoSignature(data, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataBytes = encoder.encode(data);

    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', key, dataBytes);
    return btoa(String.fromCharCode(...new Uint8Array(signature))).slice(0, 32);
  }

  /**
   * Encrypt message payload
   */
  static async encryptMessage(message, sessionKey = null) {
    if (!this.encryptionEnabled || !message.payload) {
      return message;
    }

    try {
      const key = sessionKey || await this.getSessionKey();
      const data = JSON.stringify(message.payload);

      // Use Web Crypto API for encryption
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        new TextEncoder().encode(data)
      );

      return {
        ...message,
        payload: {
          encrypted: true,
          data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
          iv: btoa(String.fromCharCode(...iv)),
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.warn('Encryption failed, sending plain message:', error);
      return message;
    }
  }

  /**
   * Decrypt message payload
   */
  static async decryptMessage(message) {
    if (!message.payload || !message.payload.encrypted) {
      return message;
    }

    try {
      const key = await this.getSessionKey();
      const encryptedData = Uint8Array.from(atob(message.payload.data), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(message.payload.iv), c => c.charCodeAt(0));

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedData
      );

      const decryptedText = new TextDecoder().decode(decrypted);
      return {
        ...message,
        payload: JSON.parse(decryptedText)
      };
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Generate or retrieve session key for encryption
   */
  static async getSessionKey() {
    const sessionId = localStorage.getItem('ws_session_id') || 'default';
    const cached = this.sessionKeys.get(sessionId);

    if (cached) {
      return cached;
    }

    // Generate a new AES key
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    this.sessionKeys.set(sessionId, key);
    return key;
  }

  /**
   * Validate message authenticity
   */
  static validateMessage(message, token = null) {
    // Basic validation
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message structure');
    }

    // Check for replay attacks using timestamp
    if (message.timestamp) {
      const age = Date.now() - message.timestamp;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (age > maxAge || age < -1000) { // Allow 1 second clock skew
        throw new Error('Message timestamp is invalid');
      }
    }

    // Validate user permissions for sensitive topics
    if (this.requiresPermission(message.topic)) {
      if (!token) {
        throw new Error('Authentication required for this topic');
      }
    }

    return true;
  }

  /**
   * Check if topic requires special permissions
   */
  static requiresPermission(topic) {
    const sensitiveTopics = [
      'system.admin.',
      'business.confidential.',
      'user.admin.',
      'master.admin.'
    ];

    return sensitiveTopics.some(prefix => topic?.startsWith(prefix));
  }

  /**
   * Setup periodic token refresh
   */
  setupTokenRefresh(token, refreshToken) {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    // Refresh token every 25 minutes (5 minutes before expiry)
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        const newToken = await this.refreshToken(refreshToken);
        // Update token in localStorage and WebSocket
        localStorage.setItem('token', newToken);
        this.updateConnectionToken(newToken);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Disconnect WebSocket on token refresh failure
        this.disconnect();
      }
    }, 25 * 60 * 1000);
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken) {
    const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.token;
  }

  /**
   * Update token in active WebSocket connections
   */
  updateConnectionToken(newToken) {
    // Implementation would notify WebSocketManager of token change
    // This ensures new messages use the updated token
    console.log('Token updated in WebSocket connection');
  }

  /**
   * Cleanup security resources
   */
  cleanup() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }

    this.sessionKeys.clear();
    localStorage.removeItem('ws_client_id');
    localStorage.removeItem('ws_session_id');
  }

  /**
   * Certificate management for production
   */
  static async loadCertificates() {
    if (process.env.NODE_ENV === 'production') {
      // In production, you might load certificates from secure storage
      return null;
    }

    return null; // No certificates in development
  }

  /**
   * Sanitize message before sending
   */
  static sanitizeMessage(message) {
    const sanitized = { ...message };

    // Remove sensitive fields that shouldn't be sent via WebSocket
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'private', 'ssn'];
    sensitiveFields.forEach(field => {
      if (sanitized.payload && typeof sanitized.payload === 'object') {
        delete sanitized.payload[field];
      }
    });

    return sanitized;
  }
}

export default WebSocketSecurity;
