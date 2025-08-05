import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const usePermissions = () => {
    const { getAuthHeader } = useAuthSecure();
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [roles, setRoles] = useState([]);

    // API Base URL
    const API_BASE = API_ENDPOINTS.SYSTEM.PERMISSIONS;

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // Fetch roles
    const fetchRoles = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            // Ganti endpoint ke /api/system/roles/data
            const result = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.ROLES}/data`);
            if (result.data && Array.isArray(result.data)) {
                setRoles(result.data);
            } else {
                setRoles([]);
            }
        } catch (err) {
            setRoles([]);
        }
    }, [getAuthHeader]);

    // Fetch permissions dari API dengan DataTables server-side pagination format
    const fetchPermissions = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // DataTables pagination parameters for server-side processing
            const start = (page - 1) * perPage;
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', Date.now().toString()); // Use timestamp for draw
            url.searchParams.append('search[value]', searchTerm || '');
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            
            const result = await HttpClient.get(`${API_BASE}/data?${url.searchParams.toString()}`);
            
            let dataArray = [];
            let totalRecords = 0;
            let filteredRecords = 0;
            
            // Handle DataTables server-side response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.recordsTotal || result.data.length;
                filteredRecords = result.recordsFiltered || result.data.length;
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // Fallback for simple response format
                dataArray = result.data;
                totalRecords = result.data.length;
                filteredRecords = result.data.length;
            } else {
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state dengan data dari backend
            setServerPagination({
                currentPage: page,
                totalPages: Math.ceil(totalRecords / perPage),
                totalItems: totalRecords,
                filteredItems: filteredRecords,
                perPage: perPage
            });
            
            if (dataArray.length >= 0) {
                const validatedData = dataArray.map((item, index) => ({
                    pubid: item.pubid || item.pid || `TEMP-${index + 1}`,
                    encryptedPid: item.encrypted_pid || item.pid || `TEMP-${index + 1}`,
                    roleId: item.roles_id || '', // Ini kosong karena API tidak mengirim roles_id
                    roleName: item.role_detail?.nama || 'Tidak Ada Role', // Default karena tidak ada relasi role
                    serviceName: item.service_name || '',
                    value: item.value || '',
                    functionName: item.function_name || '',
                    method: item.method || '',
                    createdAt: item.created_at || new Date().toISOString(),
                    updatedAt: item.updated_at || new Date().toISOString(),
                    id: item.pubid || item.pid || `TEMP-${index + 1}` // Konsisten dengan ActionButton
                }));
                
                setPermissions(validatedData);
            } else {
                setPermissions([]);
            }
            
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat mengambil data permissions');
            
            // Fallback to empty data
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, searchTerm]);

    // Mapping roles by pid for easy lookup (pid dari /roles/data)
    const rolesMapByPid = useMemo(() => {
      const map = new Map();
      roles.forEach(role => {
        if (role.pid) {
          const roleName = role.child_role || role.nama;
          map.set(role.pid, roleName);
        }
      });
      return map;
    }, [roles]);

    // Map permissions to include roleName using pid
    // Karena API permission tidak mengirim roles_id, kita tidak bisa mapping dengan roles
    const permissionsWithRoleNames = useMemo(() => {
      return permissions.map(p => {
        const roleId = p.roles_id || p.roleId || '';
        // Karena tidak ada relasi roles_id di data permission, gunakan roleName yang sudah ada
        const roleName = p.roleName || 'Tidak Ada Role';
        
        
        return {
          ...p,
          roleId: roleId,
          roleName: roleName,
        };
      });
    }, [permissions]);

    const filteredPermissions = useMemo(() => {
        let filtered = permissionsWithRoleNames;
        
        // Filter berdasarkan search term
        if (searchTerm) {
            filtered = filtered.filter(permission =>
                permission.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.functionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.value.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filter berdasarkan role jika diperlukan
        if (filterStatus !== 'all') {
            // Bisa ditambahkan filter berdasarkan method atau role tertentu
            if (filterStatus === 'get') {
                filtered = filtered.filter(permission => permission.method === 'GET');
            } else if (filterStatus === 'post') {
                filtered = filtered.filter(permission => permission.method === 'POST');
            } else if (filterStatus === 'put') {
                filtered = filtered.filter(permission => permission.method === 'PUT');
            } else if (filterStatus === 'delete') {
                filtered = filtered.filter(permission => permission.method === 'DELETE');
            }
        }
        
        return filtered;
    }, [permissionsWithRoleNames, searchTerm, filterStatus]);

    // Saat create/update, sesuaikan dengan struktur API yang sebenarnya
    const createPermission = useCallback(async (permissionData) => {
        setLoading(true);
        setError(null);
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // Struktur data sesuai dengan response API yang sebenarnya
            const payload = {
                service_name: permissionData.serviceName,
                value: permissionData.value,
                function_name: permissionData.functionName,
                method: permissionData.method,
                roles_id: 1 // Default role ID karena backend memerlukan field ini
            };
            
            const result = await HttpClient.post(`${API_BASE}/store`, payload);
            await fetchPermissions(1, 1000); // Refresh data
            return {
                success: true,
                message: result.message || 'Permission berhasil ditambahkan'
            };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPermissions]);

    const updatePermission = useCallback(async (pubid, permissionData) => {
        setLoading(true);
        setError(null);
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // Struktur data sesuai dengan response API yang sebenarnya
            const payload = {
                pid: pubid,
                service_name: permissionData.serviceName,
                value: permissionData.value,
                function_name: permissionData.functionName,
                method: permissionData.method,
                roles_id: 1, // Default role ID karena backend memerlukan field ini
                updated_by: 1 // Required field untuk update permission
            };
            
            const result = await HttpClient.post(`${API_BASE}/update`, payload);
            await fetchPermissions(1, 1000); // Refresh data
            return {
                success: true,
                message: result.message || 'Permission berhasil diperbarui'
            };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPermissions]);

    // Delete permission
    const deletePermission = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const result = await HttpClient.post(`${API_BASE}/delete`, {
                pid: pubid
            });
            await fetchPermissions(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Permission berhasil dihapus'
            };
            
        } catch (err) {
            let errorMsg = 'Terjadi kesalahan saat menghapus data';
            
            // Handle specific error types
            if (err.message === 'Failed to fetch') {
                errorMsg = 'Gagal menghubungi server. Periksa koneksi internet atau coba lagi nanti.';
            } else if (err.message.includes('CORS')) {
                errorMsg = 'Masalah konfigurasi server. Hubungi administrator sistem.';
            } else if (err.message) {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPermissions]);

    // Computed stats
    const stats = useMemo(() => {
        const totalPermissions = permissions.length;
        const uniqueServices = new Set(permissions.map(p => p.serviceName)).size;
        const methodStats = permissions.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + 1;
            return acc;
        }, {});
        
        return {
            total: totalPermissions,
            services: uniqueServices,
            methods: methodStats
        };
    }, [permissions]);

    return {
        permissions: filteredPermissions,
        allPermissions: permissions,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        roles,
        serverPagination,
        fetchPermissions,
        fetchRoles,
        createPermission,
        updatePermission,
        deletePermission
    };
};

export default usePermissions;
