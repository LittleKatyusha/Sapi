import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

class EartagService {
    // Get all eartags with DataTables parameters
    async getEartags(params = {}) {
        try {
            const response = await api.get('/master/eartag/data', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching eartags:', error);
            throw error;
        }
    }

    // Create new eartag
    async createEartag(data) {
        try {
            const response = await api.post('/master/eartag/store', data);
            return response.data;
        } catch (error) {
            console.error('Error creating eartag:', error);
            throw error;
        }
    }

    // Update existing eartag
    async updateEartag(data) {
        try {
            const response = await api.post('/master/eartag/update', data);
            return response.data;
        } catch (error) {
            console.error('Error updating eartag:', error);
            throw error;
        }
    }

    // Delete eartag
    async deleteEartag(pid) {
        try {
            const response = await api.post('/master/eartag/delete', { pid });
            return response.data;
        } catch (error) {
            console.error('Error deleting eartag:', error);
            throw error;
        }
    }

    // Helper method to format status labels
    static formatStatus(status) {
        return status === 1 ? 'Aktif' : 'Tidak Aktif';
    }

    // Helper method to format used status labels
    static formatUsedStatus(usedStatus) {
        return usedStatus === 1 ? 'Terpasang' : 'Belum Terpasang';
    }

    // Helper method to format data for display
    static formatEartagData(eartag) {
        return {
            id: eartag.pid, // Use encrypted pid instead of pubid
            kode: eartag.kode,
            status: this.formatStatus(eartag.status),
            statusRaw: eartag.status,
            usedStatus: this.formatUsedStatus(eartag.used_status),
            usedStatusRaw: eartag.used_status,
            tanggalPemasangan: eartag.used_status === 1 ? (eartag.created_at || '') : '',
            createdAt: eartag.created_at,
            updatedAt: eartag.updated_at
        };
    }
}

export default EartagService;
