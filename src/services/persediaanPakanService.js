/**
 * Persediaan Pakan Service
 * Service layer for RPH Persediaan Pakan (feed inventory) operations
 */

import HttpClient from './httpClient';

class PersediaanPakanService {
  // API endpoints — matched to backend PersediaanPakanRphController routes
  static API_STOK_BAHAN_BAKU = '/api/rph/persediaan/pakan/datastok';
  static API_DATA = '/api/rph/persediaan/pakan/data';
  static API_STORE = '/api/rph/persediaan/pakan/store';
  static API_UPDATE = '/api/rph/persediaan/pakan/update';
  static API_DELETE = '/api/rph/persediaan/pakan/hapus';
  static API_REKAP = '/api/rph/persediaan/pakan/datarekap';
  static API_SHOW = '/api/rph/persediaan/pakan/show';
  static API_COPY_TO_DATE = '/api/rph/persediaan/pakan/copy-to-date';
  static API_BERI_MAKAN = '/api/rph/persediaan/pakan/beri-makan';
  static API_RIWAYAT_PEMBERIAN = '/api/rph/persediaan/pakan/riwayat-pemberian';

  /**
   * Get stok bahan baku (raw material stock) list with server-side pagination + search
   * @param {Object} params - { page, per_page, search }
   * @returns {Promise} API response with stock data and pagination metadata
   */
  static async getStokBahanBaku(params = {}) {
    try {
      const query = {
        page: params.page ?? 1,
        per_page: params.per_page ?? 15,
        search: params.search ?? '',
        _ts: Date.now(),
      };
      const response = await HttpClient.get(this.API_STOK_BAHAN_BAKU, { params: query, cache: false });
      // HttpClient returns parsed JSON body: { status, data: [...], recordsTotal, lastPage, ... }
      const payload = response ?? {};
      const rawData = Array.isArray(payload?.data) ? payload.data : [];

      return {
        success: true,
        data: rawData.map(this.transformStokBahanBaku),
        recordsTotal: payload?.recordsTotal ?? rawData.length,
        recordsFiltered: payload?.recordsFiltered ?? rawData.length,
        page: payload?.page ?? query.page,
        perPage: payload?.perPage ?? query.per_page,
        lastPage: payload?.lastPage ?? 1,
        message: payload?.message || 'Data stok bahan baku berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching stok bahan baku:', error);
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat data stok bahan baku'
      };
    }
  }

  /**
   * Transform stok bahan baku data from API
   * @param {Object} item - Raw API data
   * @returns {Object} Transformed data
   */
  static transformStokBahanBaku(item) {
    return {
      id: item.id,
      name: item.name || '-',
      produk: item.produk || '-',
      satuan: item.satuan || item.unit || '-',
      harga: Number(item.harga) || 0,
      jumlah: Number(item.jumlah) || 0,
    };
  }

  /**
   * Get resep pakan (recipe) data in DataTable format
   * @param {Object} params - Query parameters (draw, start, length, search, etc.)
   * @returns {Promise} API response with paginated recipe data
   */
  static async getResepData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn || 0,
        'order[0][dir]': params.orderDir || 'desc',
        _ts: Date.now(),
      });

      // Add date range if provided
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);

      // Advanced filters
      if (params.kode) queryParams.append('kode', params.kode);
      if (params.name) queryParams.append('name', params.name);
      if (params.bahan) queryParams.append('bahan', params.bahan);
      if (params.status) queryParams.append('status', params.status);
      if (params.tglAktifStart) queryParams.append('start_date', params.tglAktifStart);
      if (params.tglAktifEnd) queryParams.append('end_date', params.tglAktifEnd);

      const response = await HttpClient.get(`${this.API_DATA}?${queryParams.toString()}`);
      
      return {
        success: true,
        data: response.data?.map(item => this.transformResepData(item)) || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw,
        total: response.total || 0,
      };
    } catch (error) {
      console.error('Error fetching resep pakan data:', error);
      return { 
        success: false, 
        data: [], 
        recordsTotal: 0,
        recordsFiltered: 0,
        message: error?.message || 'Gagal memuat data resep pakan' 
      };
    }
  }

  /**
   * Transform resep pakan data from API
   * @param {Object} item - Raw API data
   * @returns {Object} Transformed data
   */
  static transformResepData(item) {
    return {
      pid: item.pid,
      kode: item.kode || '-',
      tgl_aktif: item.tgl_aktif || '-',
      name: item.name || '-',
      total_jumlah: Number(item.total_jumlah) || 0,
      harga_total: Number(item.harga_total) || 0,
      keterangan: item.keterangan || '-',
      jumlah_pemakaian: Number(item.jumlah_pemakaian) || 0,
      tgl_pemakaian_terakhir: item.tgl_pemakaian_terakhir || null,
    };
  }

  /**
   * Create new resep pakan
   * @param {Object} payload - Recipe data
   * @param {string} payload.tgl_aktif - Active date (YYYY-MM-DD)
   * @param {string} payload.name - Recipe name
   * @param {string} payload.keterangan - Description
   * @param {Array} payload.items - Array of {id_produk, jumlah}
   * @returns {Promise} API response
   */
  static async storeResep(payload) {
    try {
      const response = await HttpClient.post(this.API_STORE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Resep pakan berhasil disimpan'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error storing resep pakan:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal menyimpan resep pakan'
      };
    }
  }

  /**
   * Update existing resep pakan
   * @param {Object} payload - Recipe data
   * @param {string} payload.pid - Recipe ID (encrypted)
   * @param {string} payload.tgl_aktif - Active date (YYYY-MM-DD)
   * @param {string} payload.name - Recipe name
   * @param {string} payload.keterangan - Description
   * @param {Array} payload.items - Array of {id_produk, jumlah}
   * @returns {Promise} API response
   */
  static async updateResep(payload) {
    try {
      const response = await HttpClient.post(this.API_UPDATE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Resep pakan berhasil diperbarui'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error updating resep pakan:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memperbarui resep pakan'
      };
    }
  }

  /**
   * Delete resep pakan
   * @param {string} pid - Recipe ID (encrypted)
   * @returns {Promise} API response
   */
  static async deleteResep(pid) {
    try {
      const response = await HttpClient.post(this.API_DELETE, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Resep pakan berhasil dihapus'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error deleting resep pakan:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal menghapus resep pakan'
      };
    }
  }

  /**
   * Get resep pakan detail by ID
   * @param {string} pid - Recipe ID (encrypted)
   * @returns {Promise} API response with recipe detail including items
   */
  static async showResep(pid) {
    try {
      const response = await HttpClient.post(this.API_SHOW, { pid });
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Data resep pakan berhasil dimuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching resep pakan detail:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat data resep pakan'
      };
    }
  }

  /**
   * Copy existing resep pakan to another active date.
   * Backend will re-take FIFO stock based on source recipe composition.
   * @param {Object} payload
   * @param {string} payload.pid - Source recipe ID (encrypted)
   * @param {string} payload.tgl_aktif - Target active date (YYYY-MM-DD)
   * @param {string} [payload.name] - Optional new name (defaults to source name)
   * @param {string} [payload.keterangan] - Optional new keterangan
   * @returns {Promise} API response
   */
  static async copyResepToDate(payload) {
    try {
      const response = await HttpClient.post(this.API_COPY_TO_DATE, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Resep pakan berhasil disalin ke tanggal lain'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error copying resep pakan to another date:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal menyalin resep pakan ke tanggal lain'
      };
    }
  }

  /**
   * Get rekap (recap/summary) data
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with rekap data
   */
  static async getRekapData(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        'search[value]': params.search || '',
        _ts: Date.now(),
      });

      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);

      const response = await HttpClient.get(`${this.API_REKAP}?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data ?? response,
        recordsTotal: response?.recordsTotal ?? 0,
        recordsFiltered: response?.recordsFiltered ?? 0,
      };
    } catch (error) {
      console.error('Error fetching rekap pakan data:', error);
      return {
        success: false,
        data: [],
        message: error?.message || 'Gagal memuat data rekap pakan'
      };
    }
  }

  /**
   * Beri makan sapi dari resep pakan yang sudah ada (tanpa konsumsi FIFO ulang).
   * @param {Object} payload
   * @param {string} payload.pid - Resep pakan ID (encrypted)
   * @param {string} payload.tgl_pemberian_pakan - Tanggal pemberian (YYYY-MM-DD)
   * @param {string} [payload.jam_pemberian_pakan] - Jam pemberian (HH:mm), default 08:00
   * @param {string} [payload.nama_peternak] - Nama peternak
   * @param {string[]} [payload.selected_sapi_pids] - Array of encrypted sapi pubids
   * @returns {Promise} API response
   */
  static async beriMakan(payload) {
    try {
      const response = await HttpClient.post(this.API_BERI_MAKAN, payload);
      return {
        success: true,
        data: response?.data ?? response,
        message: response?.message || 'Pemberian pakan berhasil dibuat'
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error beri makan sapi:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memberi makan sapi'
      };
    }
  }

  /**
   * Get riwayat tanggal pemberian pakan untuk sebuah resep
   * @param {string} pid - Resep pakan ID (encrypted)
   * @returns {Promise} API response with list of {tgl_pemberian, jam_pemberian, nama_peternak, jumlah_sapi, ...}
   */
  static async getRiwayatPemberian(pid) {
    try {
      const response = await HttpClient.get(`${this.API_RIWAYAT_PEMBERIAN}/${pid}`, { cache: false });
      const payload = response ?? {};
      const rawData = Array.isArray(payload?.data) ? payload.data : [];
      return {
        success: true,
        data: rawData,
        message: payload?.message || 'Riwayat pemberian berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching riwayat pemberian:', error);
      return {
        success: false,
        data: [],
        message: errorData?.message || error?.message || 'Gagal memuat riwayat pemberian',
      };
    }
  }

  /**
   * Get detail sapi yang diberi pakan pada tanggal tertentu
   * @param {string} pid - Resep pakan ID (encrypted)
   * @param {string} tanggal - YYYY-MM-DD
   * @returns {Promise} API response with {tanggal, sesi, sapi}
   */
  static async getRiwayatPemberianDetail(pid, tanggal) {
    try {
      const response = await HttpClient.get(`${this.API_RIWAYAT_PEMBERIAN}/${pid}/detail`, {
        params: { tanggal },
        cache: false,
      });
      const payload = response ?? {};
      return {
        success: true,
        data: payload?.data ?? payload,
        message: payload?.message || 'Detail pemberian berhasil dimuat',
      };
    } catch (error) {
      const errorData = error?.data ?? error?.response?.data ?? null;
      console.error('Error fetching detail riwayat pemberian:', error);
      return {
        success: false,
        data: null,
        message: errorData?.message || error?.message || 'Gagal memuat detail pemberian',
      };
    }
  }
}

export default PersediaanPakanService;
