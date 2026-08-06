/**
 * Reseller Service
 * Service layer for Reseller master data operations
 */

import HttpClient from './httpClient';

const RESELLER_BASE = '/api/master/reseller';

class ResellerService {
  /**
   * Get DataTable data with server-side pagination
   * @param {Object} params - DataTable query parameters
   * @returns {Promise} API response with paginated data
   */
  static async getData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn ?? 1,
        'order[0][dir]': params.orderDir || 'asc',
        _ts: Date.now(),
      });

      const filters = params.filters || {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(`filters[${key}]`, value);
        }
      });

      console.log('🔍 Reseller getData URL:', `${RESELLER_BASE}/data?${queryParams.toString()}`, { params, filters });

      const response = await HttpClient.get(`${RESELLER_BASE}/data?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw,
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data reseller',
      };
    }
  }

  /**
   * Get all resellers (for dropdowns/selects)
   * @param {Object} params - Filter params (search, status)
   * @returns {Promise} API response with all data
   */
  static async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status }),
        _ts: Date.now(),
      });

      const response = await HttpClient.get(`${RESELLER_BASE}/all?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data reseller berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data reseller',
      };
    }
  }

  /**
   * Get active resellers only (for sales forms)
   * @returns {Promise} API response with active resellers
   */
  static async getActive() {
    try {
      const params = new URLSearchParams();
      params.append('_ts', Date.now());
      const response = await HttpClient.get(`${RESELLER_BASE}/active?${params.toString()}`);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data reseller aktif berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data reseller aktif',
      };
    }
  }

  /**
   * Get single reseller detail by encrypted PID
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
   */
  static async show(pid) {
    try {
      const params = new URLSearchParams();
      params.append('_ts', Date.now());
      const response = await HttpClient.post(`${RESELLER_BASE}/show?${params.toString()}`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Detail reseller berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat detail reseller',
      };
    }
  }

  /**
   * Create new reseller
   * @param {Object} payload - Form data
   * @returns {Promise} API response
   */
  static async store(payload = {}) {
    try {
      const response = await HttpClient.post(`${RESELLER_BASE}/store`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Reseller berhasil ditambahkan',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menambahkan reseller',
      };
    }
  }

  /**
   * Update existing reseller
   * @param {Object} payload - Form data including pid
   * @returns {Promise} API response
   */
  static async update(payload) {
    try {
      const response = await HttpClient.post(`${RESELLER_BASE}/update`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Reseller berhasil diperbarui',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal memperbarui reseller',
      };
    }
  }

  /**
   * Delete reseller by encrypted PID
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(`${RESELLER_BASE}/hapus`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Reseller berhasil dihapus',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menghapus reseller',
      };
    }
  }
}

export default ResellerService;
