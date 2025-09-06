# CORS Implementation Guide

## 🎯 Overview

This guide covers the comprehensive CORS (Cross-Origin Resource Sharing) implementation for the React application. The implementation includes configuration management, error handling, testing utilities, and monitoring capabilities.

## 🚀 Features Implemented

### 1. CORS Configuration Management
- **File**: `src/config/cors.js`
- Environment-specific origin configuration
- Configurable headers, methods, and credentials
- Production security validation
- Dynamic origin validation

### 2. Enhanced HTTP Client with CORS Support
- **File**: `src/services/httpClient.js` (updated)
- Automatic CORS header injection
- CORS error detection and handling
- Origin header management
- Preflight request support

### 3. CORS Helper Utilities
- **File**: `src/utils/corsHelper.js`
- Origin validation utilities
- Connectivity testing
- Error troubleshooting
- Development monitoring

### 4. CORS Test Panel
- **File**: `src/components/CorsTestPanel.jsx`
- Interactive CORS testing interface
- Configuration validation
- Connectivity testing
- Real-time troubleshooting

### 5. Automatic CORS Monitoring
- **File**: `src/index.js` (updated)
- Development-mode CORS monitoring
- Automatic error detection
- Request/response logging

## 📁 Files Created/Modified

### New Files
- `src/config/cors.js` - CORS configuration management
- `src/utils/corsHelper.js` - CORS utility functions
- `src/components/CorsTestPanel.jsx` - CORS testing interface
- `CORS_IMPLEMENTATION_GUIDE.md` - This documentation

### Modified Files
- `src/services/httpClient.js` - Enhanced with CORS support
- `src/index.js` - Added CORS monitoring initialization

## 🔧 Configuration

### Environment Variables
Add these to your `.env` file:

```bash
# Required
REACT_APP_API_URL=https://your-api-server.com

# Production CORS Configuration
REACT_APP_FRONTEND_URL=https://your-frontend-domain.com
REACT_APP_DOMAIN=your-domain.com

# Development (optional - defaults provided)
REACT_APP_DEV_API_URL=http://localhost:8000
```

### CORS Configuration Structure
```javascript
// src/config/cors.js
export const CORS_CONFIG = {
  allowedOrigins: {
    development: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ],
    production: [
      process.env.REACT_APP_FRONTEND_URL,
      process.env.REACT_APP_DOMAIN
    ].filter(Boolean)
  },
  allowedHeaders: [
    'Accept',
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key'
  ],
  allowedMethods: [
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};
```

## 📖 Usage Examples

### 1. Basic CORS Configuration Check
```javascript
import { checkCurrentOrigin, validateCorsConfig } from '../utils/corsHelper';

// Check if current origin is allowed
const originCheck = checkCurrentOrigin();
console.log('Origin allowed:', originCheck.isAllowed);

// Validate CORS configuration
const validation = validateCorsConfig();
console.log('Config valid:', validation.isValid);
```

### 2. Testing API Connectivity
```javascript
import { testCorsConnectivity, validateApiCors } from '../utils/corsHelper';

// Test basic connectivity
const connectivityTest = await testCorsConnectivity('https://api.example.com');
console.log('Connectivity results:', connectivityTest);

// Full CORS validation
const corsValidation = await validateApiCors('https://api.example.com');
console.log('CORS validation:', corsValidation);
```

### 3. Handling CORS Errors
```javascript
import { handleCorsError } from '../utils/corsHelper';

try {
  const response = await fetch('/api/data');
} catch (error) {
  if (error.message.includes('CORS')) {
    const corsErrorInfo = handleCorsError(error, '/api/data');
    console.error('CORS Error:', corsErrorInfo);
    // Show user-friendly error message
    alert(corsErrorInfo.userMessage);
  }
}
```

### 4. Using the CORS Test Panel
```javascript
import CorsTestPanel from '../components/CorsTestPanel';

// Add to your development routes or settings page
const DevelopmentTools = () => {
  return (
    <div>
      <h2>Development Tools</h2>
      <CorsTestPanel />
    </div>
  );
};
```

## 🔍 Development Features

### Automatic CORS Monitoring
When `NODE_ENV=development`, the system automatically:
- Logs CORS configuration on startup
- Monitors all fetch requests for CORS issues
- Provides detailed error information
- Tracks CORS headers in responses

### Debug Logging
```javascript
// Example development console output
🌐 CORS Configuration: {
  config: { allowedOrigins: [...], ... },
  currentOrigin: "http://localhost:3000",
  allowedOrigins: ["http://localhost:3000", ...],
  validation: { isValid: true, issues: [] }
}

🌐 CORS Headers Received: {
  url: "https://api.example.com/data",
  allowOrigin: "http://localhost:3000",
  allowMethods: "GET, POST, PUT, DELETE",
  allowHeaders: "Content-Type, Authorization"
}
```

## 🧪 Testing CORS Implementation

### 1. Using the CORS Test Panel
1. Navigate to the CORS Test Panel component
2. Enter your API URL
3. Click "Test CORS" for comprehensive validation
4. Click "Test Connectivity" for basic connectivity check
5. Review results and recommendations

