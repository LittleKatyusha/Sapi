import { useState, useCallback, useEffect, useMemo } from 'react';
import PoRphService from '../../../../../services/poRphService';

/**
 * Custom hook for managing PO RPH (Purchase Order - Rumah Potong Hewan)
 * Handles all state management and API interactions for PO RPH operations
 */
const usePoRph = () => {
    // Main data state
    const [poList, setPoList] = useState([]);
    const [availableNota, setAvailableNota] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    
    // Loading states for specific operations
    const [isSearching, setIsSearching] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    
    // Error states for specific operations
    const [searchError, setSearchError] = useState(null);
    const [notaError, setNotaError] = useState(null);
    
    // Pagination state (for DataTable)
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        filteredItems: 0,
        perPage: 10,
        draw: 1
    });

    /**
     * Fetch available nota from HO
     * @param {number} officeId - Office ID to filter nota
     */
    const fetchAvailableNota = useCallback(async (officeId) => {
        if (!officeId) {
            setNotaError('Office ID is required to fetch nota');
            return { success: false, data: [] };
        }

        setLoading(true);
        setNotaError(null);
        
        try {
            const result = await PoRphService.getNota({ id_office: officeId });
            
            if (result.success) {
                setAvailableNota(result.data);
                return result;
            } else {
                setNotaError(result.message);
                setAvailableNota([]);
                return result;
            }
        } catch (error) {
            const errorMsg = error.message || 'Gagal mengambil data nota';
            setNotaError(errorMsg);
            setAvailableNota([]);
            return { success: false, message: errorMsg, data: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch PO list with pagination and filtering
     */
    const fetchPoList = useCallback(async (
        page = 1,
        perPage = 10,
        search = null,
        status = null,
        dateFilter = null,
        isSearchRequest = false
    ) => {
        setLoading(true);
        setError(null);
        setSearchError(null);
        
        if (isSearchRequest) {
            setIsSearching(true);
        }
        
        try {
            // Prepare parameters for DataTable format
            const params = {
                start: (page - 1) * perPage,
                length: perPage,
                search: search !== null ? search : searchTerm,
                draw: pagination.draw + 1
            };
            
            // Add date range filter if provided
            const currentDateRange = dateFilter !== null ? dateFilter : dateRange;
            if (currentDateRange.startDate) {
                params.start_date = currentDateRange.startDate;
            }
            if (currentDateRange.endDate) {
                params.end_date = currentDateRange.endDate;
            }
            
            const response = await PoRphService.getData(params);
            
            if (response.success) {
                // Transform data if needed
                const transformedData = response.data.map(item => 
                    PoRphService.transformData(item)
                );
                
                setPoList(transformedData);
                
                // Update pagination
                setPagination({
                    currentPage: page,
                    totalPages: Math.ceil(response.recordsFiltered / perPage),
                    totalItems: response.recordsTotal,
                    filteredItems: response.recordsFiltered,
                    perPage: perPage,
                    draw: response.draw
                });
                
                return {
                    success: true,
                    data: transformedData,
                    pagination: {
                        total: response.recordsTotal,
                        filtered: response.recordsFiltered
                    }
                };
            } else {
                throw new Error(response.message || 'Failed to fetch data');
            }
        } catch (error) {
            const errorMessage = error.message || 'Terjadi kesalahan saat mengambil data';
            
            if (isSearchRequest) {
                setSearchError(errorMessage);
            } else {
                setError(errorMessage);
            }
            
            setPoList([]);
            return { success: false, message: errorMessage, data: [] };
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchTerm, dateRange, pagination.draw]);

    /**
     * Create new PO
     */
    const createPo = useCallback(async (poData) => {
        setCreateLoading(true);
        setError(null);
        
        try {
            const result = await PoRphService.create({
                id_office: poData.id_office,
                nota: poData.nota,
                id_persetujuan_rph: poData.id_persetujuan_rph,
                catatan: poData.catatan || poData.note || ''
            });
            
            if (result.success) {
                // Refresh the list after successful creation
                await fetchPoList();
                
                // Refresh available nota
                if (poData.id_office) {
                    await fetchAvailableNota(poData.id_office);
                }
                
                return result;
            } else {
                setError(result.message);
                return result;
            }
        } catch (error) {
            const errorMsg = error.message || 'Gagal membuat PO';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setCreateLoading(false);
        }
    }, [fetchPoList, fetchAvailableNota]);

    /**
     * Update existing PO
     */
    const updatePo = useCallback(async (poData) => {
        setUpdateLoading(true);
        setError(null);
        
        try {
            const result = await PoRphService.update({
                pid: poData.pid || poData.encryptedPid,
                id_office: poData.id_office,
                nota: poData.nota,
                id_persetujuan_rph: poData.id_persetujuan_rph,
                catatan: poData.catatan || poData.note || ''
            });
            
            if (result.success) {
                // Refresh the list after successful update
                await fetchPoList();
                
                // Refresh available nota
                if (poData.id_office) {
                    await fetchAvailableNota(poData.id_office);
                }
                
                return result;
            } else {
                setError(result.message);
                return result;
            }
        } catch (error) {
            const errorMsg = error.message || 'Gagal memperbarui PO';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setUpdateLoading(false);
        }
    }, [fetchPoList, fetchAvailableNota]);

    /**
     * Delete PO
     */
    const deletePo = useCallback(async (pid) => {
        setDeleteLoading(pid);
        setError(null);
        
        try {
            const result = await PoRphService.delete(pid);
            
            if (result.success) {
                // Update pagination if needed
                setPagination(prev => ({
                    ...prev,
                    totalItems: Math.max(0, prev.totalItems - 1),
                    filteredItems: Math.max(0, prev.filteredItems - 1)
                }));
                
                // Refresh the list after successful deletion
                await fetchPoList();
                
                return result;
            } else {
                setError(result.message);
                return result;
            }
        } catch (error) {
            const errorMsg = error.message || 'Gagal menghapus PO';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null);
        }
    }, [fetchPoList]);

    /**
     * Get PO detail
     */
    const getPoDetail = useCallback(async (pid) => {
        setDetailLoading(true);
        setError(null);
        
        try {
            const result = await PoRphService.getDetail(pid);
            
            if (result.success) {
                return result;
            } else {
                setError(result.message);
                return result;
            }
        } catch (error) {
            const errorMsg = error.message || 'Gagal mengambil detail PO';
            setError(errorMsg);
            return { success: false, message: errorMsg, data: [] };
        } finally {
            setDetailLoading(false);
        }
    }, []);

    /**
     * Search handler
     */
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        // Debounced search
        const timeoutId = setTimeout(() => {
            fetchPoList(1, pagination.perPage, newSearchTerm, null, null, true);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [fetchPoList, pagination.perPage]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchPoList(1, pagination.perPage, '', null, null, false);
    }, [fetchPoList, pagination.perPage]);

    /**
     * Filter by status
     */
    const handleFilter = useCallback((newFilter) => {
        setFilterStatus(newFilter);
        setSearchError(null);
        fetchPoList(1, pagination.perPage, null, newFilter, null, false);
    }, [fetchPoList, pagination.perPage]);

    /**
     * Filter by date range
     */
    const handleDateRangeFilter = useCallback((newDateRange) => {
        setDateRange(newDateRange);
        setSearchError(null);
        fetchPoList(1, pagination.perPage, null, null, newDateRange, false);
    }, [fetchPoList, pagination.perPage]);

    /**
     * Clear date range filter
     */
    const clearDateRange = useCallback(() => {
        const emptyDateRange = { startDate: '', endDate: '' };
        setDateRange(emptyDateRange);
        setSearchError(null);
        fetchPoList(1, pagination.perPage, null, null, emptyDateRange, false);
    }, [fetchPoList, pagination.perPage]);

    /**
     * Handle page change
     */
    const handlePageChange = useCallback((newPage) => {
        fetchPoList(newPage, pagination.perPage, null, null, null, false);
    }, [fetchPoList, pagination.perPage]);

    /**
     * Handle per page change
     */
    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPoList(1, newPerPage, null, null, null, false);
    }, [fetchPoList]);

    /**
     * Calculate statistics
     */
    const stats = useMemo(() => {
        const today = new Date();
        const todayString = today.toDateString();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        
        // Filter data based on date
        const todayData = poList.filter(item => {
            const itemDate = new Date(item.tgl_pesanan || item.created_at);
            return itemDate.toDateString() === todayString;
        });
        
        const monthData = poList.filter(item => {
            const itemDate = new Date(item.tgl_pesanan || item.created_at);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        });
        
        const yearData = poList.filter(item => {
            const itemDate = new Date(item.tgl_pesanan || item.created_at);
            return itemDate.getFullYear() === thisYear;
        });
        
        return {
            total: pagination.totalItems,
            totalFiltered: pagination.filteredItems,
            todayCount: todayData.length,
            todayAmount: todayData.reduce((sum, item) => sum + (item.harga || 0), 0),
            monthCount: monthData.length,
            monthAmount: monthData.reduce((sum, item) => sum + (item.harga || 0), 0),
            yearCount: yearData.length,
            yearAmount: yearData.reduce((sum, item) => sum + (item.harga || 0), 0),
            pendingCount: poList.filter(item => item.status === 1).length,
            approvedCount: poList.filter(item => item.status === 2).length,
            rejectedCount: poList.filter(item => item.status === 3).length
        };
    }, [poList, pagination.totalItems, pagination.filteredItems]);

    /**
     * Initialize data on mount
     */
    useEffect(() => {
        fetchPoList();
    }, []);

    // Return all hook functions and state
    return {
        // Data
        poList,
        availableNota,
        
        // Loading states
        loading,
        isSearching,
        deleteLoading,
        createLoading,
        updateLoading,
        detailLoading,
        
        // Error states
        error,
        searchError,
        notaError,
        
        // Search and filter state
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        dateRange,
        setDateRange,
        
        // Pagination
        pagination,
        serverPagination: pagination, // Alias for compatibility
        
        // Statistics
        stats,
        
        // Main operations
        fetchPoList,
        fetchAvailableNota,
        createPo,
        updatePo,
        deletePo,
        getPoDetail,
        
        // Aliases for compatibility
        createPembelian: createPo,
        updatePembelian: updatePo,
        deletePembelian: deletePo,
        getPembelianDetail: getPoDetail,
        
        // Search and filter handlers
        handleSearch,
        clearSearch,
        handleFilter,
        handleDateRangeFilter,
        clearDateRange,
        handlePageChange,
        handlePerPageChange,
        
        // Refresh function
        refresh: () => fetchPoList(pagination.currentPage, pagination.perPage)
    };
};

export default usePoRph;