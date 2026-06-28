import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../config/api';
import useJenisPembelianOVK from './useJenisPembelianOVK';



const usePembelianOVK = () => {
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenisPembelian, setFilterJenisPembelian] = useState('all');
    const [advancedFilters, setAdvancedFilters] = useState({
        nota_sistem: '',
        nota: '',
        nama_supplier: '',
        plat_nomor: '',
        jenis_pembelian: '',
        startDate: '',
        endDate: ''
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Get jenis pembelian options for mapping
    const { jenisPembelianOptions } = useJenisPembelianOVK();

    // Mapping function to convert tipe_pembelian to jenis_pembelian
    const mapTipePembelianToJenis = useCallback((tipePembelian) => {
        if (!tipePembelian || !jenisPembelianOptions.length) {
            return 'INTERNAL'; // Default fallback based on actual API response
        }
        
        // Convert tipePembelian to string for comparison since API returns string values
        const tipePembelianStr = String(tipePembelian);
        const found = jenisPembelianOptions.find(option => String(option.value) === tipePembelianStr);
        return found ? found.label : 'INTERNAL';
    }, [jenisPembelianOptions]);

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

    // Fetch pembelian OVK data from API
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, filter = null, isSearchRequest = false, forceRefresh = false, filters = null) => {
        setLoading(true);
        setError(null);
        setSearchError(null);
        
        if (isSearchRequest) {
            setIsSearching(true);
        }
        
        try {
            const currentPage = page || serverPagination.currentPage;
            const currentPerPage = perPage || serverPagination.perPage;
            const currentSearch = search !== null ? search : searchTerm;
            const currentFilters = filters || advancedFilters;
            
            const params = new URLSearchParams({
                draw: '1',
                start: ((currentPage - 1) * currentPerPage).toString(),
                length: currentPerPage.toString(),
                'search[value]': currentSearch || '',
                'order[0][column]': '3', // tgl_masuk column
                'order[0][dir]': 'desc'
            });

            if (currentFilters.nota_sistem) params.append('filter_nota_sistem', currentFilters.nota_sistem);
            if (currentFilters.nota) params.append('filter_nota', currentFilters.nota);
            if (currentFilters.nama_supplier) params.append('filter_nama_supplier', currentFilters.nama_supplier);
            if (currentFilters.plat_nomor) params.append('filter_plat_nomor', currentFilters.plat_nomor);
            if (currentFilters.jenis_pembelian) params.append('filter_jenis_pembelian', currentFilters.jenis_pembelian);
            if (currentFilters.startDate) params.append('start_date', currentFilters.startDate);
            if (currentFilters.endDate) params.append('end_date', currentFilters.endDate);

            const finalParams = forceRefresh ? `${params}&_t=${Date.now()}` : params;
            const responseData = await HttpClient.get(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/data?${finalParams}`);
            
            if (responseData && responseData.data) {
                console.log('🔍 OVK API Response Sample:', responseData.data[0]);
                console.log('🔍 OVK nota_sistem field:', responseData.data[0]?.nota_sistem);
                
                const processedData = responseData.data.map(item => ({
                    ...item,
                    encryptedPid: item.pid || item.id,
                    satuan: 'item'
                }));

                setPembelian(processedData);
                
                setServerPagination({
                    currentPage: currentPage,
                    totalPages: Math.ceil((responseData.recordsFiltered || 0) / currentPerPage),
                    totalItems: responseData.recordsFiltered || 0,
                    recordsTotal: responseData.recordsTotal || 0,
                    perPage: currentPerPage
                });

                setApiStats({
                    recordsTotal: responseData.recordsTotal || 0,
                    recordsFiltered: responseData.recordsFiltered || 0
                });
                
            } else {
                setPembelian([]);
                setServerPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
            }
            
        } catch (err) {
            console.error('Fetch pembelian OVK error:', err);
            const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data pembelian OVK';
            
            if (isSearchRequest) {
                setSearchError(errorMessage);
            } else {
                setError(errorMessage);
            }
            
            setPembelian([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchTerm, filterJenisPembelian, advancedFilters]);

    // Create pembelian OVK - handle header + details array format with file upload support
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Validate required fields before sending
            if (!pembelianData.id_supplier || pembelianData.id_supplier <= 0) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }
            
            if (pembelianData.biaya_truk === null || pembelianData.biaya_truk === undefined || isNaN(pembelianData.biaya_truk) || pembelianData.biaya_truk < 0) {
                throw new Error('Biaya truck harus diisi dengan nilai numerik >= 0');
            }

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
                        requestData.append('details', JSON.stringify(pembelianData.details || []));
                    } else {
                        requestData.append(key, pembelianData[key]);
                    }
                });
                
            } else {
                // No file upload, use regular JSON format
                requestData = {
                    ...pembelianData,
                    details: pembelianData.details || []
                };
                
                // Remove file field if null to avoid validation issues
                if (!requestData.file) {
                    delete requestData.file;
                }
            }
            
            // Call real API endpoint for OVK creation
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/store`, requestData);
            
            if (responseData.status === 'ok') {
                // Refresh the data list
                await fetchPembelian(1, serverPagination.perPage);
                
                return {
                    success: true,
                    message: responseData.message || 'Pembelian OVK berhasil dibuat!',
                    data: responseData.data
                };
            } else {
                throw new Error(responseData.message || 'Gagal membuat pembelian OVK');
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.perPage]);

    // Update pembelian OVK - support file upload
    const updatePembelian = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            // Ensure pid is included in the request data
            if (!data.pid) {
                throw new Error('PID is required for update operation');
            }

            // Validate required fields for update
            if (!data.id_supplier || data.id_supplier <= 0) {
                throw new Error('Supplier harus dipilih');
            }
            if (!data.nota || data.nota.trim() === '') {
                throw new Error('Nomor nota harus diisi');
            }

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
                        requestData.append('details', JSON.stringify(data.details || []));
                    } else {
                        requestData.append(key, data[key]);
                    }
                });
                
            } else {
                // No file upload, use regular JSON format
                requestData = {
                    ...data,
                    details: data.details || []
                };
                
                // Remove file field if null to avoid validation issues
                if (!requestData.file) {
                    delete requestData.file;
                }
            }

            // Call real API endpoint for OVK update
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/update`, requestData);
            
            if (responseData.status === 'ok') {
                // Refresh the data list
                await fetchPembelian();
                
                return {
                    success: true,
                    message: responseData.message || 'Pembelian OVK berhasil diperbarui!'
                };
            } else {
                throw new Error(responseData.message || 'Gagal memperbarui pembelian OVK');
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian]);

    // Delete pembelian OVK
    const deletePembelian = useCallback(async (encryptedPid, pembelianData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid);
            
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak valid atau tidak ditemukan');
            }
            
            // Call real API endpoint for OVK deletion
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/hapus`, {
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
            console.error('Delete pembelian OVK error:', err);
            return {
                success: false,
                message: err.message || 'Gagal menghapus data pembelian OVK'
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
            // Call real API endpoint for OVK detail
            const responseData = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/show`, {
                pid: encryptedPid
            });
            
            if (responseData.status === 'ok') {
                // Map tipe_pembelian to jenis_pembelian in header data
                let headerData = responseData.header;
                if (headerData && headerData.tipe_pembelian) {
                    headerData = {
                        ...headerData,
                        jenis_pembelian: mapTipePembelianToJenis(headerData.tipe_pembelian)
                    };
                }

                return {
                    success: true,
                    data: responseData.data || [],
                    header: headerData || null, // Include header data from /show endpoint with mapped jenis_pembelian
                    message: responseData.message || 'Detail pembelian berhasil diambil'
                };
            } else {
                throw new Error(responseData.message || 'Gagal mengambil detail pembelian');
            }
            
        } catch (err) {
            console.error('Get pembelian OVK detail error:', err);
            return {
                success: false,
                data: [],
                header: null,
                message: err.message || 'Gagal mengambil detail pembelian OVK'
            };
        } finally {
            setLoading(false);
        }
    }, [mapTipePembelianToJenis]);

    // View uploaded file from pembelian OVK - Updated with new file access pattern
    const viewUploadedFile = useCallback(async (filePath) => {
        if (filePath) {
            try {
                // Debug: Log the original path
                console.log('usePembelianOVK - Original file path:', filePath);
                
                let cleanPath;
                
                // Check if it's a full Minio URL or relative path
                if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
                    // It's a full Minio URL, extract the relative path
                    // Example: http://31.97.110.74:9000/ternasys/ho/ovk/pembelian/2025/9/224/filename.pdf
                    // Extract: ho/ovk/pembelian/2025/9/224/filename.pdf
                    const url = new URL(filePath);
                    const pathParts = url.pathname.split('/');
                    // Remove empty parts and 'ternasys' prefix
                    const filteredParts = pathParts.filter(part => part && part !== 'ternasys');
                    cleanPath = filteredParts.join('/');
                    console.log('usePembelianOVK - Extracted relative path from Minio URL:', cleanPath);
                } else {
                    // It's already a relative path
                    cleanPath = filePath.replace(/\\/g, '/');
                    console.log('usePembelianOVK - Using relative path as is:', cleanPath);
                }
                
                // Create the API endpoint URL
                const fileUrl = `${API_BASE_URL}${API_ENDPOINTS.HO.OVK.PEMBELIAN}/file/${cleanPath}`;
                
                console.log('usePembelianOVK - Final file URL:', fileUrl);
                
                // Get auth token for authenticated request
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                
                if (!token) {
                    return {
                        success: false,
                        message: 'Sesi login telah berakhir. Silakan login kembali.'
                    };
                }
                
                // Try to open in new tab with authentication
                const newWindow = window.open('about:blank', '_blank');
                
                // Create authenticated request and open in new window
                const response = await fetch(fileUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/pdf,image/*,*/*',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                console.log('usePembelianOVK - Response status:', response.status);
                console.log('usePembelianOVK - Response headers:', response.headers);
                
                if (response.ok) {
                    // Check if response is a streamed response from backend
                    const contentType = response.headers.get('content-type');
                    const contentDisposition = response.headers.get('content-disposition');
                    
                    console.log('usePembelianOVK - Content-Type:', contentType);
                    console.log('usePembelianOVK - Content-Disposition:', contentDisposition);
                    
                    // If it's a streamed response, handle it properly
                    if (contentType && (contentType.includes('application/pdf') || contentType.includes('image/'))) {
                        const blob = await response.blob();
                        console.log('usePembelianOVK - Blob received:', blob);
                        console.log('usePembelianOVK - Blob size:', blob.size);
                        console.log('usePembelianOVK - Blob type:', blob.type);
                        
                        if (blob.size === 0) {
                            throw new Error('File kosong atau tidak valid');
                        }
                        
                        const blobUrl = URL.createObjectURL(blob);
                        console.log('usePembelianOVK - Blob URL created:', blobUrl);
                        
                        if (newWindow && !newWindow.closed) {
                            newWindow.location.href = blobUrl;
                            // Clean up blob URL after a delay to allow the window to load
                            setTimeout(() => {
                                URL.revokeObjectURL(blobUrl);
                            }, 1000);
                        } else {
                            // Fallback: download file
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = cleanPath.split('/').pop() || 'document';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(blobUrl);
                        }
                        
                        return {
                            success: true,
                            message: 'File berhasil dibuka'
                        };
                    } else {
                        // Fallback for other content types
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        
                        if (newWindow && !newWindow.closed) {
                            newWindow.location.href = blobUrl;
                            setTimeout(() => {
                                URL.revokeObjectURL(blobUrl);
                            }, 1000);
                        }
                        
                        return {
                            success: true,
                            message: 'File berhasil dibuka'
                        };
                    }
                } else if (response.status === 401) {
                    throw new Error('Sesi login telah berakhir');
                } else if (response.status === 404) {
                    throw new Error('File tidak ditemukan di server');
                } else if (response.status === 403) {
                    throw new Error('Tidak memiliki izin untuk mengakses file ini');
                } else {
                    throw new Error(`File tidak dapat diakses (${response.status})`);
                }
                
            } catch (error) {
                console.error('usePembelianOVK - File access error:', error);
                return {
                    success: false,
                    message: error.message || 'Gagal membuka file. Silakan coba lagi.'
                };
            }
        } else {
            return {
                success: false,
                message: 'Path file tidak valid'
            };
        }
    }, []);

    // Download file from pembelian OVK - Legacy method for backward compatibility
    const downloadFile = useCallback(async (filePath) => {
        try {
            // Call API endpoint for file download
            const response = await HttpClient.get(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/file/${encodeURIComponent(filePath)}`, {
                responseType: 'blob'
            });
            
            // Create blob URL and trigger download
            const blob = new Blob([response], { type: response.type || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Extract filename from path or use default
            const filename = filePath.split('/').pop() || 'dokumen-pembelian-ovk';
            link.setAttribute('download', filename);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return {
                success: true,
                message: 'File berhasil didownload'
            };
            
        } catch (err) {
            console.error('Download file error:', err);
            return {
                success: false,
                message: err.message || 'Gagal mendownload file'
            };
        }
    }, []);

    // Computed stats
    const stats = useMemo(() => {
        const total = serverPagination.recordsTotal || serverPagination.totalItems || pembelian.length;
        const totalOVK = pembelian.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        const today = new Date().toDateString();
        const todayPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        }).length;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        }).length;
        
        const thisYearPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getFullYear() === currentYear;
        }).length;
        
        return {
            total: total,
            totalOVK: totalOVK,
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

    // Advanced filter handlers
    const handleAdvancedFilters = useCallback((newFilters) => {
        setAdvancedFilters(newFilters);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false, false, newFilters);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian]);

    const clearAdvancedFilters = useCallback((emptyFilters = null) => {
        const resetFilters = emptyFilters || {
            nota_sistem: '',
            nota: '',
            nama_supplier: '',
            plat_nomor: '',
            jenis_pembelian: '',
            startDate: '',
            endDate: ''
        };
        setAdvancedFilters(resetFilters);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false, false, resetFilters);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian]);

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
        handleSearch,
        clearSearch,
        handleFilter,
        advancedFilters,
        handleAdvancedFilters,
        clearAdvancedFilters,
        handlePageChange,
        handlePerPageChange,
        createPembelian,
        updatePembelian,
        deletePembelian,
        deleteLoading,
        getPembelianDetail,
        downloadFile,
        viewUploadedFile
    };
};

export default usePembelianOVK;
