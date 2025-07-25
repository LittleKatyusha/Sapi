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

class SystemService {
    // =============================================
    // USERS/PEGAWAI METHODS
    // =============================================
    
    // Get all users with DataTables parameters
    async getUsers(params = {}) {
        try {
            const response = await api.get('/system/pegawai/data', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    // Create new user
    async createUser(data) {
        try {
            const response = await api.post('/system/pegawai/store', data);
            return response.data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Update existing user
    async updateUser(data) {
        try {
            const response = await api.post('/system/pegawai/update', data);
            return response.data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Delete user
    async deleteUser(pid) {
        try {
            const response = await api.post('/system/pegawai/delete', { pid });
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Get user detail
    async getUserDetail(pid) {
        try {
            const response = await api.post('/system/pegawai/detail', { pid });
            return response.data;
        } catch (error) {
            console.error('Error getting user detail:', error);
            throw error;
        }
    }

    // Reset user password
    async resetUserPassword(pid) {
        try {
            const response = await api.post('/system/pegawai/reset-password', { pid });
            return response.data;
        } catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    }

    // Get available roles/jabatan
    async getRoles() {
        try {
            const response = await api.get('/system/pegawai/jabatan');
            return response.data;
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    }

    // Get user profile image URL
    async getUserImageUrl(pid) {
        try {
            const response = await api.post('/system/pegawai/foto-profil', { pid });
            return response.data;
        } catch (error) {
            console.error('Error getting user image URL:', error);
            throw error;
        }
    }

    // =============================================
    // PERMISSIONS METHODS
    // =============================================
    
    // Get all permissions with DataTables parameters
    async getPermissions(params = {}) {
        try {
            const response = await api.get('/system/permissions/data', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching permissions:', error);
            throw error;
        }
    }

    // Create new permission
    async createPermission(data) {
        try {
            const response = await api.post('/system/permissions/store', data);
            return response.data;
        } catch (error) {
            console.error('Error creating permission:', error);
            throw error;
        }
    }

    // Update existing permission
    async updatePermission(data) {
        try {
            const response = await api.post('/system/permissions/update', data);
            return response.data;
        } catch (error) {
            console.error('Error updating permission:', error);
            throw error;
        }
    }

    // Delete permission
    async deletePermission(pid) {
        try {
            const response = await api.post('/system/permissions/delete', { pid });
            return response.data;
        } catch (error) {
            console.error('Error deleting permission:', error);
            throw error;
        }
    }

    // =============================================
    // PARAMETERS METHODS
    // =============================================
    
    // Get all parameters
    async getParameters(params = {}) {
        try {
            const response = await api.get('/system/parameter/data', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching parameters:', error);
            throw error;
        }
    }

    // Create new parameter
    async createParameter(data) {
        try {
            const response = await api.post('/system/parameter/store', data);
            return response.data;
        } catch (error) {
            console.error('Error creating parameter:', error);
            throw error;
        }
    }

    // Update existing parameter
    async updateParameter(data) {
        try {
            const response = await api.post('/system/parameter/update', data);
            return response.data;
        } catch (error) {
            console.error('Error updating parameter:', error);
            throw error;
        }
    }

    // Delete parameter
    async deleteParameter(pid) {
        try {
            const response = await api.post('/system/parameter/delete', { pid });
            return response.data;
        } catch (error) {
            console.error('Error deleting parameter:', error);
            throw error;
        }
    }

    // Get parameters by group
    async getParametersByGroup(group) {
        try {
            const response = await api.post('/system/parameter/dataByGroup', { group });
            return response.data;
        } catch (error) {
            console.error('Error fetching parameters by group:', error);
            throw error;
        }
    }

    // =============================================
    // HELPER METHODS
    // =============================================
    
    // Helper method to format user data for display
    static formatUserData(user) {
        return {
            id: user.pubid,
            nik: user.nik,
            name: user.name,
            email: user.email,
            alamat: user.alamat,
            kontak: user.kontak,
            pict: user.pict,
            groupId: user.group_id,
            groupName: user.role_detail?.nama || 'N/A',
            emailVerified: user.email_verified_at ? 'Verified' : 'Not Verified',
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
    }

    // Helper method to format permission data for display
    static formatPermissionData(permission) {
        return {
            id: permission.pubid,
            roleId: permission.roles_id,
            roleName: permission.role_detail?.nama || 'N/A',
            serviceName: permission.service_name,
            value: permission.value,
            functionName: permission.function_name,
            method: permission.method,
            createdAt: permission.created_at,
            updatedAt: permission.updated_at
        };
    }

    // Helper method to format parameter data for display
    static formatParameterData(parameter) {
        return {
            id: parameter.pubid,
            name: parameter.name,
            value: parameter.value,
            group: parameter.group,
            description: parameter.description,
            orderNo: parameter.order_no,
            createdAt: parameter.created_at,
            updatedAt: parameter.updated_at
        };
    }
}

export default SystemService;
