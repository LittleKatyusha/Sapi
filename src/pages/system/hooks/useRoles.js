import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';

const useRoles = () => {
    const { getAuthHeader } = useAuthSecure();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE = 'https://puput-api.ternasys.com/api/system/roles';

    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 10
    });

    const fetchRoles = useCallback(async (page = 1, perPage = 10, forceRefresh = false) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const start = (page - 1) * perPage;
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', Date.now().toString()); // Cache busting
            url.searchParams.append('search[value]', searchTerm || '');
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            url.searchParams.append('_t', Date.now().toString()); // Additional cache busting
            if (forceRefresh) {
                url.searchParams.append('force', 'true');
            }
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            const result = await response.json();
            
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
                    
                    // Simplified approach: Each row represents one role
                    // parent_role = the actual role name in this row
                    // child_role = if exists, this role has a child with that name
                    
                    const mapped = {
                        pubid: item.pid || `TEMP-${index + 1}`,
                        nama: item.parent_role || 'Unknown Role', // This is the actual role name
                        hasChild: !!item.child_role, // Whether this role has a child
                        childRoleName: item.child_role || null, // Name of child role if exists
                        description: item.description || '',
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                        // Determine if this is a parent or child role based on ViewRoles structure
                        isParentRole: !!item.child_role, // If child_role exists, this is a parent role
                        isChildRole: false  // Will be determined in post-processing
                    };
                    
                    // To find parent, we need to look for a role that has this role as child_role
                    // This will be done later in a post-processing step
                    return mapped;
                });
                
                // Post-process to establish parent relationships
                const processedData = validatedData.map(role => {
                    // Find if this role is someone's child
                    // A role is a child if another role has it as child_role
                    const parentRole = validatedData.find(r => r.childRoleName === role.nama);
                    
                    // Update isChildRole based on whether we found a parent
                    return {
                        ...role,
                        isChildRole: !!parentRole,
                        parentRoleName: parentRole ? parentRole.nama : null
                    };
                });
                
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
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(formattedData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }
            
            const result = await response.json();
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
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }
            
            const result = await response.json();
            
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
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ pid: pubid })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }
            
            const result = await response.json();
            await fetchRoles(1, 10);
            
            return {
                success: true,
                message: result.message || 'Role berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchRoles]);

    const stats = useMemo(() => {
        const totalRoles = serverPagination.totalItems;
        // Count roles that are parents (have child roles)
        const parentRoles = roles.filter(r => r.hasChild).length;
        
        return {
            total: totalRoles,
            parents: parentRoles,
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