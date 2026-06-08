/**
 * Pemberian OVK Sapi RPH Service
 * Service layer for recording veterinary supplies (OVK) administration at RPH.
 */

import HttpClient from './httpClient';
import PersediaanOvkService from './persediaanOvkService';

const normalizeErrorMessage = (error, fallback) => {
  const message = error?.data?.message || error?.response?.data?.message || error?.message || fallback;
  if (typeof message === 'object') {
    return Object.values(message).flat().join(', ') || fallback;
  }
  return message;
};

class PemberianOvkSapiService {
  static API_BASES = [
    '/api/rph/persediaan/pemberianovk',
    '/api/rph/persediaan/ovk/pemberian-sapi',
    '/api/rph/persediaan/ovk/pemberian-ovk',
    '/api/rph/persediaan/ovk/pemberian-ovk-sapi-rph',
    '/api/rph/persediaan/ovk/pemberianovk',
  ];

  static shouldTryNextEndpoint(error) {
    return error?.status === 404 || /endpoint|not found/i.test(error?.message || '');
  }

  static async getFirst(paths, options = {}) {
    let lastError = null;
    for (const path of paths) {
      try {
        return await HttpClient.get(path, options);
      } catch (error) {
        lastError = error;
        if (!this.shouldTryNextEndpoint(error)) throw error;
      }
    }
    throw lastError;
  }

  static async postFirst(paths, payload) {
    let lastError = null;
    for (const path of paths) {
      try {
        return await HttpClient.post(path, payload);
      } catch (error) {
        lastError = error;
        if (!this.shouldTryNextEndpoint(error)) throw error;
      }
    }
    throw lastError;
  }

  static buildDataTableParams(params = {}) {
    const queryParams = new URLSearchParams({
      draw: params.draw || 1,
      start: params.start || 0,
      length: params.length || 10,
      'search[value]': params.search || '',
      'order[0][column]': params.orderColumn || 5,
      'order[0][dir]': params.orderDir || 'desc',
      _ts: Date.now(),
    });

    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    return queryParams;
  }

  static transformRow(item = {}) {
    return {
      ...item,
      pid: item.pid,
      id_rph: item.id_rph,
      id_pembelian_ho_detail: item.id_pembelian_ho_detail,
      id_pembelian_rph_detail: item.id_pembelian_rph_detail,
      tgl_pemberian_ovk: item.tgl_pemberian_ovk || '-',
      jam_pemberian_ovk: item.jam_pemberian_ovk || '-',
      nama_peternak: item.nama_peternak || '-',
      harga: item.harga ?? null,
    };
  }

  static async getData(params = {}) {
    try {
      const queryParams = this.buildDataTableParams(params);
      const response = await this.getFirst(
        this.API_BASES.flatMap((base) => [
          `${base}/data?${queryParams.toString()}`,
          `${base}/get-data?${queryParams.toString()}`,
          `${base}/getdata?${queryParams.toString()}`,
        ]),
        { cache: false }
      );

      return {
        success: true,
        data: Array.isArray(response?.data) ? response.data.map(this.transformRow) : [],
        recordsTotal: Number(response?.recordsTotal) || 0,
        recordsFiltered: Number(response?.recordsFiltered) || 0,
        draw: response?.draw,
      };
    } catch (error) {
      console.error('PemberianOvkSapiService.getData error:', error);
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: normalizeErrorMessage(error, 'Gagal memuat data pemberian OVK sapi'),
      };
    }
  }

  static async show(pid) {
    try {
      const response = await this.postFirst(this.API_BASES.map((base) => `${base}/show`), { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data berhasil dimuat',
      };
    } catch (error) {
      console.error('PemberianOvkSapiService.show error:', error);
      return {
        success: false,
        data: null,
        message: normalizeErrorMessage(error, 'Gagal memuat detail pemberian OVK sapi'),
      };
    }
  }

  static async store(payload) {
    try {
      const response = await this.postFirst(this.API_BASES.map((base) => `${base}/store`), payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pemberian OVK sapi berhasil disimpan',
      };
    } catch (error) {
      console.error('PemberianOvkSapiService.store error:', error);
      return {
        success: false,
        data: error?.data ?? null,
        message: normalizeErrorMessage(error, 'Gagal menyimpan data pemberian OVK sapi'),
      };
    }
  }

  static async update(payload) {
    try {
      const response = await this.postFirst(this.API_BASES.map((base) => `${base}/update`), payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pemberian OVK sapi berhasil diperbarui',
      };
    } catch (error) {
      console.error('PemberianOvkSapiService.update error:', error);
      return {
        success: false,
        data: error?.data ?? null,
        message: normalizeErrorMessage(error, 'Gagal memperbarui data pemberian OVK sapi'),
      };
    }
  }

  static async delete(pid) {
    try {
      const response = await this.postFirst(
        this.API_BASES.flatMap((base) => [`${base}/hapus`, `${base}/delete`]),
        { pid }
      );
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pemberian OVK sapi berhasil dihapus',
      };
    } catch (error) {
      console.error('PemberianOvkSapiService.delete error:', error);
      return {
        success: false,
        data: null,
        message: normalizeErrorMessage(error, 'Gagal menghapus data pemberian OVK sapi'),
      };
    }
  }

  static async getOvkOptions() {
    try {
      const response = await PersediaanOvkService.getSummary();
      if (!response.success) {
        return {
          success: false,
          data: [],
          message: response.message || 'Gagal memuat daftar OVK',
        };
      }

      return {
        success: true,
        data: (response.data || []).map((item) => ({
          value: item.id_produk || item.id, // backend product ID
          label: item.nama_produk || item.namaOvk || 'OVK',
          satuan: item.satuan,
          stok: item.jumlah ?? item.stok ?? 0,
          harga: item.harga ?? 0,
        })),
        message: 'Daftar OVK berhasil dimuat',
      };
    } catch (error) {
      console.error('PemberianOvkSapiService.getOvkOptions error:', error);
      return {
        success: false,
        data: [],
        message: normalizeErrorMessage(error, 'Gagal memuat daftar OVK'),
      };
    }
  }
}

export default PemberianOvkSapiService;
