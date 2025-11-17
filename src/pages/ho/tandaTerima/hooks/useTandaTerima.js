import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// Transformation functions - Updated to match actual backend response
const transformBackendToFrontend = (backendData) => ({
    // Use pid as id if id not present
    id: backendData.id || backendData.pid,
    pid: backendData.pid,
    // For display in list/table - matching actual backend response
    barang_yang_diterima: backendData.nama_barang || '',
    tgl_terima: backendData.tgl_terima || '',
    lokasi_penerimaan: backendData.lokasi_penerimaan || '',
    pemasok: backendData.pemasok || '',
    pengirim: backendData.nama_pengirim || backendData.penerima || '',
    nota: backendData.nota || '',
    penerima: backendData.penerima || '',
    // For edit form - backend fields (may not be present in list response)
    id_barang: backendData.id_barang,
    id_office: backendData.id_office,
    nama_barang: backendData.nama_barang || '',
    nama_pengirim: backendData.nama_pengirim || backendData.penerima || '',
    plat_nomor: backendData.plat_nomor || '',
    id_satuan: backendData.id_satuan,
    // Additional fields that might be needed
    kondisi: backendData.kondisi || '',
    jumlah_berkas: backendData.jumlah_berkas || 0
});

const transformFrontendToBackend = (frontendData) => {
    console.log('transformFrontendToBackend - Input:', frontendData);
    
    const transformed = {
        id_barang: frontendData.id_barang,
        id_office: frontendData.id_office,
        nama_barang: frontendData.nama_barang || '',
        pemasok: frontendData.pemasok || '',
        nota: frontendData.nota || '',
        tgl_terima: frontendData.tgl_terima,
        nama_pengirim: frontendData.nama_pengirim,
        plat_nomor: frontendData.plat_nomor,
        id_satuan: frontendData.id_satuan || null,
        penerima: frontendData.penerima,
        details: frontendData.details?.map(detail => {
            // Support both jenis_barang and jenis_barang_name for compatibility
            const detailTransformed = {
                jenis_barang: detail.jenis_barang || detail.jenis_barang_name || '',
                jumlah: parseInt(detail.jumlah) || 0,
                kondisi: detail.kondisi || ''
            };
            console.log('Detail transformed:', detailTransformed);
            return detailTransformed;
        }) || []
    };
    
    console.log('transformFrontendToBackend - Output:', transformed);
    return transformed;
};

