import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';

const useParameters = () => {
    const { getAuthHeader } = useAuthSecure();
    const [parameters, setParameters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterGroup, setFilterGroup] = useState('all');
    const [roles, setRoles] = useState([]);

    // API Base URL
    const API_BASE = 'https://puput-api.ternasys.com/api/system/parameter';
    const ROLES_API = 'https://puput-api.ternasys.com/api/system/roles/data';

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // Fetch parameters dari API dengan DataTables server-side pagination format
    const fetchParameters = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // DataTables pagination parameters
            const start = (page - 1) * perPage;
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', '1');
            url.searchParams.append('search[value]', '');
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Token tidak valid atau sudah expired');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - Tidak memiliki akses ke endpoint ini');
                } else if (response.status === 404) {
                    throw new Error('Endpoint tidak ditemukan');
                } else if (response.status === 500) {
                    throw new Error('Server error - Silakan coba lagi nanti');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const result = await response.json();
            
            let dataArray = [];
            
            // Handle response format: {"status":"ok","data":[...]}
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
            } else if (result.draw && result.data && Array.isArray(result.data)) {
                // Fallback untuk format DataTables jika digunakan
                dataArray = result.data;
            } else {
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state (gunakan data length untuk total)
            setServerPagination({
                currentPage: page,
                totalPages: Math.ceil(dataArray.length / perPage),
                totalItems: dataArray.length,
                perPage: perPage
            });
            
            if (dataArray.length >= 0) {
                const validatedData = dataArray.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    name: item.name || '',
                    value: item.value || '',
                    group: item.group || '',
                    description: item.description || '',
                    orderNo: item.order_no || 0,
                    createdAt: item.created_at || new Date().toISOString(),
                    updatedAt: item.updated_at || new Date().toISOString(),
                    id: item.pubid || `TEMP-${index + 1}`
                }));
                
                setParameters(validatedData);
            } else {
                setParameters([]);
            }
            
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat mengambil data parameters');
            
            // Fallback to empty data
            setParameters([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Fetch roles
    const fetchRoles = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token tidak ditemukan.');
            }
            const response = await fetch(ROLES_API, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', ...authHeader }
            });
            if (!response.ok) throw new Error('Gagal fetch roles');
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                setRoles(result.data);
            } else {
                setRoles([]);
            }
        } catch (err) {
            setRoles([]);
        }
    }, [getAuthHeader]);

    // Mapping roles by PID for easy lookup
    const rolesMapByPid = useMemo(() => {
        const map = new Map();
        roles.forEach(role => {
            if (role.pid) map.set(role.pid, role.child_role || role.nama);
        });
        return map;
    }, [roles]);

    // Map parameters to include roleName
    const parametersWithRoleNames = useMemo(() => {
        return parameters.map(p => {
            if (p.group === 'roles') {
                return {
                    ...p,
                    value: rolesMapByPid.get(p.value) || p.value,
                };
            }
            return p;
        });
    }, [parameters, rolesMapByPid]);

    // Get parameters by group
    const fetchParametersByGroup = useCallback(async (group) => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/dataByGroup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ group })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                return result.data;
            } else {
                return [];
            }
            
        } catch (err) {
            return [];
        }
    }, [getAuthHeader]);

    // Create parameter
    const createParameter = useCallback(async (parameterData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    name: parameterData.name,
                    value: parameterData.value,
                    group: parameterData.group,
                    description: parameterData.description,
                    order_no: parameterData.order_no || parameterData.orderNo || 0
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchParameters(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Parameter berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchParameters]);

    // Update parameter
    const updateParameter = useCallback(async (pubid, parameterData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid,
                    name: parameterData.name,
                    value: parameterData.value,
                    group: parameterData.group,
                    description: parameterData.description,
                    order_no: parameterData.order_no || parameterData.orderNo || 0
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchParameters(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Parameter berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchParameters]);

    // Delete parameter
    const deleteParameter = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchParameters(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Parameter berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchParameters]);

    // Computed stats
    const stats = useMemo(() => {
        const totalParameters = parameters.length;
        const uniqueGroups = new Set(parameters.map(p => p.group)).size;
        const groupStats = parameters.reduce((acc, p) => {
            acc[p.group] = (acc[p.group] || 0) + 1;
            return acc;
        }, {});
        
        return {
            total: totalParameters,
            groups: uniqueGroups,
            groupStats: groupStats
        };
    }, [parameters]);

    // Get unique groups for filter
    const uniqueGroups = useMemo(() => {
        const groups = [...new Set(parameters.map(p => p.group))].filter(Boolean);
        return groups.sort();
    }, [parameters]);

    // Filtered data berdasarkan search dan filter
    const filteredParameters = useMemo(() => {
        let filtered = parameters;
        
        // Filter berdasarkan search term
        if (searchTerm) {
            filtered = filtered.filter(parameter =>
                parameter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                parameter.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                parameter.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
                parameter.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filter berdasarkan group
        if (filterGroup !== 'all') {
            filtered = filtered.filter(parameter => parameter.group === filterGroup);
        }
        
        return filtered;
    }, [parameters, searchTerm, filterGroup]);

    return {
        parameters: parametersWithRoleNames, // Ganti ke ini
        allParameters: parameters,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterGroup,
        setFilterGroup,
        stats,
        uniqueGroups,
        serverPagination,
        fetchParameters,
        fetchParametersByGroup,
        createParameter,
        updateParameter,
        deleteParameter,
        roles,
        fetchRoles
    };
};

export default useParameters;
