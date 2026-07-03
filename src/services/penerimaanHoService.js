import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const normalize = (response, defaultMsg = 'Data berhasil dimuat') => {
  if (response?.data?.data) {
    return {
      data: response.data.data,
      recordsTotal: response.data.recordsTotal ?? response.data.data.length,
      recordsFiltered: response.data.recordsFiltered ?? response.data.data.length,
      message: response.data.message || defaultMsg,
      raw: response,
    };
  }
  if (Array.isArray(response?.data)) {
    return { data: response.data, recordsTotal: response.data.length, recordsFiltered: response.data.length, message: response.message || defaultMsg, raw: response };
  }
  return { data: response?.data ?? null, recordsTotal: 0, recordsFiltered: 0, message: response?.message || defaultMsg, raw: response };
};

class PenerimaanHoService {
  static async getList(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.HO.PAYMENT.PENERIMAAN, { params });
    return normalize(response, 'Data penerimaan berhasil dimuat');
  }

  static async getDetail(pid) {
    const response = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.PENERIMAAN_DETAIL, { pid });
    return { success: true, data: response?.data || null, message: response?.message || 'Detail penerimaan dimuat', raw: response };
  }

  static async bayar(data) {
    const response = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.PENERIMAAN_BAYAR, data);
    return { success: true, data: response?.data, message: response?.message || 'Penerimaan berhasil dicatat', raw: response };
  }

  static async getHistory(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.HO.PAYMENT.PENERIMAAN_HISTORY, { params });
    return normalize(response, 'Riwayat penerimaan berhasil dimuat');
  }
}

export default PenerimaanHoService;
