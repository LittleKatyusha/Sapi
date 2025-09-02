// Environment configuration and validation
export const ENV_CONFIG = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  
  // Security Configuration
  DISABLE_RIGHT_CLICK: process.env.REACT_APP_DISABLE_RIGHT_CLICK === 'true',
  DISABLE_DEV_SHORTCUTS: process.env.REACT_APP_DISABLE_DEV_SHORTCUTS === 'true',
  DISABLE_CONSOLE: process.env.REACT_APP_DISABLE_CONSOLE === 'true',
  
  // Performance Configuration
  MEASURE_PERFORMANCE: process.env.REACT_APP_MEASURE_PERFORMANCE === 'true',
  
  // Feature Flags
  ENABLE_RIGHT_CLICK: process.env.REACT_APP_ENABLE_RIGHT_CLICK === 'true',
  
  // Environment Info
  NODE_ENV: process.env.NODE_ENV,
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// Validate required environment variables
export const validateEnvironment = () => {
  const requiredVars = [
    'REACT_APP_API_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && ENV_CONFIG.IS_DEVELOPMENT) {
    console.warn('⚠️ Missing required environment variables:', missingVars);
    console.warn('Please check your .env file and ensure all required variables are set.');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
};

// Log environment configuration in development
if (ENV_CONFIG.IS_DEVELOPMENT) {
  console.log('🔧 Environment Configuration:', {
    NODE_ENV: ENV_CONFIG.NODE_ENV,
    API_URL: ENV_CONFIG.API_URL,
    SECURITY_FEATURES: {
      DISABLE_RIGHT_CLICK: ENV_CONFIG.DISABLE_RIGHT_CLICK,
      DISABLE_DEV_SHORTCUTS: ENV_CONFIG.DISABLE_DEV_SHORTCUTS,
    },
    PERFORMANCE: {
      MEASURE_PERFORMANCE: ENV_CONFIG.MEASURE_PERFORMANCE,
    }
  });
}

export default ENV_CONFIG;
