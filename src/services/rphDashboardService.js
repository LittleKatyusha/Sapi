/**
 * RPH Dashboard Service
 * P2 — Forensic control center (summary, batch timeline, batch detail)
 * Endpoint base: /api/rph/dashboard
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.DASHBOARD;

class RphDashboardService {
  static async summary(params = {}) {
    try {
      const q = new URLSearchParams();
      if (params.start_date) q.set('start_date', params.start_date);
      if (params.end_date) q.set('end_date', params.end_date);
      const res = await HttpClient.get(`${EP.SUMMARY}?${q.toString()}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RphDashboardService.summary', err);
      return { success: false, message: err?.message || 'Gagal memuat summary' };
    }
  }

  static async batchTimeline(params = {}) {
    try {
      const q = new URLSearchParams();
      if (params.start_date) q.set('start_date', params.start_date);
      if (params.end_date) q.set('end_date', params.end_date);
      const res = await HttpClient.get(`${EP.BATCH_TIMELINE}?${q.toString()}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RphDashboardService.batchTimeline', err);
      return { success: false, message: err?.message || 'Gagal memuat timeline' };
    }
  }

  static async batchDetail(id) {
    try {
      const res = await HttpClient.post(EP.BATCH_DETAIL, { id });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RphDashboardService.batchDetail', err);
      return { success: false, message: err?.message || 'Gagal memuat detail' };
    }
  }
}

export default RphDashboardService;
