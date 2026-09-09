/**
 * Yield Baseline Service
 * P1 — Admin config for expected dressing %, cutting yield, shrinkage
 * Endpoint base: /api/rph/yield-baseline
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.YIELD_BASELINE;

class YieldBaselineService {
  static async getData(params = {}) {
    try {
      const q = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        ...(params.searchValue ? { 'search[value]': params.searchValue } : {}),
      });
      const res = await HttpClient.get(`${EP.DATA}?${q.toString()}`);
      return {
        success: true,
        data: res.data || [],
        recordsTotal: res.recordsTotal || 0,
        recordsFiltered: res.recordsFiltered || 0,
        draw: res.draw,
      };
    } catch (err) {
      console.error('YieldBaselineService.getData', err);
      return { success: false, data: [], recordsTotal: 0, message: err?.message || 'Gagal memuat data' };
    }
  }

  static async getOptions() {
    try {
      const res = await HttpClient.get(EP.OPTIONS);
      return {
        success: true,
        data: res.data || { jenis_hewan: [], klasifikasi: [] },
      };
    } catch (err) {
      console.error('YieldBaselineService.getOptions', err);
      return { success: false, data: { jenis_hewan: [], klasifikasi: [] }, message: err?.message || 'Gagal memuat options' };
    }
  }

  static async show(pid) {
    try {
      const res = await HttpClient.post(EP.SHOW, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('YieldBaselineService.show', err);
      return { success: false, message: err?.message || 'Gagal memuat detail' };
    }
  }

  static async store(payload) {
    try {
      const res = await HttpClient.post(EP.STORE, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('YieldBaselineService.store', err);
      return { success: false, message: err?.message || 'Gagal menyimpan' };
    }
  }

  static async update(payload) {
    try {
      const res = await HttpClient.post(EP.UPDATE, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('YieldBaselineService.update', err);
      return { success: false, message: err?.message || 'Gagal update' };
    }
  }

  static async hapus(pid) {
    try {
      const res = await HttpClient.post(EP.DELETE, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('YieldBaselineService.hapus', err);
      return { success: false, message: err?.message || 'Gagal hapus' };
    }
  }
}

export default YieldBaselineService;
