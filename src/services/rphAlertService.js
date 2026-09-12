/**
 * RPH Alert Service
 * P1 — Real-time alert center (list, acknowledge, resolve, summary)
 * Endpoint base: /api/rph/alerts
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.ALERTS;

class RphAlertService {
  static async getData(params = {}) {
    try {
      const q = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        ...(params.searchValue ? { 'search[value]': params.searchValue } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.severity ? { severity: params.severity } : {}),
        ...(params.alert_type ? { alert_type: params.alert_type } : {}),
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
      console.error('RphAlertService.getData', err);
      return { success: false, data: [], recordsTotal: 0, message: err?.message || 'Gagal memuat data' };
    }
  }

  static async show(pid) {
    try {
      const res = await HttpClient.post(EP.SHOW, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RphAlertService.show', err);
      return { success: false, message: err?.message || 'Gagal memuat detail' };
    }
  }

  static async acknowledge(pid) {
    try {
      const res = await HttpClient.post(EP.ACKNOWLEDGE, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RphAlertService.acknowledge', err);
      return { success: false, message: err?.message || 'Gagal acknowledge' };
    }
  }

  static async resolve(payload) {
    try {
      const res = await HttpClient.post(EP.RESOLVE, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RphAlertService.resolve', err);
      return { success: false, message: err?.message || 'Gagal resolve' };
    }
  }

  static async summary() {
    try {
      const res = await HttpClient.get(EP.SUMMARY);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RphAlertService.summary', err);
      return { success: false, message: err?.message || 'Gagal memuat summary' };
    }
  }
}

export default RphAlertService;
