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
  'Accept': 'application/json'
  // 'API-KEY': '92b1d1ee96659e5b9630a51808b9372c' // Temporarily removed
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

/**
 * Get CSRF token from Laravel Sanctum
 */
const getCsrfToken = async () => {
  try {
    // First, make a request to the sanctum/csrf-cookie endpoint to set the CSRF cookie
    await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include'
    });
    
    // Then extract the CSRF token from the cookie
    // Laravel sets both XSRF-TOKEN and laravel_session cookies
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='));
    
    if (csrfCookie) {
      const token = decodeURIComponent(csrfCookie.split('=')[1]);
      console.log('CSRF Token retrieved:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('CSRF token cookie not found in:', document.cookie);
    }
  } catch (error) {
    console.warn('Failed to get CSRF token:', error);
  }
  return null;
};

let csrfToken = null;

/**
 * Build headers for request
 */
const buildHeaders = async (customHeaders = {}, skipCsrf = false) => {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  
  // Add authentication token if available
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token for non-GET requests (skip for JWT-based login)
  if (!skipCsrf) {
    if (!csrfToken) {
      csrfToken = await getCsrfToken();
    }
    
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
      // Also try the alternative header name that Laravel might expect
      headers['X-CSRF-TOKEN'] = csrfToken;
    }
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
    
    // Handle 419 - CSRF token mismatch, refresh token and retry
    if (response.status === 419) {
      csrfToken = null; // Reset CSRF token to force refresh
      errorMessage = 'Token keamanan tidak valid. Silakan refresh halaman dan coba lagi.';
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
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await buildHeaders(options.headers),
      credentials: 'include',
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
    
    // Skip CSRF tokens for JWT-based authentication endpoints
    const isAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/register');
    const skipCsrf = isAuthEndpoint || options.skipCsrf;
    const useCredentials = !isAuthEndpoint; // Don't use credentials for JWT auth
    
    let body = null;
    let headers = await buildHeaders(options.headers, skipCsrf);
    
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
      ...options
    };
    
    // Only include credentials for session-based routes
    if (useCredentials) {
      fetchOptions.credentials = 'include';
    }
    
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