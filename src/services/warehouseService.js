import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const get = (url, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return HttpClient.get(qs ? `${url}?${qs}` : url);
};

class WarehouseService {
  static getStokFeedmil(params) { return get(API_ENDPOINTS.WAREHOUSE.STOK.FEEDMIL, params); }
  static getStokOvk(params) { return get(API_ENDPOINTS.WAREHOUSE.STOK.OVK, params); }

  static getPenerimaanFeedmil(params) { return get(API_ENDPOINTS.WAREHOUSE.PENERIMAAN.FEEDMIL.DATA, params); }
  static getPenerimaanOvk(params) { return get(API_ENDPOINTS.WAREHOUSE.PENERIMAAN.OVK.DATA, params); }
  
  static getDistribusiFeedmil(params) { return get(API_ENDPOINTS.WAREHOUSE.DISTRIBUSI.FEEDMIL.DATA, params); }
  static getDistribusiOvk(params) { return get(API_ENDPOINTS.WAREHOUSE.DISTRIBUSI.OVK.DATA, params); }
}

export default WarehouseService;
