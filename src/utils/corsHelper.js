/**
 * CORS Helper Utilities
 * Provides utilities for handling CORS-related functionality in the frontend
 */

import { CORS_CONFIG, getAllowedOrigins, isOriginAllowed, validateCorsConfig } from '../config/cors';

/**
 * Check if current origin is allowed
 */
export const checkCurrentOrigin = () => {
  const currentOrigin = window.location.origin;
  const isAllowed = isOriginAllowed(currentOrigin);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 CORS Origin Check:', {
      currentOrigin,
      isAllowed,
      allowedOrigins: getAllowedOrigins()
    });
  }
  
  return {
    origin: currentOrigin,
    isAllowed,
    allowedOrigins: getAllowedOrigins()
  };
};

/**
 * Handle CORS preflight requests
 */
export const handlePreflightRequest = (url, method = 'GET', headers = {}) => {
  const requestHeaders = {
    'Access-Control-Request-Method': method.toUpperCase(),
    'Access-Control-Request-Headers': Object.keys(headers).join(', '),
    'Origin': window.location.origin
  };
  
  return fetch(url, {
    method: 'OPTIONS',
    headers: requestHeaders,
    credentials: 'include'
  });
};

/**
 * Test CORS connectivity to API
 */
export const testCorsConnectivity = async (apiUrl) => {
  const results = {
    origin: window.location.origin,
    apiUrl,
    tests: []
  };
  
  try {
    // Test 1: Simple GET request
    const getTest = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    results.tests.push({
      test: 'GET Request',
      status: getTest.status,
      success: getTest.ok,
      headers: Object.fromEntries(getTest.headers.entries())
    });
  } catch (error) {
    results.tests.push({
      test: 'GET Request',
      success: false,
      error: error.message
    });
  }
  
  try {
    // Test 2: Preflight request
    const preflightTest = await handlePreflightRequest(apiUrl, 'POST', {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test'
    });
    
    results.tests.push({
      test: 'Preflight Request',
      status: preflightTest.status,
      success: preflightTest.ok,
      headers: Object.fromEntries(preflightTest.headers.entries())
    });
  } catch (error) {
    results.tests.push({
      test: 'Preflight Request',
      success: false,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Generate CORS troubleshooting information
 */
export const generateCorsTroubleshooting = () => {
  const validation = validateCorsConfig();
  const originCheck = checkCurrentOrigin();
  
  const troubleshooting = {
    configuration: {
      isValid: validation.isValid,
      issues: validation.issues,
      config: CORS_CONFIG
    },
    origin: originCheck,
    recommendations: []
  };
  
  // Generate recommendations based on issues
  if (!validation.isValid) {
    validation.issues.forEach(issue => {
      if (issue.includes('production origins')) {
        troubleshooting.recommendations.push({
          type: 'configuration',
          message: 'Configure REACT_APP_FRONTEND_URL and REACT_APP_DOMAIN environment variables for production',
          priority: 'high'
        });
      }
      
      if (issue.includes('Wildcard origin')) {
        troubleshooting.recommendations.push({
          type: 'security',
          message: 'Remove wildcard (*) origins in production for security',
          priority: 'high'
        });
      }
    });
  }
  
  if (!originCheck.isAllowed) {
    troubleshooting.recommendations.push({
      type: 'origin',
      message: `Add ${originCheck.origin} to allowed origins in CORS configuration`,
      priority: 'high'
    });
  }
  
  return troubleshooting;
};

/**
 * CORS error handler
 */
export const handleCorsError = (error, url) => {
  const corsError = {
    type: 'CORS_ERROR',
    message: error.message,
    url,
    origin: window.location.origin,
    timestamp: new Date().toISOString(),
    troubleshooting: generateCorsTroubleshooting()
  };
  
  console.error('🚨 CORS Error Details:', corsError);
  
  // Show user-friendly error message
  const userMessage = `
    CORS Error: Tidak dapat mengakses server.
    
    Kemungkinan penyebab:
    1. Server tidak mengizinkan akses dari origin ini (${window.location.origin})
    2. Konfigurasi CORS server tidak tepat
    3. Network atau firewall memblokir request
    
    Silakan hubungi administrator sistem.
  `;
  
  return {
    error: corsError,
    userMessage
  };
};

/**
 * Initialize CORS monitoring
 */
export const initializeCorsMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    // Log CORS configuration on startup
    console.log('🌐 CORS Configuration:', {
      config: CORS_CONFIG,
      currentOrigin: window.location.origin,
      allowedOrigins: getAllowedOrigins(),
      validation: validateCorsConfig()
    });
    
    // Monitor fetch requests for CORS issues
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Log CORS headers in development
        if (response.headers.get('Access-Control-Allow-Origin')) {
          console.log('🌐 CORS Headers Received:', {
            url: args[0],
            allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
            allowMethods: response.headers.get('Access-Control-Allow-Methods'),
            allowHeaders: response.headers.get('Access-Control-Allow-Headers')
          });
        }
        
        return response;
      } catch (error) {
        // Check if it's a CORS error
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
          handleCorsError(error, args[0]);
        }
        throw error;
      }
    };
  }
};

/**
 * Validate API endpoint CORS configuration
 */
export const validateApiCors = async (apiUrl) => {
  const validation = {
    url: apiUrl,
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  try {
    // Test basic connectivity
    const connectivityTest = await testCorsConnectivity(apiUrl);
    validation.tests.push({
      name: 'Connectivity Test',
      result: connectivityTest,
      passed: connectivityTest.tests.every(test => test.success)
    });
    
    // Test configuration
    const configTest = validateCorsConfig();
    validation.tests.push({
      name: 'Configuration Test',
      result: configTest,
      passed: configTest.isValid
    });
    
    // Test origin
    const originTest = checkCurrentOrigin();
    validation.tests.push({
      name: 'Origin Test',
      result: originTest,
      passed: originTest.isAllowed
    });
    
  } catch (error) {
    validation.error = error.message;
  }
  
  validation.overall = validation.tests.every(test => test.passed);
  
  return validation;
};

export default {
  checkCurrentOrigin,
  handlePreflightRequest,
  testCorsConnectivity,
  generateCorsTroubleshooting,
  handleCorsError,
  initializeCorsMonitoring,
  validateApiCors
};
