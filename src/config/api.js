/**
 * API Configuration
 * Centralized configuration for all API endpoints and HTTP client setup
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Get API base URL from environment variables with fallback
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000'

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
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh',
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
    PELANGGAN: '/api/master/pedagang',
    OUTLET: '/api/master/outlet',
    JENIS_HEWAN: '/api/master/jenishewan',
    KLASIFIKASI_HEWAN: '/api/master/klasifikasihewan',
    KLASIFIKASI_FEEDMIL: '/api/master/klasifikasifeedmil',
    ITEM_KULIT: '/api/master/itemkulit',
    ITEM_FEEDMIL: '/api/master/itemfeedmil',
    ITEM_OVK: '/api/master/itemovk',
    ITEM_LAIN_LAIN: '/api/master/itemlainlain',
    ITEM_POTONG: '/api/master/itempotong',
    // KLASIFIKASI_KULIT: tidak ada route backend — dihapus
    KLASIFIKASI_OVK: '/api/master/klasifikasiovk',
    KLASIFIKASI_LAIN_LAIN: '/api/master/klasifikasilainlain',
    PARAMETER: '/api/master/parameter',
    PARAMETER_SELECT: '/api/master/parameter',
    BANK: '/api/master/bank',
    PERSETUJUAN_HO: '/api/master/persetujuanho',
    PERSETUJUAN_FEEDMIL: '/api/master/persetujuanfeedmil',
    PERSETUJUAN_RPH: '/api/master/persetujuanrph',
    SATUAN: '/api/master/satuan',
    BARANG: '/api/master/barang',
    PEMBELI_HO: '/api/master/pembeliho',
    TARIF_DOF: '/api/master/tarifdof',
    BONING: '/api/master/boning',
    KARKAS: '/api/master/karkas',
    DAGING: '/api/master/daging',
    PENGIRIM: '/api/master/pengirim',
    SIM: '/api/master/sim',
    PENGIRIM_SIM: '/api/master/pengirimsim',
    KENDARAAN: '/api/master/kendaraan',
    KENDARAAN_DOKUMEN: '/api/master/kendaraandokumen'
  },

  DASHBOARD: {
    HO: '/api/dashboard/ho',
    RPH: '/api/dashboard/rph',
    WAREHOUSE: '/api/dashboard/warehouse'
  },

  // Reports
  REPORT: {
    PENGELUARAN: {
      SUBMIT: '/api/report/pengeluaran/ho-spend-submit',
      BUY: '/api/report/pengeluaran/ho-spend-buy',
      CASH: '/api/report/pengeluaran/ho-spend-cash'
    },
    PEMBELIAN: {
      NOTA_FEEDMIL: '/api/report/pembelian/nota-feedmil',
      NOTA_OVK: '/api/report/pembelian/nota-ovk',
      OTHER_HO: '/api/report/pembelian/other-ho',
      OTHER_HO_DAILY_ASSISTANCE: '/api/report/pembelian/other-ho-daily-assistance',
      OTHER_HO_MONTHLY_ASSISTANCE: '/api/report/pembelian/other-ho-monthly-assistance',
      OTHER_HO_LOAD_OTHER_DAILY: '/api/report/pembelian/other-ho-load-other-daily',
      OTHER_HO_LOAD_OTHER_MONTHLY: '/api/report/pembelian/other-ho-load-other-monthly',
      OTHER_HO_RECEIPT: '/api/report/pembelian/other-ho-receipt'
    },
    PENGAJUAN: {
      HO_SUBMIT_WAITING: '/api/report/pengajuan/ho-submit-waiting',
      HO_SUBMIT_APPROVED: '/api/report/pengajuan/ho-submit-approved'
    },
    PENJUALAN: {
      HO_DELIVERY: '/api/report/penjualan/ho-delivery',
      HO_HANDOVER: '/api/report/penjualan/ho-handover',
      HO_RECEIPT: '/api/report/penjualan/ho-receipt'
    },
    RPH: {
      PENJUALAN_BONING: '/api/report/rph/penjualan-boning',
      PENJUALAN_KARKAS: '/api/report/rph/penjualan-karkas',
      PENJUALAN_QURBAN: '/api/report/rph/penjualan-qurban',
      PIUTANG_PEDAGANG: '/api/report/rph/piutang-pedagang',
      SALDO_PEDAGANG: '/api/report/rph/saldo-pedagang',
      STOK_TERNAK: '/api/report/rph/stok-ternak',
      STOK_FEEDMIL: '/api/report/rph/stok-feedmil',
      STOK_OVK: '/api/report/rph/stok-ovk'
    }
  },

  // Warehouse
  WAREHOUSE: {
    STOK: {
      FEEDMIL: '/api/warehouse/stok/feedmil/data',
      OVK: '/api/warehouse/stok/ovk/data'
    },
    PENERIMAAN: {
      FEEDMIL: {
        DATA: '/api/warehouse/penerimaan/feedmil/data',
        STORE: '/api/warehouse/penerimaan/feedmil/store',
        SHOW: '/api/warehouse/penerimaan/feedmil/show',
        DELETE: '/api/warehouse/penerimaan/feedmil/hapus'
      },
      OVK: {
        DATA: '/api/warehouse/penerimaan/ovk/data',
        STORE: '/api/warehouse/penerimaan/ovk/store',
        SHOW: '/api/warehouse/penerimaan/ovk/show',
        DELETE: '/api/warehouse/penerimaan/ovk/hapus'
      }
    },
    DISTRIBUSI: {
      FEEDMIL: {
        DATA: '/api/warehouse/distribusi/feedmil/data',
        STORE: '/api/warehouse/distribusi/feedmil/store',
        SHOW: '/api/warehouse/distribusi/feedmil/show',
        DELETE: '/api/warehouse/distribusi/feedmil/hapus'
      },
      OVK: {
        DATA: '/api/warehouse/distribusi/ovk/data',
        STORE: '/api/warehouse/distribusi/ovk/store',
        SHOW: '/api/warehouse/distribusi/ovk/show',
        DELETE: '/api/warehouse/distribusi/ovk/hapus'
      }
    }
  },

  // Head Office (HO)
  HO: {
    PEMBELIAN: '/api/ho/pembelian',
    PEMBELIAN_SHOW_PAGINATED: '/api/ho/pembelian/show-paginated',
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
      PEMBELIAN: '/api/ho/kulit/pembelian',
      EXPORT_EXCEL: '/api/ho/kulit/pembelian/export-excel',
      EXPORT_PDF: '/api/ho/kulit/pembelian/export-pdf'
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
      PEMBELIAN: '/api/ho/bahanpembantu/pembelian',
      EXPORT_EXCEL: '/api/ho/bahanpembantu/pembelian/export-excel',
      EXPORT_PDF: '/api/ho/bahanpembantu/pembelian/export-pdf'
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
      ADD_PAYMENT: '/api/ho/payment/detail/store',
      PENERIMAAN: '/api/ho/payment/penerimaan',
      PENERIMAAN_DETAIL: '/api/ho/payment/penerimaan/detail',
      PENERIMAAN_BAYAR: '/api/ho/payment/penerimaan/bayar',
      PENERIMAAN_HISTORY: '/api/ho/payment/penerimaan/history'
    },
    EARTAG: {
      BASE: '/api/ho/eartag',
      DATA: '/api/ho/eartag/data',
      SHOW: '/api/ho/eartag/show',
      STORE: '/api/ho/eartag/store',
      HAPUS: '/api/ho/eartag/hapus',
      DELETE: '/api/ho/eartag/hapus'
    },
    PENGELUARAN: {
      BASE: '/api/ho/pengeluaran',
      SHOW: '/api/ho/pengeluaran/show'
    },
    HUTANG_VENDOR: {
      DATA: '/api/ho/hutang/vendor/data',
      SUMMARY: '/api/ho/hutang/vendor/summary',
      RIWAYAT: '/api/ho/hutang/vendor/riwayat',
      SHOW: '/api/ho/hutang/vendor/show',
    },
    PIUTANG_CABANG: {
      DATA: '/api/ho/piutang/cabang/data',
      SUMMARY: '/api/ho/piutang/cabang/summary',
      RIWAYAT: '/api/ho/piutang/cabang/riwayat',
      SHOW: '/api/ho/piutang/cabang/show',
    },
    STOK_FEEDMIL: {
      DATA: '/api/ho/stok/feedmil/data',
      SUMMARY: '/api/ho/stok/feedmil/summary',
    },
    STOK_OVK: {
      DATA: '/api/ho/stok/ovk/data',
      SUMMARY: '/api/ho/stok/ovk/summary',
    },
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
      EXPORT: '/api/rph/po/export',
      CARD: '/api/rph/po/card',
      EXPORT_EXCEL: '/api/rph/po/export-excel',
      EXPORT_REKAP_PDF: '/api/rph/po/export-rekap-pdf'
    },
    QURBAN: {
      BASE: '/api/rph/qurban',
      NOTA: '/api/rph/qurban/getnota',
      DATA: '/api/rph/qurban/data',
      SHOW: '/api/rph/qurban/show',
      STORE: '/api/rph/qurban/store',
      UPDATE: '/api/rph/qurban/update',
      DELETE: '/api/rph/qurban/hapus',
      EXPORT: '/api/rph/qurban/export',
      STATISTIK: '/api/rph/qurban/statistik'
    },
    PEMBELIAN: {
      BASE: '/api/rph/pembelian',
      SAPI: '/api/rph/pembelian/sapi'
    },
    HUTANG_PIUTANG: {
      HUTANG: '/api/rph/hutangpiutang/hutang',
      PIUTANG: '/api/rph/hutangpiutang/piutang'
    },
    PAYMENT: {
      BASE: '/api/rph/payment',
      DATA: '/api/rph/payment/data',
      SHOW: '/api/rph/payment/show',
      STORE: '/api/rph/payment/store',
      UPDATE: '/api/rph/payment/update',
      DELETE: '/api/rph/payment/hapus',
      PENGELUARAN: '/api/rph/payment/pengeluaran',
      PENGELUARAN_DETAIL: '/api/rph/payment/pengeluaran/detail',
      PENGELUARAN_BAYAR: '/api/rph/payment/pengeluaran/bayar',
      PENGELUARAN_HISTORY: '/api/rph/payment/pengeluaran/history'
    },
    BAHAN_PEMBANTU: {
      DATA: '/api/rph/bahanpembantu/data',
      SHOW: '/api/rph/bahanpembantu/show',
      STORE: '/api/rph/bahanpembantu/store',
      UPDATE: '/api/rph/bahanpembantu/update',
      DELETE: '/api/rph/bahanpembantu/hapus',
      SUMMARY_DAILY: '/api/rph/bahanpembantu/summary-daily',
      SUMMARY_MONTHLY: '/api/rph/bahanpembantu/summary-monthly',
    },
    PERSEDIAAN_OVK: {
      BASE: '/api/rph/persediaan/ovk',
      PENGGUNA: '/api/rph/persediaan/ovk/pengguna',
      DATA: '/api/rph/persediaan/ovk/data',
      SUMMARY: '/api/rph/persediaan/ovk/summary',
    },
    DOF: {
      DATA: '/api/rph/dof/data',
      STORE: '/api/rph/dof/store',
      SHOW: '/api/rph/dof/show',
      UPDATE: '/api/rph/dof/update',
      DELETE: '/api/rph/dof/hapus',
      GET_TARIF: '/api/rph/dof/gettarif',
    },
    PENJUALAN_BONING: {
      DATA: '/api/rph/penjualan/boning/data',
      STORE: '/api/rph/penjualan/boning/store',
      SHOW: '/api/rph/penjualan/boning/show',
      UPDATE: '/api/rph/penjualan/boning/update',
      DELETE: '/api/rph/penjualan/boning/hapus',
      BAYAR: '/api/rph/penjualan/boning/bayar',
      PEMBAYARAN_HISTORY: '/api/rph/penjualan/boning/pembayaran-history',
      MASTER_DATA: '/api/rph/penjualan/boning/masterdata',
      GET_PEDAGANG: '/api/rph/penjualan/boning/getpedagang',
      GET_HARGA: '/api/rph/penjualan/boning/getharga',
      GET_BONING: '/api/rph/penjualan/boning/getboning',
      PENERIMAAN_HISTORY: '/api/rph/penjualan/boning/penerimaan-history',
    },
    PENJUALAN_KARKAS: {
      DATA: '/api/rph/penjualan/karkas/data',
      STORE: '/api/rph/penjualan/karkas/store',
      SHOW: '/api/rph/penjualan/karkas/show',
      UPDATE: '/api/rph/penjualan/karkas/update',
      DELETE: '/api/rph/penjualan/karkas/hapus',
      GET_HARGA: '/api/rph/penjualan/karkas/getharga',
      PRINT_SURAT_JALAN: '/api/rph/penjualan/karkas/print-surat-jalan',
      PRINT_FAKTUR: '/api/rph/penjualan/karkas/print-faktur',
      PRINT_SSTB: '/api/rph/penjualan/karkas/print-sstb',
      GET_SETORAN: '/api/rph/penjualan/karkas/get-setoran',
      STORE_SETORAN: '/api/rph/penjualan/karkas/store-setoran',
      DELETE_SETORAN: '/api/rph/penjualan/karkas/delete-setoran',
      MASTER_DATA: '/api/rph/penjualan/karkas/master-data',
      CALCULATE_HPP: '/api/rph/penjualan/karkas/calculate-hpp',
      PEDAGANG_OPTIONS: '/api/rph/penjualan/karkas/pedagang-options',
      CATTLE_OPTIONS: '/api/rph/penjualan/karkas/cattle-options',
    },
    PENJUALAN_KULIT: {
      DATA: '/api/rph/penjualan/kulit/data',
      MASTER_DATA: '/api/rph/penjualan/kulit/masterdata',
      STORE: '/api/rph/penjualan/kulit/store',
      SHOW: '/api/rph/penjualan/kulit/show',
      UPDATE: '/api/rph/penjualan/kulit/update',
      POSTING: '/api/rph/penjualan/kulit/posting',
      BAYAR: '/api/rph/penjualan/kulit/bayar',
      PEMBAYARAN_HISTORY: '/api/rph/penjualan/kulit/pembayaran-history',
      PENERIMAAN_HISTORY: '/api/rph/penjualan/kulit/penerimaan-history',
      DELETE: '/api/rph/penjualan/kulit/hapus',
    },
    PENJUALAN_SAPI_UTUH: {
      BASE: '/api/rph/penjualan-sapi-utuh',
      DATA: '/api/rph/penjualan-sapi-utuh/data',
      SHOW: '/api/rph/penjualan-sapi-utuh/show',
      STORE: '/api/rph/penjualan-sapi-utuh/store',
      UPDATE: '/api/rph/penjualan-sapi-utuh/update',
      DELETE: '/api/rph/penjualan-sapi-utuh/hapus',
    },
    RETURN_PENJUALAN_SAPI_UTUH: '/api/rph/return-penjualan-sapi-utuh',
    PENAWARAN: {
      BASE: '/api/rph/penawaran',
      DATA: '/api/rph/penawaran/data',
      STORE: '/api/rph/penawaran/store',
      SHOW: '/api/rph/penawaran/show',
      UPDATE: '/api/rph/penawaran/update',
      HAPUS: '/api/rph/penawaran/hapus',
      AJUKAN: '/api/rph/penawaran/ajukan',
      SETUJUI: '/api/rph/penawaran/setujui',
      GUNAKAN_DISPENSASI: '/api/rph/penawaran/gunakan-dispensasi',
      ROLLBACK_DISPENSASI: '/api/rph/penawaran/rollback-dispensasi',
      PEDAGANG: '/api/rph/penawaran/pedagang',
      PEDAGANG_PICKER: '/api/rph/penawaran/pedagang-picker',
      APPROVERS: '/api/rph/penawaran/approvers',
    },
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
