/**
 * Opname Stok Service
 * Service layer untuk opname stok (feedmil & OVK)
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class OpnameStokService {
  /**
   * Get daftar opname feedmil
   */
  static async getFeedmilData(params = {}, options = {}) {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.HO.OPNAME_FEEDMIL.DATA, { params, ...options });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buat opname feedmil baru
   */
  static async storeFeedmil(data, options = {}) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.OPNAME_FEEDMIL.STORE, data, options);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hapus opname feedmil
   */
  static async deleteFeedmil(data, options = {}) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.OPNAME_FEEDMIL.DELETE, data, options);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get daftar opname OVK
   */
  static async getOvkData(params = {}, options = {}) {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.HO.OPNAME_OVK.DATA, { params, ...options });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buat opname OVK baru
   */
  static async storeOvk(data, options = {}) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.OPNAME_OVK.STORE, data, options);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hapus opname OVK
   */
  static async deleteOvk(data, options = {}) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.OPNAME_OVK.DELETE, data, options);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default OpnameStokService;
