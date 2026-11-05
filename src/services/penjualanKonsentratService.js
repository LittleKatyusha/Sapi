import httpClient from './httpClient';

const API_BASE = '/api/ho/penjualan-konsentrat';

const penjualanKonsentratService = {
  getData: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/data`, { params, cache: false });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil data penjualan konsentrat',
      };
    }
  },

  show: async (pid) => {
    try {
      const response = await httpClient.post(`${API_BASE}/show`, { pid });
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil detail penjualan konsentrat',
      };
    }
  },

  getPaymentHistory: async (pid) => {
    try {
      const response = await httpClient.post(`${API_BASE}/payment-history`, { pid });
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil riwayat pembayaran',
      };
    }
  },

  create: async (payload) => {
    try {
      const response = await httpClient.post(`${API_BASE}/store`, payload);
      return { success: true, data: response?.data, message: response?.message };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal menyimpan penjualan konsentrat',
      };
    }
  },

  cancel: async (payload) => {
    try {
      const response = await httpClient.post(`${API_BASE}/cancel`, payload);
      return { success: true, data: response?.data, message: response?.message };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal membatalkan penjualan konsentrat',
      };
    }
  },

  getResepTersedia: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/resep-tersedia`, { params, cache: false });
      return { success: true, data: response?.data || [] };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error?.data?.message || error?.message || 'Gagal mengambil resep konsentrat',
      };
    }
  },

  getPembeliOptions: async () => {
    try {
      const response = await httpClient.get(`${API_BASE}/pembeli-options`, { cache: false });
      return { success: true, data: response?.data || [] };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error?.data?.message || error?.message || 'Gagal mengambil daftar pembeli',
      };
    }
  },
};

export default penjualanKonsentratService;
