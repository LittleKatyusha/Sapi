import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const ENDPOINTS = API_ENDPOINTS.HO.PAYMENT;

// Purchase type mapping
export const PURCHASE_TYPES = [
  { value: 1, label: 'DOKA (Ternak)' },
  { value: 2, label: 'Feedmil' },
  { value: 3, label: 'OVK' },
  { value: 4, label: 'Kulit' },
  { value: 5, label: 'Lain-lain' },
];

// Payment status mapping
export const PAYMENT_STATUS = {
  0: { label: 'Belum Lunas', bgClass: 'bg-yellow-100', textClass: 'text-yellow-700' },
  1: { label: 'Lunas', bgClass: 'bg-green-100', textClass: 'text-green-700' },
  2: { label: 'Belum Bayar', bgClass: 'bg-red-100', textClass: 'text-red-700' },
};

const PaymentHoService = {
  /**
   * Fetch paginated payment list (DataTable format).
   * Requires purchase_type filter.
   */
  async getPayments({ page = 1, perPage = 10, search = '', startDate = null, endDate = null, purchaseType = 1 } = {}) {
    const params = {
      draw: page,
      start: (page - 1) * perPage,
      length: perPage,
      'search[value]': search || '',
      'order[0][column]': 0,
      'order[0][dir]': 'desc',
      purchase_type: purchaseType,
    };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const query = new URLSearchParams(params).toString();
    const res = await HttpClient.get(`${ENDPOINTS.DATA}?${query}`);
    return res.data ?? res;
  },

  /**
   * Fetch detail/cicilan list for a specific payment header.
   */
  async getPaymentDetails(idPembayaran) {
    const res = await HttpClient.get(`${ENDPOINTS.DETAILS}?id_pembayaran=${idPembayaran}`);
    return res.data ?? res;
  },

  /**
   * Store a new cicilan (payment detail). Supports file upload.
   */
  async storeDetail(data) {
    const fd = new FormData();
    fd.append('id_pembayaran', data.id_pembayaran);
    fd.append('amount', data.amount);
    fd.append('payment_date', data.payment_date);
    if (data.note) fd.append('note', data.note);
    if (data.file_upload) fd.append('file_upload', data.file_upload);

    const res = await HttpClient.post(ENDPOINTS.DETAIL_STORE, fd);
    return res.data ?? res;
  },

  /**
   * Delete a cicilan (payment detail) by id.
   */
  async deleteDetail(id) {
    const res = await HttpClient.post(ENDPOINTS.DETAIL_DELETE, { id });
    return res.data ?? res;
  },

  /**
   * Bulk update payment_status for multiple headers.
   */
  async bulkUpdateStatus({ payment_ids, payment_status, settlement_date = null }) {
    const payload = { payment_ids, payment_status };
    if (settlement_date) payload.settlement_date = settlement_date;
    const res = await HttpClient.post(ENDPOINTS.BULK_UPDATE_STATUS, payload);
    return res.data ?? res;
  },

  /** Format currency (IDR) */
  formatCurrency(val) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(val || 0);
  },
};

export default PaymentHoService;
