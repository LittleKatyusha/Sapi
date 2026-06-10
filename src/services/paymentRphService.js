import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class PaymentRphService {
  static getData(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return HttpClient.get(qs ? `${API_ENDPOINTS.RPH.PAYMENT.DATA}?${qs}` : API_ENDPOINTS.RPH.PAYMENT.DATA);
  }

  static store(data) {
    return HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.STORE, data);
  }

  static show(id) {
    return HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.SHOW, { id });
  }

  static delete(id) {
    return HttpClient.post(API_ENDPOINTS.RPH.PAYMENT.DELETE, { id });
  }
}

export default PaymentRphService;
