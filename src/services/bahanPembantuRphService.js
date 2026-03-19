/**
 * Bahan Pembantu RPH Service
 * Service layer for RPH Bahan Pembantu (auxiliary materials) operations
 */

import HttpClient from './httpClient';

class BahanPembantuRphService {
  // API endpoints
  static API_DATA = '/api/rph/bahanpembantu/data';
  static API_SHOW = '/api/rph/bahanpembantu/show';
  static API_STORE = '/api/rph/bahanpembantu/store';
  static API_UPDATE = '/api/rph/bahanpembantu/update';
  static API_DELETE = '/api/rph/bahanpembantu/hapus';
  static API_SUMMARY_DAILY = '/api/rph/bahanpembantu/summary/daily';
  static API_SUMMARY_MONTHLY = '/api/rph/bahanpembantu/summary/daily';

  /**
   * Get DataTable data with search, date filters, and pagination
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
        'order[0][column]': params.orderColumn || 4,
        'order[0][dir]': params.orderDir || 'desc',
        ...(params.startDate && { start_date: params.startDate }),
        ...(params.endDate && { end_date: params.endDate }),
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
      console.error('Error fetching Bahan Pembantu RPH data:', error);
      return { success: false, data: [], message: error.message };
    }
  }

  /**
   * Get single record detail by PID
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
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
        message: response?.message || 'Detail bahan pembantu berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching Bahan Pembantu RPH detail:', error);
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat detail bahan pembantu'
      };
    }
  }

  /**
   * Create new Bahan Pembantu record
   * @param {Object} payload - Form data
   * @returns {Promise} API response
   */
  static async store(payload = {}) {
    try {
      const response = await HttpClient.post(this.API_STORE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Bahan pembantu berhasil disimpan'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error storing Bahan Pembantu RPH:', error);
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menyimpan bahan pembantu'
      };
    }
  }

  /**
   * Update existing Bahan Pembantu record
   * @param {Object} payload - Form data including pid
   * @returns {Promise} API response
   */
  static async update(payload = {}) {
    try {
      const response = await HttpClient.post(this.API_UPDATE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Bahan pembantu berhasil diperbarui'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error updating Bahan Pembantu RPH:', error);
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal memperbarui bahan pembantu'
      };
    }
  }

  /**
   * Delete Bahan Pembantu record
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(this.API_DELETE, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Bahan pembantu berhasil dihapus'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error deleting Bahan Pembantu RPH:', error);
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menghapus bahan pembantu'
      };
    }
  }

  /**
   * Get daily summary
   * @param {string|null} date - Date string (YYYY-MM-DD), defaults to today
   * @returns {Promise} API response with daily summary
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
      console.error('Error fetching Bahan Pembantu RPH daily summary:', error);
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
   * @returns {Promise} API response with monthly summary
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
      console.error('Error fetching Bahan Pembantu RPH monthly summary:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat ringkasan bulanan'
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
      pid: item.pid,
      notaSistem: item.nota_sistem,
      namaProduk: item.nama_produk,
      peruntukkan: item.peruntukkan,
      qty: item.qty,
      satuan: item.satuan,
      hargaSatuan: item.harga_satuan,
      pemasok: item.pemasok,
      biayaKirim: item.biaya_kirim,
      biayaLain: item.biaya_lain,
      biayaTotal: item.biaya_total,
      jenisPembelian: item.jenis_pembelian,
      bankPengirim: item.bank_pengirim,
      namaBank: item.nama_bank,
      keterangan: item.keterangan,
      createdAt: item.created_at,
    };
  }
}

export default BahanPembantuRphService;
