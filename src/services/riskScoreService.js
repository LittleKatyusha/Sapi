/**
 * Risk Score Service
 * P2 — Employee/team/station daily risk scores
 * Endpoint base: /api/rph/risk-score
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.RISK_SCORE;

class RiskScoreService {
  static async getData(params = {}) {
    try {
      const q = new URLSearchParams();
      if (params.start_date) q.set('start_date', params.start_date);
      if (params.end_date) q.set('end_date', params.end_date);
      if (params.dimension) q.set('dimension', params.dimension);
      if (params.band) q.set('band', params.band);
      const res = await HttpClient.get(`${EP.DATA}?${q.toString()}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RiskScoreService.getData', err);
      return { success: false, message: err?.message || 'Gagal memuat data' };
    }
  }

  static async recompute(payload) {
    try {
      const res = await HttpClient.post(EP.RECOMPUTE, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('RiskScoreService.recompute', err);
      return { success: false, message: err?.message || 'Gagal recompute' };
    }
  }
}

export default RiskScoreService;
