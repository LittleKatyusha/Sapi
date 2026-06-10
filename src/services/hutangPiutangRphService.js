import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class HutangPiutangRphService {
  static getHutang(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return HttpClient.get(qs ? `${API_ENDPOINTS.RPH.HUTANG_PIUTANG.HUTANG}?${qs}` : API_ENDPOINTS.RPH.HUTANG_PIUTANG.HUTANG);
  }

  static getPiutang(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return HttpClient.get(qs ? `${API_ENDPOINTS.RPH.HUTANG_PIUTANG.PIUTANG}?${qs}` : API_ENDPOINTS.RPH.HUTANG_PIUTANG.PIUTANG);
  }
}

export default HutangPiutangRphService;
