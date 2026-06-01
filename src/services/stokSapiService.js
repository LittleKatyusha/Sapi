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
}

export default StokSapiService;
