/**
 * CORS Configuration
 * Handles Cross-Origin Resource Sharing settings for the application
 */

// Default CORS configuration
export const CORS_CONFIG = {
  // Allowed origins for different environments
  allowedOrigins: {
    development: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:8080',
    ],
    production: [
      'https://puput.ternasys.com',
      'https://puput-api.ternasys.com',
      'https://dev.ternasys.com',
      'https://dev-be.ternasys.com'
    ].filter(Boolean),
    test: ['http://localhost:3000']
  },

  // Default headers to include in requests
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },

  // Headers that should be allowed in CORS requests
  allowedHeaders: [
    'Accept',
    'Accept-Language',
    'Content-Language',
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key',
    'API-KEY'
  ],

  // HTTP methods that should be allowed
  allowedMethods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS',
    'HEAD'
  ],

  // Whether to include credentials in CORS requests
  credentials: true,

  // Maximum age for preflight cache (in seconds)
  maxAge: 86400 // 24 hours
};

/**
 * Get allowed origins for current environment
 */
export const getAllowedOrigins = () => {
  const env = process.env.NODE_ENV || 'development';
  return CORS_CONFIG.allowedOrigins[env] || CORS_CONFIG.allowedOrigins.development;
};

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin) => {
  const allowedOrigins = getAllowedOrigins();
  
  // Allow requests with no origin (mobile apps, curl, etc.)
  if (!origin) return true;
  
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
};

/**
 * Generate CORS headers for response
 */
export const generateCorsHeaders = (requestOrigin = null) => {
  const allowedOrigins = getAllowedOrigins();
  
  // Determine which origin to allow
  let allowOrigin = '*';
  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    allowOrigin = requestOrigin;
  } else if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
    allowOrigin = allowedOrigins[0];
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
    'Access-Control-Allow-Credentials': CORS_CONFIG.credentials.toString(),
    'Access-Control-Max-Age': CORS_CONFIG.maxAge.toString(),
    'Vary': 'Origin'
  };
};

/**
 * CORS middleware configuration for development proxy
 */
export const getProxyCorsConfig = () => {
  return {
    origin: getAllowedOrigins(),
    credentials: CORS_CONFIG.credentials,
    methods: CORS_CONFIG.allowedMethods,
    allowedHeaders: CORS_CONFIG.allowedHeaders,
    maxAge: CORS_CONFIG.maxAge
  };
};

/**
 * Validate CORS configuration
 */
export const validateCorsConfig = () => {
  const issues = [];
  
  // Check if origins are configured for production
  if (process.env.NODE_ENV === 'production') {
    const prodOrigins = CORS_CONFIG.allowedOrigins.production;
    if (!prodOrigins || prodOrigins.length === 0) {
      issues.push('No production origins configured');
    }
    
    if (prodOrigins && prodOrigins.includes('*')) {
      issues.push('Wildcard origin (*) should not be used in production');
    }
  }
  
  // Check for required environment variables
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.REACT_APP_FRONTEND_URL) {
      issues.push('REACT_APP_FRONTEND_URL not configured for production');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

export default CORS_CONFIG;
