/**
 * HTTP Client
 * Centralized HTTP client with interceptors for API calls
 * Replaces hardcoded fetch calls throughout the application
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';
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
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

/**
 * Get authentication token from secureStorage (matching useAuthSecure)
 */
const getAuthToken = () => {
  // Get token from localStorage (JWT is a plain string, not JSON)
  const token = localStorage.getItem('token');
  if (token && token !== 'cookie-based') {
    return token;
  }

  // Fallback to old keys for backward compatibility
  return localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
};

const TOKEN_KEY = 'token';
const REFRESH_INTERVAL_MS = 25 * 60 * 1000; // refresh every 25 minutes
const TOKEN_REFRESH_LOCK_KEY = 'tokenRefreshLock';
const TOKEN_REFRESH_LOCK_TTL_MS = 60 * 1000; // 1 minute

const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && token !== 'cookie-based') return token;
  return localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
};

const setToken = (token) => {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
};

const isTokenCloseToExpiry = (token, thresholdMinutes = 5) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now <= thresholdMinutes * 60;
  } catch {
    return false;
  }
};

const acquireRefreshLock = () => {
  const now = Date.now();
  const lock = localStorage.getItem(TOKEN_REFRESH_LOCK_KEY);
  if (lock) {
    const { acquiredAt } = JSON.parse(lock);
    if (now - acquiredAt < TOKEN_REFRESH_LOCK_TTL_MS) return false;
  }
  localStorage.setItem(TOKEN_REFRESH_LOCK_KEY, JSON.stringify({ acquiredAt: now }));
  return true;
};

const releaseRefreshLock = () => {
  localStorage.removeItem(TOKEN_REFRESH_LOCK_KEY);
};

let refreshTimer = null;
let isRefreshing = false;

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

const refreshToken = async () => {
  if (isRefreshing) return;
  if (!acquireRefreshLock()) return;

  isRefreshing = true;
  try {
    const token = getToken();
    if (!token) return;

    // Only refresh if token is close to expiry (prevents unnecessary refresh calls)
    if (!isTokenCloseToExpiry(token, 30)) return;

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthExpired();
      }
      return;
    }

    const data = await response.json();
    const newToken = data?.data?.token || data?.token;
    if (newToken) {
      setToken(newToken);
      window.dispatchEvent(new CustomEvent('auth:tokenRefreshed', { detail: { token: newToken, timestamp: Date.now() } }));
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔄 Token refresh failed:', error.message);
    }
  } finally {
    isRefreshing = false;
    releaseRefreshLock();
  }
};

const handleAuthExpired = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('secureAuthToken');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'token_refresh_failed', timestamp: Date.now() } }));
};

const startTokenRefreshTimer = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    const token = getToken();
    if (!token) {
      clearInterval(refreshTimer);
      refreshTimer = null;
      return;
    }
    if (isTokenCloseToExpiry(token, 30)) {
      refreshToken();
    }
  }, REFRESH_INTERVAL_MS);
};

const stopTokenRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * Handle response errors (including CORS errors)
 */
// Ensure refresh timer starts on module load when a token exists
if (typeof window !== 'undefined' && getToken()) {
  startTokenRefreshTimer();
}

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
        await response.text(); // Consume text to avoid memory leaks if needed, but not assigning to avoid warnings
        
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
      handleAuthExpired();
      errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
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
    
    const error = new Error(errorMessage);
    error.data = errorDetails;
    error.status = response.status;
    throw error;
  }
  
  return response;
};

/**
 * Request cache for GET requests
 */
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Request deduplication for concurrent requests
 */
const pendingRequests = new Map();

/**
 * Main HTTP client class
 */
