/**
 * Query Factory for React Query
 * Centralized management of query keys and API calls
 */

import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

// Query Keys - Centralized and consistent
export const QUERY_KEYS = {
  // Authentication
  AUTH: {
    PROFILE: ['auth', 'profile'],
    USER: ['auth', 'user'],
  },

  // Master Data
  MASTER: {
    BARANG: ['master', 'barang'],
    BARANG_LIST: (search = '') => ['master', 'barang', 'list', search].filter(Boolean),
    BARANG_DETAIL: (id) => ['master', 'barang', 'detail', id],
    EARTAG: ['master', 'eartag'],
    EARTAG_LIST: ['master', 'eartag', 'list'],
    EARTAG_DETAIL: (id) => ['master', 'eartag', 'detail', id],
    SUPPLIER: ['master', 'supplier'],
    SUPPLIER_LIST: ['master', 'supplier', 'list'],
    SUPPLIER_DETAIL: (id) => ['master', 'supplier', 'detail', id],
    PELANGGAN: ['master', 'pelanggan'],
    PELANGGAN_LIST: ['master', 'pelanggan', 'list'],
    PELANGGAN_DETAIL: (id) => ['master', 'pelanggan', 'detail', id],
    BANK: ['master', 'bank'],
    BANK_LIST: ['master', 'bank', 'list'],
    PARAMETER_BY_GROUP: (group) => ['master', 'parameter', 'group', group],
    TIPE_PEMBAYARAN: ['master', 'parameter', 'group', 'tipe_pembayaran'],
  },

  // System
  SYSTEM: {
    USERS: ['system', 'users'],
    USERS_LIST: (search = '', page = 1) => ['system', 'users', 'list', search, page].filter(item => item !== undefined),
    USER_DETAIL: (id) => ['system', 'users', 'detail', id],
    ROLES: ['system', 'roles'],
    PERMISSIONS: ['system', 'permissions'],
    MENU: ['system', 'menu'],
  },

  // Reports
  REPORTS: {
    LAPORAN_NOTA_SUPPLIER: (id) => ['reports', 'nota_supplier', id],
    LAPORAN_FEEDMIL: (id) => ['reports', 'feedmil', id],
    LAPORAN_OVK: (id) => ['reports', 'ovk', id],
    LAPORAN_ALL_SUPPLIER: (startDate, endDate) => ['reports', 'all_supplier', startDate, endDate],
    LAPORAN_SUPPLIER_TAX: (startDate, endDate) => ['reports', 'supplier_tax', startDate, endDate],
  },

  // HO (Head Office)
  HO: {
    PEMBELIAN: ['ho', 'pembelian'],
    PEMBELIAN_LIST: (params = {}) => ['ho', 'pembelian', 'list', params],
    PENJUALAN: ['ho', 'penjualan'],
    PENGAJUAN_BIAYA: ['ho', 'pengajuan_biaya'],
    PENGAJUAN_BIAYA_LIST: (params = {}) => ['ho', 'pengajuan_biaya', 'list', params],
    PENGAJUAN_BIAYA_DETAIL: (id) => ['ho', 'pengajuan_biaya', 'detail', id],
    PENGAJUAN_BIAYA_CARD: ['ho', 'pengajuan_biaya', 'card'],
    PENGELUARAN_PENGAJUAN_BIAYA_BANK: ['ho', 'pengeluaran_pengajuan_biaya', 'bank'],
    PENGELUARAN_PENGAJUAN_BIAYA_KAS: ['ho', 'pengeluaran_pengajuan_biaya', 'kas'],
    TANDA_TERIMA: ['ho', 'tanda_terima'],
    TANDA_TERIMA_LIST: ['ho', 'tanda_terima', 'list'],
    TANDA_TERIMA_DETAIL: (id) => ['ho', 'tanda_terima', 'detail', id],
  },

  // RPH
  RPH: {
    PO: ['rph', 'po'],
    PO_LIST: ['rph', 'po', 'list'],
    PO_DETAIL: (id) => ['rph', 'po', 'detail', id],
    PEMBELIAN_SAPI: ['rph', 'pembelian', 'sapi'],
  },

  // SDM
  SDM: {
    KARYAWAN: ['sdm', 'karyawan'],
    KARYAWAN_LIST: ['sdm', 'karyawan', 'list'],
    KARYAWAN_DETAIL: (id) => ['sdm', 'karyawan', 'detail', id],
  },
};

