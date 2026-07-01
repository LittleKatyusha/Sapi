/**
 * Penjualan Sapi Utuh Service
 * Service layer for Penjualan Sapi Utuh (Whole Cattle Sales) operations
 */

import HttpClient from './httpClient';

const BASE_URL = '/api/rph/penjualan-sapi-utuh';

class PenjualanSapiUtuhService {
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
        ...(params.status_transaksi && { status_transaksi: params.status_transaksi }),
        ...(params.exclude_status_transaksi && { exclude_status_transaksi: params.exclude_status_transaksi }),
        ...(params.status_pembayaran && { status_pembayaran: params.status_pembayaran }),
        ...(params.pengiriman && { pengiriman: params.pengiriman }),
        ...(params.status_pengiriman && { status_pengiriman: params.status_pengiriman }),
        ...(params.return_status && { return_status: params.return_status }),
        ...(params.pic && { pic: params.pic }),
        ...(params.no_transaksi && { no_transaksi: params.no_transaksi }),
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
        _ts: Date.now(),
      });

      const response = await HttpClient.get(`${BASE_URL}/data?${queryParams.toString()}`);
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
        message: errorData?.message || error?.message || 'Gagal memuat data penjualan',
      };
    }
  }

  /**
   * Get available sapi for dropdown selection
   * @returns {Promise} API response with available sapi list
   */
  static async getAvailableSapi(jenisTransaksi = 'sapi_utuh', transactionId = null) {
    try {
      const params = new URLSearchParams();
      if (jenisTransaksi) {
        params.append('jenis_transaksi', jenisTransaksi);
      }
      if (transactionId) {
        params.append('transaction_id', transactionId);
      }
      params.append('_ts', Date.now());
      const response = await HttpClient.get(`${BASE_URL}/available-sapi?${params.toString()}`);
      return {
        success: true,
        data: response?.data ?? response ?? [],
        message: response?.message || 'Data sapi berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data sapi',
      };
    }
  }

  /**
   * Get single transaction detail by encrypted PID
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
   */
  static async show(pid) {
    try {
      const params = new URLSearchParams();
      params.append('_ts', Date.now());
      const response = await HttpClient.post(`${BASE_URL}/show?${params.toString()}`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Detail penjualan berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat detail penjualan',
      };
    }
  }

  /**
   * Create new transaction
   * @param {Object|FormData} payload - Form data including details array
   * @returns {Promise} API response
   */
  static async store(payload = {}) {
    try {
      let response;
      if (payload instanceof FormData) {
        response = await HttpClient.post(`${BASE_URL}/store`, payload);
      } else {
        response = await HttpClient.post(`${BASE_URL}/store`, payload);
      }
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Penjualan berhasil ditambahkan',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menambahkan penjualan',
      };
    }
  }

  /**
   * Update existing transaction
   * @param {Object|FormData} payload - Form data including pid and details array
   * @returns {Promise} API response
   */
  static async update(payload) {
    try {
      let response;
      if (payload instanceof FormData) {
        response = await HttpClient.post(`${BASE_URL}/update`, payload);
      } else {
        response = await HttpClient.post(`${BASE_URL}/update`, payload);
      }
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Penjualan berhasil diperbarui',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal memperbarui penjualan',
      };
    }
  }

  /**
   * Delete transaction by encrypted PID
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/hapus`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Penjualan berhasil dihapus',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menghapus penjualan',
      };
    }
  }

  /**
   * Confirm transaction
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async confirm(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/confirm`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Transaksi berhasil dikonfirmasi',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal mengkonfirmasi transaksi',
      };
    }
  }

  /**
   * Cancel transaction
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async cancel(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/cancel`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Transaksi berhasil dibatalkan',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal membatalkan transaksi',
      };
    }
  }

  /**
   * Record payment / pelunasan
   * @param {Object} payload - { pid, nominal_pembayaran, metode_pembayaran, nama_pembayar }
   * @returns {Promise} API response
   */
  static async bayar(payload) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/bayar`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Pembayaran berhasil dicatat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal mencatat pembayaran',
      };
    }
  }

  /**
   * Get payment history for a transaction
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with history
   */
  static async getPembayaranHistory(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/pembayaran-history`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'History pembayaran berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat history pembayaran',
      };
    }
  }

  /**
   * Update delivery status & details
   * @param {Object} payload - Delivery data with pid and status
   * @returns {Promise} API response
   */
  static async updateDelivery(payload) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/update-delivery`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pengiriman berhasil diperbarui',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memperbarui data pengiriman',
      };
    }
  }

  /**
   * Get faktur print data
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with faktur data
   */
  static async printFaktur(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/print-faktur`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data faktur berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat data faktur',
      };
    }
  }

  /**
   * Get invoice print data
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with invoice data
   */
  static async printInvoice(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/print-invoice`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data invoice berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat data invoice',
      };
    }
  }

  /**
   * Get surat jalan print data
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with surat jalan data
   */
  static async printSuratJalan(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/print-surat-jalan`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data surat jalan berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat data surat jalan',
      };
    }
  }
}

export default PenjualanSapiUtuhService;
