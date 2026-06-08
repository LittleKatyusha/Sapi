/**
 * Stok Sapi Service
 * Service layer for Stok Sapi RPH (Pemeliharaan Sapi RPH)
 */

import HttpClient from './httpClient';

class StokSapiService {
  static API_PREFIX = '/api/rph/pemeliharaansapi';

  static async getStokByJenis(startDate, endDate) {
    try {
      const response = await HttpClient.get(`${this.API_PREFIX}/stoksapibyjenis`, {
        params: { start_date: startDate, end_date: endDate },
        cache: false,
      });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getStokByJenis error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch data',
      };
    }
  }

  static async getStokDetail(startDate, endDate) {
    try {
      const response = await HttpClient.get(`${this.API_PREFIX}/stoksapi`, {
        params: { start_date: startDate, end_date: endDate },
        cache: false,
      });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getStokDetail error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch data',
      };
    }
  }

  static async show(pid) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/stoksapi/show`, { pid });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.show error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch data',
      };
    }
  }

  static async potongPaksa(data) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/stoksapi/potong-paksa`, data);
      return { success: true, data: response.data, message: response.message || 'Data created successfully' };
    } catch (error) {
      console.error('StokSapiService.potongPaksa error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to create potong paksa',
      };
    }
  }

  static async getSapiMati(pid) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/sapimati`, { pid });
      return { success: true, data: response.data, message: response.message || 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getSapiMati error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch sapi mati data',
      };
    }
  }
}

export default StokSapiService;
