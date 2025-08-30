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
 * Build headers for request (JWT authentication only)
 */
const buildHeaders = async (customHeaders = {}) => {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  
  // Add authentication token if available
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('🔑 JWT token added to headers');
  } else {
    console.warn('⚠️ No JWT token found in localStorage');
  }
  
  return headers;
};

/**
 * Handle response errors
 */
const handleResponseError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails = null;
    
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
        
        console.error('🚨 API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData: errorData
        });
      } else {
        // For non-JSON responses (like HTML error pages)
        const responseText = await response.text();
        console.error('🚨 Non-JSON Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          contentType: contentType,
          responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
        });
        
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
      console.error('🚨 Error parsing response:', parseError);
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
      console.error('🚨 500 Internal Server Error:', {
        url: response.url,
        method: 'Unknown', // We don't have access to method here
        errorDetails: errorDetails
      });
      
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
    
    // Remove params from options before passing to fetch
    const { params, ...fetchOptions } = options;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await buildHeaders(options.headers),
      credentials: 'include',
      ...fetchOptions
    });
    
    await handleResponseError(response);
    return response.json();
  }

  /**
   * POST request
   */
  static async post(endpoint, data = null, options = {}) {
    console.log('🚀 POST METHOD CALLED - Entry point');
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Debug logging
    console.log('📡 POST Request Debug:', {
      endpoint,
      fullUrl: url,
      dataType: data instanceof FormData ? 'FormData' : typeof data,
      apiBaseUrl: API_BASE_URL,
      API_BASE_URL_Value: API_BASE_URL
    });
    
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
  }

  /**
   * PUT request
   */
  static async put(endpoint, data = null, options = {}) {
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
  }

  /**
   * DELETE request
   */
  static async delete(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: await buildHeaders(options.headers),
      credentials: 'include',
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