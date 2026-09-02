import httpClient from './httpClient';

const API_BASE = '/api/rph/pemberian-pakan-konsentrat';

const pemberianPakanKonsentratService = {
  getData: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/data`, { params, cache: false });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil data pemberian pakan konsentrat',
      };
    }
  },

  preview: async (data) => {
    try {
      const response = await httpClient.post(`${API_BASE}/preview`, data);
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal preview pemberian pakan',
      };
    }
  },

  store: async (data) => {
    try {
      const response = await httpClient.post(`${API_BASE}/store`, data);
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Pemberian pakan konsentrat berhasil',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal menyimpan pemberian pakan konsentrat',
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
        message: error?.data?.message || error?.message || 'Gagal mengambil detail pemberian pakan',
      };
    }
  },

  cancel: async (pid, alasan) => {
    try {
      const response = await httpClient.post(`${API_BASE}/cancel`, { pid, alasan });
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Pemberian pakan dibatalkan',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal membatalkan pemberian pakan',
      };
    }
  },

  previewPerSapi: async (payload) => {
    try {
      const response = await httpClient.post(`${API_BASE}/preview-per-sapi`, payload);
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal preview pemberian pakan per sapi',
      };
    }
  },

  storePerSapi: async (payload) => {
    try {
      const response = await httpClient.post(`${API_BASE}/store-per-sapi`, payload);
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Pemberian pakan konsentrat berhasil disimpan',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal menyimpan pemberian pakan per sapi',
      };
    }
  },

  listStokResep: async (idRph) => {
    try {
      const response = await httpClient.post(`${API_BASE}/stok-resep`, { id_rph: idRph });
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal memuat stok konsentrat per resep',
      };
    }
  },

  previewBulkSelected: async (payload) => {
    try {
      const response = await httpClient.post(`${API_BASE}/preview-bulk-selected`, payload);
      return { success: true, data: response?.data };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal preview pemberian pakan bulk',
      };
    }
  },

  storeBulkSelected: async (payload) => {
    try {
      const response = await httpClient.post(`${API_BASE}/store-bulk-selected`, payload);
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Pemberian pakan konsentrat berhasil disimpan',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal menyimpan pemberian pakan bulk',
      };
    }
  },
};

export default pemberianPakanKonsentratService;
