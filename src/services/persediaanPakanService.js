/**
 * Persediaan Pakan Service
 * Service layer for RPH Persediaan Pakan (feed inventory) operations
 */

import HttpClient from './httpClient';

class PersediaanPakanService {
  // API endpoints — matched to backend PersediaanPakanRphController routes
  static API_STOK_BAHAN_BAKU = '/api/rph/persediaan/pakan/datastok';
  static API_DATA = '/api/rph/persediaan/pakan/data';
  static API_STORE = '/api/rph/persediaan/pakan/store';
  static API_UPDATE = '/api/rph/persediaan/pakan/update';
  static API_DELETE = '/api/rph/persediaan/pakan/hapus';
  static API_REKAP = '/api/rph/persediaan/pakan/datarekap';
  static API_SHOW = '/api/rph/persediaan/pakan/show';

  /**
   * Get stok bahan baku (raw material stock) list
   * @returns {Promise} API response with stock data (id, name, produk, harga, jumlah)
   */
  static async getStokBahanBaku() {
    try {
      // Add timestamp to prevent caching
      const url = `${this.API_STOK_BAHAN_BAKU}?_ts=${Date.now()}`;
      const response = await HttpClient.get(url);
      const rawData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      return {
        success: true,
        data: rawData.map(this.transformStokBahanBaku),
        message: response?.message || 'Data stok bahan baku berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching stok bahan baku:', error);
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data stok bahan baku'
      };
    }
  }

  /**
   * Transform stok bahan baku data from API
   * @param {Object} item - Raw API data
   * @returns {Object} Transformed data
   */
  static transformStokBahanBaku(item) {
    return {
      id: item.id,
      name: item.name || '-',
      produk: item.produk || '-',
      harga: Number(item.harga) || 0,
      jumlah: Number(item.jumlah) || 0,
    };
  }

  /**
   * Get resep pakan (recipe) data in DataTable format
   * @param {Object} params - Query parameters (draw, start, length, search, etc.)
   * @returns {Promise} API response with paginated recipe data
   */
  static async getResepData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || 0,
        'order[0][dir]': params.orderDir || 'desc',
        _ts: Date.now(),
      });

      // Add date range if provided
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);

      const response = await HttpClient.get(`${this.API_DATA}?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data?.map(item => this.transformResepData(item)) || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw,
        total: response.total || 0,
      };
    } catch (error) {
      console.error('Error fetching resep pakan data:', error);
      return { 
        success: false, 
        data: [], 
        recordsTotal: 0,
        recordsFiltered: 0,
        message: error?.message || 'Gagal memuat data resep pakan' 
      };
    }
  }

  /**
   * Transform resep pakan data from API
   * @param {Object} item - Raw API data
   * @returns {Object} Transformed data
   */
  static transformResepData(item) {
    return {
      pid: item.pid,
      tgl_aktif: item.tgl_aktif || '-',
      name: item.name || '-',
      total_jumlah: Number(item.total_jumlah) || 0,
      harga_total: Number(item.harga_total) || 0,
      keterangan: item.keterangan || '-',
    };
  }

  /**
   * Create new resep pakan
   * @param {Object} payload - Recipe data
   * @param {string} payload.tgl_aktif - Active date (YYYY-MM-DD)
   * @param {string} payload.name - Recipe name
   * @param {string} payload.keterangan - Description
   * @param {Array} payload.items - Array of {id_produk, jumlah}
   * @returns {Promise} API response
   */
  static async storeResep(payload) {
    try {
      const response = await HttpClient.post(this.API_STORE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Resep pakan berhasil disimpan'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error storing resep pakan:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal menyimpan resep pakan'
      };
    }
  }

  /**
   * Update existing resep pakan
   * @param {Object} payload - Recipe data
   * @param {string} payload.pid - Recipe ID (encrypted)
   * @param {string} payload.tgl_aktif - Active date (YYYY-MM-DD)
   * @param {string} payload.name - Recipe name
   * @param {string} payload.keterangan - Description
   * @param {Array} payload.items - Array of {id_produk, jumlah}
   * @returns {Promise} API response
   */
  static async updateResep(payload) {
    try {
      const response = await HttpClient.post(this.API_UPDATE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Resep pakan berhasil diperbarui'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error updating resep pakan:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memperbarui resep pakan'
      };
    }
  }

  /**
   * Delete resep pakan
   * @param {string} pid - Recipe ID (encrypted)
   * @returns {Promise} API response
   */
  static async deleteResep(pid) {
    try {
      const response = await HttpClient.post(this.API_DELETE, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Resep pakan berhasil dihapus'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error deleting resep pakan:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal menghapus resep pakan'
      };
    }
  }

  /**
   * Get resep pakan detail by ID
   * @param {string} pid - Recipe ID (encrypted)
   * @returns {Promise} API response with recipe detail including items
   */
  static async showResep(pid) {
    try {
      const response = await HttpClient.post(this.API_SHOW, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data resep pakan berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching resep pakan detail:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat data resep pakan'
      };
    }
  }

  /**
   * Get rekap (recap/summary) data
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with rekap data
   */
  static async getRekapData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        _ts: Date.now(),
      });

      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);

      const response = await HttpClient.get(`${this.API_REKAP}?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data ?? response,
        recordsTotal: response?.recordsTotal ?? 0,
        recordsFiltered: response?.recordsFiltered ?? 0,
      };
    } catch (error) {
      console.error('Error fetching rekap pakan data:', error);
      return {
        success: false,
        data: [],
        message: error?.message || 'Gagal memuat data rekap pakan'
      };
    }
  }
}

export default PersediaanPakanService;
