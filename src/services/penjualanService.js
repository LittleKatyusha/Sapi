/**
 * Penjualan Service
 * Service layer for handling Penjualan Bahan Baku Pangan & OVK API operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

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
}

export default PenjualanService;