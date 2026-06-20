import HttpClient from './httpClient';

class PersediaanHasilPotongService {
  static API_BONING = '/api/rph/persediaan/boning';
  static API_KARKAS = '/api/rph/persediaan/karkas';
  static API_KULIT = '/api/rph/persediaan/kulit';

  static async getData(type, params = {}) {
    const endpoints = {
      boning: this.API_BONING,
      karkas: this.API_KARKAS,
      kulit: this.API_KULIT,
    };
    const endpoint = endpoints[type];
    if (!endpoint) return { success: false, data: null, message: 'Invalid type' };

    try {
      const response = await HttpClient.get(`${endpoint}/data`, {
        params: { ...params, _t: Date.now() },
        cache: false,
      });
      return {
        success: true,
        data: response.data || [],
        recordsTotal: response.recordsTotal || 0,
        recordsFiltered: response.recordsFiltered || 0,
        draw: response.draw || 1,
        message: 'Success',
      };
    } catch (error) {
      console.error(`PersediaanHasilPotongService.getData(${type}) error:`, error);
      return {
        success: false,
        data: null,
        recordsTotal: 0,
        recordsFiltered: 0,
        draw: 1,
        message: error?.data?.message || error?.message || 'Failed to fetch data',
      };
    }
  }

  static async show(type, pid) {
    const endpoints = {
      boning: this.API_BONING,
      karkas: this.API_KARKAS,
      kulit: this.API_KULIT,
    };
    const endpoint = endpoints[type];
    if (!endpoint) return { success: false, data: null, message: 'Invalid type' };

    try {
      const response = await HttpClient.post(`${endpoint}/show`, { pid });
      return { success: true, data: response.data, message: 'Success' };
    } catch (error) {
      console.error(`PersediaanHasilPotongService.show(${type}) error:`, error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to fetch detail',
      };
    }
  }

  static async update(type, payload) {
    const endpoints = {
      boning: this.API_BONING,
      karkas: this.API_KARKAS,
      kulit: this.API_KULIT,
    };
    const endpoint = endpoints[type];
    if (!endpoint) return { success: false, data: null, message: 'Invalid type' };

    try {
      const response = await HttpClient.post(`${endpoint}/update`, payload);
      return { success: true, data: response.data, message: response.message || 'Updated successfully' };
    } catch (error) {
      console.error(`PersediaanHasilPotongService.update(${type}) error:`, error);
      let errorMessage = 'Failed to update data';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return { success: false, data: null, message: errorMessage };
    }
  }

  static async updateKulit(payload) {
    try {
      const response = await HttpClient.post(`${this.API_KULIT}/update`, payload);
      return { success: true, data: response.data, message: response.message || 'Updated successfully' };
    } catch (error) {
      console.error('PersediaanHasilPotongService.updateKulit error:', error);
      let errorMessage = 'Failed to update kulit data';
      if (error?.data?.data) {
        const validationErrors = error.data.data;
        const messages = Object.values(validationErrors).flat();
        errorMessage = messages.join(', ');
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      return { success: false, data: null, message: errorMessage };
    }
  }

  static async delete(type, pid) {
    const endpoints = {
      boning: this.API_BONING,
      karkas: this.API_KARKAS,
      kulit: this.API_KULIT,
    };
    const endpoint = endpoints[type];
    if (!endpoint) return { success: false, data: null, message: 'Invalid type' };

    try {
      const response = await HttpClient.post(`${endpoint}/delete`, { pid });
      return { success: true, data: response.data, message: response.message || 'Deleted successfully' };
    } catch (error) {
      console.error(`PersediaanHasilPotongService.delete(${type}) error:`, error);
      return {
        success: false,
        data: null,
        message: error?.data?.message || error?.message || 'Failed to delete data',
      };
    }
  }

  static async getBoningItems() {
    try {
      const response = await HttpClient.get('/api/master/itemboning/data', { cache: true });
      return { success: true, data: response.data || [], message: 'Success' };
    } catch (error) {
      console.error('PersediaanHasilPotongService.getBoningItems error:', error);
      return { success: false, data: [], message: error?.data?.message || error?.message || 'Failed to fetch boning items' };
    }
  }

  static async getKarkasItems() {
    try {
      const response = await HttpClient.get('/api/master/karkas/data', { cache: true });
      return { success: true, data: response.data || [], message: 'Success' };
    } catch (error) {
      console.error('PersediaanHasilPotongService.getKarkasItems error:', error);
      return { success: false, data: [], message: error?.data?.message || error?.message || 'Failed to fetch karkas items' };
    }
  }
}

export default PersediaanHasilPotongService;