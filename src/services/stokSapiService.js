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
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/store', data);
      HttpClient.clearCache('potongpaksa');
      return { success: true, data: response.data, message: response.message || 'Data created successfully' };
    } catch (error) {
      console.error('StokSapiService.potongPaksa error:', error);
      console.error('Error data:', error?.data);
      let errorMessage = 'Failed to create potong paksa';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
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

  static async sapiMati(data) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/sapimati/store', data);
      HttpClient.clearCache('sapimati');
      return { success: true, data: response.data, message: response.data?.message || response.message || 'Data created successfully' };
    } catch (error) {
      console.error('StokSapiService.sapiMati error:', error);
      let errorMessage = 'Failed to create sapi mati';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
      };
    }
  }

  static async getPotongPaksaData(params = {}) {
    try {
      const response = await HttpClient.get('/api/rph/persediaan/potongpaksa/data', { params: { ...params, _t: Date.now() }, cache: false });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getPotongPaksaData error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch potong paksa data',
      };
    }
  }

  static async showPotongPaksa(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/show', { pid });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.showPotongPaksa error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch potong paksa data',
      };
    }
  }

  static async updatePotongPaksa(data) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/update', data);
      HttpClient.clearCache('potongpaksa');
      return { success: true, data: response.data, message: response.message || 'Data updated successfully' };
    } catch (error) {
      console.error('StokSapiService.updatePotongPaksa error:', error);
      let errorMessage = 'Failed to update potong paksa';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
      };
    }
  }

  static async deletePotongPaksa(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/hapus', { pid });
      HttpClient.clearCache('potongpaksa');
      return { success: true, data: response.data, message: response.message || 'Data deleted successfully' };
    } catch (error) {
      console.error('StokSapiService.deletePotongPaksa error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to delete potong paksa',
      };
    }
  }

  static async deleteSapiMati(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/sapimati/hapus', { pid });
      HttpClient.clearCache('sapimati');
      return { success: true, data: response.data, message: response.message || 'Data deleted successfully' };
    } catch (error) {
      console.error('StokSapiService.deleteSapiMati error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to delete sapi mati',
      };
    }
  }

  static async getSapiMatiData(params = {}) {
    try {
      const response = await HttpClient.get('/api/rph/persediaan/sapimati/data', { params: { ...params, _t: Date.now() }, cache: false });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getSapiMatiData error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch sapi mati data',
      };
    }
  }
}

export default StokSapiService;

