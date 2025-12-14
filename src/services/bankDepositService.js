/**
 * Bank Deposit Service
 * Service layer for handling all Bank Deposit API operations
 */

import HttpClient from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class BankDepositService {
  /**
   * Convert pagination params to DataTables format
   * @param {number} page - Current page (1-based)
   * @param {number} perPage - Items per page
   * @param {string} search - Search term
   * @param {number} orderColumn - Column index for ordering
   * @param {string} orderDir - Order direction ('asc' or 'desc')
   * @param {Object} filters - Additional filters (startDate, endDate)
   * @returns {Object} DataTables formatted parameters
   */
  static convertToDataTablesParams(page = 1, perPage = 10, search = '', orderColumn = 0, orderDir = 'desc', filters = {}) {
    const start = (page - 1) * perPage;
    
    const params = {
      draw: Date.now(), // Use timestamp as draw counter
      start: start,
      length: perPage,
      'search[value]': search || '',
      'search[regex]': false,
      'order[0][column]': orderColumn,
      'order[0][dir]': orderDir
    };

    // Add date range filters if provided
    if (filters.startDate) {
      params.start_date = filters.startDate;
    }
    if (filters.endDate) {
      params.end_date = filters.endDate;
    }

    return params;
  }

  /**
   * Get list of Bank Deposits with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Current page
   * @param {number} params.perPage - Items per page
   * @param {string} params.search - Search term
   * @param {string} params.startDate - Start date filter (YYYY-MM-DD)
   * @param {string} params.endDate - End date filter (YYYY-MM-DD)
   * @returns {Promise} API response with data
   */
  static async getBankDeposits(params = {}) {
    try {
      const {
        page = 1,
        perPage = 10,
        search = '',
        startDate = null,
        endDate = null,
        orderColumn = 0,
        orderDir = 'desc'
      } = params;

      // Convert to DataTables format
      const queryParams = this.convertToDataTablesParams(
        page,
        perPage,
        search,
        orderColumn,
        orderDir,
        { startDate, endDate }
      );

      const response = await HttpClient.get(API_ENDPOINTS.HO.BANK_DEPOSIT.DATA, {
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
      console.error('Error fetching Bank Deposit data:', error);
      throw error;
    }
  }

  /**
   * Get detail of specific Bank Deposit
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response with detail data
   */
  static async getBankDepositDetail(pid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.BANK_DEPOSIT.SHOW, {
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
      console.error('Error fetching Bank Deposit detail:', error);
      throw error;
    }
  }

  /**
   * Create new Bank Deposit
   * @param {FormData} formData - Form data with file upload
   * @returns {Promise} API response
   */
  static async createBankDeposit(formData) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.BANK_DEPOSIT.STORE, formData);

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil disimpan'
      };
    } catch (error) {
      console.error('Error creating Bank Deposit:', error);
      throw error;
    }
  }

  /**
   * Update existing Bank Deposit
   * @param {string} pid - Encrypted PID
   * @param {FormData} formData - Form data with file upload
   * @returns {Promise} API response
   */
  static async updateBankDeposit(pid, formData) {
    try {
      // Add pid to FormData
      formData.append('pid', pid);

      const response = await HttpClient.post(API_ENDPOINTS.HO.BANK_DEPOSIT.UPDATE, formData);

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil diperbarui'
      };
    } catch (error) {
      console.error('Error updating Bank Deposit:', error);
      throw error;
    }
  }

  /**
   * Delete Bank Deposit
   * @param {string} pid - Encrypted PID
   * @returns {Promise} API response
   */
  static async deleteBankDeposit(pid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.HO.BANK_DEPOSIT.DELETE, {
        pid
      });

      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil dihapus'
      };
    } catch (error) {
      console.error('Error deleting Bank Deposit:', error);
      throw error;
    }
  }

  /**
   * Create FormData for Bank Deposit submission
   * @param {Object} data - Bank deposit data
   * @param {string} data.deposit_date - Deposit date (YYYY-MM-DD)
   * @param {number} data.id_bank - Bank ID
   * @param {string} data.depositor_name - Depositor name
   * @param {number} data.amount - Amount
   * @param {File} data.proof_of_deposit - Proof file (optional)
   * @returns {FormData} FormData object ready for submission
   */
  static createFormData(data) {
    const formData = new FormData();

    // Add required fields
    if (data.deposit_date) {
      formData.append('deposit_date', data.deposit_date);
    }
    if (data.id_bank) {
      formData.append('id_bank', data.id_bank);
    }
    if (data.depositor_name) {
      formData.append('depositor_name', data.depositor_name);
    }
    if (data.amount !== undefined && data.amount !== null) {
      // Ensure amount is a number without formatting
      const amountValue = typeof data.amount === 'string'
        ? parseFloat(data.amount.replace(/[^0-9]/g, ''))
        : parseFloat(data.amount);
      formData.append('amount', amountValue);
    }

    // Add optional file
    if (data.proof_of_deposit && data.proof_of_deposit instanceof File) {
      formData.append('proof_of_deposit', data.proof_of_deposit);
    }

    return formData;
  }

  /**
   * Transform backend data to frontend format
   * @param {Object} item - Backend data item
   * @returns {Object} Transformed data
   */
  static transformData(item) {
    return {
      // IDs
      id: item.id,
      pubid: item.pubid,
      pid: item.pid, // Encrypted PID for API calls
      
      // Core fields
      deposit_date: item.deposit_date || '',
      id_bank: item.id_bank || null,
      depositor_name: item.depositor_name || '',
      amount: parseFloat(item.amount) || 0,
      
      // Bank relationship
      bank: item.bank || null,
      nama_bank: item.nama_bank || (item.bank ? item.bank.nama : ''),
      
      // File fields
      proof_of_deposit: item.proof_of_deposit || null,
      proof_of_deposit_url: item.proof_of_deposit_url || null,
      proof_status: item.proof_status !== undefined ? item.proof_status : null,
      
      // Timestamps
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      
      // Keep original data for reference
      _original: item
    };
  }

  /**
   * Get status badge configuration based on proof_status
   * @param {number|null} proofStatus - Proof status (0: uploading, 1: success, null: no file)
   * @returns {Object} Status badge configuration
   */
  static getProofStatusInfo(proofStatus) {
    if (proofStatus === 0) {
      return {
        label: 'Sedang Upload',
        color: 'yellow',
        bgClass: 'bg-yellow-50',
        textClass: 'text-yellow-700',
        borderClass: 'border-yellow-200'
      };
    }
    
    if (proofStatus === 1) {
      return {
        label: 'Berhasil',
        color: 'green',
        bgClass: 'bg-green-50',
        textClass: 'text-green-700',
        borderClass: 'border-green-200'
      };
    }
    
    // null or undefined: no file
    return {
      label: 'Tidak Ada File',
      color: 'gray',
      bgClass: 'bg-gray-50',
      textClass: 'text-gray-700',
      borderClass: 'border-gray-200'
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
   * Validate file for upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result { valid: boolean, error: string }
   */
  static validateFile(file) {
    if (!file) {
      return { valid: true, error: null }; // File is optional
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Format file harus jpg, jpeg, png, atau pdf'
      };
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Ukuran file maksimal 2MB'
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Validate form data before submission
   * @param {Object} data - Form data to validate
   * @returns {Object} Validation result { valid: boolean, errors: Object }
   */
  static validateFormData(data) {
    const errors = {};

    // Validate deposit_date
    if (!data.deposit_date) {
      errors.deposit_date = 'Tanggal setor wajib diisi';
    }

    // Validate id_bank
    if (!data.id_bank) {
      errors.id_bank = 'Bank wajib dipilih';
    }

    // Validate depositor_name
    if (!data.depositor_name || data.depositor_name.trim() === '') {
      errors.depositor_name = 'Nama penyetor wajib diisi';
    } else if (data.depositor_name.length > 50) {
      errors.depositor_name = 'Nama penyetor maksimal 50 karakter';
    }

    // Validate amount
    if (data.amount === undefined || data.amount === null || data.amount === '') {
      errors.amount = 'Jumlah wajib diisi';
    } else {
      const amountValue = typeof data.amount === 'string'
        ? parseFloat(data.amount.replace(/[^0-9]/g, ''))
        : parseFloat(data.amount);
      
      if (isNaN(amountValue) || amountValue < 0) {
        errors.amount = 'Jumlah harus lebih besar dari 0';
      }
    }

    // Validate file if provided
    if (data.proof_of_deposit) {
      const fileValidation = this.validateFile(data.proof_of_deposit);
      if (!fileValidation.valid) {
        errors.proof_of_deposit = fileValidation.error;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default BankDepositService;