class HttpClient {
  /**
   * GET request with caching and deduplication
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
      
      // Check cache first (if caching is enabled)
      const cacheKey = `GET:${url}`;
      if (options.cache !== false) {
        const cached = requestCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          if (process.env.NODE_ENV === 'development') {
            console.log('📦 Cache hit for:', url);
          }
          return cached.data;
        }
      }
      
      // Check for pending request (deduplication)
      if (pendingRequests.has(cacheKey)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏳ Deduplicating request for:', url);
        }
        return pendingRequests.get(cacheKey);
      }
      
      // Check if request should be blocked due to recent failures
      if (shouldBlockRequest(url)) {
        throw new Error('Request blocked due to recent failures. Please wait before retrying.');
      }
      
      // Remove params from options before passing to fetch
      const { params, cache, responseType, ...fetchOptions } = options;
      
      // Create the request promise
      const requestPromise = (async () => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: await buildHeaders(options.headers),
            credentials: 'include',
            ...fetchOptions
          });
          
          await handleResponseError(response);
          
          if (responseType === 'blob') {
            const data = await response.blob();
            // Clear failed request record on success
            clearFailedRequest(url);
            return data;
          }

          const data = await response.json();
          
          // Clear failed request record on success
          clearFailedRequest(url);
          
          // Cache the response (if caching is enabled)
          if (options.cache !== false) {
            requestCache.set(cacheKey, {
              data,
              timestamp: Date.now()
            });
          }
          
          return data;
        } catch (error) {
          // Record failed request for retry prevention
          recordFailedRequest(url);
          throw error;
        } finally {
          // Remove from pending requests
          pendingRequests.delete(cacheKey);
        }
      })();
      
      // Store pending request
      pendingRequests.set(cacheKey, requestPromise);
      
      return requestPromise;
    });
  }

  /**
   * POST request
   */
  static async post(endpoint, data = null, options = {}) {
    return performanceMonitor.measureApiCall(endpoint, async () => {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      // Separate headers from the rest so the spread below cannot overwrite
      // the Authorization header that buildHeaders injects.
      const { headers: customHeaders = {}, ...restOptions } = options;

      // Skip CSRF completely for JWT authentication
      let body = null;
      let headers = await buildHeaders(customHeaders);
      
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
        ...restOptions
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
      
      const { headers: customHeaders = {}, ...restOptions } = options;
      let body = null;
      let headers = await buildHeaders(customHeaders);
      
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
        ...restOptions
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
      
      const { headers: customHeaders = {}, ...restOptions } = options;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: await buildHeaders(customHeaders),
        credentials: 'include',
        ...restOptions
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
    
    const { headers: customHeaders = {}, ...restOptions } = options;
    let body = null;
    let headers = await buildHeaders(customHeaders);
    
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
      ...restOptions
    });
    
    await handleResponseError(response);
    
    // For HEAD requests, don't try to parse JSON
    if (method.toUpperCase() === 'HEAD') {
      return response;
    }
    
    return response.json();
  }
  
  /**
   * Clear request cache
   */
  static clearCache(pattern = null) {
    if (pattern) {
      for (const [key] of requestCache) {
        if (key.includes(pattern)) {
          requestCache.delete(key);
        }
      }
    } else {
      requestCache.clear();
    }
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: requestCache.size,
      keys: Array.from(requestCache.keys()),
      pendingRequests: pendingRequests.size
    };
  }
  
  /**
   * Batch requests utility
   */
  static async batch(requests) {
    const results = await Promise.allSettled(
      requests.map(({ method, endpoint, data, options }) => 
        this.request(method, endpoint, data, options)
      )
    );
    
    return results.map((result, index) => ({
      ...requests[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }
  
  /**
   * Retry mechanism for failed requests
   */
  static async withRetry(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`🔄 Retrying request (attempt ${attempt + 1}/${maxRetries}) after ${waitTime}ms`);
        }
      }
    }
    
    throw lastError;
  }
}

// Clean up expired cache entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCache) {
      if (now - value.timestamp > CACHE_DURATION) {
        requestCache.delete(key);
      }
    }
  }, CACHE_DURATION);
}

export const TokenRefresh = {
  start: startTokenRefreshTimer,
  stop: stopTokenRefreshTimer,
  refresh: refreshToken,
};

export default HttpClient;

