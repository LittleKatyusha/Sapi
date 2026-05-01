/**
 * Pedagang Service
 * Service layer for Pedagang (meat trader) master data operations
 */

import HttpClient from './httpClient';

const PEDAGANG_BASE = '/api/master/pedagang';

class PedagangService {
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
        'order[0][column]': params.orderColumn || 0,
        'order[0][dir]': params.orderDir || 'desc',
        ...(params.status_pedagang && { status_pedagang: params.status_pedagang }),
        ...(params.pasar && { pasar: params.pasar }),
        _ts: Date.now(),
      });

      const response = await HttpClient.get(`${PEDAGANG_BASE}/data?${queryParams.toString()}`);
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
        message: errorData?.message || error?.message || 'Gagal memuat data pedagang',
      };
    }
  }

  /**
   * Get single pedagang detail by encrypted PID
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
   */
  static async show(pid) {
    try {
      const params = new URLSearchParams();
      params.append('_ts', Date.now());
      const response = await HttpClient.post(`${PEDAGANG_BASE}/show?${params.toString()}`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Detail pedagang berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat detail pedagang',
      };
    }
  }

  /**
   * Create new pedagang with harga
   * @param {Object} payload - Form data including nested harga object
   * @returns {Promise} API response
   */
  static async store(payload = {}) {
    try {
      const response = await HttpClient.post(`${PEDAGANG_BASE}/store`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Pedagang berhasil ditambahkan',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menambahkan pedagang',
      };
    }
  }

  /**
   * Update existing pedagang with harga
   * @param {Object} payload - Form data including pid and nested harga object
   * @returns {Promise} API response
   */
  static async update(payload) {
    try {
      const { pid, ...data } = payload;
      const params = new URLSearchParams();
      if (pid) params.append('pid', pid);
      params.append('_ts', Date.now());
      const response = await HttpClient.post(`${PEDAGANG_BASE}/update?${params.toString()}`, data);
      return { success: true, data: response?.data ?? response, message: 'Pedagang berhasil diperbarui' };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return { success: false, data: errorData, message: errorData?.message || error?.message || 'Gagal memperbarui pedagang' };
    }
  }

  /**
   * Soft delete pedagang by encrypted PID
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(`${PEDAGANG_BASE}/hapus`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Pedagang berhasil dihapus',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menghapus pedagang',
      };
    }
  }

  /**
   * Get dashboard statistics
   * @param {Object} params - Filter params (start_date, end_date, pasar)
   * @returns {Promise} API response with statistics
   */
  static async getStatistic(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
        ...(params.pasar && { pasar: params.pasar }),
        _ts: Date.now(),
      });

      const response = await HttpClient.get(`${PEDAGANG_BASE}/statistic?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Statistik berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat statistik',
      };
    }
  }
}

export default PedagangService;
