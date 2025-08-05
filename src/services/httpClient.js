/**
 * HTTP Client
 * Centralized HTTP client with interceptors for API calls
 * Replaces hardcoded fetch calls throughout the application
 */

import { API_BASE_URL } from '../config/api.js';

/**
 * Default headers for all requests
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'API-KEY': 'putih2024'
};

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Get secure authentication token from localStorage
 */
const getSecureAuthToken = () => {
  return localStorage.getItem('secureAuthToken');
};

/**
 * Get CSRF token from cookies
 */
const getCsrfToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

/**
 * Initialize CSRF protection by getting CSRF cookie
 */
const initializeCsrfProtection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'API-KEY': 'putih2024'
      }
    });
    
    if (!response.ok) {
      console.warn('CSRF cookie request failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.warn('Failed to get CSRF cookie:', error.message);
    // CSRF is optional for development - continue without it
  }
};

/**
 * Build headers for request
 */
const buildHeaders = (customHeaders = {}) => {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  
  // Add authentication token if available
  const token = getAuthToken() || getSecureAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token for stateful requests
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }
  
  return headers;
};

/**
 * Handle response errors
 */
const handleResponseError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use default error message
    }
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('secureAuthToken');
      // Don't redirect here to avoid issues, let components handle it
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
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(options.headers),
      credentials: 'include', // Include cookies for CSRF
      ...options
    });
    
    await handleResponseError(response);
    return response.json();
  }

  /**
   * POST request
   */
  static async post(endpoint, data = null, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Initialize CSRF protection for authentication endpoints (optional for development)
    if (endpoint.includes('/api/login') || endpoint.includes('/sanctum/')) {
      try {
        await initializeCsrfProtection();
      } catch (error) {
        // Continue without CSRF for development
        console.warn('Continuing without CSRF token');
      }
    }
    
    let body = null;
    let headers = buildHeaders(options.headers);
    
    // Handle different data types
    if (data instanceof FormData) {
      body = data;
      // Remove Content-Type header for FormData (browser will set it automatically)
      delete headers['Content-Type'];
    } else if (data) {
      body = JSON.stringify(data);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      credentials: 'include', // Include cookies for CSRF
      ...options
    });
    
    await handleResponseError(response);
    return response.json();
  }

  /**
   * PUT request
   */
  static async put(endpoint, data = null, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    let body = null;
    let headers = buildHeaders(options.headers);
    
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
      credentials: 'include', // Include cookies for CSRF
      ...options
    });
    
    await handleResponseError(response);
    return response.json();
  }

  /**
   * DELETE request
   */
  static async delete(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(options.headers),
      credentials: 'include', // Include cookies for CSRF
      ...options
    });
    
    await handleResponseError(response);
    return response.json();
  }

  /**
   * HEAD request
   */
  static async head(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: buildHeaders(options.headers),
      credentials: 'include', // Include cookies for CSRF
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
    let headers = buildHeaders(options.headers);
    
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
      credentials: 'include', // Include cookies for CSRF
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

// Export the initialize function for use in app initialization
export const initializeHttpClient = initializeCsrfProtection;
export default HttpClient;