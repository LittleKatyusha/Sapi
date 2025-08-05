/**
 * API Configuration
 * Centralized configuration for all API endpoints and HTTP client setup
 */

// Get API base URL from environment variables
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://puput-api.ternasys.com';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    REFRESH_TOKEN: '/api/refresh-token',
    PROFILE: '/api/profile',
    CHANGE_PASSWORD: '/api/change-password',
    USER: '/api/user'
  },

  // System Management
  SYSTEM: {
    USERS: '/api/system/pegawai',
    ROLES: '/api/system/roles', 
    PERMISSIONS: '/api/system/permissions',
    PARAMETERS: '/api/system/parameter'
  },

  // Master Data
  MASTER: {
    EARTAG: '/api/master/eartag',
    OFFICE: '/api/master/office',
    SUPPLIER: '/api/master/supplier',
    PELANGGAN: '/api/master/pelanggan',
    OUTLET: '/api/master/outlet',
    JENIS_HEWAN: '/api/master/jenishewan',
    KLASIFIKASI_HEWAN: '/api/master/klasifikasihewan',
    PARAMETER: '/api/master/parameter'
  },

  // Head Office (HO)
  HO: {
    PEMBELIAN: '/api/ho/pembelian',
    PENJUALAN: '/api/ho/penjualan'
  },

  // SDM (Human Resources)
  SDM: {
    KARYAWAN: '/api/system/pegawai'
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to build URL with path parameters
export const buildApiUrlWithParams = (endpoint, params = {}) => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Replace path parameters (e.g., /users/:id)
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};