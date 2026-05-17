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
}

export default PenjualanKarkasService;
