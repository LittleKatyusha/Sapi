/**
 * Qurban Service
 * Dedicated service layer for handling all Qurban (Pembelian Sapi Qurban) API operations
 * Endpoints: /api/rph/qurban/*
 */

import HttpClient from '../httpClient';
import { API_ENDPOINTS } from '../../config/api';

class QurbanService {
  /**
   * Base API endpoint for Qurban
   */
  static API_BASE = API_ENDPOINTS.RPH?.QURBAN?.BASE || '/api/rph/qurban';

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  /**
   * Get available nota/pesanan from HO
   * @param {Object} params - Request parameters
   * @param {number} params.id_pemasok - Pemasok/Supplier ID to filter nota
   * @returns {Promise} API response with available nota list
   */
  static async getNota(params = {}) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.QURBAN?.NOTA || `${this.API_BASE}/getnota`,
        { id_pemasok: params.id_pemasok }
      );

      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Data nota berhasil dimuat',
      };
    } catch (error) {
      console.error('[QurbanService] Error fetching nota:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil data nota',
      };
    }
  }

  /**
   * Get available hewan/sapi from a specific nota
   * @param {Object} params - Request parameters
   * @param {number} params.id_nota - Nota ID to get hewan list
   * @returns {Promise} API response with hewan list
   */
  static async getHewan(params = {}) {
    try {
      const response = await HttpClient.post(
        `${this.API_BASE}/gethewan`,
        { id_nota: params.id_nota }
      );

      return {
        success: response.success !== false,
        data: response.data || [],
        message: response.message || 'Data hewan berhasil dimuat',
      };
    } catch (error) {
      console.error('[QurbanService] Error fetching hewan:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil data hewan',
      };
    }
  }

  /**
   * Get list of Qurban PO with DataTable support
   * @param {Object} params - Query parameters
   * @param {number} params.start - Starting index for pagination
   * @param {number} params.length - Number of records per page
   * @param {string} params.search - Search term
   * @param {string} params.start_date - Start date for filtering
   * @param {string} params.end_date - End date for filtering
   * @param {number} params.draw - DataTable draw counter
   * @returns {Promise} API response with paginated data
   */
  static async getData(params = {}) {
    try {
      const queryParams = {
        start: params.start || 0,
        length: params.length || 10,
        draw: params.draw || 1,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || '0',
        'order[0][dir]': params.orderDir || 'desc',
        _: Date.now(), // Cache buster
      };

      if (params.start_date) queryParams.start_date = params.start_date;
      if (params.end_date) queryParams.end_date = params.end_date;

      const response = await HttpClient.get(
        API_ENDPOINTS.RPH?.QURBAN?.DATA || `${this.API_BASE}/data`,
        { params: queryParams }
      );

      return {
        draw: response.draw,
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        data: response.data || [],
        total: response.total || 0,
        success: true,
      };
    } catch (error) {
      console.error('[QurbanService] Error fetching data:', error);
      throw error;
    }
  }

  /**
   * Get detail of a specific Qurban PO
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with PO details
   */
  static async getDetail(pid) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.QURBAN?.SHOW || `${this.API_BASE}/show`,
        { pid }
      );

      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Detail berhasil dimuat',
      };
    } catch (error) {
      console.error('[QurbanService] Error fetching detail:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil detail',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // CRUD operations
  // ---------------------------------------------------------------------------

  /**
   * Create new Qurban PO
   * @param {Object} data - PO data
   * @param {number} data.id_office - Office ID
   * @param {string} data.nota - Nota number from HO
   * @param {number} data.id_persetujuan_rph - Approval ID
   * @param {string} data.catatan - Notes/remarks
   * @param {Array<number>} data.sapi_list - List of sapi IDs
   * @returns {Promise} API response
   */
  static async create(data) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.QURBAN?.STORE || `${this.API_BASE}/store`,
        data
      );

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data qurban berhasil dibuat',
      };
    } catch (error) {
      console.error('[QurbanService] Error creating:', error);
      return {
        success: false,
        message: error.message || 'Gagal membuat data qurban',
      };
    }
  }

  /**
   * Update existing Qurban PO
   * @param {Object} data - PO data to update
   * @param {string} data.pid - Encrypted PID
   * @param {number} data.id_office - Office ID
   * @param {string} data.nota - Nota number from HO
   * @param {number} data.id_persetujuan_rph - Approval ID
   * @param {string} data.catatan - Notes/remarks
   * @param {Array<number>} data.sapi_list - List of sapi IDs
   * @returns {Promise} API response
   */
  static async update(data) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.QURBAN?.UPDATE || `${this.API_BASE}/update`,
        data
      );

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data qurban berhasil diperbarui',
      };
    } catch (error) {
      console.error('[QurbanService] Error updating:', error);
      return {
        success: false,
        message: error.message || 'Gagal memperbarui data qurban',
      };
    }
  }

  /**
   * Delete Qurban PO
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.QURBAN?.DELETE || `${this.API_BASE}/hapus`,
        { pid }
      );

      return {
        success: true,
        message: response.message || 'Data qurban berhasil dihapus',
      };
    } catch (error) {
      console.error('[QurbanService] Error deleting:', error);
      return {
        success: false,
        message: error.message || 'Gagal menghapus data qurban',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  /**
   * Get Qurban statistics from QurbanStatistik view
   * @returns {Promise} API response with statistics data
   */
  static async getStatistics() {
    try {
      const endpoint = API_ENDPOINTS?.RPH?.QURBAN?.STATISTIK
        || (API_ENDPOINTS?.RPH?.QURBAN?.BASE
          ? `${API_ENDPOINTS.RPH.QURBAN.BASE}/statistik`
          : '/api/rph/qurban/statistik');

      const response = await HttpClient.get(endpoint);

      return {
        success: response && !response.error,
        data: response?.data || response,
        message: response?.message || 'Statistics retrieved successfully',
      };
    } catch (error) {
      console.error('[QurbanService] Error fetching qurban statistics:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Gagal mengambil data statistik',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Data transformation helpers
  // ---------------------------------------------------------------------------

  /**
   * Transform backend data to frontend format
   * @param {Object} item - Backend data item
   * @returns {Object} Transformed data
   */
  static transformData(item) {
    return {
      ...item,
      // Core fields
      pubid: item.pubid || item.pid,
      pid: item.pid,
      encryptedPid: item.pid,
      no_po: item.no_po || item.nota_sistem || '',
      nota: item.nota || item.nota_sistem || '',
      nota_sistem: item.nota_sistem || item.no_po || '',

      // Dates
      tgl_pesanan: item.tanggal_pemesanan || item.tgl_pesanan || item.created_at,
      tanggal_pemesanan: item.tanggal_pemesanan || item.tgl_pesanan || item.created_at,
      tgl_masuk: item.created_at,
      created_at: item.created_at,
      updated_at: item.updated_at,

      // Quantities and amounts
      jumlah: parseInt(item.jumlah_hewan || item.jumlah) || 0,
      jumlah_hewan: parseInt(item.jumlah_hewan || item.jumlah) || 0,
      harga: parseFloat(item.total_harga || item.harga) || 0,
      total_harga: parseFloat(item.total_harga || item.harga) || 0,
      biaya_total: parseFloat(item.total_harga || item.harga) || 0,

      // Status and approval
      status: item.status,
      persetujuan: item.status || item.persetujuan,
      reason: item.reason || '',
      id_persetujuan_rph: item.id_persetujuan_rph,

      // Additional fields for compatibility
      nama_supplier: item.pemasok || 'RPH',
      pemasok: item.pemasok || 'RPH',
      nama_penerima: item.nama_penerima || '-',
      nama_office: 'Rumah Potong Hewan',
      nama_supir: item.pengirim || '-',
      plat_nomor: item.plat_nomor || '-',
      tempat_tiba: item.tempat_tiba || '-',
      pengirim: item.pengirim || '-',
      biaya_lain: 0,
      biaya_truk: 0,
      berat_total: 0,
      jenis_pembelian: item.jenis_pembelian || '4',
      jenis_pembelian_id: 4,
      note: item.note || '',

      // Keep original data for reference
      _original: item,
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
          textClass: 'text-yellow-700',
          borderClass: 'border-yellow-200',
        };
      case 2:
        return {
          label: 'Disetujui',
          color: 'green',
          bgClass: 'bg-green-50',
          textClass: 'text-green-700',
          borderClass: 'border-green-200',
        };
      case 3:
        return {
          label: 'Ditolak',
          color: 'red',
          bgClass: 'bg-red-50',
          textClass: 'text-red-700',
          borderClass: 'border-red-200',
        };
      default:
        return {
          label: 'Draft',
          color: 'gray',
          bgClass: 'bg-gray-50',
          textClass: 'text-gray-700',
          borderClass: 'border-gray-200',
        };
    }
  }

  // ---------------------------------------------------------------------------
  // Batch & export operations
  // ---------------------------------------------------------------------------

  /**
   * Get multiple PO details at once
   * @param {Array<string>} pids - Array of encrypted PIDs
   * @returns {Promise} API response with multiple PO details
   */
  static async getMultipleDetails(pids) {
    try {
      const promises = pids.map((pid) => this.getDetail(pid));
      const results = await Promise.allSettled(promises);

      return results.map((result, index) => ({
        pid: pids[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    } catch (error) {
      console.error('[QurbanService] Error fetching multiple details:', error);
      throw error;
    }
  }

  /**
   * Export Qurban data to Excel
   * @param {Object} params - Export parameters
   * @returns {Promise} Blob containing Excel file
   */
  static async exportToExcel(params = {}) {
    try {
      const response = await HttpClient.get(
        API_ENDPOINTS.RPH?.QURBAN?.EXPORT || `${this.API_BASE}/export`,
        { params, responseType: 'blob' }
      );

      return response;
    } catch (error) {
      console.error('[QurbanService] Error exporting data:', error);
      throw error;
    }
  }
}

export default QurbanService;