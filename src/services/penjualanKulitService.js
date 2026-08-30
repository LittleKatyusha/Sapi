import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.PENJUALAN_KULIT;

const mapError = (err, fallback) => {
  if (err?.data?.data && typeof err.data.data === 'object') {
    return Object.values(err.data.data).flat().join(', ');
  }
  return err?.data?.message || err?.message || fallback;
};

const tableQuery = (params = {}) => {
  const query = new URLSearchParams({
    draw: params.draw || 1,
    start: params.start || 0,
    length: params.length || 10,
    'search[value]': params.search || '',
    'order[0][column]': params.orderColumn ?? 1,
    'order[0][dir]': params.orderDir || 'desc',
    _ts: Date.now(),
  });
  ['start_date', 'end_date', 'id_pedagang', 'status', 'tipe_pembayaran', 'pengiriman'].forEach((key) => {
    if (params[key]) query.append(key, params[key]);
  });
  return query;
};

const PenjualanKulitService = {
  async getData(params = {}) {
    try {
      const res = await HttpClient.get(`${EP.DATA}?${tableQuery(params).toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
      };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: mapError(err, 'Gagal memuat penjualan kulit') };
    }
  },

  async getPenerimaanHistory(params = {}) {
    try {
      const query = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 1000,
        search: params.search || '',
        _ts: Date.now(),
      });
      if (params.tanggal_awal) query.append('start_date', params.tanggal_awal);
      if (params.tanggal_akhir) query.append('end_date', params.tanggal_akhir);
      const res = await HttpClient.get(`${EP.PENERIMAAN_HISTORY}?${query.toString()}`);
      return { success: true, data: res.data || [], recordsTotal: res.recordsTotal || 0, recordsFiltered: res.recordsFiltered || 0 };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: mapError(err, 'Gagal memuat riwayat penerimaan kulit') };
    }
  },

  async getMasterData() {
    try {
      const res = await HttpClient.get(`${EP.MASTER_DATA}?_ts=${Date.now()}`);
      return { success: true, data: res.data || {} };
    } catch (err) {
      return { success: false, data: {}, message: mapError(err, 'Gagal memuat master data') };
    }
  },

  async show(pid) {
    try {
      const res = await HttpClient.post(EP.SHOW, { pid });
      return { success: true, data: res.data || null };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memuat detail penjualan kulit') };
    }
  },

  async store(payload) {
    try {
      const res = await HttpClient.post(EP.STORE, payload);
      return { success: true, data: res.data || null, message: res.message || 'Transaksi berhasil disimpan' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal menyimpan transaksi') };
    }
  },

  async update(payload) {
    try {
      const res = await HttpClient.post(EP.UPDATE, payload);
      return { success: true, data: res.data || null, message: res.message || 'Transaksi berhasil diperbarui' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memperbarui transaksi') };
    }
  },

  async posting(pid) {
    try {
      const res = await HttpClient.post(EP.POSTING, { pid });
      return { success: true, data: res.data || null, message: res.message || 'Transaksi berhasil diposting' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal posting transaksi') };
    }
  },

  async bayar(payload) {
    try {
      const res = await HttpClient.post(EP.BAYAR, payload);
      return { success: true, data: res.data || null, message: res.message || 'Pembayaran kulit berhasil dicatat' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal mencatat pembayaran kulit') };
    }
  },

  async getPembayaranHistory(pid) {
    try {
      const res = await HttpClient.post(EP.PEMBAYARAN_HISTORY, { pid });
      return { success: true, data: res.data || null, message: res.message || 'History pembayaran kulit berhasil dimuat' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memuat history pembayaran kulit') };
    }
  },

  async delete(pid) {
    try {
      const res = await HttpClient.post(EP.DELETE, { pid });
      return { success: true, data: res.data || null, message: res.message || 'Draft berhasil dihapus' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal menghapus draft') };
    }
  },
};

export default PenjualanKulitService;
