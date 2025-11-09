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

    /**
     * Fetch pembelian bahan pembantu data from server
     */
    const fetchPembelianBahanPembantu = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        silent = false,
        isRefresh = false
    ) => {
        if (!silent && !isRefresh) {
            setLoading(true);
        }
        setError(null);

        try {
            // Build query parameters in the format expected by DataTables
            const searchValue = search || '';
            const params = {
                draw: 1,
                start: (page - 1) * perPage,
                length: perPage,
                'search[value]': searchValue,
                'search[regex]': false,
                'order[0][column]': 0,
                'order[0][dir]': 'desc'
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
    }, []);

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
        fetchPembelianBahanPembantu(1, serverPagination.perPage, '', false, false);
    }, [fetchPembelianBahanPembantu, serverPagination.perPage]);

    /**
     * Handle page change
     */
    const handlePageChange = useCallback((newPage) => {
        fetchPembelianBahanPembantu(newPage, serverPagination.perPage, searchTerm, false, false);
    }, [fetchPembelianBahanPembantu, serverPagination.perPage, searchTerm]);

    /**
     * Handle per page change
     */
    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelianBahanPembantu(1, newPerPage, searchTerm, false, false);
    }, [fetchPembelianBahanPembantu, searchTerm]);

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

            // Check multiple possible response structures
            const isSuccess = response?.success === true ||
                            response?.status === 'success' ||
                            response?.data?.success === true ||
                            (response && !response.error && !response.errors);

            if (isSuccess) {
                // Refresh data after successful creation (silent mode)
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, true, false);
                
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
    }, [fetchPembelianBahanPembantu, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

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

            // Check multiple possible response structures
            const isSuccess = response?.success === true ||
                            response?.status === 'success' ||
                            response?.data?.success === true ||
                            (response && !response.error && !response.errors);

            if (isSuccess) {
                // Refresh data after successful update (silent mode)
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, true, false);
                
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
    }, [fetchPembelianBahanPembantu, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

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

            if (response && response.success) {
                // Refresh data after successful deletion (silent mode)
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, true, false);
                
                return {
                    success: true,
                    message: response.data.message || 'Data pembelian bahan pembantu berhasil dihapus'
                };
            } else {
                throw new Error(response.data?.message || 'Failed to delete pembelian bahan pembantu');
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
    }, [fetchPembelianBahanPembantu, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    return {
        pembelianBahanPembantu,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
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