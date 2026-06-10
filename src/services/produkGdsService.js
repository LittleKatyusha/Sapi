import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class ProdukGdsService {
  static async getData() {
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.BARANG}/data`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async store(data) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/store`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async update(pubid, data) {
    try {
      // Sesuai konvensi form data biasanya passing pubid ke body
      data.pubid = pubid;
      const response = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/update`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async delete(pubid) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.MASTER.BARANG}/hapus`, { pubid });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default ProdukGdsService;
