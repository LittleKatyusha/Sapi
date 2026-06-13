import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class ProdukGdsService {
  static async getData() {
    const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.BARANG}/data`);
    return {
      success: true,
      data: response.data || [],
      message: response.message || 'ok',
      ...response,
    };
  }

  static async store(data) {
    const response = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/store`, data);
    return {
      success: true,
      data: response.data,
      message: response.message || 'Data berhasil disimpan',
    };
  }

  static async update(pubid, data) {
    const response = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/update`, { ...data, pubid });
    return {
      success: true,
      data: response.data,
      message: response.message || 'Data berhasil diperbarui',
    };
  }

  static async delete(pubid) {
    const response = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/hapus`, { pubid });
    return {
      success: true,
      data: response.data,
      message: response.message || 'Data berhasil dihapus',
    };
  }
}

export default ProdukGdsService;
