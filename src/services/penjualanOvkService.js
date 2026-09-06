import httpClient from './httpClient';

const API_BASE = '/api/ho/penjualan-ovk';

const penjualanOvkService = {
  getData: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/data`, { params, cache: false });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil data penjualan OVK',
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
        message: error?.data?.message || error?.message || 'Gagal mengambil detail penjualan OVK',
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
};

export default penjualanOvkService;
