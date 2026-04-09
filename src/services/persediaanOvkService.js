/**
 * Persediaan OVK Service
 * Service layer for RPH Persediaan OVK (veterinary supplies inventory) operations
 */

import HttpClient from './httpClient';

class PersediaanOvkService {
  // API endpoints — matched to backend PersediaanRphController routes
  static API_DATA = '/api/rph/persediaan/data';
  static API_REKAP = '/api/rph/persediaan/datarekap';

  /**
   * Get pengguna (usage) data for selected date range
   * Calls the same /data endpoint but fetches all records (length=-1)
   * @param {Object} options
   * @param {string} options.startDate - Start date 'YYYY-MM-DD'
   * @param {string} options.endDate - End date 'YYYY-MM-DD'
   * @param {string} [options.search=''] - Search value
   * @param {number} [options.draw=1] - DataTable draw counter
   * @param {number} [options.start=0] - Pagination offset
   * @param {number} [options.length=-1] - Page size (-1 = all records, omitted from request)
   * @returns {Promise} API response with usage data
   */
  static async getPenggunaData({ startDate, endDate, search = '', draw = 1, start = 0, length = -1 } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('draw', draw);
      params.append('start', start);
      if (length !== -1) params.append('length', length);
      if (search) params.append('search[value]', search);

      const response = await HttpClient.get(`${this.API_DATA}?${params.toString()}`);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pengguna berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching Persediaan OVK pengguna data:', error);
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data pengguna'
      };
    }
  }

  /**
   * Get persediaan (inventory/stock) data in DataTable format
   * @param {Object} params - Query parameters (draw, start, length, search, etc.)
   * @returns {Promise} API response with paginated inventory data
   */
  static async getPersediaanData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || 0,
        'order[0][dir]': params.orderDir || 'asc',
        _ts: Date.now(),
      });

      // Add date range if provided
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);

      const response = await HttpClient.get(`${this.API_DATA}?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data?.map(item => this.transformData(item)) || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw,
      };
    } catch (error) {
      console.error('Error fetching Persediaan OVK data:', error);
      return { success: false, data: [], message: error.message };
    }
  }

  /**
   * Get rekap (recap/summary) data — all-time available stock
   * Calls /datarekap with no query parameters (no pagination/filtering needed)
   * @returns {Promise} API response with rekap data
   */
  static async getSummary() {
    try {
      const response = await HttpClient.get(this.API_REKAP);
      return {
        success: true,
        data: response?.data ?? response,
        recordsTotal: response?.recordsTotal ?? 0,
        recordsFiltered: response?.recordsFiltered ?? 0,
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching Persediaan OVK summary:', error);
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: errorData?.message || error?.message || 'Gagal memuat ringkasan persediaan'
      };
    }
  }

  /**
   * Transform backend data to frontend format
   * @param {Object} item - Raw backend data
   * @returns {Object} Normalized frontend data
   */
  static transformData(item) {
    return {
      id: item.id,
      namaOvk: item.nama_produk,
      satuan: item.satuan,
      harga: item.harga,
      pemasok: item.pemasok,
      stok: item.stok,
    };
  }
}

export default PersediaanOvkService;
