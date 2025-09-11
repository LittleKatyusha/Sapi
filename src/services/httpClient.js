/**
 * HTTP Client
 * Centralized HTTP client with interceptors for API calls
 * Replaces hardcoded fetch calls throughout the application
 */

import { API_BASE_URL } from '../config/api.js';
import performanceMonitor from '../utils/performanceMonitor';
import { CORS_CONFIG, generateCorsHeaders } from '../config/cors.js';

// Track failed requests to prevent infinite retry loops
const failedRequests = new Map();
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Check if a request should be blocked due to recent failures
 */
const shouldBlockRequest = (url) => {
  const now = Date.now();
  const requestKey = url;
  
  if (failedRequests.has(requestKey)) {
    const { attempts, lastAttempt } = failedRequests.get(requestKey);
    
    // If we've exceeded max attempts and it's been less than RETRY_DELAY since last attempt
    if (attempts >= MAX_RETRY_ATTEMPTS && (now - lastAttempt) < RETRY_DELAY) {
      return true;
    }
    
    // Reset counter if enough time has passed
    if ((now - lastAttempt) >= RETRY_DELAY) {
      failedRequests.delete(requestKey);
    }
  }
  
  return false;
};

/**
 * Record a failed request
 */
const recordFailedRequest = (url) => {
  const requestKey = url;
  const now = Date.now();
  
  if (failedRequests.has(requestKey)) {
    const existing = failedRequests.get(requestKey);
    failedRequests.set(requestKey, {
      attempts: existing.attempts + 1,
      lastAttempt: now
    });
  } else {
    failedRequests.set(requestKey, {
      attempts: 1,
      lastAttempt: now
    });
  }
};

/**
 * Clear failed request record (on successful request)
 */
const clearFailedRequest = (url) => {
  failedRequests.delete(url);
};

/**
 * Default headers for all requests (includes CORS headers)
 */
const DEFAULT_HEADERS = {
  ...CORS_CONFIG.defaultHeaders,
  'X-Requested-With': 'XMLHttpRequest'
};

/**
 * Get authentication token from secureStorage (matching useAuthSecure)
 */
const getAuthToken = () => {
  // First try the secure storage method used by useAuthSecure
  try {
    const stored = localStorage.getItem('token');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // If JSON parsing fails, try as plain string
    return localStorage.getItem('token');
  }
  
  // Fallback to old keys for backward compatibility
  return localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
};

// CSRF token handling removed - using JWT authentication only

/**
 * Build headers for request (JWT authentication + CORS)
 */
const buildHeaders = async (customHeaders = {}) => {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  
  // Add authentication token if available
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CORS headers for preflight requests
  const corsHeaders = generateCorsHeaders(window.location.origin);
  Object.keys(corsHeaders).forEach(key => {
    if (key.startsWith('Access-Control-Request-')) {
      headers[key] = corsHeaders[key];
    }
  });
  
  // Add origin header for CORS
  if (window.location.origin) {
    headers.Origin = window.location.origin;
  }
  
  return headers;
};

/**
 * Handle response errors (including CORS errors)
 */
