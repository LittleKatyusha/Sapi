import httpClient from './httpClient';

const API_BASE = '/api/rph/pembelian-konsentrat';

const pembelianKonsentratService = {
  downloadDocument: async (pid, type = 'purchase') => {
    if (typeof pid !== 'string' || !pid.trim()) throw new Error('PID tidak ditemukan');
    if (!['purchase', 'stock'].includes(type)) throw new Error('Jenis dokumen tidak valid');
    const blob = await httpClient.get(`${API_BASE}/document`, { params: { pid, type }, responseType: 'blob', cache: false });
    if (!(blob instanceof Blob) || !blob.size || await blob.slice(0, 5).text() !== '%PDF-') {
      throw new Error('Respons server bukan dokumen PDF yang valid');
    }
    return blob;
  },

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
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil stok konsentrat RPH',
        data: { data: [] },
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

  storePayment: async (data) => {
    try {
      const response = await httpClient.post(`${API_BASE}/bayar`, data);
      return {
        success: true,
        data: response?.data,
        message: response?.message || 'Pembayaran berhasil dicatat',
      };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mencatat pembayaran',
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

  getCardData: async (params = {}) => {
    try {
      const response = await httpClient.get(`${API_BASE}/card`, { params, cache: false });
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      return {
        success: false,
        message: error?.data?.message || error?.message || 'Gagal mengambil card data',
      };
    }
  },
};

export default pembelianKonsentratService;
