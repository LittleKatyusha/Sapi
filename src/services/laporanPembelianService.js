/**
 * Laporan Pembelian Service
 * Service untuk menangani API calls untuk laporan pembelian
 */

import HttpClient from './httpClient.js';
import { API_BASE_URL } from '../config/api.js';
import { secureStorage } from '../utils/security.js';

class LaporanPembelianService {
  
  /**
   * Get laporan per nota supplier
   * Sementara menggunakan endpoint yang sama dengan parameter tanggal
   * @param {string} startDate - Tanggal mulai (YYYY-MM-DD)
   * @param {string} endDate - Tanggal akhir (YYYY-MM-DD)
   * @returns {Promise} - Response dari API
   */
  static async getReportNotaSupplier(startDate, endDate) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportAllSupplier', {
        params: { 
          start_date: startDate,
          end_date: endDate 
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting report nota supplier:', error);
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
   * Get laporan pajak supplier
   * Sementara menggunakan endpoint yang sama
   * @param {string} startDate - Tanggal mulai (YYYY-MM-DD)
   * @param {string} endDate - Tanggal akhir (YYYY-MM-DD)
   * @returns {Promise} - Response dari API
   */
  static async getReportSupplierTax(startDate, endDate) {
    try {
      const response = await HttpClient.get('/api/report/pembelian/getReportAllSupplier', {
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
   * Semua endpoint menggunakan getReportAllSupplier sementara
   * Menggunakan HttpClient untuk consistency dengan auth flow
   * @param {string} endpoint - API endpoint (tidak digunakan, semua menggunakan getReportAllSupplier)
   * @param {Object} params - Parameters untuk request
   * @returns {Promise} - Blob response
   */
  static async downloadPdfReport(endpoint, params) {
    // Gunakan HttpClient untuk consistency dengan authentication
    return await this.downloadPdfWithHttpClient(params);
  }

  /**
   * PDF download menggunakan HttpClient dengan handling khusus untuk blob response
   * @param {Object} params - Parameters untuk request
   * @returns {Promise} - Blob response
   */
  static async downloadPdfWithHttpClient(params) {
    try {
      console.log('🔐 Making PDF request with HttpClient:', {
        endpoint: '/api/report/pembelian/getReportAllSupplier',
        params: params
      });

      // Gunakan fetch langsung dengan HttpClient headers untuk blob response
      // Build URL dengan parameters
      let url = `/api/report/pembelian/getReportAllSupplier`;
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

      // Get JWT token menggunakan secureStorage (sama seperti useAuthSecure)
      let token = secureStorage.getItem('token');
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
