/**
 * Stok Sapi Service
 * Service layer for Stok Sapi RPH (Pemeliharaan Sapi RPH)
 */

import HttpClient from './httpClient';

class StokSapiService {
  static API_PREFIX = '/api/rph/pemeliharaansapi';

  static async getStokByJenis(startDate, endDate) {
    try {
      const response = await HttpClient.get(`${this.API_PREFIX}/stoksapibyjenis`, {
        params: { start_date: startDate, end_date: endDate },
        cache: false,
      });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getStokByJenis error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch data',
      };
    }
  }

  static async getStokDetail(startDate, endDate, params = {}) {
    try {
      const response = await HttpClient.get(`${this.API_PREFIX}/stoksapi`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          start: params.start ?? 0,
          length: params.length ?? 10,
          search: params.search ?? '',
          status_filter: params.statusFilter ?? '',
          kandang_filter: params.kandangFilter ?? '',
          draw: params.draw ?? 1,
        },
        cache: false,
      });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getStokDetail error:', error);
      let message = 'Failed to fetch data';
      if (error?.data?.data && typeof error.data.data === 'object') {
        const validationMessages = Object.values(error.data.data).flat();
        message = validationMessages.join(', ');
      } else if (error?.data?.message) {
        message = error.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      return {
        success: false,
        data: null,
        message,
      };
    }
  }

  static async getFilterOptions() {
    try {
      const response = await HttpClient.get(`${this.API_PREFIX}/stokfilteroptions`, {
        cache: false,
      });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getFilterOptions error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch filter options',
      };
    }
  }

  static async show(pid) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/show`, { pid });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.show error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch data',
      };
    }
  }

  /**
   * Update data pemeliharaan sapi (eartag, berat, kondisi, keterangan_kondisi).
   * Endpoint: POST /api/rph/pemeliharaansapi/update
   */
  static async update(payload) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/update`, payload);
      HttpClient.clearCache('pemeliharaansapi');
      return {
        success: true,
        data: response.data,
        message: response.message || 'Data berhasil diperbarui',
      };
    } catch (error) {
      console.error('StokSapiService.update error:', error);
      let message = 'Gagal memperbarui data';
      if (error?.data?.data && typeof error.data.data === 'object') {
        const validationMessages = Object.values(error.data.data).flat();
        message = validationMessages.join(', ');
      } else if (error?.data?.message) {
        message = error.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      return { success: false, data: null, message };
    }
  }

  /**
   * Riwayat perubahan (berat & kondisi) untuk sapi tertentu.
   * Endpoint: POST /api/rph/pemeliharaansapi/history
   */
  static async history(pid) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/history`, { pid });
      return {
        success: true,
        data: response.data,
        message: 'Data retrieved successfully',
      };
    } catch (error) {
      console.error('StokSapiService.history error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch history',
      };
    }
  }

  /**
   * Daftar sapi untuk pilihan induk (parent picker) - server-side datatable.
   * Endpoint: GET /api/rph/pemeliharaansapi/parent-options
   */
  static async parentOptions(jenisKelamin, params = {}) {
    try {
      const query = {
        jenis_kelamin: jenisKelamin,
        q: params.q ?? '',
        jenis_sapi: params.jenisSapi ?? '',
        start: params.start ?? 0,
        length: params.length ?? 10,
        draw: params.draw ?? 1,
      };
      const response = await HttpClient.get(`${this.API_PREFIX}/parent-options`, { params: query, cache: false });
      return {
        success: true,
        data: response.data,
        message: 'Data retrieved successfully',
      };
    } catch (error) {
      console.error('StokSapiService.parentOptions error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch parent options',
      };
    }
  }

  /**
   * Simpan sapi baru dari anakan/kelahiran.
   * Endpoint: POST /api/rph/pemeliharaansapi/store-anakan
   */
  static async storeAnakan(payload) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/store-anakan`, payload);
      HttpClient.clearCache('pemeliharaansapi');
      return {
        success: true,
        data: response.data,
        message: response.message || 'Anakan berhasil ditambahkan',
      };
    } catch (error) {
      console.error('StokSapiService.storeAnakan error:', error);
      let message = 'Gagal menambahkan anakan';
      if (error?.data?.data && typeof error.data.data === 'object') {
        const validationMessages = Object.values(error.data.data).flat();
        message = validationMessages.join(', ');
      } else if (error?.data?.message) {
        message = error.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      return { success: false, data: null, message };
    }
  }

  static async bulkAssignKandang(pids, kandangPid) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/bulk-assign-kandang`, {
        pids,
        kandang_pid: kandangPid,
      });
      HttpClient.clearCache('pemeliharaansapi');
      return {
        success: true,
        data: response.data,
        message: response.message || 'Berhasil assign kandang',
      };
    } catch (error) {
      console.error('StokSapiService.bulkAssignKandang error:', error);
      let message = 'Gagal assign kandang';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        message = messages.join(', ');
      } else if (error?.data?.message) {
        message = error.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      return { success: false, data: null, message };
    }
  }

  static async potongPaksa(data) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/store', data);
      HttpClient.clearCache('potongpaksa');
      return { success: true, data: response.data, message: response.message || 'Data created successfully' };
    } catch (error) {
      console.error('StokSapiService.potongPaksa error:', error);
      console.error('Error data:', error?.data);
      let errorMessage = 'Failed to create potong paksa';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
      };
    }
  }

  static async getSapiMati(pid) {
    try {
      const response = await HttpClient.post(`${this.API_PREFIX}/sapimati`, { pid });
      return { success: true, data: response.data, message: response.message || 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getSapiMati error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch sapi mati data',
      };
    }
  }

  static async sapiMati(data) {
    try {
      const payload = data.file instanceof File
        ? Object.entries(data).reduce((formData, [key, value]) => {
            if (value !== null && value !== undefined) formData.append(key, value);
            return formData;
          }, new FormData())
        : data;
      const response = await HttpClient.post('/api/rph/persediaan/sapimati/store', payload);
      HttpClient.clearCache('sapimati');
      return { success: true, data: response.data, message: response.data?.message || response.message || 'Data created successfully' };
    } catch (error) {
      console.error('StokSapiService.sapiMati error:', error);
      let errorMessage = 'Failed to create sapi mati';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
      };
    }
  }

  static async getPotongPaksaData(params = {}) {
    try {
      const response = await HttpClient.get('/api/rph/persediaan/potongpaksa/data', { params: { ...params, _t: Date.now() }, cache: false });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getPotongPaksaData error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch potong paksa data',
      };
    }
  }

  static async showPotongPaksa(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/show', { pid });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.showPotongPaksa error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch potong paksa data',
      };
    }
  }

  static async updatePotongPaksa(data) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/update', data);
      HttpClient.clearCache('potongpaksa');
      return { success: true, data: response.data, message: response.message || 'Data updated successfully' };
    } catch (error) {
      console.error('StokSapiService.updatePotongPaksa error:', error);
      let errorMessage = 'Failed to update potong paksa';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
      };
    }
  }

  static async deletePotongPaksa(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongpaksa/hapus', { pid });
      HttpClient.clearCache('potongpaksa');
      return { success: true, data: response.data, message: response.message || 'Data deleted successfully' };
    } catch (error) {
      console.error('StokSapiService.deletePotongPaksa error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to delete potong paksa',
      };
    }
  }

  static async deleteSapiMati(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/sapimati/hapus', { pid });
      HttpClient.clearCache('sapimati');
      return { success: true, data: response.data, message: response.message || 'Data deleted successfully' };
    } catch (error) {
      console.error('StokSapiService.deleteSapiMati error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to delete sapi mati',
      };
    }
  }

  static async getSapiMatiData(params = {}) {
    try {
      const response = await HttpClient.get('/api/rph/persediaan/sapimati/data', { params: { ...params, _t: Date.now() }, cache: false });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getSapiMatiData error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch sapi mati data',
      };
    }
  }

  static async updateSapiMati(data) {
    try {
      const payload = data.file instanceof File
        ? Object.entries(data).reduce((formData, [key, value]) => {
            if (value !== null && value !== undefined) formData.append(key, value);
            return formData;
          }, new FormData())
        : data;
      const response = await HttpClient.post('/api/rph/persediaan/sapimati/update', payload);
      HttpClient.clearCache('sapimati');
      return { success: true, data: response.data, message: response.data?.message || response.message || 'Data updated successfully' };
    } catch (error) {
      console.error('StokSapiService.updateSapiMati error:', error);
      const validationErrors = error?.data?.data;
      const message = validationErrors
        ? Object.values(validationErrors).flat().join(', ')
        : error?.data?.message || error?.message || 'Gagal memperbarui data sapi mati';
      return { success: false, data: null, message };
    }
  }

  static async downloadBuktiSapiMati(pid) {
    return HttpClient.get('/api/rph/persediaan/sapimati/download', {
      cache: false,
      responseType: 'blob',
      params: { pid },
    });
  }

  static async potongSapiBiasa(data) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongsapi/store', data);
      HttpClient.clearCache('potongsapi');
      HttpClient.clearCache('persediaan');
      return { success: true, data: response.data, message: response.data?.message || response.message || 'Data created successfully' };
    } catch (error) {
      console.error('StokSapiService.potongSapiBiasa error:', error);
      let errorMessage = 'Failed to create potong sapi biasa';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
      };
    }
  }

  static async getBoningItems() {
    try {
      const response = await HttpClient.get('/api/master/itemboning/data', { cache: true });
      return { success: true, data: response.data || [], message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getBoningItems error:', error);
      return { success: false, data: [], message: error?.data?.message || error?.message || 'Failed to fetch boning items' };
    }
  }

  static async showBoning(pid) {
    try {
      const response = await HttpClient.post('/api/master/itemboning/show', { pid });
      return { success: true, data: response.data || null, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.showBoning error:', error);
      return { success: false, data: null, message: error?.data?.message || error?.message || 'Failed to fetch boning detail' };
    }
  }

  static async getKarkasItems() {
    try {
      const response = await HttpClient.get('/api/master/karkas/data', { cache: true });
      return { success: true, data: response.data || [], message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getKarkasItems error:', error);
      return { success: false, data: [], message: error?.data?.message || error?.message || 'Failed to fetch karkas items' };
    }
  }

  static async showKarkas(pid) {
    try {
      const response = await HttpClient.post('/api/master/karkas/show', { pid });
      return { success: true, data: response.data || null, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.showKarkas error:', error);
      return { success: false, data: null, message: error?.data?.message || error?.message || 'Failed to fetch karkas detail' };
    }
  }

  static async getItemPotongOptions() {
    try {
      const response = await HttpClient.get('/api/master/parameter/data', {
        params: { groups: 'itempotong', _t: Date.now() },
        cache: false,
      });
      const source = response?.data?.[0] || response?.data || response || {};
      const itemPotong = Array.isArray(source.itempotong) ? source.itempotong : [];
      return {
        success: true,
        data: itemPotong,
        message: 'Data retrieved successfully',
      };
    } catch (error) {
      console.error('StokSapiService.getItemPotongOptions error:', error);
      return {
        success: false,
        data: [],
        message: error?.data?.message || error?.message || 'Failed to fetch item potong options',
      };
    }
  }

  static async getPotongSapiBiasaData(params = {}) {
    try {
      const response = await HttpClient.get('/api/rph/persediaan/potongsapi/data', { params: { ...params, _t: Date.now() }, cache: false });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.getPotongSapiBiasaData error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch potong sapi biasa data',
      };
    }
  }

  static async showPotongSapiBiasa(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongsapi/show', { pid });
      return { success: true, data: response.data, message: 'Data retrieved successfully' };
    } catch (error) {
      console.error('StokSapiService.showPotongSapiBiasa error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch potong sapi biasa detail',
      };
    }
  }

  static async updatePotongSapiBiasa(data) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongsapi/update', data);
      HttpClient.clearCache('potongsapi');
      HttpClient.clearCache('persediaan');
      return { success: true, data: response.data, message: response.message || 'Data updated successfully' };
    } catch (error) {
      console.error('StokSapiService.updatePotongSapiBiasa error:', error);
      let errorMessage = 'Failed to update potong sapi biasa';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
      };
    }
  }

  static async deletePotongSapiBiasa(pid) {
    try {
      const response = await HttpClient.post('/api/rph/persediaan/potongsapi/hapus', { pid });
      HttpClient.clearCache('potongsapi');
      HttpClient.clearCache('persediaan');
      return { success: true, data: response.data, message: response.message || 'Data deleted successfully' };
    } catch (error) {
      console.error('StokSapiService.deletePotongSapiBiasa error:', error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to delete potong sapi biasa',
      };
    }
  }

  /**
   * Daftar sapi aktif RPH untuk dipilih pada form pemberian pakan.
   * Menandai sapi yang sudah tercatat menerima pakan lain pada tanggal yang sama.
   * Endpoint: GET /api/rph/pemeliharaansapi/stok-sapi-options?tgl_pemberian_pakan=YYYY-MM-DD
   */
  static async getStokSapiOptions(tglPemberianPakan) {
    try {
      const queryParams = new URLSearchParams({
        tgl_pemberian_pakan: tglPemberianPakan,
        _t: Date.now(),
      });
      const response = await HttpClient.get(`${this.API_PREFIX}/stok-sapi-options?${queryParams.toString()}`);
      return {
        success: true,
        data: response?.data || { total: 0, total_tersedia: 0, rows: [] },
        message: response?.message || 'Data berhasil dimuat',
      };
    } catch (error) {
      console.error('StokSapiService.getStokSapiOptions error:', error);
      return {
        success: false,
        data: { total: 0, total_tersedia: 0, rows: [] },
        message: error?.message || 'Gagal memuat data',
      };
    }
  }
}

export default StokSapiService;

