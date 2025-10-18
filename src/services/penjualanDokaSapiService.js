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
   * @returns {Promise} API response
   */
  static async approve(pid, id_persetujuan_ho) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/approve`, {
        pid: pid,
        id_persetujuan_ho: id_persetujuan_ho
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil disetujui'
      };
    } catch (error) {
      console.error('Error approving Penjualan Doka Sapi:', error);
      throw error;
    }
  }

  /**
   * Reject a Penjualan Doka Sapi
   * @param {string} pid - Encrypted PID
   * @param {number} id_persetujuan_ho - ID of approval person
   * @param {string} catatan - Rejection reason/notes
   * @returns {Promise} API response
   */
  static async reject(pid, id_persetujuan_ho, catatan) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/reject`, {
        pid: pid,
        id_persetujuan_ho: id_persetujuan_ho,
        catatan: catatan
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil ditolak'
      };
    } catch (error) {
      console.error('Error rejecting Penjualan Doka Sapi:', error);
      throw error;
    }
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
      nota: item.no_po || '', // Map no_po to nota for compatibility
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
      nama_supir: '-',
      plat_nomor: '-',
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