const useTandaTerima = () => {
    const [tandaTerima, setTandaTerima] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0
    });
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalPages: 1,
        totalItems: 0
    });

    // Calculate statistics from data
    const calculateStats = useCallback((data) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const todayCount = data.filter(item => {
            const itemDate = new Date(item.tgl_terima);
            return itemDate >= today;
        }).length;

        const weekCount = data.filter(item => {
            const itemDate = new Date(item.tgl_terima);
            return itemDate >= weekStart;
        }).length;

        const monthCount = data.filter(item => {
            const itemDate = new Date(item.tgl_terima);
            return itemDate >= monthStart;
        }).length;

        const yearCount = data.filter(item => {
            const itemDate = new Date(item.tgl_terima);
            return itemDate >= yearStart;
        }).length;

        return {
            total: data.length,
            today: todayCount,
            thisWeek: weekCount,
            thisMonth: monthCount,
            thisYear: yearCount
        };
    }, []);

    // Fetch tanda terima data
    const fetchTandaTerima = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        showLoading = true,
        forceRefresh = false
    ) => {
        console.log('🔄 [FETCH] Starting fetch with params:', { page, perPage, search, showLoading, forceRefresh });
        
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            // Try to call real API - Using GET with query params
            const params = new URLSearchParams({
                draw: '1',
                start: ((page - 1) * perPage).toString(),
                length: perPage.toString(),
                'search[value]': search || '',
                'order[0][column]': '0',
                'order[0][dir]': 'desc'
            });
            
            // Force bypass cache when forceRefresh is true
            const fetchOptions = forceRefresh ? { cache: false } : {};
            console.log('🔄 [FETCH] Fetch options:', fetchOptions);
            
            const response = await HttpClient.get(
                `${API_ENDPOINTS.HO.TANDA_TERIMA.LIST}?${params.toString()}`,
                fetchOptions
            );

            // Validate response structure
            if (!response || !response.data) {
                throw new Error('Invalid response structure from server');
            }

            // Debug: Log the response
            console.log('Backend Response:', response.data);

            // Backend returns data directly in response.data (it's already an array)
            // OR it might be in response.data.data (DataTables format)
            let dataArray;
            if (Array.isArray(response.data)) {
                // Data is directly in response.data
                dataArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                // Data is in response.data.data (DataTables format)
                dataArray = response.data.data;
            } else {
                dataArray = [];
            }
            
            // Debug: Log raw data
            console.log('Raw Data Array:', dataArray);
            
            // Transform backend data to frontend format
            const transformedData = Array.isArray(dataArray)
                ? dataArray.map(transformBackendToFrontend)
                : [];
            
            // Debug: Log transformed data
            console.log('Transformed Data:', transformedData);
            
            setTandaTerima(transformedData);
            
            // Calculate stats from all data
            const calculatedStats = calculateStats(transformedData);
            setStats(calculatedStats);

            // Update pagination from server response
            let totalRecords;
            if (Array.isArray(response.data)) {
                // If data is direct array, use its length
                totalRecords = response.data.length;
            } else {
                // If DataTables format, use recordsFiltered/recordsTotal
                totalRecords = response.data.recordsFiltered || response.data.recordsTotal || 0;
            }
            
            setServerPagination({
                currentPage: page,
                perPage: perPage,
                totalPages: Math.ceil(totalRecords / perPage) || 1,
                totalItems: totalRecords
            });

        } catch (err) {
            console.error('Error fetching tanda terima:', err);
            
            // Set empty data and show error
            setTandaTerima([]);
            setStats({
                total: 0,
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                thisYear: 0
            });
            setServerPagination({
                currentPage: 1,
                perPage: perPage,
                totalPages: 0,
                totalItems: 0
            });
            
            setError(err.response?.data?.message || err.message || 'Gagal memuat data dari server');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [calculateStats]);

    // Handle search with debounce
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setIsSearching(true);
        setSearchError(null);

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchTandaTerima(1, serverPagination.perPage, value, false);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchTandaTerima, serverPagination.perPage]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchTandaTerima(1, serverPagination.perPage, '', false);
    }, [fetchTandaTerima, serverPagination.perPage]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        fetchTandaTerima(page, serverPagination.perPage, searchTerm, true);
    }, [fetchTandaTerima, serverPagination.perPage, searchTerm]);

    // Handle per page change
    const handlePerPageChange = useCallback((perPage) => {
        fetchTandaTerima(1, perPage, searchTerm, true);
    }, [fetchTandaTerima, searchTerm]);

    // Create tanda terima
    const createTandaTerima = useCallback(async (data) => {
        console.log('💾 [CREATE HOOK] Starting create operation');
        try {
            // Transform frontend data to backend format
            const backendData = transformFrontendToBackend(data);
            
            // Call real API
            const response = await HttpClient.post(
                API_ENDPOINTS.HO.TANDA_TERIMA.STORE,
                backendData
            );

            // Check if response is successful
            if (response.data && response.data.header) {
                console.log('💾 [CREATE HOOK] Create successful, clearing cache and refreshing...');
                
                // Clear cache before fetching
                HttpClient.clearCache('tandaterimabarang');
                
                await fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: 'Data tanda terima berhasil disimpan',
                    data: response.data
                };
            }

            return {
                success: false,
                message: 'Gagal menyimpan data tanda terima'
            };
        } catch (error) {
            console.error('❌ [CREATE HOOK] Error creating tanda terima:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal menyimpan data ke server'
            };
        }
    }, [fetchTandaTerima, serverPagination, searchTerm]);

    // Update tanda terima
    const updateTandaTerima = useCallback(async (id, data) => {
        console.log('💾 [UPDATE HOOK] Starting update operation for ID:', id);
        try {
            // Transform frontend data to backend format
            const backendData = transformFrontendToBackend(data);
            
            // Call real API
            const response = await HttpClient.post(
                API_ENDPOINTS.HO.TANDA_TERIMA.UPDATE,
                {
                    pid: id,
                    ...backendData
                }
            );

            // Check if response is successful
            if (response.data) {
                console.log('💾 [UPDATE HOOK] Update successful, clearing cache and refreshing...');
                
                // Clear cache before fetching
                HttpClient.clearCache('tandaterimabarang');
                
                await fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: 'Data tanda terima berhasil diperbarui',
                    data: response.data
                };
            }

            return {
                success: false,
                message: 'Gagal memperbarui data tanda terima'
            };
        } catch (error) {
            console.error('❌ [UPDATE HOOK] Error updating tanda terima:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal memperbarui data ke server'
            };
        }
    }, [fetchTandaTerima, serverPagination, searchTerm]);

    // Delete tanda terima
    const deleteTandaTerima = useCallback(async (id) => {
        console.log('🗑️ [DELETE HOOK] Starting delete operation for ID:', id);
        try {
            // Call real API
            const response = await HttpClient.post(
                API_ENDPOINTS.HO.TANDA_TERIMA.DELETE,
                { pid: id }
            );

            // Check if response is successful
            if (response.data || response.success !== false) {
                console.log('🗑️ [DELETE HOOK] Delete successful, clearing cache and refreshing...');
                
                // Clear cache before fetching
                HttpClient.clearCache('tandaterimabarang');
                
                await fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: 'Data tanda terima berhasil dihapus'
                };
            }

            return {
                success: false,
                message: 'Gagal menghapus data tanda terima'
            };
        } catch (error) {
            console.error('❌ [DELETE HOOK] Error deleting tanda terima:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal menghapus data dari server'
            };
        }
    }, [fetchTandaTerima, serverPagination, searchTerm]);

    // Get tanda terima by ID - with officeOptions and satuanOptions to find IDs
    const getTandaTerimaById = useCallback(async (id, officeOptions = [], satuanOptions = []) => {
        try {
            // Call real API to get single record
            const response = await HttpClient.post(
                API_ENDPOINTS.HO.TANDA_TERIMA.SHOW,
                { pid: id }
            );

            // Debug: Log the response
            console.log('getTandaTerimaById Response:', response);

            // Check if response is successful
            if (response.data) {
                // Backend returns flat array structure where each item is a detail
                // Extract data array from response
                let dataArray;
                if (Array.isArray(response.data)) {
                    dataArray = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    dataArray = response.data.data;
                } else {
                    throw new Error('Invalid response structure');
                }

                if (!dataArray || dataArray.length === 0) {
                    return {
                        success: false,
                        message: 'Data tidak ditemukan'
                    };
                }

                // Extract header data from the first item (all items share same header data)
                const firstItem = dataArray[0];
                
                // Try to find id_office from lokasi_penerimaan if id_office is not available
                let resolvedIdOffice = firstItem.id_office || null;
                
                if (!resolvedIdOffice && firstItem.lokasi_penerimaan && officeOptions.length > 0) {
                    // Try to find matching office by name
                    const matchingOffice = officeOptions.find(
                        option => option.label && option.label.toLowerCase() === firstItem.lokasi_penerimaan.toLowerCase()
                    );
                    
                    if (matchingOffice) {
                        resolvedIdOffice = matchingOffice.value;
                        console.log('Found matching office ID:', resolvedIdOffice, 'for', firstItem.lokasi_penerimaan);
                    } else {
                        console.warn('No matching office found for:', firstItem.lokasi_penerimaan);
                    }
                }
                
                // Try to find id_satuan from satuan name if id_satuan is not available
                let resolvedIdSatuan = firstItem.id_satuan || null;
                
                if (!resolvedIdSatuan && firstItem.satuan && satuanOptions.length > 0) {
                    // Try to find matching satuan by name
                    const matchingSatuan = satuanOptions.find(
                        option => option.label && option.label.toLowerCase() === firstItem.satuan.toLowerCase()
                    );
                    
                    if (matchingSatuan) {
                        resolvedIdSatuan = matchingSatuan.value;
                        console.log('Found matching satuan ID:', resolvedIdSatuan, 'for', firstItem.satuan);
                    } else {
                        console.warn('No matching satuan found for:', firstItem.satuan);
                    }
                }
                
                const headerData = {
                    id_barang: firstItem.id_barang || null,
                    id_office: resolvedIdOffice,
                    nama_barang: firstItem.nama_barang || '',
                    pemasok: firstItem.pemasok || '',
                    nota: firstItem.nota || '',
                    tgl_terima: firstItem.tgl_terima || '',
                    nama_pengirim: firstItem.nama_pengirim || '',
                    plat_nomor: firstItem.plat_nomor || '',
                    id_satuan: resolvedIdSatuan,
                    penerima: firstItem.penerima || '',
                    id_tanda_terima: firstItem.id_tanda_terima || null, // Store header ID for detail updates
                    // Store original values for reference
                    lokasi_penerimaan: firstItem.lokasi_penerimaan || '',
                    satuan: firstItem.satuan || ''
                };
                
                console.log('Backend lokasi_penerimaan:', firstItem.lokasi_penerimaan);
                console.log('Resolved id_office:', resolvedIdOffice);
                console.log('Backend satuan:', firstItem.satuan);
                console.log('Resolved id_satuan:', resolvedIdSatuan);
                console.log('Backend id_tanda_terima:', firstItem.id_tanda_terima);
                console.log('Header id_tanda_terima:', headerData.id_tanda_terima);

                // Transform each item in the array to a detail item
                const detailData = dataArray.map((item, index) => ({
                    id: item.id || item.pid || Date.now() + index,
                    pid: item.pid || null, // Store pid for updates
                    id_tanda_terima: item.id_tanda_terima || null, // Store for reference
                    jenis_barang_id: item.jenis_barang_id || null,
                    jenis_barang_name: item.jenis_barang || '',
                    jumlah: item.jumlah || 0,
                    kondisi: item.kondisi || ''
                }));

                console.log('Transformed Header:', headerData);
                console.log('Transformed Details:', detailData);

                return {
                    success: true,
                    header: headerData,
                    details: detailData
                };
            }

            return {
                success: false,
                message: 'Data tidak ditemukan'
            };
        } catch (error) {
            console.error('Error fetching tanda terima by ID:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal memuat data dari server'
            };
        }
    }, []);

    // Update individual detail item
    const updateDetailItem = useCallback(async (headerPid, detailData) => {
        try {
            // Call real API to update/create detail
            const response = await HttpClient.post(
                API_ENDPOINTS.HO.TANDA_TERIMA.UPDATE,
                detailData
            );

            // Check if response is successful
            if (response.data) {
                return {
                    success: true,
                    message: 'Detail item berhasil disimpan',
                    data: response.data
                };
            }

            return {
                success: false,
                message: 'Gagal menyimpan detail item'
            };
        } catch (error) {
            console.error('Error updating detail item:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal menyimpan detail item ke server'
            };
        }
    }, []);

    return {
        tandaTerima,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchTandaTerima,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createTandaTerima,
        updateTandaTerima,
        deleteTandaTerima,
        getTandaTerimaById,
        updateDetailItem
    };
};

export default useTandaTerima;