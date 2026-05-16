/**
 * Stok OVK HO Service
 * Service layer for HO Stok OVK operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class StokOvkHoService {
  /**
   * Get semua data stok OVK HO
   */
  static async getData() {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.HO.STOK_OVK.DATA);
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
