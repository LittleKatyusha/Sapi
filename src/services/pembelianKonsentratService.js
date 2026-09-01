import httpClient from './httpClient';

const API_BASE = '/api/rph/pembelian-konsentrat';

const pembelianKonsentratService = {
  getData: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/data`, { params, cache: false });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil data pembelian konsentrat',
      };
    }
  },

  getStok: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/stok`, { params, cache: false });
      return { success: true, data: response?.data || [] };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil stok konsentrat RPH',
        data: [],
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
        message: error?.data?.message || error?.message || 'Gagal mengambil resep tersedia',
        data: [],
      };
    }
  },

  store: async (data) => {
    try {
      const response = await httpClient.post(`${API_BASE}/store`, data);
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Pembelian konsentrat berhasil',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal menyimpan pembelian konsentrat',
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
        message: error?.data?.message || error?.message || 'Gagal mengambil detail pembelian konsentrat',
      };
    }
  },

  cancel: async (pid, alasan) => {
    try {
      const response = await httpClient.post(`${API_BASE}/cancel`, { pid, alasan });
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Pembelian konsentrat dibatalkan',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal membatalkan pembelian konsentrat',
      };
    }
  },
};

export default pembelianKonsentratService;
