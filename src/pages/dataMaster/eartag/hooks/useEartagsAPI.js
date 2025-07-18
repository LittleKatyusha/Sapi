import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useEartagsAPI = () => {
    const { getAuthHeader } = useAuthSecure();
    const [eartags, setEartags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterUsedStatus, setFilterUsedStatus] = useState('all');
    
    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 100 // Default fetch all data
    });

    // API Base URL
    const API_BASE = 'https://puput-api.ternasys.com/api/master/eartag';

    // Helper function untuk mapping status
    const mapStatusToText = useCallback((status) => {
        return status === 1 ? 'Aktif' : 'Nonaktif';
    }, []);

    const mapUsedStatusToText = useCallback((usedStatus) => {
        return usedStatus === 1 ? 'Sudah Terpasang' : 'Belum Terpasang';
    }, []);

    // Function untuk test koneksi API
    const testApiConnection = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            
            if (!authHeader.Authorization) {
                return { success: false, message: 'Token authorization tidak ditemukan' };
            }
            
            const response = await fetch(`${API_BASE}/data`, {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            if (response.ok) {
                return { success: true, message: 'Koneksi API berhasil' };
            } else {
                return { success: false, message: `API connection failed: ${response.status}` };
            }
        } catch (error) {
            return { success: false, message: `Network error: ${error.message}` };
        }
    }, [getAuthHeader]);

    // Fetch data dari API dengan DataTables server-side pagination format
    const fetchEartags = useCallback(async (page = 1, perPage = 100) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // DataTables pagination parameters
            const start = (page - 1) * perPage; // Calculate offset
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', '1');
            url.searchParams.append('search[value]', ''); // Empty search for now
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
            let paginationMeta = {};
            
            // Handle DataTables response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                // DataTables format: {draw: 1, recordsTotal: 100, recordsFiltered: 100, data: [...]}
                dataArray = result.data;
                paginationMeta = {
                    draw: result.draw,
                    recordsTotal: result.recordsTotal,
                    recordsFiltered: result.recordsFiltered,
                    total: result.recordsTotal,
                    filtered: result.recordsFiltered,
                    current_page: page,
                    per_page: perPage,
                    last_page: Math.ceil(result.recordsTotal / perPage)
                };
            } else if (result.status === 'ok' && result.data) {
                // Format 1: {status: 'ok', data: [...]}
                if (Array.isArray(result.data)) {
                    dataArray = result.data;
                } else if (result.data.data && Array.isArray(result.data.data)) {
                    dataArray = result.data.data;
                    paginationMeta = result.data;
                }
            } else if (result.success && result.data) {
                // Format 2: {success: true, data: [...]}
                if (Array.isArray(result.data)) {
                    dataArray = result.data;
                } else if (result.data.data && Array.isArray(result.data.data)) {
                    dataArray = result.data.data;
                    paginationMeta = result.data;
                }
            } else if (Array.isArray(result.data)) {
                // Format 3: {data: [...]}
                dataArray = result.data;
            } else if (Array.isArray(result)) {
                // Format 4: Direct array
                dataArray = result;
            } else {
                console.error('Unexpected API response format:', result);
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state
            if (Object.keys(paginationMeta).length > 0) {
                setServerPagination({
                    currentPage: paginationMeta.current_page || page,
                    totalPages: paginationMeta.last_page || Math.ceil((paginationMeta.total || paginationMeta.recordsTotal || dataArray.length) / perPage),
                    totalItems: paginationMeta.total || paginationMeta.recordsTotal || dataArray.length,
                    perPage: paginationMeta.per_page || perPage
                });
                
            }
            
            if (dataArray.length > 0) {
                const validatedData = dataArray.map((item, index) => ({
                    pid: item.pubid || item.pid || `TEMP-${index + 1}`, // Backend uses 'pubid'
                    kode: item.kode || item.code || 'Kode tidak tersedia',
                    used_status: item.used_status !== undefined ? item.used_status : (item.usedStatus !== undefined ? item.usedStatus : 0),
                    status: item.status !== undefined ? item.status : (item.active !== undefined ? (item.active ? 1 : 0) : 1),
                    created_at: item.created_at || item.createdAt || new Date().toISOString(),
                    updated_at: item.updated_at || item.updatedAt || new Date().toISOString(),
                    // Map untuk compatibility dengan komponen existing
                    id: item.kode || item.code || `EAR${(index + 1).toString().padStart(3, '0')}`,
                    statusText: mapStatusToText(item.status !== undefined ? item.status : (item.active !== undefined ? (item.active ? 1 : 0) : 1)),
                    usedStatusText: mapUsedStatusToText(item.used_status !== undefined ? item.used_status : (item.usedStatus !== undefined ? item.usedStatus : 0)),
                    tanggalPemasangan: (item.used_status === 1 || item.usedStatus === 1) ? (item.updated_at || item.updatedAt || new Date().toISOString().split('T')[0]) : '',
                    deskripsi: `Eartag ${item.kode || item.code || 'tanpa kode'} - ${mapStatusToText(item.status !== undefined ? item.status : (item.active !== undefined ? (item.active ? 1 : 0) : 1))}`
                }));
                
                setEartags(validatedData);
                setError(null); // Clear error on success
            } else {
                throw new Error('Tidak ada data eartag yang diterima dari server');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback ke data dummy dengan struktur yang sesuai
            setEartags([
                {
                    pid: "EAR001",
                    kode: "EAR001",
                    used_status: 0,
                    status: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    id: "EAR001",
                    statusText: "Aktif",
                    usedStatusText: "Belum Terpasang",
                    tanggalPemasangan: "",
                    deskripsi: "Eartag khusus untuk sapi perah berkualitas tinggi"
                },
                {
                    pid: "EAR002",
                    kode: "EAR002",
                    used_status: 1,
                    status: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    id: "EAR002",
                    statusText: "Aktif",
                    usedStatusText: "Sudah Terpasang",
                    tanggalPemasangan: "2024-01-15",
                    deskripsi: "Eartag untuk kambing etawa"
                },
                {
                    pid: "EAR003",
                    kode: "EAR003",
                    used_status: 1,
                    status: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    id: "EAR003",
                    statusText: "Nonaktif",
                    usedStatusText: "Sudah Terpasang",
                    tanggalPemasangan: "2024-02-10",
                    deskripsi: "Perlu penggantian komponen sensor"
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, mapStatusToText, mapUsedStatusToText]);

    // Create eartag
    const createEartag = useCallback(async (eartagData) => {
        setLoading(true);
        setError(null);
        
        const requiredParams = ['kode', 'used_status', 'status'];
        const missingParams = requiredParams.filter(param =>
            eartagData[param] === undefined || eartagData[param] === null || eartagData[param] === ''
        );
        
        if (missingParams.length > 0) {
            const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
        
        try {
            const cleanEartagData = {
                kode: String(eartagData.kode).trim(),
                used_status: parseInt(eartagData.used_status, 10),
                status: parseInt(eartagData.status, 10)
            };
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(cleanEartagData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.data && typeof errorData.data === 'object') {
                        const validationErrors = Object.values(errorData.data).flat().join(', ');
                        throw new Error(`Validation error: ${validationErrors}`);
                    }
                    throw new Error(errorData.message || 'Gagal menambahkan data');
                } catch (e) {
                    throw new Error('Gagal menambahkan data');
                }
            }

            const result = await response.json();
            await fetchEartags();
            
            return { 
                success: true, 
                message: result.message || 'Data berhasil ditambahkan' 
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchEartags]);

    // Update eartag
    const updateEartag = useCallback(async (pid, eartagData) => {
        setLoading(true);
        setError(null);
        
        try {
            const eartag = eartags.find(e => e.pid === pid);
            if (!eartag) {
                throw new Error('Eartag tidak ditemukan');
            }
            
            const requiredParams = ['kode', 'used_status', 'status'];
            const missingParams = requiredParams.filter(param =>
                eartagData[param] === undefined || eartagData[param] === null || eartagData[param] === ''
            );
            
            if (missingParams.length > 0) {
                const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
            
            const cleanData = {
                kode: String(eartagData.kode).trim(),
                used_status: parseInt(eartagData.used_status, 10),
                status: parseInt(eartagData.status, 10)
            };
            
            const payload = {
                pid: pid,
                ...cleanData
            };
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                await fetchEartags();
                
                return {
                    success: true,
                    message: result.message || 'Data berhasil diperbarui'
                };
            } else {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.data && typeof errorData.data === 'object') {
                        const validationErrors = Object.values(errorData.data).flat().join(', ');
                        throw new Error(`Validation error: ${validationErrors}`);
                    }
                    throw new Error(errorData.message || errorData.data || 'Gagal memperbarui data');
                } catch (e) {
                    throw new Error(errorText || 'Gagal memperbarui data');
                }
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchEartags, getAuthHeader, eartags]);

    // Delete eartag
    const deleteEartag = useCallback(async (pid) => {
        setLoading(true);
        setError(null);
        
        try {
            const eartag = eartags.find(e => e.pid === pid);
            if (!eartag) {
                throw new Error('Eartag tidak ditemukan');
            }
            
            const payload = {
                pid: pid
            };
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                await fetchEartags();
                
                return {
                    success: true,
                    message: result.message || 'Data berhasil dihapus'
                };
            } else {
                const errorText = await response.text();
                let errorMessage = 'Gagal menghapus data';
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.data) {
                        errorMessage = errorData.data;
                    }
                } catch (e) {
                    errorMessage = errorText || 'Gagal menghapus data';
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchEartags, getAuthHeader, eartags]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        if (!eartags || !Array.isArray(eartags)) {
            return [];
        }
        
        return eartags.filter(item => {
            if (!item) return false;
            
            try {
                const matchesSearch =
                    (item.kode && item.kode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()));
                    
                const matchesStatus = filterStatus === 'all' ||
                    (filterStatus === 'active' && item.status === 1) ||
                    (filterStatus === 'inactive' && item.status === 0);
                    
                const matchesUsedStatus = filterUsedStatus === 'all' ||
                    (filterUsedStatus === 'used' && item.used_status === 1) ||
                    (filterUsedStatus === 'unused' && item.used_status === 0);
                      
                return matchesSearch && matchesStatus && matchesUsedStatus;
            } catch (error) {
                console.warn('Error filtering item:', item, error);
                return false;
            }
        });
    }, [eartags, searchTerm, filterStatus, filterUsedStatus]);

    // Statistics
    const stats = useMemo(() => {
        if (!eartags || !Array.isArray(eartags)) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                inUse: 0
            };
        }
        
        try {
            const total = eartags.length;
            const active = eartags.filter(item => item && item.status === 1).length;
            const inactive = eartags.filter(item => item && item.status === 0).length;
            const inUse = eartags.filter(item => item && item.used_status === 1).length;
            
            return {
                total,
                active,
                inactive,
                inUse
            };
        } catch (error) {
            console.warn('Error calculating stats:', error);
            return {
                total: 0,
                active: 0,
                inactive: 0,
                inUse: 0
            };
        }
    }, [eartags]);

    return {
        eartags: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterUsedStatus,
        setFilterUsedStatus,
        stats,
        fetchEartags,
        createEartag,
        updateEartag,
        deleteEartag,
        testApiConnection,
        mapStatusToText,
        mapUsedStatusToText,
        // Server pagination info
        serverPagination
    };
};

export default useEartagsAPI;