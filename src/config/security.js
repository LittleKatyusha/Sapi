/**
 * Security Configuration
 * Centralized security constants and configuration
 */

// API Key from environment variables
export const API_KEY = process.env.REACT_APP_API_KEY;

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Requested-With': 'XMLHttpRequest',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

// API authentication headers
export const getApiAuthHeaders = () => ({
  'API-KEY': API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

// Enhanced security headers with API key
export const getEnhancedSecurityHeaders = (additionalHeaders = {}) => ({
  ...SECURITY_HEADERS,
  ...getApiAuthHeaders(),
  ...additionalHeaders
});

// Security constants
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 1800000, // 30 minutes
  LOGIN_RATE_LIMIT_MAX: parseInt(process.env.REACT_APP_LOGIN_RATE_LIMIT_MAX) || 5,
  LOGIN_RATE_LIMIT_WINDOW: parseInt(process.env.REACT_APP_LOGIN_RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 2097152, // 2MB
  PASSWORD_MIN_LENGTH: parseInt(process.env.REACT_APP_PASSWORD_MIN_LENGTH) || 8,
  PASSWORD_HISTORY_COUNT: parseInt(process.env.REACT_APP_PASSWORD_HISTORY_COUNT) || 5,
  SECURITY_CHECK_INTERVAL: parseInt(process.env.REACT_APP_SECURITY_CHECK_INTERVAL) || 30000, // 30 seconds
  TOKEN_REFRESH_BUFFER: parseInt(process.env.REACT_APP_TOKEN_REFRESH_BUFFER) || 300000 // 5 minutes
};

// Feature flags
export const SECURITY_FEATURES = {
  ENABLE_2FA: process.env.REACT_APP_ENABLE_2FA === 'true',
  ENABLE_BIOMETRIC: process.env.REACT_APP_ENABLE_BIOMETRIC === 'true',
  ENABLE_DEVICE_TRUST: process.env.REACT_APP_ENABLE_DEVICE_TRUST === 'true',
  ENABLE_SESSION_WARNING: process.env.REACT_APP_ENABLE_SESSION_WARNING === 'true',
  ENABLE_AUTO_LOGOUT: process.env.REACT_APP_ENABLE_AUTO_LOGOUT === 'true'
};

// Development security settings
export const DEV_SECURITY_SETTINGS = {
  DISABLE_CONSOLE_LOGS: process.env.REACT_APP_DISABLE_CONSOLE_LOGS === 'true',
  OBFUSCATE_ERRORS: process.env.REACT_APP_OBFUSCATE_ERRORS === 'true',
  ENABLE_TEXT_SELECTION: process.env.REACT_APP_ENABLE_TEXT_SELECTION !== 'false'
};

// Validation functions
export const validateApiKey = () => {
  if (!API_KEY) {
    console.error('❌ API_KEY not found in environment variables');
    return false;
  }
  return true;
};

export const getSecurityConfig = () => ({
  apiKey: API_KEY,
  securityHeaders: SECURITY_HEADERS,
  securityConfig: SECURITY_CONFIG,
  securityFeatures: SECURITY_FEATURES,
  devSettings: DEV_SECURITY_SETTINGS
});
