import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.PENJUALAN_BONING;

const mapError = (err, fallback) => err?.data?.message || err?.message || fallback;

const buildTableQuery = (params = {}, defaults = {}) => new URLSearchParams({
  draw: params.draw || 1,
  start: params.start || 0,
  length: params.length || defaults.length || 1000,
  'search[value]': params.search || '',
  'order[0][column]': params.orderColumn ?? defaults.orderColumn ?? 0,
  'order[0][dir]': params.orderDir || defaults.orderDir || 'asc',
  _ts: Date.now(),
});

const PenjualanBoningService = {
  async getData(params = {}) {
    try {
      const query = buildTableQuery(params, { length: 10, orderColumn: 6, orderDir: 'desc' });

      if (params.startDate) query.append('start_date', params.startDate);
      if (params.endDate) query.append('end_date', params.endDate);
      if (params.idOffice) query.append('id_office', params.idOffice);
      if (params.payment_status) query.append('payment_status', params.payment_status);

      const res = await HttpClient.get(`${EP.DATA}?${query.toString()}`);

      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
        draw: res.draw || params.draw || 1,
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: mapError(err, 'Gagal memuat data penjualan boning'),
      };
    }
  },

  async getMasterData(idOffice) {
    try {
      const query = idOffice ? `?id_office=${idOffice}` : '';
      const res = await HttpClient.get(`${EP.MASTER_DATA}${query}`);
      return { success: true, data: res.data || {} };
    } catch (err) {
      return { success: false, data: {}, message: mapError(err, 'Gagal memuat master data') };
    }
  },

  async getPedagang(idOffice) {
    try {
      const query = idOffice ? `?id_office=${idOffice}` : '';
      const res = await HttpClient.get(`${EP.GET_PEDAGANG}${query}`);
      return { success: true, data: res.data || [] };
    } catch (err) {
      return { success: false, data: [], message: mapError(err, 'Gagal memuat data pedagang') };
    }
  },

  async getBoning(idOffice) {
    try {
      const query = idOffice ? `?id_office=${idOffice}` : '';
      const res = await HttpClient.get(`${EP.GET_BONING}${query}`);
      return { success: true, data: res.data || [] };
    } catch (err) {
      return { success: false, data: [], message: mapError(err, 'Gagal memuat item boning') };
    }
  },

  async getMasterPedagang(params = {}) {
    try {
      const query = buildTableQuery(params);
      const res = await HttpClient.get(`/api/master/pedagang/data?${query.toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: mapError(err, 'Gagal memuat master pedagang'),
      };
    }
  },

  async getMasterBanks(params = {}) {
    try {
      const query = buildTableQuery(params);
      const res = await HttpClient.get(`/api/master/bank/data?${query.toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
      };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: mapError(err, 'Gagal memuat bank') };
    }
  },

  async getMasterPengirim(params = {}) {
    try {
      const query = buildTableQuery(params);
      const res = await HttpClient.get(`/api/master/pengirim/data?${query.toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
      };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: mapError(err, 'Gagal memuat pengirim') };
    }
  },

  async getMasterKendaraan(params = {}) {
    try {
      const query = buildTableQuery(params);
      const res = await HttpClient.get(`/api/master/kendaraan/data?${query.toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
      };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: mapError(err, 'Gagal memuat kendaraan') };
    }
  },

  async getMasterItemPotong(params = {}) {
    try {
      const query = buildTableQuery(params);
      const res = await HttpClient.get(`/api/master/itempotong/data?${query.toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
      };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: mapError(err, 'Gagal memuat item potong') };
    }
  },

  async getPedagangHarga(pid) {
    try {
      if (!pid) {
        return { success: false, data: null, message: 'PID pedagang tidak valid' };
      }

      const res = await HttpClient.get(`/api/master/pedagangharga/data?pid=${encodeURIComponent(pid)}`);
      return { success: true, data: res.data || null };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memuat daftar harga pedagang') };
    }
  },

  async getHarga(payload) {
    try {
      const res = await HttpClient.post(EP.GET_HARGA, payload);
      return { success: true, data: res.data || null };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memuat harga jual') };
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
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: mapError(err, 'Gagal memuat riwayat penerimaan boning'),
      };
    }
  },

  async bayar(payload) {
    try {
      const res = await HttpClient.post(EP.BAYAR, payload);
      return { success: true, data: res.data || null, message: res.message || 'Pembayaran boning berhasil dicatat' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal mencatat pembayaran boning') };
    }
  },

  async getPembayaranHistory(pid) {
    try {
      const res = await HttpClient.post(EP.PEMBAYARAN_HISTORY, { pid });
      return { success: true, data: res.data || null, message: res.message || 'History pembayaran boning berhasil dimuat' };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memuat history pembayaran boning') };
    }
  },

  async show(pid) {
    try {
      const res = await HttpClient.post(EP.SHOW, { pid });
      return { success: true, data: res.data || null };
    } catch (err) {
      return { success: false, data: null, message: mapError(err, 'Gagal memuat detail transaksi') };
    }
  },

  async store(payload) {
    try {
      const res = await HttpClient.post(EP.STORE, payload);
      return { success: true, data: res.data || null, message: res.message || 'Penjualan boning berhasil disimpan' };
    } catch (err) {
      return { success: false, message: mapError(err, 'Gagal menyimpan data') };
    }
  },

  async update(payload) {
    try {
      const res = await HttpClient.post(EP.UPDATE, payload);
      return { success: true, data: res.data || null, message: res.message || 'Penjualan boning berhasil diperbarui' };
    } catch (err) {
      return { success: false, message: mapError(err, 'Gagal memperbarui data') };
    }
  },

  async hapus(pid) {
    try {
      const res = await HttpClient.post(EP.DELETE, { pid });
      return { success: true, message: res.message || 'Penjualan boning berhasil dihapus' };
    } catch (err) {
      return { success: false, message: mapError(err, 'Gagal menghapus data') };
    }
  },
};

export default PenjualanBoningService;
