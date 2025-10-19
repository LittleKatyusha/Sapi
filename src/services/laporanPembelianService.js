/**
 * Laporan Pembelian Service
 * Service untuk menangani API calls untuk laporan pembelian
 */

import HttpClient from './httpClient.js';
import { API_BASE_URL } from '../config/api.js';


class LaporanPembelianService {
  
  /**
   * Get laporan per nota supplier
   * @param {string} id - ID pembelian yang akan dilaporkan
   * @returns {Promise} - Response dari API
   */
  static async getReportNotaSupplier(id) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportNotaSupplier', {
        params: { 
          id: id
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting report nota supplier:', error);
      throw error;
    }
  }

  /**
   * Get laporan per nota feedmil
   * @param {string} id - ID pembelian feedmil yang akan dilaporkan
   * @returns {Promise} - Response dari API
   */
  static async getReportNotaFeedmil(id) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportNotaFeedmil', {
        params: { 
          id: id
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting report nota feedmil:', error);
      throw error;
    }
  }

  /**
   * Get laporan per nota OVK
   * @param {string} id - ID pembelian OVK yang akan dilaporkan
   * @returns {Promise} - Response dari API
   */
  static async getReportNotaOvk(id) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportNotaOvk', {
        params: { 
          id: id
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting report nota OVK:', error);
      throw error;
    }
  }

  /**
   * Get laporan semua supplier
   * @param {string} startDate - Tanggal mulai (YYYY-MM-DD)
   * @param {string} endDate - Tanggal akhir (YYYY-MM-DD)
   * @returns {Promise} - Response dari API
   */
  static async getReportAllSupplier(startDate, endDate) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportAllSupplier', {
        params: { 
          start_date: startDate,
          end_date: endDate 
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting report all supplier:', error);
      throw error;
    }
  }

  /**
   * Get laporan pembelian lain-lain (Other HO)
   * @param {string} startDate - Tanggal mulai (YYYY-MM-DD)
   * @param {string} endDate - Tanggal akhir (YYYY-MM-DD)
   * @param {number} idTipePembelian - ID tipe pembelian
   * @returns {Promise} - Response dari API
   */
  static async getReportOtherHo(startDate, endDate, idTipePembelian) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportOtherHo', {
        params: {
          start_date: startDate,
          end_date: endDate,
          id_tipe_pembelian: idTipePembelian
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting report other HO:', error);
      throw error;
    }
  }

  /**
   * Get all available nota numbers for dropdown selection
   * @returns {Promise} - Response dari API containing list of nota numbers
   */
  static async getAllNotaNumbers() {
    try {
      const response = await HttpClient.get('/api/ho/pembelian/data', {
        params: { 
          start: 0,
          length: 10000, // Get a large number to get all records
          draw: Date.now(),
          'search[value]': '',
          'order[0][column]': '0',
          'order[0][dir]': 'asc'
        }
      });
      
      // Extract nota numbers from the response
      if (response.data && Array.isArray(response.data)) {
        const notaList = response.data
          .filter(item => item.nota) // Filter out items without nota
          .map(item => ({
            value: item.nota,
            label: item.nota,
            supplier: item.nama_supplier || 'Unknown Supplier'
          }))
          .filter((nota, index, self) => 
            index === self.findIndex(n => n.value === nota.value)
          ); // Remove duplicates
        
        return {
          success: true,
          data: notaList
        };
      }
      
      return {
        success: false,
        data: []
      };
    } catch (error) {
      console.error('Error getting all nota numbers:', error);
      throw error;
    }
  }

  /**
   * Get laporan pajak supplier
   * @param {string} startDate - Tanggal mulai (YYYY-MM-DD)
   * @param {string} endDate - Tanggal akhir (YYYY-MM-DD)
   * @returns {Promise} - Response dari API
   */
  static async getReportSupplierTax(startDate, endDate) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportSupplierTax', {
        params: { 
          start_date: startDate,
          end_date: endDate 
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting report supplier tax:', error);
      throw error;
    }
  }

  /**
   * Download PDF report dengan handling untuk response blob
   * Menggunakan HttpClient untuk consistency dengan auth flow
   * @param {string} endpoint - API endpoint yang akan digunakan
   * @param {Object} params - Parameters untuk request
   * @returns {Promise} - Blob response
   */
  static async downloadPdfReport(endpoint, params) {
    // Gunakan HttpClient untuk consistency dengan authentication
    return await this.downloadPdfWithHttpClient(endpoint, params);
  }

  /**
   * PDF download menggunakan HttpClient dengan handling khusus untuk blob response
   * @param {string} endpoint - API endpoint yang akan digunakan
   * @param {Object} params - Parameters untuk request
   * @returns {Promise} - Blob response
   */
  static async downloadPdfWithHttpClient(endpoint, params) {
    try {
      const apiEndpoint = `/api/report/pembelian/${endpoint}`;
      console.log('🔐 Making PDF request with HttpClient:', {
        endpoint: apiEndpoint,
        params: params
      });

      // Gunakan fetch langsung dengan HttpClient headers untuk blob response
      // Build URL dengan parameters
      let url = apiEndpoint;
      const urlParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlParams.append(key, value);
        }
      });
      
      const queryString = urlParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }

      // Get JWT token from localStorage
      let token = localStorage.getItem('token');
      if (!token) {
        // Fallback ke method lama untuk backward compatibility
        token = localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
      }

      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      // Headers yang konsisten dengan HttpClient
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };

      const fullUrl = `${API_BASE_URL}${url}`;
      
      console.log('🔐 Making PDF request:', {
        fullUrl,
        method: 'GET',
        token: token ? `${token.substring(0, 10)}...` : 'Missing',
        params: params
      });

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: headers
        // NO credentials: 'include' for JWT-only authentication
      });

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = null;
        
        // Try to get more specific error message
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorDetails = errorData;
          } else {
            // For non-JSON responses, get text for debugging
            const responseText = await response.text();
            console.error('📄 Non-JSON error response:', responseText.substring(0, 500));
          }
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
        }
        
        console.error('🚨 PDF Request Failed:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          errorMessage,
          errorDetails
        });
        
        throw new Error(errorMessage);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error in PDF download with HttpClient:', error);
      throw error;
    }
  }

  /**
   * Download PDF report for regular pembelian (supplier)
   * @param {string} id - ID pembelian
   * @returns {Promise} - Blob response
   */
  static async downloadReportNotaSupplier(id) {
    return await this.downloadPdfReport('getReportNotaSupplier', { id });
  }

  /**
   * Download PDF report for pembelian feedmil
   * @param {string} id - ID pembelian feedmil
   * @returns {Promise} - Blob response
   */
  static async downloadReportNotaFeedmil(id) {
    return await this.downloadPdfReport('getReportNotaFeedmil', { id });
  }

  /**
   * Download PDF report for pembelian OVK
   * @param {string} id - ID pembelian OVK
   * @returns {Promise} - Blob response
   */
  static async downloadReportNotaOvk(id) {
    return await this.downloadPdfReport('getReportNotaOvk', { id });
  }

  /**
   * Download PDF report for all suppliers
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Blob response
   */
  static async downloadReportAllSupplier(startDate, endDate) {
    return await this.downloadPdfReport('getReportAllSupplier', { 
      start_date: startDate, 
      end_date: endDate 
    });
  }

  /**
   * Download PDF report for supplier tax
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Blob response
   */
  static async downloadReportSupplierTax(startDate, endDate) {
    return await this.downloadPdfReport('getReportSupplierTax', { 
      start_date: startDate, 
      end_date: endDate 
    });
  }

  /**
   * Download PDF report for pembelian lain-lain (Other HO)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {number} idTipePembelian - ID tipe pembelian
   * @returns {Promise} - Blob response
   */
  static async downloadReportOtherHo(startDate, endDate, idTipePembelian) {
    return await this.downloadPdfReport('getReportOtherHo', {
      start_date: startDate,
      end_date: endDate,
      id_tipe_pembelian: idTipePembelian
    });
  }

  /**
   * DEPRECATED: Direct PDF download dengan JWT authentication
   * Use downloadPdfWithHttpClient instead for consistency
   * @param {Object} params - Parameters untuk request
   * @returns {Promise} - Blob response
   */
  static async downloadPdfDirect(params) {
    console.warn('⚠️ downloadPdfDirect is deprecated, use downloadPdfWithHttpClient instead');
    return await this.downloadPdfWithHttpClient(params);
  }
}

export default LaporanPembelianService;
