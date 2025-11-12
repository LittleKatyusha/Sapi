import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const usePembelianBeban = () => {
    const [pembelianBeban, setPembelianBeban] = useState([]);
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
     * Fetch pembelian beban data from server
     */
    const fetchPembelianBeban = useCallback(async (
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

            // Force bypass cache when isRefresh is true
            const response = await HttpClient.get(`${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/data`, {
                params,
                cache: isRefresh ? false : undefined
            });

            if (response && (response.success === true || response.data)) {
                const data = response.data?.data || response.data || [];
                setPembelianBeban(data);
                
                // Update pagination info
                const recordsFiltered = response.data?.recordsFiltered || response.recordsFiltered || 0;
                setServerPagination({
                    currentPage: page,
                    perPage: perPage,
                    totalPages: Math.ceil(recordsFiltered / perPage),
                    totalItems: recordsFiltered
                });
            } else {
                throw new Error(response?.message || response.data?.message || 'Failed to fetch pembelian beban data');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch pembelian beban data');
            setPembelianBeban([]);
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
            fetchPembelianBeban(1, serverPagination.perPage, value, false, false);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchPembelianBeban, serverPagination.perPage]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchPembelianBeban(1, serverPagination.perPage, '', false, false);
    }, [fetchPembelianBeban, serverPagination.perPage]);

    /**
     * Handle page change
     */
    const handlePageChange = useCallback((newPage) => {
        fetchPembelianBeban(newPage, serverPagination.perPage, searchTerm, false, false);
    }, [fetchPembelianBeban, serverPagination.perPage, searchTerm]);

    /**
     * Handle per page change
     */
    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelianBeban(1, newPerPage, searchTerm, false, false);
    }, [fetchPembelianBeban, searchTerm]);

    /**
     * Create new pembelian beban
     */
    const createPembelianBeban = useCallback(async (bebanData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/store`,
                bebanData
            );

            // Check multiple possible response structures
            const isSuccess = response?.success === true ||
                            response?.status === 'success' ||
                            response?.data?.success === true ||
                            (response && !response.error && !response.errors);

            if (isSuccess) {
                // Clear cache for beban data endpoint
                HttpClient.clearCache('bebanbiaya/pembelian');
                
                // Refresh data after successful creation with isRefresh flag
                await fetchPembelianBeban(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: response.message || response.data?.message || 'Data pembelian beban berhasil ditambahkan',
                    data: response.data || response
                };
            } else {
                throw new Error(response.message || response.data?.message || response.error || 'Failed to create pembelian beban');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create pembelian beban';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelianBeban, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    /**
     * Update pembelian beban
     */
    const updatePembelianBeban = useCallback(async (encryptedPid, bebanData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/update`,
                {
                    pid: encryptedPid,
                    ...bebanData
                }
            );

            // Check multiple possible response structures
            const isSuccess = response?.success === true ||
                            response?.status === 'success' ||
                            response?.data?.success === true ||
                            (response && !response.error && !response.errors);

            if (isSuccess) {
                // Clear cache for beban data endpoint
                HttpClient.clearCache('bebanbiaya/pembelian');
                
                // Refresh data after successful update with isRefresh flag
                await fetchPembelianBeban(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: response.message || response.data?.message || 'Data pembelian beban berhasil diperbarui',
                    data: response.data || response
                };
            } else {
                throw new Error(response.message || response.data?.message || response.error || 'Failed to update pembelian beban');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update pembelian beban';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelianBeban, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    /**
     * Delete pembelian beban
     */
    const deletePembelianBeban = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);

        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/hapus`,
                {
                    pid: encryptedPid
                }
            );

            // Check multiple possible success response structures
            const isSuccess = response?.success === true ||
                            response?.status === 'ok' ||
                            response?.status === 'success' ||
                            response?.data?.success === true;

            if (isSuccess) {
                // Clear cache for beban data endpoint to force fresh data
                HttpClient.clearCache('bebanbiaya/pembelian');
                
                // Refresh data after successful deletion with isRefresh flag
                await fetchPembelianBeban(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: response.message || response.data?.message || 'Data pembelian beban berhasil dihapus'
                };
            } else {
                throw new Error(response.message || response.data?.message || 'Failed to delete pembelian beban');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete pembelian beban';
            setError(errorMessage);
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelianBeban, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    return {
        pembelianBeban,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchPembelianBeban,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createPembelianBeban,
        updatePembelianBeban,
        deletePembelianBeban
    };
};

export default usePembelianBeban;