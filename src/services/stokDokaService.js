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

  /**
   * Daftar klasifikasi hewan (kambing/domba) untuk dropdown form anakan.
   * Endpoint: GET /api/rph/stokdoka/klasifikasi-options
   */
  static async getKlasifikasiOptions() {
    try {
      const response = await HttpClient.get(`${this.API_PREFIX}/klasifikasi-options`, { cache: false });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokDokaService.getKlasifikasiOptions error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch klasifikasi options',
      };
    }
  }

  /**
   * Daftar DOKA untuk pilihan induk (parent picker) - server-side datatable.
   * Endpoint: GET /api/rph/stokdoka/parent-options
   */
  static async parentOptions(jenisKelamin, params = {}) {
    try {
      const query = {
        jenis_kelamin: jenisKelamin,
        q: params.q ?? '',
        jenis_klasifikasi: params.jenisKlasifikasi ?? '',
        start: params.start ?? 0,
        length: params.length ?? 10,
        draw: params.draw ?? 1,
      };
      const response = await HttpClient.get(`${this.API_PREFIX}/parent-options`, { params: query, cache: false });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokDokaService.parentOptions error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch parent options',
      };
    }
  }

  /**
   * Simpan DOKA baru dari anakan/kelahiran.
   * Endpoint: POST /api/rph/stokdoka/store-anakan
   */
  static async storeAnakan(payload) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/store-anakan`, payload);
      HttpClient.clearCache('stokdoka');
      return {
        success: true,
        data: response.data,
        message: response.message || 'Anakan DOKA berhasil ditambahkan',
      };
    } catch (error) {
      console.error('StokDokaService.storeAnakan error:', error);
      let message = 'Gagal menambahkan anakan DOKA';
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
}

export default StokDokaService;
