/**
 * DOF RPH Service
 * Service layer for RPH DOF (Disetop Over Feed) operations
 * Endpoint base: /api/rph/dof
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.DOF;

class DofRphService {
  /**
   * GET paginated DataTable data
   */
  static async getData(params = {}) {
    try {
      const q = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || 5,
        'order[0][dir]': params.orderDir || 'desc',
        _ts: Date.now(),
      });
      if (params.startDate) q.append('start_date', params.startDate);
      if (params.endDate) q.append('end_date', params.endDate);

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
   * POST /show — get detail of one DOF record including items
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
   * POST /store — create new DOF header + items
   * @param {{ id_tr_ho_pembelian_detail: number, order_no: string, items: Array<{id_master_dof: number, harga: number, tgl_dof: string}> }} payload
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
   * POST /update — update DOF (can replace detail items)
   * @param {{ pid: string, status?: number, order_no?: string, items?: Array }} payload
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
   * POST /hapus — soft-delete a DOF record
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
   * GET /gettarif — get list of DOF tarifs for an office
   * @param {{ idOffice?: number, idKlasifikasiHewan?: number }} params
   */
  static async getTarif(params = {}) {
    try {
      const q = new URLSearchParams();
      if (params.idOffice) q.append('id_office', params.idOffice);
      if (params.idKlasifikasiHewan) q.append('id_klasifikasi_hewan', params.idKlasifikasiHewan);

      const res = await HttpClient.get(`${EP.GET_TARIF}?${q.toString()}`);
      return { success: true, data: res.data || [] };
    } catch (err) {
      return { success: false, data: [], message: err?.message || 'Gagal memuat tarif DOF' };
    }
  }
}

export default DofRphService;
