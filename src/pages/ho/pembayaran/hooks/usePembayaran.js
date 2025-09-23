import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// HttpClient already handles JSON parsing and error handling internally

const usePembayaran = () => {
    const [pembayaran, setPembayaran] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
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

    // Base API endpoint for pembayaran
    const PAYMENT_API_BASE = API_ENDPOINTS.HO.PAYMENT.BASE;

    // Fetch pembayaran data from API
    const fetchPembayaran = useCallback(async (page = 1, perPage = null, search = null, isSearchRequest = false, forceRefresh = false) => {
        console.log('🔄 Pembayaran Hook: fetchPembayaran called with params:', { page, perPage, search, isSearchRequest, forceRefresh });
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
            
            // Prepare DataTables format parameters for backend
            const params = new URLSearchParams({
                draw: '1',
                start: ((currentPage - 1) * currentPerPage).toString(),
                length: currentPerPage.toString(),
                'search[value]': currentSearch || '',
                'order[0][column]': '3', // due_date column
                'order[0][dir]': 'desc'
            });
            
            // Add cache-busting parameter when forceRefresh is true
            const finalParams = forceRefresh ? `${params}&_t=${Date.now()}` : params;
            const apiUrl = `${API_ENDPOINTS.HO.PAYMENT.DATA}?${finalParams}`;
            console.log('🔄 Pembayaran Hook: Making API call to:', apiUrl);
            const jsonData = await HttpClient.get(apiUrl);
            
            if (jsonData && jsonData.data) {
                // Transform backend data to match frontend expectations
                const transformedData = jsonData.data.map(item => ({
                    id: item.pid, // Use encrypted pid as id
                    encryptedPid: item.pid,
                    nota_ho: item.nota_ho,
                    nama_supplier: item.nama_supplier,
                    due_date: item.due_date,
                    settlement_date: item.settlement_date,
                    payment_status: item.payment_status,
                    amount: item.amount,
                    // Add the missing fields for the new columns
                    farm: item.farm,
                    syarat_pembayaran: item.syarat_pembayaran,
                    // Also include the ID fields for potential conversion
                    id_farm: item.id_farm,
                    id_syarat_pembayaran: item.id_syarat_pembayaran
                }));
                
                // Update pagination state from server response
                setServerPagination({
                    currentPage: currentPage,
                    totalPages: Math.ceil((jsonData.recordsFiltered || 0) / currentPerPage),
                    totalItems: jsonData.recordsFiltered || 0,
                    recordsTotal: jsonData.recordsTotal || 0, // Total records before filtering
                    perPage: currentPerPage
                });
                
                setPembayaran(transformedData);
            } else {
                setPembayaran([]);
                setServerPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
            }
            
        } catch (err) {
            console.error('Fetch pembayaran error:', err);
            const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data pembayaran';
            
            if (isSearchRequest) {
                setSearchError(errorMessage);
            } else {
                setError(errorMessage);
            }
            
            setPembayaran([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchTerm]); // Remove serverPagination dependencies to prevent infinite loops

    // Create pembayaran
    const createPembayaran = useCallback(async (pembayaranData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Prepare form data for backend
            const formData = new FormData();
            
            // Header data mapping to backend fields
            formData.append('id_pembelian', pembayaranData.id_pembelian || '');
            formData.append('purchase_type', pembayaranData.purchase_type || 1);
            formData.append('due_date', pembayaranData.due_date || '');
            formData.append('settlement_date', pembayaranData.settlement_date || '');
            formData.append('payment_status', pembayaranData.payment_status || 0);
            
            // Add detail items if exists
            if (pembayaranData.details && pembayaranData.details.length > 0) {
                pembayaranData.details.forEach((item, index) => {
                    formData.append(`details[${index}][amount]`, parseFloat(item.amount) || 0);
                    formData.append(`details[${index}][payment_date]`, item.payment_date || '');
                });
            }
            
            // Debug: Check if auth token exists
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            const jsonData = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.STORE, formData, {
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
                skipCsrf: true, // Skip CSRF token for JWT-based API
                credentials: 'omit', // Don't send cookies that might interfere with JWT
                redirect: 'error' // Throw error on redirect instead of following it
            });
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Force refresh to get the latest data
                try {
                    await fetchPembayaran(1, serverPagination.perPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after create failed:', refreshError);
                    // If refresh fails, try to refresh without search term
                    try {
                        await fetchPembayaran(1, serverPagination.perPage, '', false, true);
                    } catch (fallbackError) {
                        console.error('Fallback refresh also failed:', fallbackError);
                    }
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembayaran berhasil dibuat!',
                    data: jsonData.data
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal menyimpan data';
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            console.error('Create pembayaran error:', err);
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            
            // Check if it's an authentication error (401 or redirect to login)
            if (err.message.includes('401') || err.message.includes('login') || err.message.includes('302')) {
                const authError = 'Sesi Anda telah berakhir atau ada masalah authentikasi. Silakan login kembali.';
                setError(authError);
                return { success: false, message: authError, needsLogin: true };
            }
            
            // Check if it's a 405 Method Not Allowed (might be CSRF issue)
            if (err.message.includes('405')) {
                const methodError = 'Method tidak diizinkan. Kemungkinan masalah CSRF token atau routing.';
                setError(methodError);
                return { success: false, message: methodError };
            }
            
            // For development: provide more detailed error info
            const errorMsg = `${err.message || 'Terjadi kesalahan saat menyimpan data'}\n\nDetail: ${JSON.stringify({
                endpoint: API_ENDPOINTS.HO.PAYMENT.STORE,
                hasFormData: true,
                errorType: err.name || 'Unknown'
            }, null, 2)}`;
            
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembayaran, serverPagination.perPage, searchTerm]);

    // Update pembayaran
    const updatePembayaran = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            // Prepare form data for backend
            const formData = new FormData();
            
            formData.append('pid', data.id || data.encryptedPid);
            
            // Header data mapping to backend fields
            formData.append('id_pembelian', data.id_pembelian || '');
            formData.append('purchase_type', data.purchase_type || 1);
            formData.append('due_date', data.due_date || '');
            formData.append('settlement_date', data.settlement_date || '');
            formData.append('payment_status', data.payment_status || 0);
            
            const jsonData = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.UPDATE, formData, {
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Force refresh to get the latest data
                try {
                    await fetchPembayaran(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after update failed:', refreshError);
                    // If refresh fails, try to refresh the first page
                    try {
                        await fetchPembayaran(1, serverPagination.perPage, searchTerm, false, true);
                    } catch (fallbackError) {
                        console.error('Fallback refresh also failed:', fallbackError);
                    }
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembayaran berhasil diperbarui!'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal memperbarui data';
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('Error updating pembayaran:', error);
            const errorMsg = error.message || 'Failed to update pembayaran';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembayaran, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    // Delete pembayaran
    const deletePembayaran = useCallback(async (encryptedPid, pembayaranData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid);
            
            if (!encryptedPid) {
                throw new Error('ID pembayaran tidak valid atau tidak ditemukan');
            }
            
            const jsonData = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DELETE, {
                pid: encryptedPid
            }, {
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
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
                    await fetchPembayaran(targetPage, currentPerPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after delete failed:', refreshError);
                    // If refresh fails, try to refresh the first page
                    try {
                        await fetchPembayaran(1, currentPerPage, searchTerm, false, true);
                    } catch (fallbackError) {
                        console.error('Fallback refresh also failed:', fallbackError);
                    }
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Data berhasil dihapus'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal menghapus data';
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            console.error('Delete pembayaran error:', err);
            let errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null);
            setLoading(false);
        }
    }, [fetchPembayaran, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    // Get pembayaran detail
    const getPembayaranDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            const jsonData = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.SHOW, {
                pid: encryptedPid
            }, {
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Validasi dan proses data yang diterima
                let headerData = jsonData.header || null;
                let detailData = Array.isArray(jsonData.data) ? jsonData.data : [];
                
                // Jika tidak ada header tapi ada detail, gunakan data dari detail pertama
                if (!headerData && detailData.length > 0) {
                    const firstItem = detailData[0];
                    headerData = {
                        encryptedPid: firstItem.pid || encryptedPid,
                        nota_ho: firstItem.nota_ho || '',
                        nama_supplier: firstItem.nama_supplier || '',
                        due_date: firstItem.due_date || '',
                        settlement_date: firstItem.settlement_date || '',
                        payment_status: firstItem.payment_status || 0,
                        amount: parseFloat(firstItem.amount) || 0,
                        // Extract farm and syarat pembayaran IDs from detail data
                        id_farm: firstItem.id_farm,
                        id_syarat_pembayaran: firstItem.id_syarat_pembayaran
                    };
                }
                
                // Ensure header data has id_farm and id_syarat_pembayaran from detail data if not present
                if (headerData && detailData.length > 0) {
                    const firstItem = detailData[0];
                    if (!headerData.id_farm && firstItem.id_farm) {
                        headerData.id_farm = firstItem.id_farm;
                    }
                    if (!headerData.id_syarat_pembayaran && firstItem.id_syarat_pembayaran) {
                        headerData.id_syarat_pembayaran = firstItem.id_syarat_pembayaran;
                    }
                }
                
                return {
                    success: true,
                    data: detailData,
                    header: headerData,
                    message: jsonData.message || 'Detail pembayaran berhasil diambil'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Detail tidak ditemukan';
                console.warn('Backend returned error:', errorMessage);
                return { success: false, data: [], header: null, message: errorMessage };
            }
            
        } catch (err) {
            console.error('Get pembayaran detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail pembayaran';
            setError(errorMsg);
            return { success: false, data: [], header: null, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get payment details for a specific payment
    const getPaymentDetails = useCallback(async (paymentId) => {
        setLoading(true);
        setError(null);
        
        try {
            const jsonData = await HttpClient.get(`${API_ENDPOINTS.HO.PAYMENT.DETAILS}?id_pembayaran=${paymentId}`, {
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            if (jsonData && jsonData.status === 'ok') {
                return {
                    success: true,
                    data: jsonData.data || [],
                    message: jsonData.message || 'Detail pembayaran berhasil diambil'
                };
            } else {
                const errorMessage = jsonData?.message || 'Gagal mengambil detail pembayaran';
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('Get payment details error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail pembayaran';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create payment detail
    const createPaymentDetail = useCallback(async (detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const requestData = {
                id_pembayaran: detailData.id_pembayaran,
                amount: parseFloat(detailData.amount || 0),
                payment_date: detailData.payment_date || ''
            };
            
            const result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DETAIL_STORE, requestData);
            
            if (result && result.status === 'ok') {
                return {
                    success: true,
                    message: result.message || 'Detail pembayaran berhasil dibuat',
                    data: result.data
                };
            } else {
                throw new Error(result?.message || 'Gagal membuat detail pembayaran');
            }
        } catch (err) {
            console.error('Create payment detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat membuat detail pembayaran';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update payment detail
    const updatePaymentDetail = useCallback(async (encryptedPid, detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const requestData = {
                pid: encryptedPid,
                id_pembayaran: detailData.id_pembayaran,
                amount: parseFloat(detailData.amount || 0),
                payment_date: detailData.payment_date || ''
            };
            
            const result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DETAIL_UPDATE, requestData);
            
            if (result && result.status === 'ok') {
                return {
                    success: true,
                    message: result.message || 'Detail pembayaran berhasil diperbarui',
                    data: result.data
                };
            } else {
                throw new Error(result?.message || 'Gagal memperbarui detail pembayaran');
            }
        } catch (err) {
            console.error('Update payment detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui detail pembayaran';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete payment detail
    const deletePaymentDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DETAIL_DELETE, {
                pid: encryptedPid
            });
            
            if (result && result.status === 'ok') {
                return {
                    success: true,
                    message: result.message || 'Detail pembayaran berhasil dihapus'
                };
            } else {
                throw new Error(result?.message || 'Gagal menghapus detail pembayaran');
            }
        } catch (err) {
            console.error('Delete payment detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus detail pembayaran';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Computed stats based on current data
    const stats = useMemo(() => {
        const total = pembayaran.length;
        
        // Count settled and pending payments
        const settled = pembayaran.filter(item => item.payment_status === 1).length;
        const pending = pembayaran.filter(item => item.payment_status === 0).length;
        
        // Count overdue payments (pending payments with due date in the past)
        const now = new Date();
        const overdue = pembayaran.filter(item => {
            return item.payment_status === 0 && item.due_date && new Date(item.due_date) < now;
        }).length;
        
        return {
            total: serverPagination.recordsTotal || serverPagination.totalItems || total, // Use recordsTotal from API response
            settled,
            pending,
            overdue
        };
    }, [pembayaran, serverPagination.totalItems, serverPagination.recordsTotal]);

    // Enhanced debounced search handler
    const searchTimeoutRef = useRef(null);
    
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (!newSearchTerm.trim()) {
            fetchPembayaran(1, serverPagination.perPage, '', false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            fetchPembayaran(1, serverPagination.perPage, newSearchTerm, true);
        }, 300);
    }, [fetchPembayaran, serverPagination.perPage]);
    
    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        fetchPembayaran(1, serverPagination.perPage, '', false);
    }, [fetchPembayaran, serverPagination.perPage]);
    

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);


    // Pagination handlers
    const handlePageChange = useCallback((newPage) => {
        fetchPembayaran(newPage, serverPagination.perPage, searchTerm, false);
    }, [fetchPembayaran, serverPagination.perPage, searchTerm]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembayaran(1, newPerPage, searchTerm, false);
    }, [fetchPembayaran, searchTerm]);

    return {
        pembayaran,
        allPembayaran: pembayaran,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPembayaran,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createPembayaran,
        updatePembayaran,
        deletePembayaran,
        deleteLoading,
        getPembayaranDetail,
        getPaymentDetails,
        createPaymentDetail,
        updatePaymentDetail,
        deletePaymentDetail
    };
};

export default usePembayaran;