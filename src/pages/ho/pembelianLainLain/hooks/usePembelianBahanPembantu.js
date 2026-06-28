import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const usePembelianBahanPembantu = () => {
    const [pembelianBahanPembantu, setPembelianBahanPembantu] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    
    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalPages: 0,
        totalItems: 0
    });

    // Advanced filters state
    const [advancedFilters, setAdvancedFilters] = useState({
        nama_office: '',
        nama_produk: '',
        peruntukan: '',
        pemasok: '',
        tipe_pembayaran: '',
        startDate: '',
        endDate: ''
    });

    /**
     * Fetch pembelian bahan pembantu data from server
     */
    const fetchPembelianBahanPembantu = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        silent = false,
        isRefresh = false,
        filters = advancedFilters
    ) => {
        if (!silent && !isRefresh) {
            setLoading(true);
        }
        setError(null);

        try {
            // Build query parameters in the format expected by DataTables
            const searchValue = search || '';
            const activeFilters = filters || advancedFilters;
            const params = {
                draw: 1,
                start: (page - 1) * perPage,
                length: perPage,
                'search[value]': searchValue,
                'search[regex]': false,
                'order[0][column]': 0,
                'order[0][dir]': 'desc',
                ...(activeFilters.nama_office ? { filter_nama_office: activeFilters.nama_office } : {}),
                ...(activeFilters.nama_produk ? { filter_nama_produk: activeFilters.nama_produk } : {}),
                ...(activeFilters.peruntukan ? { filter_peruntukan: activeFilters.peruntukan } : {}),
                ...(activeFilters.pemasok ? { filter_pemasok: activeFilters.pemasok } : {}),
                ...(activeFilters.tipe_pembayaran ? { filter_tipe_pembayaran: activeFilters.tipe_pembayaran } : {}),
                ...(activeFilters.startDate ? { start_date: activeFilters.startDate } : {}),
                ...(activeFilters.endDate ? { end_date: activeFilters.endDate } : {})
            };

            const response = await HttpClient.get(`${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/data`, {
                params
            });

            if (response && (response.success === true || response.data)) {
                const data = response.data?.data || response.data || [];
                setPembelianBahanPembantu(data);
                
                // Update pagination info
                const recordsFiltered = response.data?.recordsFiltered || response.recordsFiltered || 0;
                setServerPagination({
                    currentPage: page,
                    perPage: perPage,
                    totalPages: Math.ceil(recordsFiltered / perPage),
                    totalItems: recordsFiltered
                });
            } else {
                throw new Error(response?.message || response.data?.message || 'Failed to fetch pembelian bahan pembantu data');
            }
        } catch (err) {
            console.error('Error fetching pembelian bahan pembantu:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch pembelian bahan pembantu data');
            setPembelianBahanPembantu([]);
            setServerPagination(prev => ({
                ...prev,
                totalPages: 0,
                totalItems: 0
            }));
        } finally {
            if (!silent && !isRefresh) {
                setLoading(false);
            }
        }
    }, [advancedFilters]);

    /**
     * Handle advanced filters apply
     */
    const handleAdvancedFilters = useCallback((newFilters) => {
        setAdvancedFilters(newFilters);
        fetchPembelianBahanPembantu(1, serverPagination.perPage, searchTerm, false, false, newFilters);
    }, [fetchPembelianBahanPembantu, serverPagination.perPage, searchTerm]);

    /**
     * Clear advanced filters
     */
    const clearAdvancedFilters = useCallback((emptyFilters) => {
        const resetFilters = emptyFilters || {
            nama_office: '',
            nama_produk: '',
            peruntukan: '',
            pemasok: '',
            tipe_pembayaran: '',
            startDate: '',
            endDate: ''
        };
        setAdvancedFilters(resetFilters);
        fetchPembelianBahanPembantu(1, serverPagination.perPage, searchTerm, false, false, resetFilters);
    }, [fetchPembelianBahanPembantu, serverPagination.perPage, searchTerm]);

    /**
     * Handle search with debouncing
     */
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setIsSearching(true);
        setSearchError(null);

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchPembelianBahanPembantu(1, serverPagination.perPage, value, false, false);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchPembelianBahanPembantu, serverPagination.perPage]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchPembelianBahanPembantu(1, serverPagination.perPage, '', false, false, advancedFilters);
    }, [fetchPembelianBahanPembantu, serverPagination.perPage, advancedFilters]);

    /**
     * Handle page change
     */
    const handlePageChange = useCallback((newPage) => {
        fetchPembelianBahanPembantu(newPage, serverPagination.perPage, searchTerm, false, false, advancedFilters);
    }, [fetchPembelianBahanPembantu, serverPagination.perPage, searchTerm, advancedFilters]);

    /**
     * Handle per page change
     */
    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelianBahanPembantu(1, newPerPage, searchTerm, false, false, advancedFilters);
    }, [fetchPembelianBahanPembantu, searchTerm, advancedFilters]);

    /**
     * Create new pembelian bahan pembantu
     */
    const createPembelianBahanPembantu = useCallback(async (bahanPembantuData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/store`,
                bahanPembantuData
            );

            // Check multiple possible response structures including status: "ok"
            const isSuccess = response?.success === true ||
                            response?.status === 'success' ||
                            response?.status === 'ok' ||
                            response?.data?.success === true ||
                            (response && !response.error && !response.errors);

            if (isSuccess) {
                // Clear cache after successful create
                HttpClient.clearCache('bahanpembantu/pembelian');
                
                // Refresh data after successful creation with force refresh
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true, advancedFilters);
                
                return {
                    success: true,
                    message: response.message || response.data?.message || 'Data pembelian bahan pembantu berhasil ditambahkan',
                    data: response.data || response
                };
            } else {
                throw new Error(response.message || response.data?.message || response.error || 'Failed to create pembelian bahan pembantu');
            }
        } catch (err) {
            console.error('Error creating pembelian bahan pembantu:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create pembelian bahan pembantu';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelianBahanPembantu, serverPagination.currentPage, serverPagination.perPage, searchTerm, advancedFilters]);

    /**
     * Update pembelian bahan pembantu
     */
    const updatePembelianBahanPembantu = useCallback(async (encryptedPid, bahanPembantuData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/update`,
                {
                    pid: encryptedPid,
                    ...bahanPembantuData
                }
            );

            // Check multiple possible response structures including status: "ok"
            const isSuccess = response?.success === true ||
                            response?.status === 'success' ||
                            response?.status === 'ok' ||
                            response?.data?.success === true ||
                            (response && !response.error && !response.errors);

            if (isSuccess) {
                // Clear cache after successful update
                HttpClient.clearCache('bahanpembantu/pembelian');
                
                // Refresh data after successful update with force refresh
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true, advancedFilters);
                
                return {
                    success: true,
                    message: response.message || response.data?.message || 'Data pembelian bahan pembantu berhasil diperbarui',
                    data: response.data || response
                };
            } else {
                throw new Error(response.message || response.data?.message || response.error || 'Failed to update pembelian bahan pembantu');
            }
        } catch (err) {
            console.error('Error updating pembelian bahan pembantu:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update pembelian bahan pembantu';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelianBahanPembantu, serverPagination.currentPage, serverPagination.perPage, searchTerm, advancedFilters]);

    /**
     * Delete pembelian bahan pembantu
     */
    const deletePembelianBahanPembantu = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);

        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/hapus`,
                {
                    pid: encryptedPid
                }
            );

            // Check for both success formats: success: true OR status: "ok"
            const isSuccess = response && (response.success === true || response.status === 'ok');

            if (isSuccess) {
                // Clear cache after successful delete
                HttpClient.clearCache('bahanpembantu/pembelian');
                
                // Refresh data after successful deletion with force refresh
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true, advancedFilters);
                
                return {
                    success: true,
                    message: response.message || response.data?.message || 'Data pembelian bahan pembantu berhasil dihapus'
                };
            } else {
                throw new Error(response.message || response.data?.message || 'Failed to delete pembelian bahan pembantu');
            }
        } catch (err) {
            console.error('Error deleting pembelian bahan pembantu:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete pembelian bahan pembantu';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelianBahanPembantu, serverPagination.currentPage, serverPagination.perPage, searchTerm, advancedFilters]);

    return {
        pembelianBahanPembantu,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        advancedFilters,
        handleAdvancedFilters,
        clearAdvancedFilters,
        fetchPembelianBahanPembantu,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createPembelianBahanPembantu,
        updatePembelianBahanPembantu,
        deletePembelianBahanPembantu
    };
};

export default usePembelianBahanPembantu;