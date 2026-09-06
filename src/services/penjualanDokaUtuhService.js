/**
 * Penjualan Doka Utuh Service
 * Service layer for Penjualan Doka Utuh (Whole Doka/Kambing/Domba Sales) operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

const BASE_URL = API_ENDPOINTS.RPH.PENJUALAN_DOKA_UTUH.BASE;
const RETURN_URL = API_ENDPOINTS.RPH.RETURN_PENJUALAN_DOKA_UTUH;

class PenjualanDokaUtuhService {
  static async getData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || 0,
        'order[0][dir]': params.orderDir || 'desc',
        ...(params.status_transaksi && { status_transaksi: params.status_transaksi }),
        ...(params.exclude_status_transaksi && { exclude_status_transaksi: params.exclude_status_transaksi }),
        ...(params.status_pembayaran && { status_pembayaran: params.status_pembayaran }),
        ...(params.pengiriman && { pengiriman: params.pengiriman }),
        ...(params.status_pengiriman && { status_pengiriman: params.status_pengiriman }),
        ...(params.return_status && { return_status: params.return_status }),
        ...(params.pic && { pic: params.pic }),
        ...(params.no_transaksi && { no_transaksi: params.no_transaksi }),
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
        _ts: Date.now(),
      });

      const response = await HttpClient.get(`${BASE_URL}/data?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw,
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data penjualan doka',
      };
    }
  }

  static async getAvailableDoka(transactionId = null) {
    try {
      const params = new URLSearchParams();
      if (transactionId) {
        params.append('transaction_id', transactionId);
      }
      params.append('_ts', Date.now());
      const response = await HttpClient.get(`${BASE_URL}/available-doka?${params.toString()}`);
      return {
        success: true,
        data: response?.data ?? response ?? [],
        message: response?.message || 'Data doka berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data doka',
      };
    }
  }

  static async show(pid) {
    try {
      const params = new URLSearchParams();
      params.append('_ts', Date.now());
      const response = await HttpClient.post(`${BASE_URL}/show?${params.toString()}`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Detail penjualan doka berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat detail penjualan doka',
      };
    }
  }

  static async store(payload = {}) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/store`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Penjualan doka berhasil ditambahkan',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menambahkan penjualan doka',
      };
    }
  }

  static async update(payload) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/update`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Penjualan doka berhasil diperbarui',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal memperbarui penjualan doka',
      };
    }
  }

  static async delete(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/hapus`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Penjualan doka berhasil dihapus',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal menghapus penjualan doka',
      };
    }
  }

  static async confirm(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/confirm`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Transaksi berhasil dikonfirmasi',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal mengkonfirmasi transaksi',
      };
    }
  }

  static async cancel(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/cancel`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Transaksi berhasil dibatalkan',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal membatalkan transaksi',
      };
    }
  }

  static async bayar(data) {
    try {
      let payload = data;
      if (data.file && data.file instanceof File) {
        payload = new FormData();
        Object.keys(data).forEach((key) => {
          if (key === 'file') {
            payload.append('file', data.file);
          } else if (data[key] !== null && data[key] !== undefined) {
            payload.append(key, data[key]);
          }
        });
      }
      const response = await HttpClient.post(`${BASE_URL}/bayar`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Pembayaran berhasil dicatat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal mencatat pembayaran',
      };
    }
  }

  static async getPembayaranHistory(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/pembayaran-history`, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'History pembayaran berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat history pembayaran',
      };
    }
  }

  static async updateDelivery(payload) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/update-delivery`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data pengiriman berhasil diperbarui',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memperbarui data pengiriman',
      };
    }
  }

  static async printFaktur(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/print-faktur`, { pid }, { responseType: 'blob' });
      return { success: true, data: response, message: 'Faktur berhasil diunduh' };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return { success: false, data: null, message: errorData?.message || error?.message || 'Gagal memuat data faktur' };
    }
  }

  static async printInvoice(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/print-invoice`, { pid }, { responseType: 'blob' });
      return { success: true, data: response, message: 'Invoice berhasil diunduh' };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return { success: false, data: null, message: errorData?.message || error?.message || 'Gagal memuat data invoice' };
    }
  }

  static async printSuratJalan(pid) {
    try {
      const response = await HttpClient.post(`${BASE_URL}/print-surat-jalan`, { pid }, { responseType: 'blob' });
      return { success: true, data: response, message: 'Surat jalan berhasil diunduh' };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return { success: false, data: null, message: errorData?.message || error?.message || 'Gagal memuat data surat jalan' };
    }
  }

  static async getPenerimaanHistory(params = {}) {
    try {
      const response = await HttpClient.get(`${BASE_URL}/penerimaan-history`, { params });
      return {
        success: true,
        data: response?.data?.data ?? [],
        recordsTotal: response?.data?.recordsTotal ?? 0,
        recordsFiltered: response?.data?.recordsFiltered ?? 0,
        message: response?.message || 'Riwayat penerimaan berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat riwayat penerimaan',
      };
    }
  }

  // === Return endpoints ===
  static async getReturnHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        ...(params.tipe_return && { tipe_return: params.tipe_return }),
        ...(params.status && { status: params.status }),
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
        ...(params.id_penjualan && { id_penjualan: params.id_penjualan }),
        _ts: Date.now(),
      });
      const response = await HttpClient.get(`${RETURN_URL}/history?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data ?? [],
        recordsTotal: response?.recordsTotal ?? 0,
        recordsFiltered: response?.recordsFiltered ?? 0,
        draw: response?.draw,
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat history return',
      };
    }
  }

  static async getReturns(idPenjualan = null) {
    try {
      const params = new URLSearchParams();
      if (idPenjualan) params.append('id_penjualan', idPenjualan);
      params.append('_ts', Date.now());
      const response = await HttpClient.get(`${RETURN_URL}?${params.toString()}`);
      return {
        success: true,
        data: response?.data ?? [],
        total: response?.total ?? 0,
        message: response?.message || 'Data return berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data return',
      };
    }
  }

  static async storeReturn(payload) {
    try {
      const response = await HttpClient.post(`${RETURN_URL}`, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Return berhasil dibuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      return {
        success: false,
        data: errorData,
        message: errorData?.message || error?.message || 'Gagal membuat return',
      };
    }
  }
}

export default PenjualanDokaUtuhService;
