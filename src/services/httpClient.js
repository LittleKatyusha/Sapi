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
 * Build headers for request
 */
const buildHeaders = (customHeaders = {}) => {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  
  // Add authentication token if available
  const token = getAuthToken() || getSecureAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
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