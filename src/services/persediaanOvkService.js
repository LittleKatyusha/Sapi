/**
 * Persediaan OVK Service
 * Service layer for RPH Persediaan OVK (veterinary supplies inventory) operations
 */

import HttpClient from './httpClient';

class PersediaanOvkService {
  // API endpoints
  static API_PENGGUNA = '/api/rph/persediaan-ovk/pengguna';
  static API_DATA = '/api/rph/persediaan-ovk/data';
  static API_SUMMARY = '/api/rph/persediaan-ovk/summary';

  /**
   * Get pengguna (usage) data for selected dates
   * @param {Array<string>} dates - Array of date strings 'YYYY-MM-DD'
   * @returns {Promise} API response with usage data per date
   */
  static async getPenggunaData(dates = []) {
    try {
      const params = new URLSearchParams();
      if (dates.length > 0) {
        params.set('dates', dates.join(','));
      }
      params.set('_ts', Date.now());

      const response = await HttpClient.get(`${this.API_PENGGUNA}?${params.toString()}`);
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
   * Get summary statistics
   * @returns {Promise} API response with summary data
   */
  static async getSummary() {
    try {
      const response = await HttpClient.get(this.API_SUMMARY, {
        params: { _ts: Date.now() },
      });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Ringkasan persediaan berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching Persediaan OVK summary:', error);
      return {
        success: false,
        data: null,
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
      pid: item.pid,
      namaOvk: item.nama_ovk,
      satuan: item.satuan,
      stok: item.stok,
      stokMinimal: item.stok_minimal,
      kategori: item.kategori,
      tanggalMasuk: item.tanggal_masuk,
      supplier: item.supplier,
      hargaSatuan: item.harga_satuan,
    };
  }
}

export default PersediaanOvkService;
