/**
 * Pengajuan Biaya Service
 * Service layer for handling all Pengajuan Biaya API operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class PengajuanBiayaService {
  /**
   * Get list of Pengajuan Biaya with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.start - Starting index for pagination
   * @param {number} params.length - Number of records per page
   * @param {string} params.search - Search term
   * @param {number} params.draw - Draw counter for DataTables
   * @returns {Promise} API response with data
   */
  static async getData(params = {}) {
    try {
      // Build query parameters for DataTables format
      const queryParams = {
        start: params.start || 0,
        length: params.length || 10,
        draw: params.draw || 1,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || '0',
        'order[0][dir]': params.orderDir || 'desc',
        tipe: params.tipe || 2, // ✅ Tambahkan parameter tipe (default 2 untuk menunggu persetujuan)
        _: Date.now() // Cache buster
      };

      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/data`, {
        params: queryParams
      });

      // Transform response to match expected format
      return {
        draw: response.draw,
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        data: response.data || [],
        success: true
      };
    } catch (error) {
      console.error('Error fetching Pengajuan Biaya data:', error);
      throw error;
    }
  }

  /**
   * Get detail of specific Pengajuan Biaya
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
   */
  static async getDetail(pid) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/show`, {
        pid
      });

      // Backend returns data as array, get first item
      const detailData = Array.isArray(response.data) && response.data.length > 0
        ? response.data[0]
        : (response.data || {});

      return {
        success: true,
        data: detailData,
        message: response.message || 'Detail berhasil dimuat'
      };
    } catch (error) {
      console.error('Error fetching Pengajuan Biaya detail:', error);
      throw error;
    }
  }

  /**
   * Get card/dashboard statistics
   * @returns {Promise} API response with statistics
   */
  static async getCardData() {
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/card`);

      // Backend returns: { data: [{ pengajuanmenunggupersetujuan: {...}, pengajuanhariini: {...}, ... }] }
      // Transform to frontend format
      let transformedData = {
        pending: { count: 0, nominal: 0 },
        today: { count: 0, nominal: 0 },
        thisWeek: { count: 0, nominal: 0 },
        thisMonth: { count: 0, nominal: 0 },
        thisYear: { count: 0, nominal: 0 }
      };

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const cardData = response.data[0];
        
        // Map backend keys to frontend format
        if (cardData.pengajuanmenunggupersetujuan) {
          transformedData.pending = {
            count: cardData.pengajuanmenunggupersetujuan.jumlah || 0,
            nominal: cardData.pengajuanmenunggupersetujuan.nominal || 0
          };
        }
        
        if (cardData.pengajuanhariini) {
          transformedData.today = {
            count: cardData.pengajuanhariini.jumlah || 0,
            nominal: cardData.pengajuanhariini.nominal || 0
          };
        }
        
        if (cardData.pengajuanmingguini) {
          transformedData.thisWeek = {
            count: cardData.pengajuanmingguini.jumlah || 0,
            nominal: cardData.pengajuanmingguini.nominal || 0
          };
        }
        
        if (cardData.pengajuanbulanini) {
          transformedData.thisMonth = {
            count: cardData.pengajuanbulanini.jumlah || 0,
            nominal: cardData.pengajuanbulanini.nominal || 0
          };
        }
        
        if (cardData.pengajuantahunini) {
          transformedData.thisYear = {
            count: cardData.pengajuantahunini.jumlah || 0,
            nominal: cardData.pengajuantahunini.nominal || 0
          };
        }
      }

      return {
        success: true,
        data: transformedData,
        message: response.message || 'Statistik berhasil dimuat'
      };
    } catch (error) {
      console.error('Error fetching Pengajuan Biaya card data:', error);
      throw error;
    }
  }

  /**
   * Create new Pengajuan Biaya
   * @param {Object} data - Pengajuan Biaya data
   * @param {number} data.id_jenis_biaya - Expense type ID
   * @param {number} data.nominal - Amount
   * @param {string} data.tgl_pengajuan - Submission date
   * @param {string} data.keperluan - Purpose (max 150 chars)
   * @param {string} data.nama_pengaju - Submitter name (max 50 chars)
   * @param {number} data.id_metode_bayar - Payment method ID
   * @param {number} data.id_persetujuan_ho - HO approval ID
   * @param {string} data.catatan - Notes
   * @returns {Promise} API response
   */
  static async store(data) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/store`, data);

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil disimpan'
      };
    } catch (error) {
      console.error('Error creating Pengajuan Biaya:', error);
      throw error;
    }
  }

  /**
   * Update existing Pengajuan Biaya
   * @param {string} pid - Encrypted PID
   * @param {Object} data - Updated data
   * @returns {Promise} API response
   */
  static async update(pid, data) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/update`, {
        pid,
        ...data
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil diperbarui'
      };
    } catch (error) {
      console.error('Error updating Pengajuan Biaya:', error);
      throw error;
    }
  }

  /**
   * Delete Pengajuan Biaya
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENGAJUAN_BIAYA}/hapus`, {
        pid
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil dihapus'
      };
    } catch (error) {
      console.error('Error deleting Pengajuan Biaya:', error);
      throw error;
    }
  }

  /**
   * Transform backend data to frontend format
   * @param {Object} item - Backend data item
   * @returns {Object} Transformed data
   */
  static transformData(item) {
    return {
      // IDs
      pubid: item.pubid || item.id,
      pid: item.pid, // Encrypted PID for API calls
      
      // Core fields - map backend to frontend
      nomor_pengajuan: item.nomor_pengajuan || '',
      keperluan: item.keperluan || '',
      barang_yang_diajukan: item.keperluan || '', // Display field
      nominal: parseFloat(item.nominal) || 0,
      tgl_pengajuan: item.tgl_pengajuan || '',
      nama_pengaju: item.nama_pengaju || '',
      yang_mengajukan: item.nama_pengaju || '', // Display field
      
      // Related data
      jenis_biaya: item.jenis_biaya || item.nama_jenis_biaya || '',
      id_jenis_biaya: item.id_jenis_biaya || null,
      metode_bayar: item.metode_bayar || item.nama_metode_bayar || '',
      id_metode_bayar: item.id_metode_bayar || null,
      persetujuan_ho: item.persetujuan_ho || item.nama_persetujuan_ho || '',
      id_persetujuan_ho: item.id_persetujuan_ho || null,
      
      // Status and notes
      status: item.status || 'Menunggu Persetujuan',
      catatan: item.catatan || '',
      reason: item.reason || '',
      
      // Timestamps
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      
      // Keep original data for reference
      _original: item
    };
  }

  /**
   * Transform frontend data to backend format
   * @param {Object} data - Frontend data
   * @returns {Object} Backend format data
   */
  static transformToBackend(data) {
    // Ensure nominal is a pure number (remove any formatting)
    const nominalValue = typeof data.nominal === 'string'
      ? parseFloat(data.nominal.replace(/[^0-9]/g, ''))
      : parseFloat(data.nominal);

    return {
      id_jenis_biaya: parseInt(data.id_jenis_biaya) || null,
      nominal: nominalValue || 0,
      tgl_pengajuan: data.tgl_pengajuan,
      keperluan: (data.keperluan || data.barang_yang_diajukan || '').trim(),
      nama_pengaju: (data.nama_pengaju || data.yang_mengajukan || '').trim(),
      id_metode_bayar: parseInt(data.id_metode_bayar) || null,
      id_persetujuan_ho: parseInt(data.id_persetujuan_ho) || null,
      catatan: (data.catatan || '').trim()
    };
  }

  /**
   * Get status badge configuration based on status
   * @param {string} status - Status text
   * @returns {Object} Status badge configuration
   */
  static getStatusInfo(status) {
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower.includes('disetujui')) {
      return {
        label: 'Disetujui',
        color: 'green',
        bgClass: 'bg-green-50',
        textClass: 'text-green-700',
        borderClass: 'border-green-200'
      };
    }
    
    if (statusLower.includes('ditolak')) {
      return {
        label: 'Ditolak',
        color: 'red',
        bgClass: 'bg-red-50',
        textClass: 'text-red-700',
        borderClass: 'border-red-200'
      };
    }
    
    // Default: Menunggu Persetujuan
    return {
      label: 'Menunggu Persetujuan',
      color: 'yellow',
      bgClass: 'bg-yellow-50',
      textClass: 'text-yellow-700',
      borderClass: 'border-yellow-200'
    };
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  /**
   * Format date for display
   * @param {string} date - Date string
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    if (!date) return '-';
    
    try {
      const dateObj = new Date(date);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      return date;
    }
  }
}

export default PengajuanBiayaService;