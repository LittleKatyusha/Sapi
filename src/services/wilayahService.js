/**
 * Wilayah Service
 * Service layer for Wilayah (region) master data operations
 * Provides cascading dropdown data: Provinsi → Kabupaten → Kecamatan → Kelurahan
 */

import HttpClient from './httpClient';

const PROVINSI_BASE = '/api/master/provinsi';
const KABUPATEN_BASE = '/api/master/kabupaten';
const KECAMATAN_BASE = '/api/master/kecamatan';
const KELURAHAN_BASE = '/api/master/kelurahan';

class WilayahService {
  /**
   * Get all provinsi
   * @param {string} search - Optional search query
   * @returns {Promise} API response with provinsi list
   */
  static async getProvinsi(search = '') {
    try {
      const queryParams = new URLSearchParams({ _ts: Date.now() });
      if (search) {
        queryParams.append('search', search);
      }

      const response = await HttpClient.get(`${PROVINSI_BASE}/all?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data || [],
        message: 'Provinsi berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data provinsi',
      };
    }
  }

  /**
   * Get all kabupaten by provinsi
   * @param {string} idProvinsi - Provinsi ID
   * @param {string} search - Optional search query
   * @returns {Promise} API response with kabupaten list
   */
  static async getKabupaten(idProvinsi, search = '') {
    try {
      const queryParams = new URLSearchParams({
        id_provinsi: idProvinsi,
        _ts: Date.now(),
      });
      if (search) {
        queryParams.append('search', search);
      }

      const response = await HttpClient.get(`${KABUPATEN_BASE}/all?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data || [],
        message: 'Kabupaten berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data kabupaten',
      };
    }
  }

  /**
   * Get all kecamatan by kabupaten
   * @param {string} idKabupaten - Kabupaten ID
   * @param {string} search - Optional search query
   * @returns {Promise} API response with kecamatan list
   */
  static async getKecamatan(idKabupaten, search = '') {
    try {
      const queryParams = new URLSearchParams({
        id_kabupaten: idKabupaten,
        _ts: Date.now(),
      });
      if (search) {
        queryParams.append('search', search);
      }

      const response = await HttpClient.get(`${KECAMATAN_BASE}/all?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data || [],
        message: 'Kecamatan berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data kecamatan',
      };
    }
  }

  /**
   * Get all kelurahan by kecamatan
   * @param {string} idKecamatan - Kecamatan ID
   * @param {string} search - Optional search query
   * @returns {Promise} API response with kelurahan list
   */
  static async getKelurahan(idKecamatan, search = '') {
    try {
      const queryParams = new URLSearchParams({
        id_kecamatan: idKecamatan,
        _ts: Date.now(),
      });
      if (search) {
        queryParams.append('search', search);
      }

      const response = await HttpClient.get(`${KELURAHAN_BASE}/all?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data || [],
        message: 'Kelurahan berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data kelurahan',
      };
    }
  }
}

export default WilayahService;
