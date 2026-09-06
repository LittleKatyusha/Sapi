/**
 * Penjualan Doka Sapi Service
 * Service layer for handling all Penjualan Doka Sapi API operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class PenjualanDokaSapiService {
  /**
   * Get list of Penjualan Doka Sapi with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.start - Starting index for pagination
   * @param {number} params.length - Number of records per page
   * @param {string} params.search - Search term
   * @param {string} params.start_date - Start date for filtering
   * @param {string} params.end_date - End date for filtering
   * @returns {Promise} API response with data
   */
  static async getData(params = {}) {
    try {
      // Build query parameters for DataTables format
      const queryParams = {
        start: params.start || 0,
        length: params.length || 10,
        draw: params.draw || 1,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || '0',
        'order[0][dir]': params.orderDir || 'desc',
        _: Date.now() // Cache buster
      };

      // Add optional date filters
      if (params.start_date) {
        queryParams.start_date = params.start_date;
      }
      if (params.end_date) {
        queryParams.end_date = params.end_date;
      }
      if (params.status && params.status !== 'all') {
        queryParams.status = params.status;
      }
      if (params.rph) {
        queryParams.rph = params.rph;
      }
      if (params.payment_status && params.payment_status !== 'all') {
        queryParams.payment_status = params.payment_status;
      }

      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/data`, {
        params: queryParams
      });

      // Transform response to match expected format
      return {
        draw: response.draw,
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        data: response.data || [],
        total: response.total || 0,
        success: true
      };
    } catch (error) {
      console.error('Error fetching Penjualan Doka Sapi data:', error);
      throw error;
    }
  }

  /**
   * Get stat cards data (server-side accurate aggregation)
   * @returns {Promise} API response with card data
   */
  static async getCardData() {
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/card`);
      return response;
    } catch (error) {
      console.error('Error fetching Penjualan Doka Sapi card data:', error);
      throw error;
    }
  }

  /**
   * Build export URL with filters for Excel/PDF download.
   * @param {Object} filters - { start_date, end_date, status, rph, payment_status }
   * @param {string} type - 'export-excel' | 'export-rekap-pdf'
   * @returns {string} Full URL with query params
   */
  static buildExportUrl(filters = {}, type = 'export-excel') {
    const base = `${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/${type}`;
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.rph) params.append('rph', filters.rph);
    if (filters.payment_status && filters.payment_status !== 'all') params.append('payment_status', filters.payment_status);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  /**
   * Get detail of specific Penjualan Doka Sapi
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
   */
  static async getDetail(pid) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/show`, {
        pid: pid
      });

      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Detail berhasil dimuat'
      };
    } catch (error) {
      console.error('Error fetching Penjualan Doka Sapi detail:', error);
      throw error;
    }
  }

  /**
   * Approve a Penjualan Doka Sapi
   * @param {string} pid - Encrypted PID
   * @param {number} id_persetujuan_ho - ID of approval person
   * @param {string} catatan_ho - HO notes (optional)
   * @returns {Promise} API response
   */
  static async approve(pid, id_persetujuan_ho, catatan_ho = '') {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/approve`, {
        pid: pid,
        id_persetujuan_ho: id_persetujuan_ho,
        catatan: catatan_ho  // Backend expects 'catatan' not 'catatan_ho'
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil disetujui'
      };
    } catch (error) {
      console.error('Error approving Penjualan Doka Sapi:', error);
      const message = this._extractErrorMessage(error, 'Gagal menyetujui pesanan');
      const wrapped = new Error(message);
      wrapped.data = error.data;
      wrapped.status = error.status;
      throw wrapped;
    }
  }

  /**
   * Reject a Penjualan Doka Sapi
   * @param {string} pid - Encrypted PID
   * @param {number} id_persetujuan_ho - ID of approval person
   * @param {string} catatan - Rejection reason/notes
   * @param {string} catatan_ho - HO notes (optional)
   * @returns {Promise} API response
   */
  static async reject(pid, id_persetujuan_ho, catatan, catatan_ho = '') {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/reject`, {
        pid: pid,
        id_persetujuan_ho: id_persetujuan_ho,
        catatan: catatan  // Backend only expects 'catatan', not 'catatan_ho'
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil ditolak'
      };
    } catch (error) {
      console.error('Error rejecting Penjualan Doka Sapi:', error);
      const message = this._extractErrorMessage(error, 'Gagal menolak pesanan');
      const wrapped = new Error(message);
      wrapped.data = error.data;
      wrapped.status = error.status;
      throw wrapped;
    }
  }

  /**
   * Extract a user-friendly message from an HttpClient error.
   * Backend validation errors come back as:
   *   { status: 'no', message: 'Validasi gagal', data: { catatan: ['...'] }, code: 400 }
   * HttpClient stores the parsed body in error.data and sets error.message to the raw message.
   */
  static _extractErrorMessage(error, fallback) {
    const data = error?.data;
    if (data && typeof data === 'object') {
      // Laravel validation messages: { field: ['msg1', 'msg2', ...] }
      const fieldMessages = [];
      Object.keys(data).forEach((field) => {
        const v = data[field];
        if (Array.isArray(v) && v.length > 0) {
          fieldMessages.push(`${field}: ${v.join(', ')}`);
        } else if (typeof v === 'string') {
          fieldMessages.push(`${field}: ${v}`);
        }
      });
      if (fieldMessages.length > 0) {
        return fieldMessages.join(' | ');
      }
      if (typeof data.message === 'string' && data.message) {
        return data.message;
      }
    }
    return error?.message || fallback;
  }

  /**
   * Transform backend data to frontend format
   * @param {Object} item - Backend data item
   * @returns {Object} Transformed data
   */
  static transformData(item) {
    return {
      // Map backend fields to frontend fields
      pubid: item.pubid || item.id,
      pid: item.pid, // Encrypted PID for API calls
      no_po: item.no_po || '',
      nota: item.nota || '', // Map nota field correctly
      nota_sistem: item.nota_sistem || '', // Nota sistem from tr_pembelian_ho
      rph: item.rph || '',
      nama_supplier: item.rph || '', // Map rph to nama_supplier for display
      created_at: item.created_at || item.tgl_pesanan,
      tgl_masuk: item.tgl_pesanan || item.created_at,
      jumlah: parseInt(item.jumlah) || 0,
      harga: parseFloat(item.harga) || 0,
      biaya_total: parseFloat(item.harga) || 0, // Map harga to biaya_total
      reason: item.reason || '',
      status: item.status, // 1: pending, 2: approved, 3: rejected
      
      // Additional fields for compatibility
      nama_office: 'Head Office',
      nama_supir: item.nama_supir || item.supir || item.nama_driver || item.driver || '-',
      plat_nomor: item.plat_nomor || item.plat || item.no_plat || '-',
      persetujuan_ho: item.persetujuan_ho || item.persetujuan || item.nama_persetujuan || '',
      biaya_lain: 0,
      biaya_truk: 0,
      berat_total: 0,
      jenis_penjualan: '1',
      saldo_sebelum: 0,
      saldo_setelah: 0,
      
      // Keep original data for reference
      _original: item
    };
  }

  /**
   * Get status label and color based on status code
   * @param {number} status - Status code (1: pending, 2: approved, 3: rejected)
   * @returns {Object} Status label and color
   */
  static getStatusInfo(status) {
    switch (status) {
      case 1:
        return {
          label: 'Menunggu',
          color: 'yellow',
          bgClass: 'bg-yellow-50',
          textClass: 'text-yellow-700'
        };
      case 2:
        return {
          label: 'Disetujui',
          color: 'green',
          bgClass: 'bg-green-50',
          textClass: 'text-green-700'
        };
      case 3:
        return {
          label: 'Ditolak',
          color: 'red',
          bgClass: 'bg-red-50',
          textClass: 'text-red-700'
        };
      default:
        return {
          label: 'Draft',
          color: 'gray',
          bgClass: 'bg-gray-50',
          textClass: 'text-gray-700'
        };
    }
  }
}

export default PenjualanDokaSapiService;