import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const RESOURCES = {
  pengirim: API_ENDPOINTS.MASTER.PENGIRIM,
  sim: API_ENDPOINTS.MASTER.SIM,
  pengirimsim: API_ENDPOINTS.MASTER.PENGIRIM_SIM,
};

const buildParams = (params = {}) => ({
  draw: params.draw || 1,
  start: params.start || 0,
  length: params.length || 10,
  'search[value]': params.search || '',
  'search[regex]': false,
  'order[0][column]': params.order?.[0]?.column ?? 0,
  'order[0][dir]': params.order?.[0]?.dir ?? 'asc',
});

class SopirService {
  static getEndpoint(resource) {
    return RESOURCES[resource];
  }

  static async getData(resource, params = {}) {
    const endpoint = this.getEndpoint(resource);
    if (!endpoint) return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: 'Invalid resource' };

    try {
      const response = await HttpClient.get(`${endpoint}/data`, {
        params: buildParams(params),
      });

      return {
        success: true,
        data: response.data || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw || 1,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        draw: 1,
        message: error?.data?.message || error?.message || 'Gagal memuat data',
      };
    }
  }

  static async getAll(resource) {
    return this.getData(resource, { draw: 1, start: 0, length: 1000, search: '' });
  }

  static async show(resource, pid) {
    const endpoint = this.getEndpoint(resource);
    if (!endpoint) return { success: false, data: null, message: 'Invalid resource' };

    try {
      const response = await HttpClient.post(`${endpoint}/show`, { pid });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, data: null, message: error?.data?.message || error?.message || 'Gagal memuat detail' };
    }
  }

  static async store(resource, payload) {
    const endpoint = this.getEndpoint(resource);
    if (!endpoint) return { success: false, message: 'Invalid resource' };

    try {
      const response = await HttpClient.post(`${endpoint}/store`, payload);
      HttpClient.clearCache(endpoint);
      return { success: true, data: response.data, message: response.message || 'Data berhasil disimpan' };
    } catch (error) {
      return { success: false, message: error?.data?.message || error?.message || 'Gagal menyimpan data' };
    }
  }

  static async update(resource, payload) {
    const endpoint = this.getEndpoint(resource);
    if (!endpoint) return { success: false, message: 'Invalid resource' };

    try {
      const response = await HttpClient.post(`${endpoint}/update`, payload);
      HttpClient.clearCache(endpoint);
      return { success: true, data: response.data, message: response.message || 'Data berhasil diperbarui' };
    } catch (error) {
      return { success: false, message: error?.data?.message || error?.message || 'Gagal memperbarui data' };
    }
  }

  static async delete(resource, pid) {
    const endpoint = this.getEndpoint(resource);
    if (!endpoint) return { success: false, message: 'Invalid resource' };

    try {
      const response = await HttpClient.post(`${endpoint}/hapus`, { pid });
      HttpClient.clearCache(endpoint);
      return { success: true, message: response.message || 'Data berhasil dihapus' };
    } catch (error) {
      return { success: false, message: error?.data?.message || error?.message || 'Gagal menghapus data' };
    }
  }
}

export default SopirService;
