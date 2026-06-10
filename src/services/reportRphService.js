import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const get = (url, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return HttpClient.get(qs ? `${url}?${qs}` : url);
};

class ReportRphService {
  static getPenjualanBoning(params) { return get(API_ENDPOINTS.REPORT.RPH.PENJUALAN_BONING, params); }
  static getPenjualanKarkas(params) { return get(API_ENDPOINTS.REPORT.RPH.PENJUALAN_KARKAS, params); }
  static getPenjualanQurban(params) { return get(API_ENDPOINTS.REPORT.RPH.PENJUALAN_QURBAN, params); }
  static getPiutangPedagang(params) { return get(API_ENDPOINTS.REPORT.RPH.PIUTANG_PEDAGANG, params); }
  static getSaldoPedagang(params) { return get(API_ENDPOINTS.REPORT.RPH.SALDO_PEDAGANG, params); }
  static getStokTernak(params) { return get(API_ENDPOINTS.REPORT.RPH.STOK_TERNAK, params); }
  static getStokFeedmil(params) { return get(API_ENDPOINTS.REPORT.RPH.STOK_FEEDMIL, params); }
  static getStokOvk(params) { return get(API_ENDPOINTS.REPORT.RPH.STOK_OVK, params); }
}

export default ReportRphService;
