import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const normalize = (response, fallbackMessage) => ({
  success: true,
  data: Array.isArray(response?.data) ? response.data : response.data || [],
  message: response?.message || fallbackMessage,
  raw: response,
});

class HutangPiutangRphService {
  static async getHutang(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.RPH.HUTANG_PIUTANG.HUTANG, { params });
    return normalize(response, 'Data Hutang RPH berhasil dimuat');
  }

  static async getPiutang(params = {}) {
    const response = await HttpClient.get(API_ENDPOINTS.RPH.HUTANG_PIUTANG.PIUTANG, { params });
    return normalize(response, 'Data Piutang RPH berhasil dimuat');
  }

  static async getHutangDetail(pid) {
    const response = await HttpClient.post(`${API_ENDPOINTS.RPH.HUTANG_PIUTANG.HUTANG}/show`, { pid });
    return {
        success: true,
        data: response.data,
        message: response.message || 'Detail Hutang RPH berhasil dimuat'
    };
  }

  static async payHutang(payload) {
    const response = await HttpClient.post(`${API_ENDPOINTS.RPH.HUTANG_PIUTANG.HUTANG}/pay`, payload);
    return {
        success: true,
        data: response.data,
        message: response.message || 'Pembayaran hutang berhasil dicatat'
    };
  }
}

export default HutangPiutangRphService;
