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
      const response = await HttpClient.get('/api/report/pembelian/nota-supplier', {
        params: {
          id: id  // Backend expects 'id' parameter, which should be an encrypted pubid
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
      const response = await HttpClient.get('/api/report/pembelian/nota-feedmil', {
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
      const response = await HttpClient.get('/api/report/pembelian/nota-ovk', {
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
      const response = await HttpClient.get('/api/report/pembelian/all-supplier', {
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
      const response = await HttpClient.get('/api/report/pembelian/other-ho', {
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
      
      // Extract nota numbers with encrypted pid from the response
      if (response.data && Array.isArray(response.data)) {
        console.log('Raw pembelian data sample:', response.data[0]); // Debug log
        
        const notaList = response.data
          .filter(item => item.nota && item.pid) // Filter out items without nota or pid (encrypted id)
          .map(item => ({
            value: item.pid,    // Use encrypted pid as the value (this is what backend expects as 'id')
            label: item.nota,   // Display nota number as the label
            supplier: item.nama_supplier || 'Unknown Supplier',
            originalNota: item.nota  // Keep original nota for reference
          }))
          .filter((nota, index, self) =>
            index === self.findIndex(n => n.value === nota.value)
          ); // Remove duplicates based on pid
        
        console.log('Processed nota list:', notaList.length, 'items');
        console.log('Sample nota item:', notaList[0]);
        
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
      const response = await HttpClient.get('/api/report/pembelian/supplier-tax', {
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
   * @param {string} endpoint - API endpoint yang akan digunakan (method name to be mapped)
   * @param {Object} params - Parameters untuk request
   * @returns {Promise} - Blob response
   */
  static async downloadPdfReport(endpoint, params) {
    // Map old method names to new endpoint names
    const endpointMapping = {
      'getReportNotaSupplier': 'nota-supplier',
      'getReportAllSupplier': 'all-supplier',
      'getReportSupplierTax': 'supplier-tax',
      'getReportNotaFeedmil': 'nota-feedmil',
      'getReportNotaOvk': 'nota-ovk',
      'getReportOtherHo': 'other-ho',
      'getReportBahanPembantuDaily': 'other-ho-daily-assistance',
      'getReportBahanPembantuMonthly': 'other-ho-monthly-assistance'
    };
    
    // Use the mapped endpoint or fallback to the provided endpoint
    const mappedEndpoint = endpointMapping[endpoint] || endpoint;
    
    console.log('📋 downloadPdfReport called with:', {
      originalEndpoint: endpoint,
      mappedEndpoint: mappedEndpoint,
      params: params
    });
    
    // Gunakan HttpClient untuk consistency dengan authentication
    return await this.downloadPdfWithHttpClient(mappedEndpoint, params);
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
        params: params,
        method: 'GET'
      });

      // Build URL dengan parameters untuk GET request
      let url = apiEndpoint;
      const urlParams = new URLSearchParams();
      
      // Log each parameter being added
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          console.log(`Adding param: ${key} = ${value}`);
          urlParams.append(key, value);
        }
      });
      
      const queryString = urlParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
      
      console.log('Final URL path:', url);

      // Get JWT token from localStorage
      let token = localStorage.getItem('token');
      if (!token) {
        // Fallback ke method lama untuk backward compatibility
        token = localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
      }

      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      // Headers yang konsisten dengan HttpClient - Remove Content-Type for GET
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
        'X-Requested-With': 'XMLHttpRequest'
      };

      const fullUrl = `${API_BASE_URL}${url}`;
      
      console.log('🔐 Making PDF GET request:', {
        fullUrl,
        method: 'GET',
        token: token ? `${token.substring(0, 10)}...` : 'Missing',
        params: params,
        queryString: queryString
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
            console.log('🔍 Error response data:', errorData);
            
            // Check for specific backend errors
            if (errorData.message && errorData.message.startsWith('-getReport')) {
              // This is a backend method error
              const methodName = errorData.message.substring(1); // Remove the leading '-'
              
              // Check if it's a missing parameter configuration
              if (errorData.data && errorData.data.includes('No query results for model [App\\Models\\System\\Parameter]')) {
                errorMessage = `Backend configuration error: Missing Jasper Report parameter in database for ${methodName}. Please check that all required JASPER_SERVER and JASPER_REPORT parameters are configured in the System Parameters table.`;
                console.error('⚠️ Backend missing configuration:', {
                  method: methodName,
                  details: errorData.data
                });
              } else {
                errorMessage = `Backend error in ${methodName}: ${errorData.data || 'Unknown error'}`;
                console.error('⚠️ Backend error:', errorData);
              }
            } else {
              errorMessage = errorData.message || errorData.error || errorMessage;
            }
            errorDetails = errorData;
          } else {
            // For non-JSON responses, get text for debugging
            const responseText = await response.text();
            console.error('📄 Non-JSON error response:', responseText.substring(0, 500));
            
            // Check if this is the weird method name error
            if (responseText.includes('-getReportNotaSupplier')) {
              errorMessage = 'Backend error: The server is not properly handling the report request. Please check backend configuration.';
            }
          }
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
        }
        
        console.error('🚨 PDF Request Failed:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          endpoint: endpoint,
          params: params,
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
  static async downloadReportNotaSupplier(nota) {
    return await this.downloadPdfReport('nota-supplier', { nota });
  }

  /**
   * Download PDF report for pembelian feedmil
   * @param {string} id - ID pembelian feedmil
   * @returns {Promise} - Blob response
   */
  static async downloadReportNotaFeedmil(id) {
    return await this.downloadPdfReport('nota-feedmil', { id });
  }

  /**
   * Download PDF report for pembelian OVK
   * @param {string} id - ID pembelian OVK
   * @returns {Promise} - Blob response
   */
  static async downloadReportNotaOvk(id) {
    return await this.downloadPdfReport('nota-ovk', { id });
  }

  /**
   * Download PDF report for all suppliers
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Blob response
   */
  static async downloadReportAllSupplier(startDate, endDate) {
    return await this.downloadPdfReport('all-supplier', {
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
    return await this.downloadPdfReport('supplier-tax', {
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
    return await this.downloadPdfReport('other-ho', {
      start_date: startDate,
      end_date: endDate,
      id_tipe_pembelian: idTipePembelian
    });
  }

  /**
   * Download PDF report for Bahan Pembantu Harian
   * @param {string} tglPembelian - Tanggal pembelian (YYYY-MM-DD)
   * @param {string} divisi - Divisi ID
   * @param {string} idTipePembayaran - Tipe Pembayaran ID
   * @param {string} petugas - Nama petugas
   * @returns {Promise} - Blob response
   */
  static async downloadReportBahanPembantuDaily(tglPembelian, divisi, idTipePembayaran, petugas) {
    return await this.downloadPdfReport('other-ho-daily-assistance', {
      tgl_pembelian: tglPembelian,
      divisi: divisi,
      id_tipe_pembayaran: idTipePembayaran,
      petugas: petugas
    });
  }

  /**
   * Download PDF report for Bahan Pembantu Bulanan
   * @param {Array<number>} bulan - Array of month numbers
   * @param {number} tahun - Tahun
   * @param {string} divisi - Divisi ID
   * @param {string} idTipePembayaran - Tipe Pembayaran ID
   * @param {string} petugas - Nama petugas
   * @returns {Promise} - Blob response
   */
  static async downloadReportBahanPembantuMonthly(bulan, tahun, divisi, idTipePembayaran, petugas) {
    return await this.downloadPdfReport('other-ho-monthly-assistance', {
      bulan: bulan,
      tahun: tahun,
      divisi: divisi,
      id_tipe_pembayaran: idTipePembayaran,
      petugas: petugas
    });
  }

  /**
   * Download PDF report for Beban Harian (Daily Expenses)
   * @param {string} inputDate - Tanggal input (YYYY-MM-DD)
   * @param {string} division - Division ID
   * @param {string} idTipePembayaran - Tipe Pembayaran ID
   * @param {string} petugas - Nama petugas
   * @returns {Promise} - Blob response
   */
  static async downloadReportBebanDaily(inputDate, division, idTipePembayaran, petugas) {
    return await this.downloadPdfReport('other-ho-load-other-daily', {
      input_date: inputDate,
      division: division,
      id_tipe_pembayaran: idTipePembayaran,
      petugas: petugas
    });
  }

  /**
   * Download PDF report for Beban Bulanan (Monthly Expenses)
   * @param {number} year - Tahun
   * @param {number} month - Bulan (1-12)
   * @param {string} division - Division ID
   * @param {string} idTipePembayaran - Tipe Pembayaran ID
   * @param {string} petugas - Nama petugas
   * @returns {Promise} - Blob response
   */
  static async downloadReportBebanMonthly(year, month, division, idTipePembayaran, petugas) {
    return await this.downloadPdfReport('other-ho-load-other-monthly', {
      year: year,
      month: month,
      division: division,
      id_tipe_pembayaran: idTipePembayaran,
      petugas: petugas
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
