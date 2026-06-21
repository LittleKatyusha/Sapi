/**
 * Penawaran Penjualan RPH Service
 * Service layer for RPH Sales Quotation/Offer API operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class PenawaranPenjualanRphService {
  static API_BASE = API_ENDPOINTS.RPH?.PENAWARAN?.BASE || '/api/rph/penawaran';

  /**
   * Get list of penawaran with DataTable support
   */
  static async getData(params = {}) {
    try {
      const queryParams = {
        start: params.start || 0,
        length: params.length || 10,
        draw: params.draw || 1,
        search: params.search || '',
        start_date: params.start_date || '',
        end_date: params.end_date || '',
        rph_id: params.rph_id || '',
      };

      const response = await HttpClient.get(
        API_ENDPOINTS.RPH?.PENAWARAN?.DATA || `${this.API_BASE}/data`,
        { params: queryParams }
      );

      return {
        success: true,
        data: response.data || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw || 1,
        message: response.message || 'Data berhasil dimuat',
      };
    } catch (error) {
      console.error('Error fetching penawaran data:', error);
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: error.message || 'Gagal mengambil data penawaran',
      };
    }
  }

  /**
   * Get penawaran detail by PID
   */
  static async show(pid) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.PENAWARAN?.SHOW || `${this.API_BASE}/show`,
        { pid }
      );

      return {
        success: true,
        data: response.data || null,
        message: response.message || 'Detail berhasil dimuat',
      };
    } catch (error) {
      console.error('Error fetching penawaran detail:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Gagal memuat detail',
      };
    }
  }

  /**
   * Create new penawaran
   */
  static async store(data) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.PENAWARAN?.STORE || `${this.API_BASE}/store`,
        data
      );

      return {
        success: true,
        data: response.data || null,
        message: response.message || 'SPP berhasil dibuat',
      };
    } catch (error) {
      console.error('Error creating penawaran:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Gagal membuat SPP',
      };
    }
  }

  /**
   * Update existing penawaran (draft only)
   */
  static async update(data) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.PENAWARAN?.UPDATE || `${this.API_BASE}/update`,
        data
      );

      return {
        success: true,
        data: response.data || null,
        message: response.message || 'SPP berhasil diperbarui',
      };
    } catch (error) {
      console.error('Error updating penawaran:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Gagal memperbarui SPP',
      };
    }
  }

  /**
   * Delete penawaran (draft only)
   */
  static async hapus(pid) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.PENAWARAN?.HAPUS || `${this.API_BASE}/hapus`,
        { pid }
      );

      return {
        success: true,
        message: response.message || 'SPP berhasil dihapus',
      };
    } catch (error) {
      console.error('Error deleting penawaran:', error);
      return {
        success: false,
        message: error.message || 'Gagal menghapus SPP',
      };
    }
  }

  /**
   * Submit penawaran for approval
   */
  static async ajukan(pid, diajukan_kepada) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.PENAWARAN?.AJUKAN || `${this.API_BASE}/ajukan`,
        { pid, diajukan_kepada }
      );

      return {
        success: true,
        data: response.data || null,
        message: response.message || 'SPP berhasil diajukan',
      };
    } catch (error) {
      console.error('Error submitting penawaran:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengajukan SPP',
      };
    }
  }

  /**
   * Approve or reject penawaran
   */
  static async setujui(pid, approved) {
    try {
      const response = await HttpClient.post(
        API_ENDPOINTS.RPH?.PENAWARAN?.SETUJUI || `${this.API_BASE}/setujui`,
        { pid, approved }
      );

      return {
        success: true,
        data: response.data || null,
        message: response.message || (approved ? 'SPP disetujui' : 'SPP ditolak'),
      };
    } catch (error) {
      console.error('Error approving/rejecting penawaran:', error);
      return {
        success: false,
        message: error.message || 'Gagal memproses persetujuan',
      };
    }
  }

  /**
   * Get list of pedagang for selection
   */
  static async getPedagangList(rph_id) {
    try {
      const response = await HttpClient.get(
        API_ENDPOINTS.RPH?.PENAWARAN?.PEDAGANG || `${this.API_BASE}/pedagang`,
        { params: { rph_id } }
      );

      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Data pedagang berhasil dimuat',
      };
    } catch (error) {
      console.error('Error fetching pedagang list:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil data pedagang',
      };
    }
  }

  /**
   * Get list of approvers
   */
  static async getApprovers() {
    try {
      const response = await HttpClient.get(
        API_ENDPOINTS.RPH?.PENAWARAN?.APPROVERS || `${this.API_BASE}/approvers`
      );

      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Data approver berhasil dimuat',
      };
    } catch (error) {
      console.error('Error fetching approvers:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil data approver',
      };
    }
  }
}

export default PenawaranPenjualanRphService;
