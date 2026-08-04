/**
 * Kandang Service
 * Master kandang per RPH — untuk pengelompokan sapi di form pemberian pakan.
 */

import HttpClient from './httpClient';

class KandangService {
  static API_BASE = '/api/rph/kandang';
  static API_DATA = `${this.API_BASE}/data`;
  static API_OPTIONS = `${this.API_BASE}/options`;
  static API_STORE = `${this.API_BASE}/store`;
  static API_UPDATE = `${this.API_BASE}/update`;
  static API_DELETE = `${this.API_BASE}/hapus`;
  static API_SHOW = `${this.API_BASE}/show`;

  static async getData(params = {}) {
    try {
      const query = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
      });
      if (params.search) query.append('search', params.search);

      const response = await HttpClient.get(`${this.API_DATA}?${query.toString()}`);
      return {
        success: true,
        data: response?.data || [],
        recordsTotal: response?.recordsTotal ?? 0,
        recordsFiltered: response?.recordsFiltered ?? 0,
        draw: response?.draw ?? 1,
      };
    } catch (error) {
      console.error('Error fetching kandang data:', error);
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: error?.message || 'Gagal memuat data kandang',
      };
    }
  }

  static async getOptions() {
    try {
      const response = await HttpClient.get(this.API_OPTIONS);
      return {
        success: true,
        data: response?.data || [],
        message: response?.message || 'Data retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching kandang options:', error);
      return {
        success: false,
        data: [],
        message: error?.message || 'Gagal memuat opsi kandang',
      };
    }
  }

  static async show(pid) {
    try {
      const response = await HttpClient.post(this.API_SHOW, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data kandang berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching kandang detail:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat detail kandang',
      };
    }
  }

  static async store(payload) {
    try {
      const response = await HttpClient.post(this.API_STORE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Kandang berhasil dibuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error creating kandang:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal membuat kandang',
      };
    }
  }

  static async update(payload) {
    try {
      const response = await HttpClient.post(this.API_UPDATE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Kandang berhasil diperbarui',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error updating kandang:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memperbarui kandang',
      };
    }
  }

  static async delete(pid) {
    try {
      const response = await HttpClient.post(this.API_DELETE, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Kandang berhasil dihapus',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error deleting kandang:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal menghapus kandang',
      };
    }
  }
}

export default KandangService;
