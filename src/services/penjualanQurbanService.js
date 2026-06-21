/**
 * Penjualan Qurban Service
 * API client for RPH Penjualan Sapi Qurban
 */

import HttpClient from './httpClient';

class PenjualanQurbanService {
  static API_BASE = '/api/rph/penjualan-qurban';

  /**
   * Get DataTable data
   */
  static async getData(params = {}) {
    try {
      const queryParams = {
        start: params.start || 0,
        length: params.length || 10,
        draw: params.draw || 1,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || '0',
        'order[0][dir]': params.orderDir || 'desc',
        _: Date.now(),
      };

      if (params.start_date) queryParams.start_date = params.start_date;
      if (params.end_date) queryParams.end_date = params.end_date;

      const response = await HttpClient.get(`${this.API_BASE}/data`, { params: queryParams });
      return {
        draw: response.draw,
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        data: response.data || [],
        success: true,
      };
    } catch (error) {
      console.error('[PenjualanQurbanService] Error fetching data:', error);
      throw error;
    }
  }

  /**
   * Get detail
   */
  static async getDetail(pid) {
    try {
      const response = await HttpClient.post(`${this.API_BASE}/show`, { pid });
      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Detail berhasil dimuat',
      };
    } catch (error) {
      console.error('[PenjualanQurbanService] Error fetching detail:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Gagal mengambil detail',
      };
    }
  }

  /**
   * Create new penjualan
   */
  static async create(data) {
    try {
      const response = await HttpClient.post(`${this.API_BASE}/store`, data);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil dibuat',
      };
    } catch (error) {
      console.error('[PenjualanQurbanService] Error creating:', error);
      return {
        success: false,
        message: error.message || 'Gagal membuat data',
      };
    }
  }

  /**
   * Update penjualan
   */
  static async update(data) {
    try {
      const response = await HttpClient.post(`${this.API_BASE}/update`, data);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil diperbarui',
      };
    } catch (error) {
      console.error('[PenjualanQurbanService] Error updating:', error);
      return {
        success: false,
        message: error.message || 'Gagal memperbarui data',
      };
    }
  }

  /**
   * Delete penjualan
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(`${this.API_BASE}/hapus`, { pid });
      return {
        success: true,
        message: response.message || 'Data berhasil dihapus',
      };
    } catch (error) {
      console.error('[PenjualanQurbanService] Error deleting:', error);
      return {
        success: false,
        message: error.message || 'Gagal menghapus data',
      };
    }
  }

  /**
   * Add payment
   */
  static async addPembayaran(data) {
    try {
      const response = await HttpClient.post(`${this.API_BASE}/pembayaran/store`, data);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Pembayaran berhasil ditambahkan',
      };
    } catch (error) {
      console.error('[PenjualanQurbanService] Error adding payment:', error);
      return {
        success: false,
        message: error.message || 'Gagal menambahkan pembayaran',
      };
    }
  }

  /**
   * Update delivery status
   */
  static async updateStatusPengiriman(data) {
    try {
      const response = await HttpClient.post(`${this.API_BASE}/pengiriman/update-status`, data);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Status pengiriman berhasil diperbarui',
      };
    } catch (error) {
      console.error('[PenjualanQurbanService] Error updating status:', error);
      return {
        success: false,
        message: error.message || 'Gagal memperbarui status',
      };
    }
  }

  /**
   * Format currency
   */
  static formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Get status pengiriman label
   */
  static getStatusPengirimanLabel(status) {
    const labels = {
      1: { text: 'BELUM DIKIRIM', color: 'gray' },
      2: { text: 'SEDANG DIKIRIM', color: 'blue' },
      3: { text: 'TERKIRIM', color: 'green' },
      4: { text: 'RETUR', color: 'red' },
    };
    return labels[status] || { text: 'UNKNOWN', color: 'gray' };
  }

  /**
   * Get status pembayaran label
   */
  static getStatusPembayaranLabel(status) {
    const labels = {
      'LUNAS': { text: 'LUNAS', color: 'green' },
      'BELUM LUNAS': { text: 'BELUM LUNAS', color: 'yellow' },
      'BELUM DIBAYAR': { text: 'BELUM DIBAYAR', color: 'red' },
    };
    return labels[status] || { text: status, color: 'gray' };
  }
}

export default PenjualanQurbanService;
