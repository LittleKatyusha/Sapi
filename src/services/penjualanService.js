/**
 * Penjualan Service
 * Service layer for handling Penjualan Bahan Baku Pangan & OVK API operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

class PenjualanService {
  /**
   * Get list of Penjualan with pagination, search, and filtering
   * @param {string} type - 'bahan-baku' or 'ovk'
   * @param {Object} params - Query parameters
   * @param {number} params.start - Starting index for pagination
   * @param {number} params.length - Number of records per page
   * @param {string} params.search - Search term
   * @returns {Promise} API response with data
   */
  static async getData(idJenisPenjualan = 1, params = {}) {
    try {
      const queryParams = {
        start: params.start || 0,
        length: params.length || 10,
        draw: params.draw || 1,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || '0',
        'order[0][dir]': params.orderDir || 'desc',
        id_jenis_penjualan: idJenisPenjualan,
        _: Date.now()
      };

      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENJUALAN}/data`, {
        params: queryParams,
        cache: false
      });

      return {
        draw: response.draw,
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        data: response.data || [],
        success: true
      };
    } catch (error) {
      console.error(`Error fetching Penjualan (jenis=${idJenisPenjualan}) data:`, error);
      throw error;
    }
  }

  /**
   * Get summary/card data for penjualan dashboard
   * @param {string} type - 'bahan-baku' or 'ovk'
   * @returns {Promise} API response with summary data
   */
  static async getSummary(idJenisPenjualan = 1) {
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENJUALAN}/summary`, {
        params: { id_jenis_penjualan: idJenisPenjualan, _: Date.now() },
        cache: false
      });

      return {
        success: true,
        data: response.data || response || {}
      };
    } catch (error) {
      console.error(`Error fetching Penjualan (jenis=${idJenisPenjualan}) summary:`, error);
      throw error;
    }
  }

  /**
   * Get card data for penjualan dashboard
   * @returns {Promise} API response with card data
   */
  static async getCardData() {
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENJUALAN}/getCardData`, {
        params: { _: Date.now() },
        cache: false
      });

      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('Error fetching Penjualan card data:', error);
      throw error;
    }
  }

  /**
   * Delete a Penjualan record by pid
   * @param {string} pid - The public ID (pubid) of the penjualan to delete
   * @returns {Promise} API response
   */
  static async deletePenjualan(pid) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN}/hapus`, { pid });
      return response;
    } catch (error) {
      console.error(`Error deleting Penjualan (pid=${pid}):`, error);
      throw error;
    }
  }

  /**
   * Generic PDF report download for penjualan
   * @param {string} endpoint - Full API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Blob>} PDF blob
   */
  static async downloadPdfReport(endpoint, params) {
    try {
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlParams.append(key, value);
        }
      });

      const queryString = urlParams.toString();
      const fullUrl = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;

      let token = localStorage.getItem('token');
      if (!token) {
        token = localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
      }
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      // Parse token if stored as JSON
      try { token = JSON.parse(token); } catch (_) { /* use as-is */ }

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch (_) { /* use default message */ }
        throw new Error(errorMessage);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading penjualan PDF report:', error);
      throw error;
    }
  }

  /**
   * Download Surat Jalan PDF
   * @param {string} id - Encrypted PID of the penjualan
   * @param {string} petugas - Officer name
   * @returns {Promise<Blob>} PDF blob
   */
  static async downloadSuratJalan(id, petugas) {
    return this.downloadPdfReport(API_ENDPOINTS.REPORT.PENJUALAN.HO_DELIVERY, { id, petugas });
  }

  /**
   * Download Surat Serah Terima Barang PDF
   * @param {string} id - Encrypted PID of the penjualan
   * @param {string} petugas - Officer name
   * @returns {Promise<Blob>} PDF blob
   */
  static async downloadSerahTerimaBarang(id, petugas) {
    return this.downloadPdfReport(API_ENDPOINTS.REPORT.PENJUALAN.HO_HANDOVER, { id, petugas });
  }

  /**
   * Download Kwitansi PDF
   * @param {string} id - Encrypted PID of the penjualan
   * @param {string} petugas - Officer name
   * @returns {Promise<Blob>} PDF blob
   */
  static async downloadKwitansi(id, petugas) {
    return this.downloadPdfReport(API_ENDPOINTS.REPORT.PENJUALAN.HO_RECEIPT, { id, petugas });
  }
}

export default PenjualanService;