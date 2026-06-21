/**
 * Penjualan Karkas Service
 * Service layer for RPH Penjualan Karkas (karkas sales) operations
 * Endpoint base: /api/rph/penjualan/karkas
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.PENJUALAN_KARKAS;

export const BAGIAN_KARKAS = [
  { value: 'paha_belakang_kanan', label: 'Paha Belakang Kanan' },
  { value: 'paha_belakang_kiri',  label: 'Paha Belakang Kiri' },
  { value: 'paha_depan_kanan',    label: 'Paha Depan Kanan' },
  { value: 'paha_depan_kiri',     label: 'Paha Depan Kiri' },
];

class PenjualanKarkasService {
  /**
   * Get paginated DataTable data
   */
  static async getData(params = {}) {
    try {
      const q = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || 4,
        'order[0][dir]': params.orderDir || 'desc',
        _ts: Date.now(),
      });
      if (params.startDate) q.append('start_date', params.startDate);
      if (params.endDate) q.append('end_date', params.endDate);
      if (params.idOffice) q.append('id_office', params.idOffice);

      const res = await HttpClient.get(`${EP.DATA}?${q.toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
        draw: res.draw,
      };
    } catch (err) {
      return { success: false, data: [], recordsTotal: 0, recordsFiltered: 0, message: err?.message || 'Gagal memuat data' };
    }
  }

  /**
   * Get detail of one transaction
   */
  static async show(pid) {
    try {
      const res = await HttpClient.post(EP.SHOW, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, data: null, message: err?.message || 'Gagal memuat detail' };
    }
  }

  /**
   * Create new karkas transaction
   */
  static async store(payload) {
    try {
      const res = await HttpClient.post(EP.STORE, payload);
      return { success: true, data: res.data, message: res.message || 'Data berhasil disimpan' };
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Gagal menyimpan data';
      return { success: false, message: msg };
    }
  }

  /**
   * Update existing karkas transaction
   */
  static async update(payload) {
    try {
      const res = await HttpClient.post(EP.UPDATE, payload);
      return { success: true, data: res.data, message: res.message || 'Data berhasil diperbarui' };
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Gagal memperbarui data';
      return { success: false, message: msg };
    }
  }

  /**
   * Soft-delete a transaction
   */
  static async hapus(pid) {
    try {
      const res = await HttpClient.post(EP.DELETE, { pid });
      return { success: true, message: res.message || 'Data berhasil dihapus' };
    } catch (err) {
      return { success: false, message: err?.message || 'Gagal menghapus data' };
    }
  }

  /**
   * Get karkas harga list for a specific pedagang
   */
  static async getHarga(pidPedagang) {
    try {
      const res = await HttpClient.get(`${EP.GET_HARGA}?pid_pedagang=${encodeURIComponent(pidPedagang)}`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, data: null, message: err?.message || 'Gagal memuat data harga' };
    }
  }

  /**
   * Print Surat Jalan document data
   */
  static async printSuratJalan(pid) {
    try {
      const res = await HttpClient.post(EP.PRINT_SURAT_JALAN, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err?.message || 'Gagal memuat surat jalan' };
    }
  }

  /**
   * Print Faktur document data
   */
  static async printFaktur(pid) {
    try {
      const res = await HttpClient.post(EP.PRINT_FAKTUR, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err?.message || 'Gagal memuat faktur' };
    }
  }

  /**
   * Print SSTB document data
   */
  static async printSstb(pid) {
    try {
      const res = await HttpClient.post(EP.PRINT_SSTB, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err?.message || 'Gagal memuat SSTB' };
    }
  }

  /**
   * Get setoran list for a penjualan
   */
  static async getSetoran(pid) {
    try {
      const res = await HttpClient.get(`${EP.GET_SETORAN}?pid=${encodeURIComponent(pid)}`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, data: [], message: err?.message || 'Gagal memuat setoran' };
    }
  }

  /**
   * Create new setoran record
   */
  static async storeSetoran(payload) {
    try {
      const res = await HttpClient.post(EP.STORE_SETORAN, payload);
      return { success: true, data: res.data, message: res.message || 'Setoran berhasil ditambahkan' };
    } catch (err) {
      return { success: false, message: err?.message || 'Gagal menambah setoran' };
    }
  }

  /**
   * Delete setoran record
   */
  static async deleteSetoran(pid) {
    try {
      const res = await HttpClient.post(EP.DELETE_SETORAN, { pid });
      return { success: true, message: res.message || 'Setoran berhasil dihapus' };
    } catch (err) {
      return { success: false, message: err?.message || 'Gagal menghapus setoran' };
    }
  }

  /**
   * Get master data dropdowns (payment terms, drivers, vehicles, etc.)
   */
  static async getMasterData() {
    try {
      const res = await HttpClient.get(EP.MASTER_DATA);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, data: {}, message: err?.message || 'Gagal memuat master data' };
    }
  }

  /**
   * Calculate HPP (profit/loss)
   */
  static async calculateHpp(payload) {
    try {
      const res = await HttpClient.post(EP.CALCULATE_HPP, payload);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, data: null, message: err?.message || 'Gagal menghitung HPP' };
    }
  }

  /**
   * Get pedagang options with saldo tracking
   */
  static async getPedagangOptions(idOffice) {
    try {
      const q = idOffice ? `?id_office=${idOffice}` : '';
      const res = await HttpClient.get(`${EP.PEDAGANG_OPTIONS}${q}`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, data: [], message: err?.message || 'Gagal memuat pedagang' };
    }
  }

  /**
   * Get cattle options with eartag
   */
  static async getCattleOptions(idOffice) {
    try {
      const q = idOffice ? `?id_office=${idOffice}` : '';
      const res = await HttpClient.get(`${EP.CATTLE_OPTIONS}${q}`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, data: [], message: err?.message || 'Gagal memuat data sapi' };
    }
  }
}

export default PenjualanKarkasService;
