/**
 * Environment Validation Helper
 * Use this in your main App component to validate environment on startup
 */

import { validateEnvironment, ENVIRONMENT_INFO } from '../config/api';

export const useEnvironmentValidation = () => {
  const validateOnStartup = () => {
    // Validate environment configuration
    const envValidation = validateEnvironment();
    
    if (!envValidation.isValid) {
      console.error('❌ Environment validation failed:', envValidation.errors);
      
      // Dalam production, mungkin redirect ke error page
      if (process.env.NODE_ENV === 'production') {
        // Tambahkan logic untuk handle environment error di production
        // Misalnya: redirect ke maintenance page atau show error modal
      }
      
      return {
        isValid: false,
        errors: envValidation.errors,
        config: envValidation.config
      };
    } else {
      // Log environment info (hanya di development)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Environment validated:', envValidation.config);
        console.log('🔧 Environment Info:', ENVIRONMENT_INFO);
      }
      
      return {
        isValid: true,
        errors: [],
        config: envValidation.config
      };
    }
  };

  return { validateOnStartup };
};

// Standalone function yang bisa dipanggil di mana saja
export const logEnvironmentInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔧 Environment Information');
    console.log('NODE_ENV:', ENVIRONMENT_INFO.NODE_ENV);
    console.log('API_BASE_URL:', ENVIRONMENT_INFO.API_BASE_URL);
    console.log('IS_PRODUCTION:', ENVIRONMENT_INFO.IS_PRODUCTION);
    console.log('IS_DEVELOPMENT:', ENVIRONMENT_INFO.IS_DEVELOPMENT);
    console.log('DEBUG_MODE:', ENVIRONMENT_INFO.DEBUG_MODE);
    console.groupEnd();
  }
};
