import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const get = async (url, params = {}) => {
  const response = await HttpClient.get(url, { params });
  const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
  return {
    success: true,
    data,
    raw: response,
    message: response?.message || 'ok',
  };
};

export const HO_REPORTS = [
  { key: 'nota-feedmil', title: 'Nota Feedmil', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.NOTA_FEEDMIL, needsId: true },
  { key: 'nota-ovk', title: 'Nota OVK', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.NOTA_OVK, needsId: true },
  { key: 'pengajuan-waiting', title: 'HO Submit Waiting', group: 'Pengajuan', endpoint: API_ENDPOINTS.REPORT.PENGAJUAN.HO_SUBMIT_WAITING },
  { key: 'pengajuan-approved', title: 'HO Submit Approved', group: 'Pengajuan', endpoint: API_ENDPOINTS.REPORT.PENGAJUAN.HO_SUBMIT_APPROVED },
  { key: 'delivery', title: 'HO Delivery', group: 'Penjualan', endpoint: API_ENDPOINTS.REPORT.PENJUALAN.HO_DELIVERY, needsId: true, needsPetugas: true },
  { key: 'handover', title: 'HO Handover', group: 'Penjualan', endpoint: API_ENDPOINTS.REPORT.PENJUALAN.HO_HANDOVER, needsId: true, needsPetugas: true },
  { key: 'receipt', title: 'HO Receipt', group: 'Penjualan', endpoint: API_ENDPOINTS.REPORT.PENJUALAN.HO_RECEIPT, needsId: true, needsPetugas: true },
  { key: 'spend-submit', title: 'HO Spend Submit', group: 'Pengeluaran', endpoint: API_ENDPOINTS.REPORT.PENGELUARAN.SUBMIT },
  { key: 'spend-buy', title: 'HO Spend Buy', group: 'Pengeluaran', endpoint: API_ENDPOINTS.REPORT.PENGELUARAN.BUY },
  { key: 'spend-cash', title: 'HO Spend Cash', group: 'Pengeluaran', endpoint: API_ENDPOINTS.REPORT.PENGELUARAN.CASH },
  { key: 'other-ho', title: 'Other HO', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO },
  { key: 'other-ho-daily-assistance', title: 'Other HO Daily Assistance', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_DAILY_ASSISTANCE },
  { key: 'other-ho-monthly-assistance', title: 'Other HO Monthly Assistance', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_MONTHLY_ASSISTANCE },
  { key: 'other-ho-load-other-daily', title: 'Other HO Load Other Daily', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_LOAD_OTHER_DAILY },
  { key: 'other-ho-load-other-monthly', title: 'Other HO Load Other Monthly', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_LOAD_OTHER_MONTHLY },
  { key: 'other-ho-receipt', title: 'Other HO Receipt', group: 'Pembelian', endpoint: API_ENDPOINTS.REPORT.PEMBELIAN.OTHER_HO_RECEIPT },
];

class ReportHoService {
  static getReport(report, params = {}) { return get(report.endpoint, params); }
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