### 2. Manual Testing
```javascript
// Test different scenarios
import { validateApiCors } from '../utils/corsHelper';

// Test production API
const prodTest = await validateApiCors('https://prod-api.example.com');

// Test development API
const devTest = await validateApiCors('http://localhost:8000');

// Test with different origins
const customTest = await validateApiCors('https://custom-api.example.com');
```

### 3. Browser Developer Tools
1. Open Network tab in DevTools
2. Look for OPTIONS requests (preflight)
3. Check response headers for CORS configuration
4. Verify no CORS errors in console

## 🚨 Common CORS Issues and Solutions

### 1. Origin Not Allowed
**Error**: `Access to fetch at 'API_URL' from origin 'ORIGIN' has been blocked by CORS policy`

**Solution**:
```javascript
// Add origin to CORS configuration
const CORS_CONFIG = {
  allowedOrigins: {
    development: [
      'http://localhost:3000',
      'YOUR_ORIGIN_HERE' // Add your origin
    ]
  }
};
```

### 2. Missing Preflight Headers
**Error**: `Request header 'authorization' is not allowed by Access-Control-Allow-Headers`

**Solution**:
```javascript
// Add headers to CORS configuration
const CORS_CONFIG = {
  allowedHeaders: [
    'Accept',
    'Content-Type',
    'Authorization', // Ensure this is included
    'X-Custom-Header' // Add custom headers
  ]
};
```

### 3. Credentials Not Allowed
**Error**: `The value of the 'Access-Control-Allow-Credentials' header is '' which must be 'true'`

**Solution**:
```javascript
// Ensure credentials are enabled
const CORS_CONFIG = {
  credentials: true // Must be true for cookies/auth
};
```

### 4. Method Not Allowed
**Error**: `Method 'PUT' is not allowed by Access-Control-Allow-Methods`

**Solution**:
```javascript
// Add method to CORS configuration
const CORS_CONFIG = {
  allowedMethods: [
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'
  ]
};
```

## 🔒 Security Considerations

### Production Configuration
```javascript
// ✅ Good - Specific origins
allowedOrigins: {
  production: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ]
}

// ❌ Bad - Wildcard in production
allowedOrigins: {
  production: ['*'] // Never use in production
}
```

### Credentials Handling
```javascript
// Only enable credentials when necessary
const CORS_CONFIG = {
  credentials: true, // Only if you need cookies/auth headers
  allowedOrigins: ['https://trusted-domain.com'] // Never use * with credentials
};
```

### Header Security
```javascript
// Only allow necessary headers
const CORS_CONFIG = {
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    // Don't add unnecessary headers
  ]
};
```

## 📊 Monitoring and Analytics

### CORS Error Tracking
```javascript
// Track CORS errors for monitoring
const handleCorsError = (error, url) => {
  // Log to analytics service
  analytics.track('cors_error', {
    error: error.message,
    url,
    origin: window.location.origin,
    timestamp: new Date().toISOString()
  });
};
```

### Performance Impact
- CORS preflight requests add latency
- Cache preflight responses with `maxAge`
- Monitor preflight request frequency
- Optimize allowed headers/methods

## 🚀 Advanced Features

### Dynamic Origin Validation
```javascript
// Custom origin validation logic
export const isOriginAllowed = (origin) => {
  const allowedOrigins = getAllowedOrigins();
  
  // Custom validation logic
  if (origin && origin.endsWith('.yourdomain.com')) {
    return true;
  }
  
  return allowedOrigins.includes(origin);
};
```

### Environment-Specific Configuration
```javascript
// Different configs per environment
const getEnvironmentConfig = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return { credentials: true, origins: ['*'] };
    case 'staging':
      return { credentials: true, origins: ['https://staging.example.com'] };
    case 'production':
      return { credentials: true, origins: ['https://example.com'] };
    default:
      return { credentials: false, origins: [] };
  }
};
```

## 📞 Support and Troubleshooting

### Debug Steps
1. Check browser console for CORS errors
2. Use the CORS Test Panel for validation
3. Verify server-side CORS configuration
4. Test with different browsers
5. Check network requests in DevTools

### Common Commands
```bash
# Test CORS with curl
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api.com/endpoint

# Check CORS headers
curl -I -H "Origin: http://localhost:3000" https://your-api.com/endpoint
```

### Getting Help
1. Review this documentation
2. Use the CORS Test Panel for diagnostics
3. Check browser developer tools
4. Verify server-side CORS configuration
5. Test with minimal configuration first

## 📋 Checklist

### Development Setup
- [ ] Configure CORS origins for development
- [ ] Test API connectivity
- [ ] Verify preflight requests work
- [ ] Check error handling

### Production Deployment
- [ ] Set production environment variables
- [ ] Remove wildcard origins
- [ ] Test from production domain
- [ ] Verify security headers
- [ ] Monitor CORS errors

### Maintenance
- [ ] Regular CORS configuration review
- [ ] Monitor CORS error rates
- [ ] Update origins as needed
- [ ] Test after server changes
