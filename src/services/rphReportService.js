/**
 * RPH Report Service
 * P2 — Anti-shrinkage reports (shrinkage, unexplained loss, recon, risk, corrections, alerts)
 * Endpoint base: /api/rph/reports
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.REPORTS;

class RphReportService {
  static async _get(endpoint, params = {}) {
    const q = new URLSearchParams();
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.dimension) q.set('dimension', params.dimension);
    const res = await HttpClient.get(`${endpoint}?${q.toString()}`);
    return { success: true, data: res.data };
  }

  static async shrinkage(params = {}) {
    try {
      return await this._get(EP.SHRINKAGE, params);
    } catch (err) {
      console.error('RphReportService.shrinkage', err);
      return { success: false, message: err?.message || 'Gagal memuat report' };
    }
  }

  static async unexplainedLoss(params = {}) {
    try {
      return await this._get(EP.UNEXPLAINED_LOSS, params);
    } catch (err) {
      console.error('RphReportService.unexplainedLoss', err);
      return { success: false, message: err?.message || 'Gagal memuat report' };
    }
  }

  static async reconciliation(params = {}) {
    try {
      return await this._get(EP.RECONCILIATION, params);
    } catch (err) {
      console.error('RphReportService.reconciliation', err);
      return { success: false, message: err?.message || 'Gagal memuat report' };
    }
  }

  static async risk(params = {}) {
    try {
      return await this._get(EP.RISK, params);
    } catch (err) {
      console.error('RphReportService.risk', err);
      return { success: false, message: err?.message || 'Gagal memuat report' };
    }
  }

  static async corrections(params = {}) {
    try {
      return await this._get(EP.CORRECTIONS, params);
    } catch (err) {
      console.error('RphReportService.corrections', err);
      return { success: false, message: err?.message || 'Gagal memuat report' };
    }
  }

  static async alerts(params = {}) {
    try {
      return await this._get(EP.ALERTS, params);
    } catch (err) {
      console.error('RphReportService.alerts', err);
      return { success: false, message: err?.message || 'Gagal memuat report' };
    }
  }
}

export default RphReportService;
