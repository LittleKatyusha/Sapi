import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const normalize = (response, fallbackMessage) => ({
  success: true,
  data: Array.isArray(response?.data) ? response.data : [],
  message: response?.message || fallbackMessage,
  raw: response,
});

class PaymentRphService {
  static async getData(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.RPH.PAYMENT.DATA, { params });
    return normalize(response, 'Data Payment RPH berhasil dimuat');
  }

  static async store(data) {
    const response = await HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.STORE, data);
    return { success: true, data: response?.data, message: response?.message || 'Payment RPH berhasil disimpan', raw: response };
  }

  static async update(data) {
    const response = await HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.UPDATE, data);
    return { success: true, data: response?.data, message: response?.message || 'Payment RPH berhasil diperbarui', raw: response };
  }

  static async show(pubid) {
    const response = await HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.SHOW, { pubid });
    return { success: true, data: response?.data || null, message: response?.message || 'Detail payment dimuat', raw: response };
  }

  static async delete(pubid) {
    const response = await HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.DELETE, { pubid });
    return { success: true, data: response?.data, message: response?.message || 'Payment RPH berhasil dihapus', raw: response };
  }
}

export default PaymentRphService;