const handleResponseError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails = null;
    
    // Handle CORS errors specifically
    if (response.status === 0 || response.type === 'opaque') {
      errorMessage = 'CORS error: Tidak dapat mengakses server. Periksa konfigurasi CORS.';
      throw new Error(errorMessage);
    }
    
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('🔍 Error response details:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
      } else {
        // For non-JSON responses (like HTML error pages)
        const responseText = await response.text();
        
        // Provide more user-friendly error messages for common HTTP errors
        if (response.status === 500) {
          errorMessage = 'Server mengalami kesalahan internal. Silakan coba lagi dalam beberapa saat.';
        } else if (response.status === 503) {
          errorMessage = 'Layanan sementara tidak tersedia. Silakan coba lagi nanti.';
        } else if (response.status === 404) {
          errorMessage = 'Endpoint atau data yang diminta tidak ditemukan.';
        } else if (response.status === 403) {
          errorMessage = 'Anda tidak memiliki izin untuk mengakses resource ini.';
        }
      }
    } catch (parseError) {
      // If response parsing fails, use default error message
    }
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('secureAuthToken');
      localStorage.removeItem('token');
      errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      // Don't redirect here to avoid issues, let components handle it
    }
    
    // Handle 419 - Token mismatch (should not occur with JWT)
    if (response.status === 419) {
      errorMessage = 'Token tidak valid. Silakan login ulang.';
    }
    
    // Handle 500 Internal Server Error with more specific messaging
    if (response.status === 500) {
      if (!errorMessage.includes('Server mengalami kesalahan')) {
        errorMessage = 'Server mengalami kesalahan internal. Silakan coba lagi atau hubungi administrator.';
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return response;
};

/**
 * Main HTTP client class
 */
class HttpClient {
  /**
   * GET request
   */
  static async get(endpoint, options = {}) {
    return performanceMonitor.measureApiCall(endpoint, async () => {
      let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      // Handle query parameters
      if (options.params) {
        const urlParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            urlParams.append(key, value);
          }
        });
        
        const queryString = urlParams.toString();
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString;
        }
      }
      
      // Check if request should be blocked due to recent failures
      if (shouldBlockRequest(url)) {
        throw new Error('Request blocked due to recent failures. Please wait before retrying.');
      }
      
      // Remove params from options before passing to fetch
      const { params, ...fetchOptions } = options;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: await buildHeaders(options.headers),
          credentials: 'include',
          ...fetchOptions
        });
        
        await handleResponseError(response);
        
        // Clear failed request record on success
        clearFailedRequest(url);
        
        return response.json();
      } catch (error) {
        // Record failed request for retry prevention
        recordFailedRequest(url);
        throw error;
      }
    });
  }

  /**
   * POST request
   */
  static async post(endpoint, data = null, options = {}) {
    return performanceMonitor.measureApiCall(endpoint, async () => {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      // Skip CSRF completely for JWT authentication
      let body = null;
      let headers = await buildHeaders(options.headers);
      
      // Handle different data types
      if (data instanceof FormData) {
        body = data;
        // Remove Content-Type header for FormData (browser will set it automatically)
        delete headers['Content-Type'];
      } else if (data) {
        body = JSON.stringify(data);
      }
      
      const fetchOptions = {
        method: 'POST',
        headers,
        body,
        credentials: 'include',
        ...options
      };
      
      const response = await fetch(url, fetchOptions);
      
      await handleResponseError(response);
      return response.json();
    });
  }

  /**
   * PUT request
   */
  static async put(endpoint, data = null, options = {}) {
    return performanceMonitor.measureApiCall(endpoint, async () => {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      let body = null;
      let headers = await buildHeaders(options.headers);
      
      if (data instanceof FormData) {
        body = data;
        delete headers['Content-Type'];
      } else if (data) {
        body = JSON.stringify(data);
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body,
        credentials: 'include',
        ...options
      });
      
      await handleResponseError(response);
      return response.json();
    });
  }

  /**
   * DELETE request
   */
  static async delete(endpoint, options = {}) {
    return performanceMonitor.measureApiCall(endpoint, async () => {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: await buildHeaders(options.headers),
        credentials: 'include',
        ...options
      });
      
      await handleResponseError(response);
      return response.json();
    });
  }

  /**
   * HEAD request
   */
  static async head(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: await buildHeaders(options.headers),
      credentials: 'include',
      ...options
    });
    
    await handleResponseError(response);
    return response;
  }

  /**
   * Generic request method for custom HTTP methods
   */
  static async request(method, endpoint, data = null, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    let body = null;
    let headers = await buildHeaders(options.headers);
    
    if (data instanceof FormData) {
      body = data;
      delete headers['Content-Type'];
    } else if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      body = JSON.stringify(data);
    }
    
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body,
      credentials: 'include',
      ...options
    });
    
    await handleResponseError(response);
    
    // For HEAD requests, don't try to parse JSON
    if (method.toUpperCase() === 'HEAD') {
      return response;
    }
    
    return response.json();
  }
}

export default HttpClient;
