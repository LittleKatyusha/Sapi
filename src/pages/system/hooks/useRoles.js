import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const useRoles = () => {
    const { getAuthHeader } = useAuthSecure();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE = API_ENDPOINTS.SYSTEM.ROLES;

    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 25  // Increased from 10 to 25 to show more data
    });

    const fetchRoles = useCallback(async (page = 1, perPage = 25, forceRefresh = false) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const start = (page - 1) * perPage;
            // Build query parameters manually instead of using URL constructor
            const queryParams = new URLSearchParams({
                'start': start.toString(),
                'length': perPage.toString(),
                'draw': Date.now().toString(), // Cache busting
                'search[value]': searchTerm || '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc',
                '_t': Date.now().toString() // Additional cache busting
            });
            
            if (forceRefresh) {
                queryParams.append('force', 'true');
            }
            
            const result = await HttpClient.get(`${API_BASE}/data?${queryParams.toString()}`);
            
            let dataArray = [];
            let totalRecords = 0;
            let filteredRecords = 0;

            if (result.draw && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.recordsTotal || result.data.length;
                filteredRecords = result.recordsFiltered || result.data.length;
            } else {
                throw new Error(`Format response API tidak sesuai.`);
            }
            
            setServerPagination({
                currentPage: page,
                totalPages: Math.ceil(totalRecords / perPage),
                totalItems: totalRecords,
                filteredItems: filteredRecords,
                perPage: perPage
            });
            
            if (dataArray.length >= 0) {
                const validatedData = dataArray.map((item, index) => {
                    // Debug: lihat semua field yang tersedia dari server
                    if (index === 0) {
                        console.log('[DEBUG] Available fields from server:', Object.keys(item));
                        console.log('[DEBUG] Full item data:', item);
                    }
                    
                    // Map data sesuai dengan struktur backend role_detail view
                    const mapped = {
                        id: item.id,
                        pubid: item.pid || `TEMP-${index + 1}`,
                        nama: item.parent_role || 'Unknown Role', // parent_role adalah nama role utama
                        description: item.description || '',
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                        // Informasi hierarki dari view role_detail
                        parentRole: item.parent_role, // Nama parent role
                        childRole: item.child_role, // Nama child role jika ada
                        hasChild: !!item.child_role, // Apakah role ini punya child
                        isParentRole: !!item.child_role, // Role ini adalah parent jika punya child
                        isChildRole: false // Akan ditentukan di post-processing
                    };
                    
                    return mapped;
                });
                
                // Post-process to establish parent relationships
                const processedData = validatedData.map(role => {
                    // Find if this role is someone's child
                    // A role is a child if another role has it as child_role
                    const parentRole = validatedData.find(r => r.childRole === role.nama);
                    
                    return {
                        ...role,
                        isChildRole: !!parentRole,
                        parentRoleName: parentRole ? parentRole.parentRole : null
                    };
                });
                
                // Debug: Log processed data
                console.log('[DEBUG] Processed roles data:', processedData);
                
                setRoles(processedData);
            } else {
                setRoles([]);
            }
            
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat mengambil data roles');
            setRoles([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, searchTerm]);

    const createRole = useCallback(async (roleData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            // Ensure data format matches backend expectations
            const formattedData = {
                nama: roleData.nama,
                parent_id: roleData.parent_id,
                description: roleData.description
            };
            
            const result = await HttpClient.post(`${API_BASE}/store`, formattedData);
            await fetchRoles(serverPagination.currentPage, serverPagination.perPage);
            
            return {
                success: true,
                message: result.message || 'Role berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchRoles]);

    const updateRole = useCallback(async (pubid, roleData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            // Format data to match backend expectations
            const payload = { 
                pid: pubid, 
                nama: roleData.nama,
                parent_id: roleData.parent_id,
                description: roleData.description
            };
            
            const result = await HttpClient.post(`${API_BASE}/update`, payload);
            
            console.log('[DEBUG] Update API result:', result);
            
            // Refresh data dengan page yang sama
            console.log('[DEBUG] Calling fetchRoles from updateRole...');
            await fetchRoles(serverPagination.currentPage, serverPagination.perPage);
            
            return {
                success: true,
                message: result.message || 'Role berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchRoles]);

    const deleteRole = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            console.log('[DEBUG] Deleting role with pubid:', pubid);
            const result = await HttpClient.post(`${API_BASE}/hapus`, { pid: pubid });
            console.log('[DEBUG] Delete result:', result);
            
            // Refresh data after successful delete
            await fetchRoles(serverPagination.currentPage, serverPagination.perPage, true);
            
            return {
                success: true,
                message: result.message || 'Role berhasil dihapus'
            };
            
        } catch (err) {
            console.error('[DEBUG] Delete error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchRoles, serverPagination.currentPage, serverPagination.perPage]);

    const stats = useMemo(() => {
        const totalRoles = serverPagination.totalItems;
        // Count roles that are parents (have child roles)
        const parentRoles = roles.filter(r => r.hasChild).length;
        // Count unique parent roles
        const uniqueParentRoles = [...new Set(roles.map(r => r.parentRole))].length;
        
        return {
            total: totalRoles,
            parents: parentRoles,
            uniqueParents: uniqueParentRoles,
        };
    }, [roles, serverPagination]);

    return {
        roles,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        stats,
        serverPagination,
        fetchRoles,
        createRole,
        updateRole,
        deleteRole
    };
};

export default useRoles; 