/**
 * Biaya RPH Service
 * Service layer for RPH Biaya (bank/kas) operations
 */

import HttpClient from './httpClient';

class BiayaRphService {
  // API endpoints aligned with the RPH route naming convention
  static API_DATA = '/api/rph/biaya/data';
  static API_SHOW = '/api/rph/biaya/show';
  static API_STORE = '/api/rph/biaya/store';
  static API_UPDATE = '/api/rph/biaya/update';
  static API_DELETE = '/api/rph/biaya/hapus';
  static API_SUMMARY_DAILY = '/api/rph/biaya/summary/daily';
  static API_SUMMARY_MONTHLY = '/api/rph/biaya/summary/monthly';

  /**
   * Get DataTable data
   * @param {Object} params
   */
  static async getData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || 4,
        'order[0][dir]': params.orderDir || 'desc',
        ...(params.startDate && { start_date: params.startDate }),
        ...(params.endDate && { end_date: params.endDate }),
        _ts: Date.now(),
      });

      const response = await HttpClient.get(`${this.API_DATA}?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw,
      };
    } catch (error) {
      console.error('Error fetching Biaya RPH data:', error);
      return { success: false, data: [], message: error.message };
    }
  }

  /**
   * Get daily summary
   * @param {string|null} date - Date string (YYYY-MM-DD), defaults to today
   */
  static async getSummaryDaily(date = null) {
    try {
      const params = {};
      if (date) params.date = date;

      const response = await HttpClient.get(this.API_SUMMARY_DAILY, { params });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Ringkasan harian berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching Biaya RPH daily summary:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat ringkasan harian'
      };
    }
  }

  /**
   * Get monthly summary
   * @param {number|null} year - Year (e.g. 2026)
   * @param {number|null} month - Month (1-12)
   */
  static async getSummaryMonthly(year = null, month = null) {
    try {
      const params = {};
      if (year) params.year = year;
      if (month) params.month = month;

      const response = await HttpClient.get(this.API_SUMMARY_MONTHLY, { params });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Ringkasan bulanan berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching Biaya RPH monthly summary:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat ringkasan bulanan'
      };
    }
  }

  /**
   * Get single record detail by PID
   * @param {string} pid
   */
  static async show(pid) {
    try {
      const response = await HttpClient.post(this.API_SHOW, { pid });
      const rawData = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : response?.data
            ? [response.data]
            : [];
      return {
        success: true,
        data: rawData,
        message: response?.message || 'Detail biaya RPH berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching Biaya RPH detail:', error);
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat detail biaya RPH'
      };
    }
  }

  /**
   * Create new Biaya RPH record
   * @param {Object} payload
   */
  static async store(payload = {}) {
    try {
      const response = await HttpClient.post(this.API_STORE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Biaya RPH berhasil disimpan'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error storing Biaya RPH:', error);
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menyimpan biaya RPH'
      };
    }
  }

  /**
   * Update existing Biaya RPH record
   * @param {Object} payload
   */
  static async update(payload = {}) {
    try {
      const response = await HttpClient.post(this.API_UPDATE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Biaya RPH berhasil diperbarui'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error updating Biaya RPH:', error);
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal memperbarui biaya RPH'
      };
    }
  }

  /**
   * Delete Biaya RPH record
   * @param {string} pid
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(this.API_DELETE, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Biaya RPH berhasil dihapus'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error deleting Biaya RPH:', error);
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menghapus biaya RPH'
      };
    }
  }
}

export default BiayaRphService;
