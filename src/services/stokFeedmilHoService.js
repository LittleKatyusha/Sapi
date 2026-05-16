/**
 * Stok Feedmil HO Service
 * Service layer for HO Stok Feedmil operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class StokFeedmilHoService {
  /**
   * Get semua data stok feedmil HO
   */
  static async getData() {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.HO.STOK_FEEDMIL.DATA);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get summary stok feedmil HO
   */
  static async getSummary() {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.HO.STOK_FEEDMIL.SUMMARY);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default StokFeedmilHoService;
