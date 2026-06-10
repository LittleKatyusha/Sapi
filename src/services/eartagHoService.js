import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EARTAG_HO_BASE = '/api/ho/eartag';

class EartagHoService {
  static getData(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return HttpClient.get(qs ? `${EARTAG_HO_BASE}/data?${qs}` : `${EARTAG_HO_BASE}/data`);
  }

  static store(data) {
    return HttpClient.post(`${EARTAG_HO_BASE}/store`, data);
  }

  static show(pubid) {
    return HttpClient.post(`${EARTAG_HO_BASE}/show`, { pubid });
  }

  static delete(pubid) {
    return HttpClient.post(`${EARTAG_HO_BASE}/hapus`, { pubid });
  }
}

export default EartagHoService;
