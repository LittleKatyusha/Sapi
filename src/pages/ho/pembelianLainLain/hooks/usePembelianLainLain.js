import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../config/api';

const usePembelianLainLain = () => {
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenisPembelian, setFilterJenisPembelian] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 10
    });

    // Advanced filters state
    const [advancedFilters, setAdvancedFilters] = useState({
        nota_sistem: '',
        nota: '',
        nama_supplier: '',
        plat_nomor: '',
        jenis_pembelian: '',
        startDate: '',
        endDate: ''
    });

    // API stats state
    const [apiStats, setApiStats] = useState({
        recordsTotal: 0,
        recordsFiltered: 0
    });

    // Fetch pembelian Lain-Lain data from API
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, filter = null, isSearchRequest = false, forceRefresh = false, filters = null) => {
        console.log('Lain-Lain Hook: fetchPembelian called with params:', { page, perPage, search, isSearchRequest, forceRefresh, filters });
        setLoading(true);
        setError(null);
        setSearchError(null);

        if (isSearchRequest) {
            setIsSearching(true);
        }

        try {
            // Build DataTable request parameters similar to backend expectation
            const currentPage = page || serverPagination.currentPage;
            const currentPerPage = perPage || serverPagination.perPage;
            const currentSearch = search !== null ? search : searchTerm;
            const activeFilters = filters || advancedFilters;

            const params = new URLSearchParams({
                draw: '1',
                start: ((currentPage - 1) * currentPerPage).toString(),
                length: currentPerPage.toString(),
                'search[value]': currentSearch || '',
                'order[0][column]': '3', // tgl_masuk column
                'order[0][dir]': 'desc'
            });

            // Add advanced filters
            if (activeFilters?.nota_sistem) params.append('filter_nota_sistem', activeFilters.nota_sistem);
            if (activeFilters?.nota) params.append('filter_nota', activeFilters.nota);
            if (activeFilters?.nama_supplier) params.append('filter_nama_supplier', activeFilters.nama_supplier);
            if (activeFilters?.plat_nomor) params.append('filter_plat_nomor', activeFilters.plat_nomor);
            if (activeFilters?.jenis_pembelian) params.append('filter_jenis_pembelian', activeFilters.jenis_pembelian);
            if (activeFilters?.startDate) params.append('start_date', activeFilters.startDate);
            if (activeFilters?.endDate) params.append('end_date', activeFilters.endDate);

            // Add cache-busting parameter when forceRefresh is true
            const finalParams = forceRefresh ? `${params}&_t=${Date.now()}` : params;
            const responseData = await HttpClient.get(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/data?${finalParams}`);

            if (responseData.recordsTotal !== undefined) {
                // DataTable response format
                const processedData = responseData.data.map(item => ({
                    ...item,
                    id: item.pid, // Use backend encrypted ID
                    encryptedPid: item.pid || item.id,
                    satuan: 'item' // Default unit for Lain-Lain
                }));

                setPembelian(processedData);

                // Update pagination state
                setServerPagination({
                    currentPage: currentPage,
                    totalPages: Math.ceil(responseData.recordsFiltered / currentPerPage),
                    totalItems: responseData.recordsFiltered,
                    recordsTotal: responseData.recordsTotal,
                    perPage: currentPerPage
                });

                // Update API stats
                setApiStats({
                    recordsTotal: responseData.recordsTotal,
                    recordsFiltered: responseData.recordsFiltered
                });

            } else {
                throw new Error('Invalid response format from server');
            }

        } catch (err) {
            console.error('API call failed:', err.message);
            setError(err.message || 'Failed to fetch data');
            setPembelian([]);

            // Update pagination state for empty data
            setServerPagination({
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                perPage: perPage || serverPagination.perPage
            });

            setApiStats({
                recordsTotal: 0,
                recordsFiltered: 0
            });
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchTerm, serverPagination.currentPage, serverPagination.perPage, advancedFilters]);

    // Create pembelian Lain-Lain - handle header + details array format with file upload support
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Supplier validation removed - now handled as nama_supplier text field
            // biaya_truk, nama_supir, plat_nomor validations removed as fields are removed

            // Prepare request data - handle file upload with FormData
            let requestData;
            
            // If there's a file, use FormData for proper file upload
            if (pembelianData.file && pembelianData.file instanceof File) {
                requestData = new FormData();
                
                // Add all header fields to FormData
                Object.keys(pembelianData).forEach(key => {
                    if (key === 'file') {
                        requestData.append('file', pembelianData.file);
                    } else if (key === 'details') {
                        // Ensure details have proper field mapping for backend
                        const enhancedDetails = pembelianData.details.map(detail => {
                            console.log('📤 Processing detail for FormData:', detail);
                            
                            return {
                                ...detail,
                                // Ensure numeric IDs are properly included
                                id_item: detail.id_item || null,
                                id_klasifikasi_lainlain: detail.id_klasifikasi_lainlain || null,
                                // Include OVK field names for backward compatibility
                                id_klasifikasi_ovk: detail.id_klasifikasi_lainlain,
                                nama_klasifikasi_ovk: detail.nama_klasifikasi_lainlain
                            };
                        });
                        
                        console.log('📦 Enhanced details for backend:', enhancedDetails);
                        requestData.append('details', JSON.stringify(enhancedDetails));
                    } else {
                        requestData.append(key, pembelianData[key]);
                    }
                });
                
            } else {
                // No file upload, use regular JSON format
                // Enhance details with proper field mapping for backend
                const enhancedDetails = pembelianData.details.map(detail => {
                    console.log('📤 Processing detail for JSON:', detail);
                    
                    return {
                        ...detail,
                        // Ensure numeric IDs are properly included
                        id_item: detail.id_item || null,
                        id_klasifikasi_lainlain: detail.id_klasifikasi_lainlain || null,
                        // Include OVK field names for backward compatibility
                        id_klasifikasi_ovk: detail.id_klasifikasi_lainlain,
                        nama_klasifikasi_ovk: detail.nama_klasifikasi_lainlain
                    };
                });
                
                console.log('📦 Enhanced details for backend:', enhancedDetails);
                
                requestData = {
                    ...pembelianData,
                    details: enhancedDetails
                };
                
                // Remove file field if null to avoid validation issues
                if (!requestData.file) {
                    delete requestData.file;
                }
            }
            
            // Call real API endpoint for Lain-Lain creation
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/store`, requestData);
            
            if (responseData.status === 'ok') {
                // Refresh the data list
                await fetchPembelian(1, serverPagination.perPage);
                
                return {
                    success: true,
                    message: responseData.message || 'Pembelian Lain-Lain berhasil dibuat!',
                    data: responseData.data
                };
            } else {
                throw new Error(responseData.message || 'Gagal membuat pembelian Lain-Lain');
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.perPage]);

    // Update pembelian Lain-Lain - support file upload
    const updatePembelian = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            // Ensure pid is included in the request data
            if (!data.pid) {
                throw new Error('PID is required for update operation');
            }

            // Supplier validation removed - now handled as nama_supplier text field
            if (!data.nota || data.nota.trim() === '') {
                throw new Error('Nomor nota harus diisi');
            }

            // nama_supir, plat_nomor, biaya_truk validations removed as fields are removed

            // Prepare request data - handle file upload with FormData
            let requestData;
            
            // If there's a file, use FormData for proper file upload
            if (data.file && data.file instanceof File) {
                requestData = new FormData();
                
                // Add all fields to FormData
                Object.keys(data).forEach(key => {
                    if (key === 'file') {
                        requestData.append('file', data.file);
                    } else if (key === 'details') {
                        // Ensure details have proper field mapping for backend
                        const enhancedDetails = data.details.map(detail => {
                            console.log('📤 [UPDATE] Processing detail for FormData:', detail);
                            
                            return {
                                ...detail,
                                // Ensure numeric IDs are properly included
                                id_item: detail.id_item || null,
                                id_klasifikasi_lainlain: detail.id_klasifikasi_lainlain || null,
                                // Include OVK field names for backward compatibility
                                id_klasifikasi_ovk: detail.id_klasifikasi_lainlain,
                                nama_klasifikasi_ovk: detail.nama_klasifikasi_lainlain
                            };
                        });
                        
                        console.log('📦 [UPDATE] Enhanced details for backend:', enhancedDetails);
                        requestData.append('details', JSON.stringify(enhancedDetails));
                    } else {
                        requestData.append(key, data[key]);
                    }
                });
                
            } else {
                // No file upload, use regular JSON format
                // Enhance details with proper field mapping for backend
                const enhancedDetails = data.details.map(detail => {
                    console.log('📤 [UPDATE] Processing detail for JSON:', detail);
                    
                    return {
                        ...detail,
                        // Ensure numeric IDs are properly included
                        id_item: detail.id_item || null,
                        id_klasifikasi_lainlain: detail.id_klasifikasi_lainlain || null,
                        // Include OVK field names for backward compatibility
                        id_klasifikasi_ovk: detail.id_klasifikasi_lainlain,
                        nama_klasifikasi_ovk: detail.nama_klasifikasi_lainlain
                    };
                });
                
                console.log('📦 [UPDATE] Enhanced details for backend:', enhancedDetails);
                
                requestData = {
                    ...data,
                    details: enhancedDetails
                };
                
                // Remove file field if null to avoid validation issues
                if (!requestData.file) {
                    delete requestData.file;
                }
            }

            // Call real API endpoint for Lain-Lain update
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/update`, requestData);
            
            if (responseData.status === 'ok') {
                // Refresh the data list
                await fetchPembelian();
                
                return {
                    success: true,
                    message: responseData.message || 'Pembelian Lain-Lain berhasil diperbarui!'
                };
            } else {
                throw new Error(responseData.message || 'Gagal memperbarui pembelian Lain-Lain');
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian]);

    // Delete pembelian Lain-Lain
    const deletePembelian = useCallback(async (encryptedPid, pembelianData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid);
            
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak valid atau tidak ditemukan');
            }
            
            // Call real API endpoint for Lain-Lain deletion
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/hapus`, {
                pid: encryptedPid
            });
            
            if (responseData.status === 'ok') {
                // Calculate the current page after deletion
                const currentPage = serverPagination.currentPage;
                const currentPerPage = serverPagination.perPage;
                const totalItemsAfterDelete = Math.max(0, serverPagination.totalItems - 1);
                const totalPagesAfterDelete = Math.ceil(totalItemsAfterDelete / currentPerPage);
                
                // If current page is empty after deletion, go to previous page
                let targetPage = currentPage;
                if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
                    targetPage = totalPagesAfterDelete;
                }
                
                // Update pagination state
                setServerPagination(prev => ({
                    ...prev,
                    totalItems: totalItemsAfterDelete,
                    totalPages: totalPagesAfterDelete,
                    currentPage: targetPage
                }));
                
                // Refresh data with the correct page
                try {
                    await fetchPembelian(targetPage, currentPerPage, searchTerm, filterJenisPembelian, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after delete failed:', refreshError);
                    // If refresh fails, try to refresh the first page
                    try {
                        await fetchPembelian(1, currentPerPage, searchTerm, filterJenisPembelian, false, true);
                    } catch (fallbackError) {
                        console.error('Fallback refresh also failed:', fallbackError);
                    }
                }
                
                return {
                    success: true,
                    message: responseData.message || 'Data berhasil dihapus'
                };
            } else {
                throw new Error(responseData.message || 'Gagal menghapus data');
            }
            
        } catch (err) {
            // Handle error without mock data fallback
            console.error('API call failed:', err.message);
            setError(err.message || 'Failed to delete data');
            
            return {
                success: false,
                message: err.message || 'Gagal menghapus data'
            };
        } finally {
            setDeleteLoading(null);
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage, serverPagination.totalItems, searchTerm, filterJenisPembelian]);

    // Get pembelian detail
    const getPembelianDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            // Call real API endpoint for Lain-Lain detail
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/show`, {
                pid: encryptedPid
            });
            
            if (responseData.status === 'ok') {
                return {
                    success: true,
                    data: responseData.data || [],
                    header: responseData.header || null,
                    message: responseData.message || 'Detail pembelian berhasil diambil'
                };
            } else {
                throw new Error(responseData.message || 'Gagal mengambil detail pembelian');
            }
            
        } catch (err) {
            console.error('Get pembelian detail error:', err);
            setError(err.message || 'Failed to get details');
            return {
                success: false,
                data: [],
                header: null,
                message: err.message || 'Failed to get details'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // View uploaded file from pembelian Lain-Lain - Updated to use direct URL access
    const viewUploadedFile = useCallback(async (filePath) => {
        if (!filePath) {
            return {
                success: false,
                message: 'Path file tidak valid'
            };
        }

        try {
            // Check if it's already a complete pre-signed URL from the database
            if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
                // It's already a complete URL (like https://assets.ternasys.com/...?X-Amz-Signature=...)
                // Open directly without any processing
                const newWindow = window.open(filePath, '_blank');
                
                if (!newWindow || newWindow.closed) {
                    // Fallback: Create a link and click it
                    const link = document.createElement('a');
                    link.href = filePath;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    const fileName = filePath.split('/').pop()?.split('?')[0] || 'document';
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                
                return {
                    success: true,
                    message: 'File berhasil dibuka'
                };
            } else {
                // Legacy path format - construct the full URL
                // This is for backward compatibility with older data
                const cleanPath = filePath.replace(/\\/g, '/');
                
                // If it's a relative path, we might need to construct the full URL
                // Check if the backend provides a base URL for assets
                let fullUrl;
                
                // If the path looks like it should be on assets.ternasys.com
                if (cleanPath.includes('ternasys') || cleanPath.includes('pembelian')) {
                    // Construct the full Minio/S3 URL
                    fullUrl = `https://assets.ternasys.com/${cleanPath}`;
                } else {
                    // Fall back to the API endpoint for legacy files
                    fullUrl = `${API_BASE_URL}${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/file/${cleanPath}`;
                }
                
                // Open the URL directly
                const newWindow = window.open(fullUrl, '_blank');
                
                if (!newWindow || newWindow.closed) {
                    // Fallback: Create a link and click it
                    const link = document.createElement('a');
                    link.href = fullUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    const fileName = cleanPath.split('/').pop() || 'document';
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                
                return {
                    success: true,
                    message: 'File berhasil dibuka'
                };
            }
        } catch (error) {
            console.error('File access error:', error);
            return {
                success: false,
                message: error.message || 'Gagal membuka file. Silakan coba lagi.'
            };
        }
    }, []);

    // Computed stats
    const stats = useMemo(() => {
        const total = pembelian.length;
        const totalLainLainQty = pembelian.reduce((sum, item) => sum + (item.jumlah || 0), 0);

        // Today's purchases
        const today = new Date().toDateString();
        const todayPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        }).length;

        // This month's purchases
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        }).length;

        // This year's purchases
        const thisYearPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getFullYear() === currentYear;
        }).length;

        return {
            total: serverPagination.recordsTotal || serverPagination.totalItems || total,
            totalLainLain: totalLainLainQty,
            today: todayPurchases,
            thisMonth: thisMonthPurchases,
            thisYear: thisYearPurchases
        };
    }, [pembelian, serverPagination.totalItems, serverPagination.recordsTotal]);

    // Enhanced debounced search handler
    const searchTimeoutRef = useRef(null);
    
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!newSearchTerm.trim()) {
            fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false, false, advancedFilters);
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchPembelian(1, serverPagination.perPage, newSearchTerm, filterJenisPembelian, true, false, advancedFilters);
        }, 300);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian, advancedFilters]);

    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false, false, advancedFilters);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian, advancedFilters]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Filter handler
    const handleFilter = useCallback((newFilter) => {
        setFilterJenisPembelian(newFilter);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, newFilter, false, false, advancedFilters);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, advancedFilters]);

    // Advanced filter handlers
    const handleAdvancedFilters = useCallback((newFilters) => {
        setAdvancedFilters(newFilters);
        fetchPembelian(1, serverPagination.perPage, searchTerm, filterJenisPembelian, false, true, newFilters);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterJenisPembelian]);

    const clearAdvancedFilters = useCallback(() => {
        const emptyFilters = {
            nota_sistem: '',
            nota: '',
            nama_supplier: '',
            plat_nomor: '',
            jenis_pembelian: '',
            startDate: '',
            endDate: ''
        };
        setAdvancedFilters(emptyFilters);
        fetchPembelian(1, serverPagination.perPage, searchTerm, filterJenisPembelian, false, true, emptyFilters);
        return emptyFilters;
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterJenisPembelian]);

    // Pagination handlers
    const handlePageChange = useCallback((newPage) => {
        fetchPembelian(newPage, serverPagination.perPage, searchTerm, filterJenisPembelian, false, false, advancedFilters);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterJenisPembelian, advancedFilters]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, searchTerm, filterJenisPembelian, false, false, advancedFilters);
    }, [fetchPembelian, searchTerm, filterJenisPembelian, advancedFilters]);

    return {
        pembelian,
        allPembelian: pembelian,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterJenisPembelian,
        setFilterJenisPembelian,
        isSearching,
        searchError,
        stats,
        apiStats,
        serverPagination,
        fetchPembelian,
        advancedFilters,
        handleAdvancedFilters,
        clearAdvancedFilters,
        handleSearch,
        clearSearch,
        handleFilter,
        handlePageChange,
        handlePerPageChange,
        createPembelian,
        updatePembelian,
        deletePembelian,
        deleteLoading,
        getPembelianDetail,
        viewUploadedFile
    };
};

export default usePembelianLainLain;
