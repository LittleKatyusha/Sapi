import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class EartagHoService {
  static async getData(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.HO.EARTAG.DATA, { params });
    return {
      success: true,
      data: response.data || [],
      message: response.message || 'ok',
      ...response,
    };
  }

  static async store(payload) {
    const response = await HttpClient.post(API_ENDPOINTS.HO.EARTAG.STORE, payload);
    return {
      success: true,
      data: response.data,
      message: response.message || 'Eartag berhasil dipasang',
    };
  }

  static async show(payload) {
    const response = await HttpClient.post(API_ENDPOINTS.HO.EARTAG.SHOW, payload);
    const data = Array.isArray(response.data) ? response.data[0] : response.data;
    return {
      success: true,
      data: data || null,
      message: response.message || 'ok',
    };
  }

  static async hapus(payload) {
    const response = await HttpClient.post(API_ENDPOINTS.HO.EARTAG.HAPUS, payload);
    return {
      success: true,
      data: response.data,
      message: response.message || 'Eartag berhasil dilepas',
    };
  }
}

export default EartagHoService;
