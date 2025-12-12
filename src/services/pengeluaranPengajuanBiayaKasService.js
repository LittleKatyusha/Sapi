/**
 * Pengeluaran Pengajuan Biaya Kas Service
 * Service layer for handling cash disbursement and approval operations
 * Integrates with PengeluaranPengajuanBiayaKasController
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class PengeluaranPengajuanBiayaKasService {
  /**
   * Get list of Pengeluaran Pengajuan Biaya with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.start - Starting index for pagination
   * @param {number} params.length - Number of records per page
   * @param {string} params.search - Search term
   * @param {number} params.draw - Draw counter for DataTables
   * @param {string} params.start_date - Start date for filtering (optional)
   * @param {string} params.end_date - End date for filtering (optional)
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
        _: Date.now() // Cache buster
      };

      // Add date range filters if provided
      if (params.start_date) {
        queryParams.start_date = params.start_date;
      }
      if (params.end_date) {
        queryParams.end_date = params.end_date;
      }

      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENGELUARAN_PENGAJUAN_BIAYA_KAS}/data`, {
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
      console.error('Error fetching Pengeluaran Pengajuan Biaya data:', error);
      throw error;
    }
  }

  /**
   * Get detail of specific Pengeluaran Pengajuan Biaya
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
   */
  static async getDetail(pid) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENGELUARAN_PENGAJUAN_BIAYA_KAS}/show`, {
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
      console.error('Error fetching Pengeluaran Pengajuan Biaya detail:', error);
      throw error;
    }
  }

  /**
   * Get card/dashboard statistics
   * @returns {Promise} API response with statistics
   */
  static async getCardData() {
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.HO.PENGELUARAN_PENGAJUAN_BIAYA_KAS}/card`);

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
      console.error('Error fetching Pengeluaran Pengajuan Biaya card data:', error);
      throw error;
    }
  }

  /**
   * Approve cash budget request
   * @param {string} pid - Encrypted PID
   * @param {Object} data - Approval data
   * @param {number} data.nominal_disetujui - Approved amount
   * @param {number} data.id_disetujui - Approver ID
   * @param {string} data.penerima_nominal - Recipient name
   * @param {string} data.tgl_pembayaran - Payment date
   * @param {string} data.kota_pembayaran - Payment city
   * @param {string} data.catatan_persetujuan - Approval notes (optional)
   * @param {File} data.file - Payment receipt file (optional)
   * @returns {Promise} API response
   */
  static async approve(pid, data) {
    try {
      // Create FormData for file upload support
      const formData = new FormData();
      formData.append('pid', pid);
      formData.append('nominal_disetujui', data.nominal_disetujui);
      formData.append('id_disetujui', data.id_disetujui);
      formData.append('penerima_nominal', data.penerima_nominal);
      formData.append('tgl_pembayaran', data.tgl_pembayaran);
      formData.append('kota_pembayaran', data.kota_pembayaran);
      
      if (data.catatan_persetujuan) {
        formData.append('catatan_persetujuan', data.catatan_persetujuan);
      }
      
      if (data.file) {
        formData.append('file', data.file);
      }

      // Don't set Content-Type header - let browser set it automatically with boundary
      // HttpClient will automatically add Authorization header
      const response = await HttpClient.post(
        `${API_ENDPOINTS.HO.PENGELUARAN_PENGAJUAN_BIAYA_KAS}/approve`,
        formData
      );

      return {
        success: true,
        data: response.data,
        message: response.message || 'Pengajuan berhasil disetujui'
      };
    } catch (error) {
      console.error('Error approving Pengajuan Biaya:', error);
      throw error;
    }
  }

  /**
   * Reject cash budget request
   * @param {string} pid - Encrypted PID
   * @param {string} reason - Rejection reason
   * @returns {Promise} API response
   */
  static async reject(pid, reason) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENGELUARAN_PENGAJUAN_BIAYA_KAS}/reject`, {
        pid,
        reason
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Pengajuan berhasil ditolak'
      };
    } catch (error) {
      console.error('Error rejecting Pengajuan Biaya:', error);
      throw error;
    }
  }

  /**
   * Delete Pengeluaran Pengajuan Biaya
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async delete(pid) {
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.HO.PENGELUARAN_PENGAJUAN_BIAYA_KAS}/hapus`, {
        pid
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil dihapus'
      };
    } catch (error) {
      console.error('Error deleting Pengeluaran Pengajuan Biaya:', error);
      throw error;
    }
  }

  /**
   * Get file/receipt from MinIO storage
   * @param {string} filePath - File path in storage
   * @returns {string} Full URL to file
   */
  static getFileUrl(filePath) {
    if (!filePath) return null;
    return `${API_ENDPOINTS.HO.PENGELUARAN_PENGAJUAN_BIAYA_KAS}/file/${encodeURIComponent(filePath)}`;
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
      
      // Office/Division data
      divisi: item.divisi || '',
      
      // Approval fields
      nama_persetujuan: item.nama_persetujuan || item.nama_pesetujuan || '',
      catatan_persetujuan: item.catatan_persetujuan || item.catatan_pesetujuan || '',
      nominal_disetujui: parseFloat(item.nominal_disetujui) || 0,
      penerima_nominal: item.penerima_nominal || '',
      tgl_pembayaran: item.tgl_pembayaran || '',
      kota_pembayaran: item.kota_pembayaran || '',
      file: item.file || null,
      
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
   * Transform frontend approval data to backend format
   * @param {Object} data - Frontend data
   * @returns {Object} Backend format data
   */
  static transformApprovalToBackend(data) {
    // Ensure nominal is a pure number (remove any formatting)
    const nominalValue = typeof data.nominal_disetujui === 'string'
      ? parseFloat(data.nominal_disetujui.replace(/[^0-9]/g, ''))
      : parseFloat(data.nominal_disetujui);

    return {
      nominal_disetujui: nominalValue || 0,
      id_disetujui: parseInt(data.id_disetujui) || null,
      penerima_nominal: (data.penerima_nominal || '').trim(),
      tgl_pembayaran: data.tgl_pembayaran,
      kota_pembayaran: (data.kota_pembayaran || '').trim(),
      catatan_persetujuan: (data.catatan_persetujuan || '').trim(),
      file: data.file || null
    };
  }

  /**
   * Get status badge configuration based on status
   * @param {string|number} status - Status text or number
   * @returns {Object} Status badge configuration
   */
  static getStatusInfo(status) {
    // Convert numeric status to text
    let statusText = status;
    if (typeof status === 'number') {
      switch (status) {
        case 1:
          statusText = 'Menunggu Persetujuan';
          break;
        case 2:
          statusText = 'Disetujui';
          break;
        case 3:
          statusText = 'Ditolak';
          break;
        default:
          statusText = 'Menunggu Persetujuan';
      }
    }
    
    const statusLower = (statusText || '').toLowerCase();
    
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

  /**
   * Validate approval data before submission
   * @param {Object} data - Approval data to validate
   * @returns {Object} Validation result { valid: boolean, errors: array }
   */
  static validateApprovalData(data) {
    const errors = [];

    if (!data.nominal_disetujui || parseFloat(data.nominal_disetujui) <= 0) {
      errors.push('Nominal yang disetujui harus lebih dari 0');
    }

    if (!data.id_disetujui) {
      errors.push('Persetujuan harus dipilih');
    }

    if (!data.penerima_nominal || data.penerima_nominal.trim().length === 0) {
      errors.push('Penerima nominal harus diisi');
    }

    if (data.penerima_nominal && data.penerima_nominal.length > 150) {
      errors.push('Penerima nominal maksimal 150 karakter');
    }

    if (!data.tgl_pembayaran) {
      errors.push('Tanggal pembayaran harus diisi');
    }

    if (!data.kota_pembayaran || data.kota_pembayaran.trim().length === 0) {
      errors.push('Kota pembayaran harus diisi');
    }

    // File validation if provided
    if (data.file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(data.file.type)) {
        errors.push('File harus berupa JPG, JPEG, PNG, atau PDF');
      }

      if (data.file.size > maxSize) {
        errors.push('Ukuran file maksimal 2MB');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate rejection data before submission
   * @param {string} reason - Rejection reason
   * @returns {Object} Validation result { valid: boolean, errors: array }
   */
  static validateRejectionData(reason) {
    const errors = [];

    if (!reason || reason.trim().length === 0) {
      errors.push('Alasan penolakan harus diisi');
    }

    if (reason && reason.length < 10) {
      errors.push('Alasan penolakan minimal 10 karakter');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default PengeluaranPengajuanBiayaKasService;