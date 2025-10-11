import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Hook untuk mengelola data pembayaran Doka
 * Khusus untuk purchase_type = 1 (Doka)
 */
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

    // Fetch pembayaran data from API
    const fetchPembayaran = useCallback(async (page = 1, perPage = null, search = null, isSearchRequest = false, forceRefresh = false) => {
        console.log('🔄 Pembayaran Doka Hook: fetchPembayaran called with params:', { page, perPage, search, isSearchRequest, forceRefresh });
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
            
            // Build API URL with purchase_type as query parameter
            const apiUrl = `${API_ENDPOINTS.HO.PAYMENT.DATA}/?purchase_type=1&${finalParams}`;
            console.log('🔄 Pembayaran Doka Hook: Making API call to:', apiUrl);
            const jsonData = await HttpClient.get(apiUrl);
            
            if (jsonData && jsonData.data) {
                // Transform backend data to match frontend expectations
                const transformedData = jsonData.data.map(item => ({
                    // Keep id for internal operations but don't display it in UI
                    id: item.id,
                    // Map all the fields from your API response
                    id_pembelian: item.id_pembelian,
                    purchase_type: item.purchase_type,
                    due_date: item.due_date,
                    settlement_date: item.settlement_date,
                    payment_status: item.payment_status,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    nota: item.nota,
                    nota_sistem: item.nota_sistem,
                    tgl_masuk: item.tgl_masuk,
                    biaya_total: item.biaya_total,
                    // Keep pid for internal operations but don't display it in UI
                    encryptedPid: item.pid,
                    // Keep existing fields for backward compatibility
                    nota_ho: item.nota_ho,
                    nama_supplier: item.nama_supplier,
                    amount: item.amount,
                    farm: item.farm,
                    syarat_pembayaran: item.syarat_pembayaran,
                    id_farm: item.id_farm,
                    id_syarat_pembayaran: item.id_syarat_pembayaran
                }));
                
                // Update pagination state from server response
                setServerPagination({
                    currentPage: currentPage,
                    totalPages: Math.ceil((jsonData.recordsFiltered || 0) / currentPerPage),
                    totalItems: jsonData.recordsFiltered || 0,
                    recordsTotal: jsonData.recordsTotal || 0,
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
    }, [searchTerm, serverPagination.currentPage, serverPagination.perPage]);

    // Create pembayaran
    const createPembayaran = useCallback(async (pembayaranData) => {
        setLoading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            
            formData.append('id_pembelian', pembayaranData.id_pembelian || '');
            formData.append('purchase_type', pembayaranData.purchase_type || 1);
            formData.append('due_date', pembayaranData.due_date || '');
            formData.append('settlement_date', pembayaranData.settlement_date || '');
            formData.append('payment_status', pembayaranData.payment_status || 0);
            
            if (pembayaranData.details && pembayaranData.details.length > 0) {
                pembayaranData.details.forEach((item, index) => {
                    formData.append(`details[${index}][amount]`, parseFloat(item.amount) || 0);
                    formData.append(`details[${index}][payment_date]`, item.payment_date || '');
                });
            }
            
            const jsonData = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.STORE, formData, {
                skipCsrf: true,
                credentials: 'omit',
                redirect: 'error'
            });
            
            if (jsonData && jsonData.status === 'ok') {
                try {
                    await fetchPembayaran(1, serverPagination.perPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after create failed:', refreshError);
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembayaran berhasil dibuat!',
                    data: jsonData.data
                };
            } else {
                const errorMessage = jsonData?.message || 'Gagal menyimpan data';
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            console.error('Create pembayaran error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
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
            const formData = new FormData();
            
            formData.append('pid', data.id || data.encryptedPid);
            formData.append('id_pembelian', data.id_pembelian || '');
            formData.append('purchase_type', data.purchase_type || 1);
            formData.append('due_date', data.due_date || '');
            formData.append('settlement_date', data.settlement_date || '');
            formData.append('payment_status', data.payment_status || 0);
            
            const jsonData = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.UPDATE, formData, {
                skipCsrf: true
            });
            
            if (jsonData && jsonData.status === 'ok') {
                try {
                    await fetchPembayaran(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after update failed:', refreshError);
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembayaran berhasil diperbarui!'
                };
            } else {
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
                skipCsrf: true
            });
            
            if (jsonData && jsonData.status === 'ok') {
                const currentPage = serverPagination.currentPage;
                const currentPerPage = serverPagination.perPage;
                const totalItemsAfterDelete = Math.max(0, serverPagination.totalItems - 1);
                const totalPagesAfterDelete = Math.ceil(totalItemsAfterDelete / currentPerPage);
                
                let targetPage = currentPage;
                if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
                    targetPage = totalPagesAfterDelete;
                }
                
                setServerPagination(prev => ({
                    ...prev,
                    totalItems: totalItemsAfterDelete,
                    totalPages: totalPagesAfterDelete,
                    currentPage: targetPage
                }));
                
                try {
                    await fetchPembayaran(targetPage, currentPerPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after delete failed:', refreshError);
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Data berhasil dihapus'
                };
            } else {
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
                pid: encryptedPid  // Fixed: Changed from 'id' to 'pid' to match backend expectation
            }, {
                skipCsrf: true
            });
            
            if (jsonData && jsonData.status === 'ok') {
                // API mengembalikan data dengan struktur: {data: {pembelian: {}, details: []}}
                const paymentData = jsonData.data;
                let headerData = null;
                let detailData = [];
                
                if (paymentData) {
                    // Calculate total_terbayar from details
                    let calculatedTotalTerbayar = 0;
                    if (paymentData.details && Array.isArray(paymentData.details)) {
                        calculatedTotalTerbayar = paymentData.details.reduce((sum, detail) => {
                            return sum + (parseFloat(detail.amount) || 0);
                        }, 0);
                    }

                    // Header data dari payment object
                    headerData = {
                        id: paymentData.id,
                        encryptedPid: paymentData.pid || encryptedPid,
                        id_pembelian: paymentData.id_pembelian || '',
                        purchase_type: paymentData.purchase_type || 1,
                        due_date: paymentData.due_date || '',
                        settlement_date: paymentData.settlement_date || '',
                        payment_status: paymentData.payment_status || 0,
                        created_at: paymentData.created_at || '',
                        updated_at: paymentData.updated_at || '',
                        // Include totals - use from API response or calculate from details
                        total_tagihan: paymentData.total_tagihan || paymentData.pembelian?.biaya_total || 0,
                        total_terbayar: paymentData.total_terbayar || calculatedTotalTerbayar,
                        // Include pembelian data if available
                        pembelian: paymentData.pembelian || null
                    };
                    
                    // Detail data dari relasi details
                    if (paymentData.details && Array.isArray(paymentData.details)) {
                        detailData = paymentData.details.map(detail => ({
                            id: detail.id,
                            amount: parseFloat(detail.amount) || 0,
                            payment_date: detail.payment_date || '',
                            note: detail.note || detail.description || '',
                            created_at: detail.created_at || '',
                            updated_at: detail.updated_at || ''
                        }));
                    }
                }
                
                return {
                    success: true,
                    data: detailData,
                    header: headerData,
                    message: jsonData.message || 'Detail pembayaran berhasil diambil'
                };
            } else {
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

    // Computed stats based on current data

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

    // Computed filtered data (for compatibility with existing code)
    const filteredData = useMemo(() => {
        return pembayaran;
    }, [pembayaran]);

    return {
        pembayaran,
        allPembayaran: pembayaran,
        filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
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
        getPaymentDetails: () => ({ success: false, data: [], message: 'Not implemented' }),
        createPaymentDetail: () => ({ success: false, message: 'Not implemented' }),
        updatePaymentDetail: () => ({ success: false, message: 'Not implemented' }),
        deletePaymentDetail: useCallback(async (detailId, pembayaranId) => {
            setLoading(true);
            setError(null);
            
            try {
                const jsonData = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DETAIL_DELETE, {
                    id: detailId,
                    pembayaran_id: pembayaranId
                }, {
                    skipCsrf: true
                });
                
                if (jsonData && jsonData.status === 'ok') {
                    return {
                        success: true,
                        message: jsonData.message || 'Detail pembayaran berhasil dihapus'
                    };
                } else {
                    const errorMessage = jsonData?.message || 'Gagal menghapus detail pembayaran';
                    throw new Error(errorMessage);
                }
                
            } catch (err) {
                console.error('Delete payment detail error:', err);
                let errorMsg = err.message || 'Terjadi kesalahan saat menghapus detail pembayaran';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            } finally {
                setLoading(false);
            }
        }, [])
    };
};

export default usePembayaran;
