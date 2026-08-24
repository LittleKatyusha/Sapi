import httpClient from './httpClient';

class SystemService {
    // =============================================
    // USERS/PEGAWAI METHODS
    // =============================================
    
    // Get all users with DataTables parameters
    async getUsers(params = {}) {
        try {
            const response = await httpClient.get('/api/system/pegawai/data', { params });
            return response;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    // Create new user
    async createUser(data) {
        try {
            const response = await httpClient.post('/api/system/pegawai/store', data);
            return response;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Update existing user
    async updateUser(data) {
        try {
            const response = await httpClient.post('/api/system/pegawai/update', data);
            return response;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Delete user
    async deleteUser(pid) {
        try {
            const response = await httpClient.post('/api/system/pegawai/hapus', { pid });
            return response;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Get user detail
    async getUserDetail(pid) {
        try {
            const response = await httpClient.post('/api/system/pegawai/detail', { pid });
            return response;
        } catch (error) {
            console.error('Error getting user detail:', error);
            throw error;
        }
    }

    // Reset user password
    async resetUserPassword(pid) {
        try {
            const response = await httpClient.post('/api/system/pegawai/reset-password', { pid });
            return response;
        } catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    }

    // Get available roles/jabatan
    async getRoles() {
        try {
            const response = await httpClient.get('/api/system/pegawai/jabatan');
            return response;
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    }

    // Get user profile image URL
    async getUserImageUrl(pid) {
        try {
            const response = await httpClient.post('/api/system/pegawai/foto-profil', { pid });
            return response;
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
            const response = await httpClient.get('/api/system/permissions/data', { params });
            return response;
        } catch (error) {
            console.error('Error fetching permissions:', error);
            throw error;
        }
    }

    // Create new permission
    async createPermission(data) {
        try {
            const response = await httpClient.post('/api/system/permissions/store', data);
            return response;
        } catch (error) {
            console.error('Error creating permission:', error);
            throw error;
        }
    }

    // Update existing permission
    async updatePermission(data) {
        try {
            const response = await httpClient.post('/api/system/permissions/update', data);
            return response;
        } catch (error) {
            console.error('Error updating permission:', error);
            throw error;
        }
    }

    // Delete permission
    async deletePermission(pid) {
        try {
            const response = await httpClient.post('/api/system/permissions/hapus', { pid });
            return response;
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
            const response = await httpClient.get('/api/system/parameter/data', { params });
            return response;
        } catch (error) {
            console.error('Error fetching parameters:', error);
            throw error;
        }
    }

    // Create new parameter
    async createParameter(data) {
        try {
            const response = await httpClient.post('/api/system/parameter/store', data);
            return response;
        } catch (error) {
            console.error('Error creating parameter:', error);
            throw error;
        }
    }

    // Update existing parameter
    async updateParameter(data) {
        try {
            const response = await httpClient.post('/api/system/parameter/update', data);
            return response;
        } catch (error) {
            console.error('Error updating parameter:', error);
            throw error;
        }
    }

    // Delete parameter
    async deleteParameter(pid) {
        try {
            const response = await httpClient.post('/api/system/parameter/hapus', { pid });
            return response;
        } catch (error) {
            console.error('Error deleting parameter:', error);
            throw error;
        }
    }

    // Get parameters by group
    async getParametersByGroup(group) {
        try {
            const response = await httpClient.post('/api/system/parameter/dataByGroup', { group });
            return response;
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

    // =============================================
    // OFFICE / LOKASI METHODS
    // =============================================

    async getOffice() {
        try {
            const response = await httpClient.get('/api/master/office/data', { params: { per_page: 100 } });
            return {
                success: true,
                data: response?.data?.data || response?.data || response || [],
            };
        } catch (error) {
            console.error('Error fetching office:', error);
            return {
                success: false,
                message: error?.message || 'Gagal mengambil data office',
                data: [],
            };
        }
    }

    // =============================================
    // PARAMETER BY GROUP METHODS
    // =============================================

    async getParameterByGroup(group) {
        try {
            const response = await httpClient.post('/api/system/parameter/dataByGroup', { group });
            return {
                success: true,
                data: response.data || response,
            };
        } catch (error) {
            console.error('Error fetching parameter by group:', error);
            return {
                success: false,
                message: error?.message || 'Gagal mengambil data parameter',
                data: [],
            };
        }
    }
}

const systemService = new SystemService();

export default systemService;
