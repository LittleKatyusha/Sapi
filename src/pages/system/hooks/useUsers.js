import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const useUsers = () => {
    const { getAuthHeader } = useAuthSecure();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [roles, setRoles] = useState([]);

    // API Base URL
    const API_BASE = API_ENDPOINTS.SYSTEM.USERS;

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // Fetch users dari API dengan DataTables server-side pagination format
    const fetchUsers = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('Fetching users from backend...');
            
            // DataTables pagination parameters for server-side processing
            const start = (page - 1) * perPage;
            // Build query parameters manually instead of using URL constructor
            const queryParams = new URLSearchParams({
                'start': start.toString(),
                'length': perPage.toString(),
                'draw': Date.now().toString(), // Use timestamp for draw
                'search[value]': searchTerm || '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            });
            
            const result = await HttpClient.get(`${API_BASE}/data?${queryParams.toString()}`);
            
            console.log('Response received');
            
            let dataArray = [];
            let totalRecords = 0;
            let filteredRecords = 0;
            
            // Handle DataTables server-side response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.recordsTotal || result.data.length;
                filteredRecords = result.recordsFiltered || result.data.length;
                console.log('DataTables response received:', dataArray.length, 'items');
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // Fallback for simple response format
                dataArray = result.data;
                totalRecords = result.data.length;
                filteredRecords = result.data.length;
                console.log('API response received:', dataArray.length, 'items');
            } else {
                console.error('Unexpected API response format:', result);
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
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.encrypted_pid || item.pid || item.pubid,
                    nik: item.nik || '',
                    name: item.name || 'Nama tidak tersedia',
                    email: item.email || '',
                    address: item.alamat || '', // Map alamat to address for consistency with modal
                    alamat: item.alamat || '',
                    phone: item.kontak || '', // Map kontak to phone for consistency with modal
                    kontak: item.kontak || '',
                    pict: item.pict || '',
                    photoUrl: item.photo_url || '',
                    position: item.position || '', // Add position mapping
                    groupId: item.group_id || '',
                    groupName: item.role_detail?.nama || 'N/A',
                    emailVerified: item.email_verified_at ? 'Verified' : 'Not Verified',
                    status: item.status !== undefined ? item.status : 1,
                    createdAt: item.created_at || new Date().toISOString(),
                    updatedAt: item.updated_at || new Date().toISOString(),
                    id: item.pubid || `TEMP-${index + 1}`
                }));
                
                console.log('Validated users data:', validatedData.slice(0, 2));
                setUsers(validatedData);
            } else {
                console.warn('No users data received from API');
                setUsers([]);
            }
            
        } catch (err) {
            console.error('Error in fetchUsers:', err);
            setError(err.message || 'Terjadi kesalahan saat mengambil data users');
            
            // Fallback to empty data
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, searchTerm]);

    // Fetch roles/jabatan
    const fetchRoles = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const result = await HttpClient.get(`${API_BASE}/jabatan`);
            
            // Handle response format: {"status":"ok","data":[...]} atau {"success":true,"data":[...]}
            if ((result.status === 'ok' || result.success) && Array.isArray(result.data)) {
                setRoles(result.data);
            } else {
                console.warn('No roles data received from API');
                setRoles([]);
            }
            
        } catch (err) {
            console.error('Error fetching roles:', err);
            setRoles([]);
        }
    }, [getAuthHeader]);

    // Create user
    const createUser = useCallback(async (userData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const result = await HttpClient.post(`${API_BASE}/store`, {
                nik: userData.nik,
                name: userData.name,
                username: userData.username,
                email: userData.email,
                alamat: userData.address || userData.alamat || '',
                kontak: userData.phone || userData.kontak || '',
                position: userData.position || '',
                group_id: userData.groupId || 2, // Default to a valid group_id
                password: userData.password || 'default123'
            });
            await fetchUsers(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'User berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchUsers]);

    // Update user
    const updateUser = useCallback(async (pubid, userData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const result = await HttpClient.post(`${API_BASE}/update`, {
                pid: pubid,
                nik: userData.nik,
                name: userData.name,
                username: userData.username,
                email: userData.email,
                alamat: userData.address || userData.alamat || '',
                kontak: userData.phone || userData.kontak || '',
                position: userData.position || '',
                group_id: userData.groupId || 2,
                ...(userData.password && { password: userData.password }) // Only include password if provided
            });
            await fetchUsers(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'User berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchUsers]);

    // Delete user
    const deleteUser = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const result = await HttpClient.post(`${API_BASE}/hapus`, {
                pid: pubid
            });
            await fetchUsers(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'User berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchUsers]);

    // Reset user password
    const resetUserPassword = useCallback(async (user, newPassword) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const result = await HttpClient.post(`${API_BASE}/reset-password`, {
                pid: user.pubid || user.id,
                password: newPassword
            });
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Password berhasil direset'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat reset password';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Get user photo URL
    const getUserPhotoUrl = useCallback(async (pubid) => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const result = await HttpClient.post(`${API_BASE}/foto-profil`, {
                pid: pubid
            });
            
            return {
                success: result.status === 'ok' || result.success === true,
                photoUrl: result.photo_url || result.data?.photo_url || '',
                message: result.message || 'Foto profil berhasil diambil'
            };
            
        } catch (err) {
            console.error('Error fetching user photo:', err);
            return {
                success: false,
                photoUrl: '',
                message: err.message || 'Terjadi kesalahan saat mengambil foto profil'
            };
        }
    }, [getAuthHeader]);

    // Upload user photo
    const uploadUserPhoto = useCallback(async (pubid, photoFile) => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const formData = new FormData();
            formData.append('pid', pubid);
            formData.append('photo', photoFile);
            
            const result = await HttpClient.post(`${API_BASE}/upload-foto`, formData);
            await fetchUsers(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Foto profil berhasil diupload'
            };
            
        } catch (err) {
            console.error('Error uploading user photo:', err);
            return {
                success: false,
                message: err.message || 'Terjadi kesalahan saat mengupload foto profil'
            };
        }
    }, [getAuthHeader, fetchUsers]);

    // Computed stats
    const stats = useMemo(() => {
        const totalUsers = users.length;
        const activeUsers = users.filter(user => user.status === 1).length;
        const inactiveUsers = users.filter(user => user.status === 0).length;
        const verifiedUsers = users.filter(user => user.emailVerified === 'Verified').length;
        
        return {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            verified: verifiedUsers
        };
    }, [users]);

    // Filtered data berdasarkan search dan filter
    const filteredUsers = useMemo(() => {
        let filtered = users;
        
        // Filter berdasarkan search term
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.groupName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filter berdasarkan status
        if (filterStatus !== 'all') {
            if (filterStatus === 'active') {
                filtered = filtered.filter(user => user.status === 1);
            } else if (filterStatus === 'inactive') {
                filtered = filtered.filter(user => user.status === 0);
            } else if (filterStatus === 'verified') {
                filtered = filtered.filter(user => user.emailVerified === 'Verified');
            } else if (filterStatus === 'unverified') {
                filtered = filtered.filter(user => user.emailVerified === 'Not Verified');
            }
        }
        
        return filtered;
    }, [users, searchTerm, filterStatus]);

    return {
        users: filteredUsers,
        allUsers: users,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        roles,
        serverPagination,
        fetchUsers,
        fetchRoles,
        createUser,
        updateUser,
        deleteUser,
        resetUserPassword,
        getUserPhotoUrl,
        uploadUserPhoto
    };
};

export default useUsers;
