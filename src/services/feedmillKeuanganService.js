import httpClient from './httpClient';

const API_BASE = '/api/ho/feedmill/keuangan';

const feedmillKeuanganService = {
  // ===== Penerimaan (pemasukan feedmill) =====
  getPenerimaan: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/penerimaan/data`, { params, cache: false });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil data penerimaan feedmill',
      };
    }
  },

  showPenerimaan: async (pid) => {
    try {
      const response = await httpClient.post(`${API_BASE}/penerimaan/show`, { pid });
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil detail penerimaan',
      };
    }
  },

  getCardDataPenerimaan: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/penerimaan/card`, { params, cache: false });
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil card data penerimaan',
      };
    }
  },

  // ===== Pengeluaran (biaya/pengeluaran feedmill) =====
  getPengeluaran: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/pengeluaran/data`, { params, cache: false });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil data pengeluaran feedmill',
      };
    }
  },

  showPengeluaran: async (pid) => {
    try {
      const response = await httpClient.post(`${API_BASE}/pengeluaran/show`, { pid });
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil detail pengeluaran',
      };
    }
  },

  getCardData: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/pengeluaran/card`, { params, cache: false });
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil card data',
      };
    }
  },
};

export default feedmillKeuanganService;
