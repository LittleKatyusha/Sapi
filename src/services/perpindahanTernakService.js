import httpClient from './httpClient';

const API_BASE = '/api/rph/perpindahanternak';

const perpindahanTernakService = {
  /**
   * Get paginated perpindahan ternak data
   */
  getData: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/data`, { params });
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Gagal mengambil data perpindahan ternak',
      };
    }
  },

  /**
   * Get detail perpindahan ternak by pid
   */
  show: async (pid) => {
    try {
      const response = await httpClient.post(`${API_BASE}/show`, { pid });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Gagal mengambil detail perpindahan ternak',
      };
    }
  },

  /**
   * Create new perpindahan ternak
   */
  store: async (data) => {
    try {
      const response = await httpClient.post(`${API_BASE}/store`, data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || 'Perpindahan ternak berhasil disimpan',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Gagal menyimpan perpindahan ternak',
      };
    }
  },

  /**
   * Update perpindahan ternak
   */
  update: async (pid, data) => {
    try {
      const response = await httpClient.post(`${API_BASE}/update`, { pid, ...data });
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || 'Perpindahan ternak berhasil diupdate',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Gagal mengupdate perpindahan ternak',
      };
    }
  },

  /**
   * Delete perpindahan ternak
   */
  delete: async (pid) => {
    try {
      const response = await httpClient.post(`${API_BASE}/hapus`, { pid });
      return {
        success: true,
        message: response.data?.message || 'Perpindahan ternak berhasil dihapus',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Gagal menghapus perpindahan ternak',
      };
    }
  },

  /**
   * Get available sapi list for perpindahan
   */
  getSapiList: async (params = {}) => {
    try {
      const queryParams = {};
      if (params.golongan !== null && params.golongan !== '' && params.golongan !== undefined) {
        queryParams.golongan = params.golongan;
      }
      if (params.search) queryParams.search = params.search;
      if (params.page) queryParams.page = params.page;
      if (params.per_page) queryParams.per_page = params.per_page;
      const response = await httpClient.get(`${API_BASE}/getsapilist`, { params: queryParams, cache: false });
      const payload = response?.data || {};
      return {
        success: true,
        data: payload.data || [],
        meta: payload.meta || null,
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Gagal mengambil list sapi',
        data: [],
        meta: null,
      };
    }
  },
};

export default perpindahanTernakService;
