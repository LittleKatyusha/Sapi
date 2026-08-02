/**
 * Stok OVK HO Service
 * Service layer for HO Stok OVK operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class StokOvkHoService {
  /**
   * Get data stok OVK HO dengan server-side pagination & search
   */
  static async getData(params = {}) {
    try {
      const { search = '', page = 1, perPage = 15, lowStock = false } = params;
      const query = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
        low_stock: String(lowStock),
      }).toString();
      const response = await HttpClient.get(`${API_ENDPOINTS.HO.STOK_OVK.DATA}?${query}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get summary stok OVK HO
   */
  static async getSummary() {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.HO.STOK_OVK.SUMMARY);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default StokOvkHoService;
