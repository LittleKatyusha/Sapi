import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../config/api';
import useJenisPembelianLainLain from './useJenisPembelianLainLain';

const usePembelianLainLain = () => {
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenisPembelian, setFilterJenisPembelian] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Get jenis pembelian options for mapping
    const { jenisPembelianOptions } = useJenisPembelianLainLain();

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 10
    });

    // API stats state
    const [apiStats, setApiStats] = useState({
        recordsTotal: 0,
        recordsFiltered: 0
    });

    // Fetch pembelian Lain-Lain data from API
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, filter = null, isSearchRequest = false, forceRefresh = false) => {
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
            
            const params = {
                draw: 1,
                start: (currentPage - 1) * currentPerPage,
                length: currentPerPage,
                'search[value]': currentSearch || '',
                'search[regex]': false,
                'order[0][column]': 0,
                'order[0][dir]': 'desc'
            };

            // Call real API endpoint for Lain-Lain data
            // Add cache-busting parameter when forceRefresh is true
            const finalParams = forceRefresh ? { ...params, _t: Date.now() } : params;
            const responseData = await HttpClient.get(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/data`, {
                params: finalParams
            });
            
            if (responseData.recordsTotal !== undefined) {
                // DataTable response format
                const processedData = responseData.data.map(item => ({
                    ...item,
                    encryptedPid: item.pid || item.id, // Use backend encrypted ID
                    satuan: 'item' // Default unit for Lain-Lain
                }));

                setPembelian(processedData);
                
                // Update pagination state
                setServerPagination({
                    currentPage: currentPage,
                    totalPages: Math.ceil(responseData.recordsFiltered / currentPerPage),
                    totalItems: responseData.recordsFiltered,
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
    }, [searchTerm, filterJenisPembelian, serverPagination.currentPage, serverPagination.perPage]);

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
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage, searchTerm, filterJenisPembelian]);

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
        // Calculate from current filtered data - sum up jumlah (total items)
        const totalLainLain = pembelian.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        // Today's purchases from current data
        const today = new Date().toDateString();
        const todayPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        }).length;
        
        // This month's purchases from current data
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        }).length;
        
        return {
            total: apiStats.recordsTotal,
            totalLainLain: totalLainLain, // Total items (jumlah)
            today: todayPurchases,
            thisMonth: thisMonthPurchases
        };
    }, [apiStats.recordsTotal, pembelian]);

    // Enhanced debounced search handler
    const searchTimeoutRef = useRef(null);
    
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (!newSearchTerm.trim()) {
            fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            fetchPembelian(1, serverPagination.perPage, newSearchTerm, filterJenisPembelian, true);
        }, 300);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian]);
    
    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian]);
    
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
        fetchPembelian(1, serverPagination.perPage, searchTerm, newFilter, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm]);

    // Pagination handlers
    const handlePageChange = useCallback((newPage) => {
        fetchPembelian(newPage, serverPagination.perPage, searchTerm, filterJenisPembelian, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterJenisPembelian]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, searchTerm, filterJenisPembelian, false);
    }, [fetchPembelian, searchTerm, filterJenisPembelian]);

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