// Query Options - Default configurations for different query types
export const QUERY_OPTIONS = {
  // For frequently changing data (form options, dropdowns)
  FREQUENT: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },

  // For master data that changes infrequently
  MASTER: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  },

  // For session-critical data
  SESSION: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },

  // For list data with search
  LIST_SEARCH: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,    // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  // For reports (may take longer to refetch)
  REPORTS: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
};

// Mutation Options
export const MUTATION_OPTIONS = {
  // Default optimistic options (update UI immediately)
  OPTIMISTIC: {
    onMutate: async () => {
      // Begin server-side mutation and show loading state
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned above to roll back
      console.error('Mutation error:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
    },
  },

  // Non-optimistic options (wait for server response)
  SYNC: {
    onMutate: () => {
      // Show loading state
    },
    onError: (err) => {
      console.error('Mutation error:', err);
    },
    onSuccess: () => {
      // Update state or show success message
    },
  },
};

// API Call Wrappers - Converted to Promise-based for React Query
export const apiCalls = {
  // Master Data APIs
  master: {
    // Barang
    getBarangList: async (search = '') => {
      const params = {
        draw: 1,
        start: 0,
        length: 10000,
        'search[value]': search,
        'order[0][column]': 0,
        'order[0][dir]': 'asc',
        t: Date.now(),
      };
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BARANG}/data`, { params });
      return result?.data || result || [];
    },

    getBarangById: async (pid) => {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BARANG}/show`, {
        params: { pid }
      });
      return result?.data;
    },

    createBarang: async (data) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/store`, data);
      return result;
    },

    updateBarang: async (pid, data) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/update`, {
        pid,
        ...data
      });
      return result;
    },

    deleteBarang: async (pid) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/hapus`, { pid });
      return result;
    },

    // Banks
    getBanksList: async () => {
      try {
        const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BANK}/all`);
        return result?.data || [];
      } catch {
        // Fallback to /data endpoint
        const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BANK}/data`, {
          params: { length: 1000, start: 0 }
        });
        return result?.data || [];
      }
    },

    // Parameters by Group
    getParametersByGroup: async (group) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group
      });
      return result?.data || [];
    },
  },

  // System APIs
  system: {
    getUsersList: async (params = {}) => {
      const result = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.USERS}/data`, { params });
      return result?.data || [];
    },

    getUserById: async (pid) => {
      const result = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.USERS}/detail`, {
        params: { pid }
      });
      return result?.data;
    },
  },

  // HO APIs
  ho: {
    getPengajuanBiayaList: async (params = {}) => {
      // Convert to DataTables format if needed
      const dtParams = {
        draw: 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        t: Date.now(),
      };
      const result = await HttpClient.get(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/data`, {
        params: dtParams
      });
      return result?.data || [];
    },

    getPengajuanBiayaDetail: async (pid) => {
      const result = await HttpClient.get(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/show`, {
        params: { pid }
      });
      return result?.data;
    },

    createPengajuanBiaya: async (data) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/store`, data);
      return result;
    },

    updatePengajuanBiaya: async (pid, data) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/update`, {
        pid,
        ...data
      });
      return result;
    },

    deletePengajuanBiaya: async (pid) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/hapus`, { pid });
      return result;
    },

    rejectPengajuanBiaya: async (pid, catatan_penolakan) => {
      const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/reject`, {
        pid,
        catatan_penolakan
      });
      return result;
    },

    // Card data for dashboard
    getPengajuanBiayaCardData: async () => {
      const result = await HttpClient.get(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/card`);
      return result?.data || {};
    },
  },

  // Reports
  reports: {
    getLaporanNotaSupplier: async (id) => {
      const result = await HttpClient.get(`${API_ENDPOINTS.REPORTS?.LAPORAN_NOTA_SUPPLIER || 'api/reports/nota-supplier'}/${id}`);
      return result?.data;
    },

    getLaporanAllSupplier: async (startDate, endDate) => {
      const params = { start_date: startDate, end_date: endDate };
      const result = await HttpClient.get(`${API_ENDPOINTS.REPORTS?.LAPORAN_ALL_SUPPLIER || 'api/reports/all-supplier'}`, { params });
      return result?.data;
    },
  },
};

// Utility functions
export const formatApiResponse = (response, defaultValue = []) => {
  if (!response) return defaultValue;
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [response].filter(item => item !== null && item !== undefined);
};

export const handleApiError = (error) => {
  console.error('API Error:', error);
  throw error; // Re-throw for React Query error handling
};

export default {
  QUERY_KEYS,
  QUERY_OPTIONS,
  MUTATION_OPTIONS,
  apiCalls,
  formatApiResponse,
  handleApiError,
};
