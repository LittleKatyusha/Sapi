import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const normalize = (response, fallbackMessage) => ({
  success: true,
  data: Array.isArray(response?.data) ? response.data : [],
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
}

export default HutangPiutangRphService;
