import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class DashboardService {
  static getHo(params = {}) {
    return HttpClient.get(API_ENDPOINTS.DASHBOARD.HO, { params, cache: false });
  }

  static getRph(params = {}) {
    return HttpClient.get(API_ENDPOINTS.DASHBOARD.RPH, { params, cache: false });
  }

  static getWarehouse(params = {}) {
    return HttpClient.get(API_ENDPOINTS.DASHBOARD.WAREHOUSE, { params, cache: false });
  }

  static async getAll(params = {}) {
    const [ho, rph, warehouse] = await Promise.all([
      this.getHo(params),
      this.getRph(params),
      this.getWarehouse(params)
    ]);

    return { ho, rph, warehouse };
  }
}

export default DashboardService;
