/**
 * Pemberian Pakan Sapi RPH Service
 * Service layer for recording cattle feed distribution at RPH.
 */

import HttpClient from './httpClient';
import PersediaanPakanService from './persediaanPakanService';

const normalizeErrorMessage = (error, fallback) => {
  const message = error?.data?.message || error?.response?.data?.message || error?.message || fallback;
  if (typeof message === 'object') {
    return Object.values(message).flat().join(', ') || fallback;
  }
  return message;
};

class PemberianPakanSapiService {
  static API_BASES = [
    '/api/rph/persediaan/pemberianpakan',
    '/api/rph/persediaan/pakan/pemberian-sapi',
    '/api/rph/persediaan/pakan/pemberian-pakan-sapi',
    '/api/rph/persediaan/pakan/pemberian-pakan-sapi-rph',
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
      'order[0][column]': params.orderColumn || 8,
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
      nama_sapi: item.nama_sapi || '-',
      eartag_sapi: item.eartag_sapi || '-',
      nama_resep_pakan: item.nama_resep_pakan || '-',
      tgl_pemberian_pakan: item.tgl_pemberian_pakan || '-',
      jam_pemberian_pakan: item.jam_pemberian_pakan || '-',
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
      console.error('PemberianPakanSapiService.getData error:', error);
      return {
        success: false,
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        message: normalizeErrorMessage(error, 'Gagal memuat data pemberian pakan sapi'),
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
      console.error('PemberianPakanSapiService.show error:', error);
      return {
        success: false,
        data: null,
        message: normalizeErrorMessage(error, 'Gagal memuat detail pemberian pakan sapi'),
      };
    }
  }

  static async store(payload) {
    try {
      const response = await this.postFirst(this.API_BASES.map((base) => `${base}/store`), payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pemberian pakan sapi berhasil disimpan',
      };
    } catch (error) {
      console.error('PemberianPakanSapiService.store error:', error);
      return {
        success: false,
        data: error?.data ?? null,
        message: normalizeErrorMessage(error, 'Gagal menyimpan data pemberian pakan sapi'),
      };
    }
  }

  static async update(payload) {
    try {
      const response = await this.postFirst(this.API_BASES.map((base) => `${base}/update`), payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pemberian pakan sapi berhasil diperbarui',
      };
    } catch (error) {
      console.error('PemberianPakanSapiService.update error:', error);
      return {
        success: false,
        data: error?.data ?? null,
        message: normalizeErrorMessage(error, 'Gagal memperbarui data pemberian pakan sapi'),
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
        message: response?.message || 'Data pemberian pakan sapi berhasil dihapus',
      };
    } catch (error) {
      console.error('PemberianPakanSapiService.delete error:', error);
      return {
        success: false,
        data: null,
        message: normalizeErrorMessage(error, 'Gagal menghapus data pemberian pakan sapi'),
      };
    }
  }

  static async getResepPakanOptions() {
    const response = await PersediaanPakanService.getResepData({
      draw: 1,
      start: 0,
      length: 1000,
      search: '',
      orderColumn: 1,
      orderDir: 'asc',
    });

    if (!response.success) {
      return {
        success: false,
        data: [],
        message: response.message || 'Gagal memuat daftar resep pakan',
      };
    }

    return {
      success: true,
      data: (response.data || [])
        .filter((item) => item.pid)
        .map((item) => ({
          value: item.pid,
          label: item.name || item.nama_resep_pakan || 'Resep Pakan',
          description: item.keterangan,
          total_jumlah: item.total_jumlah,
          harga_total: item.harga_total,
        })),
      message: 'Daftar resep pakan berhasil dimuat',
    };
  }
}

export default PemberianPakanSapiService;
