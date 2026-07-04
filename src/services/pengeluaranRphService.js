import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const normalize = (response, defaultMsg = 'Data berhasil dimuat') => {
  const payload = response?.data?.data ?? response?.data ?? response;
  const rows = Array.isArray(payload) ? payload : (payload?.data ?? []);
  const recordsTotal = payload?.recordsTotal ?? rows.length;
  const recordsFiltered = payload?.recordsFiltered ?? rows.length;
  return {
    data: rows,
    recordsTotal,
    recordsFiltered,
    message: response?.data?.message || response?.message || defaultMsg,
    raw: response,
  };
};

class PengeluaranRphService {
  static async getList(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.RPH.PAYMENT.PENGELUARAN, { params });
    return normalize(response, 'Data pengeluaran berhasil dimuat');
  }

  static async getDetail(pid) {
    const response = await HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.PENGELUARAN_DETAIL, { pid });
    return { success: true, data: response?.data || null, message: response?.message || 'Detail pengeluaran dimuat', raw: response };
  }

  static async bayar(data) {
    const response = await HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.PENGELUARAN_BAYAR, data);
    return { success: true, data: response?.data, message: response?.message || 'Pembayaran berhasil dicatat', raw: response };
  }

  static async getHistory(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.RPH.PAYMENT.PENGELUARAN_HISTORY, { params });
    return normalize(response, 'Riwayat pengeluaran berhasil dimuat');
  }
}

export default PengeluaranRphService;
