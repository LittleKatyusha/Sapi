/**
 * API Configuration
 * Centralized configuration for all API endpoints and HTTP client setup
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Get API base URL from environment variables with fallback
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:8080'

// Configuration based on environment
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: isProduction ? 30000 : 10000, // 30s production, 10s development
  RETRY_ATTEMPTS: isProduction ? 3 : 1,
  DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true' || isDevelopment,
  
  // Security headers untuk production
  SECURITY_HEADERS: isProduction ? {
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  } : {}
};

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
    PARAMETERS: '/api/system/parameter',
    MENU: '/api/system/menu'
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
    KLASIFIKASI_FEEDMIL: '/api/master/klasifikasifeedmil',
    ITEM_KULIT: '/api/master/itemkulit',
    ITEM_FEEDMIL: '/api/master/itemfeedmil',
    ITEM_OVK: '/api/master/itemovk',
    ITEM_LAIN_LAIN: '/api/master/itemlainlain',
    KLASIFIKASI_KULIT: '/api/master/klasifikasikulit',
    KLASIFIKASI_OVK: '/api/master/klasifikasiovk',
    KLASIFIKASI_LAIN_LAIN: '/api/master/klasifikasilainlain',
    PARAMETER: '/api/master/parameter',
    PARAMETER_SELECT: '/api/master/parameter',
    BANK: '/api/master/bank',
    PERSETUJUAN_HO: '/api/master/persetujuanho',
    PERSETUJUAN_FEEDMIL: '/api/master/persetujuanfeedmil',
    PERSETUJUAN_RPH: '/api/master/persetujuanrph',
    SATUAN: '/api/master/satuan',
    BARANG: '/api/master/barang'
  },

  // Head Office (HO)
  HO: {
    PEMBELIAN: '/api/ho/pembelian',
    PENJUALAN: '/api/ho/penjualan',
    PENJUALAN_DOKA_SAPI: '/api/ho/penjualandokasapi', // Updated endpoint for Penjualan Doka Sapi
    PENGAJUAN_BIAYA: '/api/ho/pengajuanbiaya', // Pengajuan Biaya endpoint (Cash Budget Request)
    PENGELUARAN_PENGAJUAN_BIAYA_KAS: '/api/ho/pengeluaranpengajuanbiayakas', // Cash Disbursement/Approval endpoint
    PENGELUARAN_PENGAJUAN_BIAYA_BANK: '/api/ho/pengeluaranpengajuanbiayabank', // Bank Disbursement/Approval endpoint
    BANK_DEPOSIT: {
      BASE: '/api/ho/bankdeposit',
      DATA: '/api/ho/bankdeposit/data',
      SHOW: '/api/ho/bankdeposit/show',
      STORE: '/api/ho/bankdeposit/store',
      UPDATE: '/api/ho/bankdeposit/update',
      DELETE: '/api/ho/bankdeposit/delete',
      FILE: '/api/ho/bankdeposit/file'
    },
    FEEDMIL: {
      PEMBELIAN: '/api/ho/feedmil/pembelian'
    },
    KULIT: {
      PEMBELIAN: '/api/ho/kulit/pembelian'
    },
    OVK: {
      PEMBELIAN: '/api/ho/ovk/pembelian'
    },
    LAINLAIN: {
      PEMBELIAN: '/api/ho/lainlain/pembelian'
    },
    BEBAN_BIAYA: {
      PEMBELIAN: '/api/ho/bebanbiaya/pembelian'
    },
    BAHAN_PEMBANTU: {
      PEMBELIAN: '/api/ho/bahanpembantu/pembelian'
    },
    TANDA_TERIMA: {
      BASE: '/api/ho/tandaterimabarang',
      LIST: '/api/ho/tandaterimabarang/data',
      SHOW: '/api/ho/tandaterimabarang/show',
      STORE: '/api/ho/tandaterimabarang/store',
      UPDATE: '/api/ho/tandaterimabarang/update',
      DELETE: '/api/ho/tandaterimabarang/hapus'
    },
    PAYMENT: {
      BASE: '/api/ho/payment',
      DATA: '/api/ho/payment/data',
      SUMMARY: '/api/ho/payment/summary',
      STORE: '/api/ho/payment/store',
      UPDATE: '/api/ho/payment/update',
      DELETE: '/api/ho/payment/hapus',
      SHOW: '/api/ho/payment/show',
      BULK_UPDATE_STATUS: '/api/ho/payment/bulk-update-status',
      DETAILS: '/api/ho/payment/details',
      DETAIL_STORE: '/api/ho/payment/detail/store',
      DETAIL_UPDATE: '/api/ho/payment/detail/update',
      DETAIL_DELETE: '/api/ho/payment/detail/hapus',
      ADD_PAYMENT: '/api/ho/payment/add-payment'
    },
    PENGELUARAN: {
      BASE: '/api/ho/pengeluaran',
      SHOW: '/api/ho/pengeluaran/show'
    }
  },

  // RPH (Rumah Potong Hewan)
  RPH: {
    PO: {
      BASE: '/api/rph/po',
      NOTA: '/api/rph/po/getnota',
      DATA: '/api/rph/po/data',
      SHOW: '/api/rph/po/show',
      STORE: '/api/rph/po/store',
      UPDATE: '/api/rph/po/update',
      DELETE: '/api/rph/po/hapus',
      EXPORT: '/api/rph/po/export'
    },
    PEMBELIAN: {
      BASE: '/api/rph/pembelian',
      SAPI: '/api/rph/pembelian/sapi'
    }
  },

  // SDM (Human Resources)
  SDM: {
    KARYAWAN: '/api/system/pegawai'
  }
};

// Environment-specific endpoint overrides
if (isDevelopment) {
  // Development-specific endpoints jika ada
  // API_ENDPOINTS.AUTH.LOGIN = '/api/dev/login';
}

// Helper function to build full URL with environment awareness
export const buildApiUrl = (endpoint) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  if (API_CONFIG.DEBUG_MODE) {
    console.log(`🔗 API URL: ${url}`);
  }
  
  return url;
};

// Helper function to build URL with path parameters
export const buildApiUrlWithParams = (endpoint, params = {}) => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Replace path parameters (e.g., /users/:id)
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  if (API_CONFIG.DEBUG_MODE) {
    console.log(`🔗 API URL with params: ${url}`, params);
  }
  
  return url;
};

// Helper untuk validasi environment
export const validateEnvironment = () => {
  const errors = [];
  
  if (!API_BASE_URL) {
    errors.push('API_BASE_URL tidak terdefinisi');
  }
  
  if (isProduction && API_BASE_URL.includes('localhost')) {
    errors.push('Production tidak boleh menggunakan localhost');
  }
  
  if (isDevelopment && !API_BASE_URL.includes('localhost') && !process.env.REACT_APP_API_BASE_URL) {
    console.warn('⚠️  Development menggunakan production API');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    config: {
      environment: process.env.NODE_ENV,
      apiBaseUrl: API_BASE_URL,
      debugMode: API_CONFIG.DEBUG_MODE
    }
  };
};

// Export environment info untuk debugging
export const ENVIRONMENT_INFO = {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL,
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: isDevelopment,
  DEBUG_MODE: API_CONFIG.DEBUG_MODE
};