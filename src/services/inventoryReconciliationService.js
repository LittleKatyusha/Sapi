/**
 * Inventory Reconciliation Service
 * P2 — Physical count vs system stock (create, enter count, verify)
 * Endpoint base: /api/rph/inventory-reconciliation
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const EP = API_ENDPOINTS.RPH.INVENTORY_RECONCILIATION;

class InventoryReconciliationService {
  static async getData(params = {}) {
    try {
      const q = new URLSearchParams();
      if (params.start_date) q.set('start_date', params.start_date);
      if (params.end_date) q.set('end_date', params.end_date);
      const res = await HttpClient.get(`${EP.DATA}?${q.toString()}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('InventoryReconciliationService.getData', err);
      return { success: false, message: err?.message || 'Gagal memuat data' };
    }
  }

  static async show(pid) {
    try {
      const res = await HttpClient.post(EP.SHOW, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('InventoryReconciliationService.show', err);
      return { success: false, message: err?.message || 'Gagal memuat detail' };
    }
  }

  static async store(payload) {
    try {
      const res = await HttpClient.post(EP.STORE, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('InventoryReconciliationService.store', err);
      return { success: false, message: err?.message || 'Gagal menyimpan' };
    }
  }

  static async enterCount(payload) {
    try {
      const res = await HttpClient.post(EP.ENTER_COUNT, payload);
      return { success: true, data: res.data };
    } catch (err) {
      console.error('InventoryReconciliationService.enterCount', err);
      return { success: false, message: err?.message || 'Gagal save count' };
    }
  }

  static async verify(pid) {
    try {
      const res = await HttpClient.post(EP.VERIFY, { pid });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('InventoryReconciliationService.verify', err);
      return { success: false, message: err?.message || 'Gagal verify' };
    }
  }
}

export default InventoryReconciliationService;
