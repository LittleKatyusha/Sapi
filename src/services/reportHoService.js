import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const get = (url, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return HttpClient.get(qs ? `${url}?${qs}` : url);
};

class ReportHoService {
  static getNotaFeedmil(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.NOTA_FEEDMIL, params); }
  static getNotaOvk(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.NOTA_OVK, params); }
  static getOtherHo(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO, params); }
  static getOtherHoDailyAssistance(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_DAILY_ASSISTANCE, params); }
  static getOtherHoMonthlyAssistance(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_MONTHLY_ASSISTANCE, params); }
  static getOtherHoLoadOtherDaily(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_LOAD_OTHER_DAILY, params); }
  static getOtherHoLoadOtherMonthly(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_LOAD_OTHER_MONTHLY, params); }
  static getOtherHoReceipt(params = {}) { return get(API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_RECEIPT, params); }
  static getHoSubmitWaiting(params = {}) { return get(API_ENDPOINTS.REPORT.PENGAJUAN.HO_SUBMIT_WAITING, params); }
  static getHoSubmitApproved(params = {}) { return get(API_ENDPOINTS.REPORT.PENGAJUAN.HO_SUBMIT_APPROVED, params); }
  static getHoDelivery(params = {}) { return get(API_ENDPOINTS.REPORT.PENJUALAN.HO_DELIVERY, params); }
  static getHoHandover(params = {}) { return get(API_ENDPOINTS.REPORT.PENJUALAN.HO_HANDOVER, params); }
  static getHoReceipt(params = {}) { return get(API_ENDPOINTS.REPORT.PENJUALAN.HO_RECEIPT, params); }
  static getHoSpendSubmit(params = {}) { return get(API_ENDPOINTS.REPORT.PENGELUARAN.SUBMIT, params); }
  static getHoSpendBuy(params = {}) { return get(API_ENDPOINTS.REPORT.PENGELUARAN.BUY, params); }
  static getHoSpendCash(params = {}) { return get(API_ENDPOINTS.REPORT.PENGELUARAN.CASH, params); }
}

export default ReportHoService;
