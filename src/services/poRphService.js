/**
 * PO RPH Service
 * Service layer for handling all PO RPH (Purchase Order - Rumah Potong Hewan) API operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class PoRphService {
  /**
   * Base API endpoint for PO RPH
   */
  static API_BASE = API_ENDPOINTS.RPH?.PO?.BASE || '/api/rph/po';

  /**
   * Get available nota/pesanan from HO
   * @param {Object} params - Request parameters
   * @param {number} params.id_office - Office ID to filter nota
   * @returns {Promise} API response with available nota list
   */
  static async getNota(params = {}) {
    try {
      // Backend requires POST method with id_office in body
      const response = await HttpClient.post(API_ENDPOINTS.RPH?.PO?.NOTA || `${this.API_BASE}/getnota`, {
        id_office: params.id_office
      });

      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Data nota berhasil dimuat'
      };
    } catch (error) {
      console.error('Error fetching nota from HO:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil data nota'
      };
    }
  }

  /**
   * Get list of PO RPH with DataTable support
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

      const response = await HttpClient.get(API_ENDPOINTS.RPH?.PO?.DATA || `${this.API_BASE}/data`, {
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
      console.error('Error fetching PO RPH data:', error);
      throw error;
    }
  }

  /**
   * Get detail of a specific PO
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with PO details
   */
  static async getDetail(pid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.RPH?.PO?.SHOW || `${this.API_BASE}/show`, {
        pid: pid
      });

      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Detail PO berhasil dimuat'
      };
    } catch (error) {
      console.error('Error fetching PO detail:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil detail PO'
      };
    }
  }

  /**
   * Create new PO RPH
   * @param {Object} data - PO data
   * @param {number} data.id_office - Office ID
   * @param {string} data.nota - Nota number from HO
   * @param {number} data.id_persetujuan_rph - Approval ID
   * @param {string} data.catatan - Notes/remarks
   * @returns {Promise} API response
   */
  static async create(data) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.RPH?.PO?.STORE || `${this.API_BASE}/store`, data);

      return {
        success: true,
        data: response.data,
        message: response.message || 'PO RPH berhasil dibuat'
      };
    } catch (error) {
      console.error('Error creating PO RPH:', error);
      return {
        success: false,
        message: error.message || 'Gagal membuat PO RPH'
      };
    }
  }

  /**
   * Update existing PO RPH
   * @param {Object} data - PO data to update
   * @param {string} data.pid - Encrypted PID
   * @param {number} data.id_office - Office ID
   * @param {string} data.nota - Nota number from HO
   * @param {number} data.id_persetujuan_rph - Approval ID
   * @param {string} data.catatan - Notes/remarks
   * @returns {Promise} API response
   */
  static async update(data) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.RPH?.PO?.UPDATE || `${this.API_BASE}/update`, data);

      return {
        success: true,
        data: response.data,
        message: response.message || 'PO RPH berhasil diperbarui'
      };
    } catch (error) {
      console.error('Error updating PO RPH:', error);
      return {
        success: false,
        message: error.message || 'Gagal memperbarui PO RPH'
      };
    }
  }

  /**
   * Delete PO RPH
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.RPH?.PO?.DELETE || `${this.API_BASE}/hapus`, {
        pid: pid
      });

      return {
        success: true,
        message: response.message || 'PO RPH berhasil dihapus'
      };
    } catch (error) {
      console.error('Error deleting PO RPH:', error);
      return {
        success: false,
        message: error.message || 'Gagal menghapus PO RPH'
      };
    }
  }

  /**
   * Transform backend data to frontend format
   * @param {Object} item - Backend data item
   * @returns {Object} Transformed data
   */
  static transformData(item) {
    return {
      // Core fields
      pubid: item.pubid,
      pid: item.pid, // Encrypted PID for API calls
      encryptedPid: item.pid, // Alias for compatibility
      no_po: item.no_po || '',
      nota: item.nota || '',
      nota_sistem: item.no_po || '', // Map no_po to nota_sistem for compatibility
      
      // Dates
      tgl_pesanan: item.tgl_pesanan || item.created_at,
      tgl_masuk: item.created_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      
      // Quantities and amounts
      jumlah: parseInt(item.jumlah) || 0,
      harga: parseFloat(item.harga) || 0,
      biaya_total: parseFloat(item.harga) || 0,
      
      // Status and approval
      status: item.status, // 1: pending, 2: approved, 3: rejected
      persetujuan: item.status || item.persetujuan, // Map status to persetujuan for compatibility
      reason: item.reason || '',
      id_persetujuan_rph: item.id_persetujuan_rph,
      
      // Additional fields for compatibility with existing components
      nama_supplier: 'RPH',
      nama_office: 'Rumah Potong Hewan',
      nama_supir: '-',
      plat_nomor: '-',
      biaya_lain: 0,
      biaya_truk: 0,
      berat_total: 0,
      jenis_pembelian: '4', // Type 4 for RPH
      jenis_pembelian_id: 4,
      note: item.note || '',
      
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
          textClass: 'text-yellow-700',
          borderClass: 'border-yellow-200'
        };
      case 2:
        return {
          label: 'Disetujui',
          color: 'green',
          bgClass: 'bg-green-50',
          textClass: 'text-green-700',
          borderClass: 'border-green-200'
        };
      case 3:
        return {
          label: 'Ditolak',
          color: 'red',
          bgClass: 'bg-red-50',
          textClass: 'text-red-700',
          borderClass: 'border-red-200'
        };
      default:
        return {
          label: 'Draft',
          color: 'gray',
          bgClass: 'bg-gray-50',
          textClass: 'text-gray-700',
          borderClass: 'border-gray-200'
        };
    }
  }

  /**
   * Batch operations
   */
  
  /**
   * Get multiple PO details at once
   * @param {Array<string>} pids - Array of encrypted PIDs
   * @returns {Promise} API response with multiple PO details
   */
  static async getMultipleDetails(pids) {
    try {
      const promises = pids.map(pid => this.getDetail(pid));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        pid: pids[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('Error fetching multiple PO details:', error);
      throw error;
    }
  }

  /**
   * Export PO data to Excel
   * @param {Object} params - Export parameters
   * @returns {Promise} Blob containing Excel file
   */
  static async exportToExcel(params = {}) {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.RPH?.PO?.EXPORT || `${this.API_BASE}/export`, {
        params,
        responseType: 'blob'
      });
      
      return response;
    } catch (error) {
      console.error('Error exporting PO data:', error);
      throw error;
    }
  }
}

export default PoRphService;