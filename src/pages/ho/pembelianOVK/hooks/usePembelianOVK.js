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

    // Mock data untuk sementara - nanti bisa diganti dengan API call
    const mockData = [
        {
            id: 1,
            encryptedPid: 'encrypted_1',
            nota: 'OVK-001-2024',
            nama_supplier: 'PT Farmasi Veteriner',
            tgl_masuk: '2024-01-15',
            nama_supir: 'Budi Santoso',
            plat_nomor: 'B 1234 AB',
            jumlah: 20,
            satuan: 'btl',
            berat_total: 100,
            biaya_total: 2000000,
            biaya_lain: 100000,
            tipe_pembelian: 1, // Will be mapped to jenis_pembelian
            jenis_pembelian: 'INTERNAL'
        },
        {
            id: 2,
            encryptedPid: 'encrypted_2',
            nota: 'OVK-002-2024',
            nama_supplier: 'CV Medikamen Ternak',
            tgl_masuk: '2024-01-16',
            nama_supir: 'Sukarno',
            plat_nomor: 'B 5678 CD',
            jumlah: 15,
            satuan: 'btl',
            berat_total: 75,
            biaya_total: 1500000,
            biaya_lain: 75000,
            tipe_pembelian: 2, // Will be mapped to jenis_pembelian
            jenis_pembelian: 'INTERNAL'
        },
        {
            id: 3,
            encryptedPid: 'encrypted_3',
            nota: 'OVK-003-2024',
            nama_supplier: 'PT Vitamin Ternak',
            tgl_masuk: '2024-01-17',
            nama_supir: 'Joko Widodo',
            plat_nomor: 'B 9999 EF',
            jumlah: 30,
            satuan: 'pack',
            berat_total: 150,
            biaya_total: 3000000,
            biaya_lain: 150000,
            tipe_pembelian: 3, // Will be mapped to jenis_pembelian
            jenis_pembelian: 'INTERNAL'
        }
    ];

    // Fetch pembelian OVK data from API
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

            // Call real API endpoint for OVK data
            // Add cache-busting parameter when forceRefresh is true
            const finalParams = forceRefresh ? { ...params, _t: Date.now() } : params;
            const responseData = await HttpClient.get(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/data`, {
                params: finalParams
            });
            
            if (responseData.recordsTotal !== undefined) {
                // DataTable response format
                const processedData = responseData.data.map(item => ({
                    ...item,
                    encryptedPid: item.pid || item.id, // Use backend encrypted ID
                    satuan: 'item' // Default unit for OVK
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
            // Fallback to mock data for development
            console.warn('API call failed, using mock data:', err.message);
            
            // Use mock data sebagai fallback
            let filteredData = [...mockData];
            
            // Apply search filter
            const currentSearch = search !== null ? search : searchTerm;
            if (currentSearch && currentSearch.trim()) {
                filteredData = filteredData.filter(item => 
                    item.nota.toLowerCase().includes(currentSearch.toLowerCase()) ||
                    item.nama_supplier.toLowerCase().includes(currentSearch.toLowerCase()) ||
                    item.nama_supir.toLowerCase().includes(currentSearch.toLowerCase()) ||
                    item.plat_nomor.toLowerCase().includes(currentSearch.toLowerCase())
                );
            }
            
            // Apply jenis pembelian filter
            const currentFilter = filter !== null ? filter : filterJenisPembelian;
            if (currentFilter && currentFilter !== 'all') {
                filteredData = filteredData.filter(item => item.jenis_pembelian === currentFilter);
            }
            
            // Apply pagination
            const currentPage = page || serverPagination.currentPage;
            const currentPerPage = perPage || serverPagination.perPage;
            const totalItems = filteredData.length;
            const totalPages = Math.ceil(totalItems / currentPerPage);
            const startIndex = (currentPage - 1) * currentPerPage;
            const endIndex = startIndex + currentPerPage;
            const paginatedData = filteredData.slice(startIndex, endIndex);
            
            // Update pagination state
            setServerPagination({
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                perPage: currentPerPage
            });
            
            setPembelian(paginatedData);
            
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchTerm, filterJenisPembelian, serverPagination.currentPage, serverPagination.perPage]);

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
            // Fallback to mock data for development
            console.warn('API call failed, using mock data:', err.message);
            
            // Calculate pagination for mock data
            const currentPage = serverPagination.currentPage;
            const currentPerPage = serverPagination.perPage;
            const totalItemsAfterDelete = Math.max(0, serverPagination.totalItems - 1);
            const totalPagesAfterDelete = Math.ceil(totalItemsAfterDelete / currentPerPage);
            
            // If current page is empty after deletion, go to previous page
            let targetPage = currentPage;
            if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
                targetPage = totalPagesAfterDelete;
            }
            
            // Remove from mock data
            const index = mockData.findIndex(item => item.encryptedPid === encryptedPid);
            if (index !== -1) {
                mockData.splice(index, 1);
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
                message: 'Data berhasil dihapus (mock data)'
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
            // Fallback to mock data for development
            console.warn('API call failed, using mock data:', err.message);
            
            const item = mockData.find(item => item.encryptedPid === encryptedPid);
            
            // Map tipe_pembelian to jenis_pembelian in mock data if needed
            let headerData = item;
            if (item && item.tipe_pembelian) {
                headerData = {
                    ...item,
                    jenis_pembelian: mapTipePembelianToJenis(item.tipe_pembelian)
                };
            }
            
            return {
                success: true,
                data: item ? [item] : [],
                header: headerData || null, // Use item as header for mock data with mapped jenis_pembelian
                message: 'Detail pembelian berhasil diambil (mock data)'
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
        // Use API data if available, fallback to mock data
        const useApiData = apiStats.recordsTotal > 0;
        
        if (useApiData) {
            // Calculate from current filtered data for other stats
            const totalOVK = pembelian.reduce((sum, item) => sum + (item.jumlah || 0), 0);
            
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
                total: apiStats.recordsTotal, // Use recordsTotal from API
                totalOVK: totalOVK,
                today: todayPurchases,
                thisMonth: thisMonthPurchases
            };
        } else {
            // Fallback to mock data calculations
            const total = mockData.length;
            const totalOVK = mockData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
            
            // Today's purchases
            const today = new Date().toDateString();
            const todayPurchases = mockData.filter(item => {
                const itemDate = new Date(item.tgl_masuk).toDateString();
                return itemDate === today;
            }).length;
            
            // This month's purchases
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();
            const thisMonthPurchases = mockData.filter(item => {
                const itemDate = new Date(item.tgl_masuk);
                return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
            }).length;
            
            return {
                total: total,
                totalOVK: totalOVK,
                today: todayPurchases,
                thisMonth: thisMonthPurchases
            };
        }
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
        downloadFile,
        viewUploadedFile
    };
};

export default usePembelianOVK;
