/**
 * Slaughter Batch Service
 * P0 — Slaughter batch control, mass-balance, corrections, two-man close
 * Endpoint base: /api/rph/slaughter-batch
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.SLAUGHTER_BATCH;

class SlaughterBatchService {
  static async getData(params = {}) {
    try {
      const q = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        ...(params.searchValue ? { 'search[value]': params.searchValue } : {}),
        ...(params.start_date ? { start_date: params.start_date } : {}),
        ...(params.end_date ? { end_date: params.end_date } : {}),
        ...(params.status ? { status: params.status } : {}),
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
      console.error('SlaughterBatchService.getData', err);
      return { success: false, data: [], recordsTotal: 0, message: err?.message || 'Gagal memuat data' };
    }
  }

  static async show(pid) {
    try {
      const res = await HttpClient.post(EP.SHOW, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.show', err);
      return { success: false, message: err?.message || 'Gagal memuat detail' };
    }
  }

  static async store(payload) {
    try {
      const res = await HttpClient.post(EP.STORE, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.store', err);
      return { success: false, message: err?.message || 'Gagal menyimpan' };
    }
  }

  static async recordWeight(payload) {
    try {
      const res = await HttpClient.post(EP.RECORD_WEIGHT, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.recordWeight', err);
      return { success: false, message: err?.message || 'Gagal record weight' };
    }
  }

  static async requestCorrection(payload) {
    try {
      const res = await HttpClient.post(EP.REQUEST_CORRECTION, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.requestCorrection', err);
      return { success: false, message: err?.message || 'Gagal request correction' };
    }
  }

  static async approveCorrection(payload) {
    try {
      const res = await HttpClient.post(EP.APPROVE_CORRECTION, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.approveCorrection', err);
      return { success: false, message: err?.message || 'Gagal approve correction' };
    }
  }

  static async rejectCorrection(payload) {
    try {
      const res = await HttpClient.post(EP.REJECT_CORRECTION, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.rejectCorrection', err);
      return { success: false, message: err?.message || 'Gagal reject correction' };
    }
  }

  static async addLoss(payload) {
    try {
      const res = await HttpClient.post(EP.ADD_LOSS, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.addLoss', err);
      return { success: false, message: err?.message || 'Gagal add loss' };
    }
  }

  static async reconcile(pid) {
    try {
      const res = await HttpClient.post(EP.RECONCILE, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.reconcile', err);
      return { success: false, message: err?.message || 'Gagal reconcile' };
    }
  }

  static async closeBatch(payload) {
    try {
      const res = await HttpClient.post(EP.CLOSE, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('SlaughterBatchService.closeBatch', err);
      return { success: false, message: err?.message || 'Gagal close batch' };
    }
  }
}

export default SlaughterBatchService;
