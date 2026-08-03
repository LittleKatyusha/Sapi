/**
 * Stok DOKA Service
 * Service layer for Stok DOKA (Kambing/Domba) RPH
 */

import HttpClient from './httpClient';

class StokDokaService {
  static API_PREFIX = '/api/rph/stokdoka';

  static async getData({
    startDate = null,
    endDate = null,
    start = 0,
    length = 10,
    search = '',
    draw = 1,
  } = {}) {
    try {
      const response = await HttpClient.get(`${this.API_PREFIX}/data`, {
        params: {
          start_date: startDate || null,
          end_date: endDate || null,
          start,
          length,
          search: search || null,
          draw,
          _t: Date.now(),
        },
        cache: false,
      });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokDokaService.getData error:', error);
      let message = 'Failed to fetch data';
      if (error?.data?.data && typeof error.data.data === 'object') {
        const validationMessages = Object.values(error.data.data).flat();
        message = validationMessages.join(', ');
      } else if (error?.data?.message) {
        message = error.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      return { success: false, data: null, message };
    }
  }

  static async show(pid) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/show`, { pid });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokDokaService.show error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch detail',
      };
    }
  }
}

export default StokDokaService;
