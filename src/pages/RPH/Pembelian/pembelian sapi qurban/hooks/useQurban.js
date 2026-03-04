import { useState, useCallback, useEffect } from 'react';
import QurbanService from '../../../../../services/qurban/qurbanService';

/**
 * Custom hook for managing Qurban (Pembelian Sapi Qurban)
 * Handles all state management and API interactions using the dedicated QurbanService
 */
const useQurban = () => {
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
        endDate: '',
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
        draw: 1,
    });

    const [stats, setStats] = useState({
        today_ekor: 0,
        today_po: 0,
        today_total: 0,
        week_ekor: 0,
        week_po: 0,
        week_total: 0,
        month_ekor: 0,
        month_po: 0,
        month_total: 0,
        total_po: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    const toNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    /**
     * Fetch Qurban statistics from backend card endpoint
     */
    const fetchStatistics = useCallback(async () => {
        try {
            const result = await QurbanService.getStatistics();
            const data = result?.data || {};

            if (result?.success) {
                setStats({
                    today_ekor: toNumber(data.hewan_hari_ini),
                    today_po: toNumber(data.nota_hari_ini),
                    today_total: toNumber(data.nominal_hari_ini),
                    week_ekor: toNumber(data.hewan_minggu_ini),
                    week_po: toNumber(data.nota_minggu_ini),
                    week_total: toNumber(data.nominal_minggu_ini),
                    month_ekor: toNumber(data.hewan_bulan_ini),
                    month_po: toNumber(data.nota_bulan_ini),
                    month_total: toNumber(data.nominal_bulan_ini),
                    total_po: toNumber(data.total_po),
                    pending: toNumber(data.pending),
                    approved: toNumber(data.approved),
                    rejected: toNumber(data.rejected),
                });
            }
        } catch (err) {
            // Silently ignore to keep existing stats and avoid breaking list screen
            console.error('[useQurban] Error fetching statistics:', err);
        }
    }, []);

    /**
     * Fetch available nota from HO
     */
    const fetchAvailableNota = useCallback(async (pemasokId) => {
        if (!pemasokId) {
            setNotaError('ID Pemasok diperlukan untuk mengambil nota');
            return { success: false, data: [] };
        }

        setLoading(true);
        setNotaError(null);

        try {
            const result = await QurbanService.getNota({ id_pemasok: pemasokId });

            if (result.success) {
                setAvailableNota(result.data);
                return result;
            } else {
                setNotaError(result.message);
                setAvailableNota([]);
                return result;
            }
        } catch (err) {
            const errorMsg = err.message || 'Gagal mengambil data nota';
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
    const fetchPoList = useCallback(
        async (
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
                const params = {
                    start: (page - 1) * perPage,
                    length: perPage,
                    search: search !== null ? search : searchTerm,
                    draw: pagination.draw + 1,
                };

                const currentDateRange = dateFilter !== null ? dateFilter : dateRange;
                if (currentDateRange.startDate) params.start_date = currentDateRange.startDate;
                if (currentDateRange.endDate) params.end_date = currentDateRange.endDate;

                const response = await QurbanService.getData(params);

                if (response.success) {
                    const transformedData = response.data.map((item) =>
                        QurbanService.transformData(item)
                    );

                    setPoList(transformedData);

                    setPagination({
                        currentPage: page,
                        totalPages: Math.ceil(response.recordsFiltered / perPage),
                        totalItems: response.recordsTotal,
                        filteredItems: response.recordsFiltered,
                        perPage,
                        draw: response.draw,
                    });

                    await fetchStatistics();

                    return {
                        success: true,
                        data: transformedData,
                        pagination: {
                            total: response.recordsTotal,
                            filtered: response.recordsFiltered,
                        },
                    };
                } else {
                    throw new Error(response.message || 'Failed to fetch data');
                }
            } catch (err) {
                const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data';

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
        },
        [searchTerm, dateRange, pagination.draw, fetchStatistics]
    );

    /**
     * Create new Qurban PO
     */
    const createPo = useCallback(
        async (poData) => {
            setCreateLoading(true);
            setError(null);

            try {
                const result = await QurbanService.create(poData);

                if (result.success) {
                    await fetchPoList();
                    if (poData.id_pemasok) await fetchAvailableNota(poData.id_pemasok);
                    return result;
                } else {
                    setError(result.message);
                    return result;
                }
            } catch (err) {
                const errorMsg = err.message || 'Gagal membuat data qurban';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            } finally {
                setCreateLoading(false);
            }
        },
        [fetchPoList, fetchAvailableNota]
    );

    /**
     * Update existing Qurban PO
     */
    const updatePo = useCallback(
        async (poData) => {
            setUpdateLoading(true);
            setError(null);

            try {
                const result = await QurbanService.update(poData);

                if (result.success) {
                    await fetchPoList();
                    if (poData.id_pemasok) await fetchAvailableNota(poData.id_pemasok);
                    return result;
                } else {
                    setError(result.message);
                    return result;
                }
            } catch (err) {
                const errorMsg = err.message || 'Gagal memperbarui data qurban';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            } finally {
                setUpdateLoading(false);
            }
        },
        [fetchPoList, fetchAvailableNota]
    );

    /**
     * Delete Qurban PO
     */
    const deletePo = useCallback(
        async (pid) => {
            setDeleteLoading(pid);
            setError(null);

            try {
                const result = await QurbanService.delete(pid);

                if (result.success) {
                    setPagination((prev) => ({
                        ...prev,
                        totalItems: Math.max(0, prev.totalItems - 1),
                        filteredItems: Math.max(0, prev.filteredItems - 1),
                    }));
                    await fetchPoList();
                    return result;
                } else {
                    setError(result.message);
                    return result;
                }
            } catch (err) {
                const errorMsg = err.message || 'Gagal menghapus data qurban';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            } finally {
                setDeleteLoading(null);
            }
        },
        [fetchPoList]
    );

    /**
     * Get PO detail
     */
    const getPoDetail = useCallback(async (pid) => {
        setDetailLoading(true);
        setError(null);

        try {
            const result = await QurbanService.getDetail(pid);

            if (result.success) {
                return result;
            } else {
                setError(result.message);
                return result;
            }
        } catch (err) {
            const errorMsg = err.message || 'Gagal mengambil detail';
            setError(errorMsg);
            return { success: false, message: errorMsg, data: [] };
        } finally {
            setDetailLoading(false);
        }
    }, []);

    // -------------------------------------------------------------------------
    // Search & filter handlers
    // -------------------------------------------------------------------------

    const handleSearch = useCallback(
        (newSearchTerm) => {
            setSearchTerm(newSearchTerm);
            setSearchError(null);

            const timeoutId = setTimeout(() => {
                fetchPoList(1, pagination.perPage, newSearchTerm, null, null, true);
            }, 300);

            return () => clearTimeout(timeoutId);
        },
        [fetchPoList, pagination.perPage]
    );

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchPoList(1, pagination.perPage, '', null, null, false);
    }, [fetchPoList, pagination.perPage]);

    const handleFilter = useCallback(
        (newFilter) => {
            setFilterStatus(newFilter);
            setSearchError(null);
            fetchPoList(1, pagination.perPage, null, newFilter, null, false);
        },
        [fetchPoList, pagination.perPage]
    );

    const handleDateRangeFilter = useCallback(
        (newDateRange) => {
            setDateRange(newDateRange);
            setSearchError(null);
            fetchPoList(1, pagination.perPage, null, null, newDateRange, false);
        },
        [fetchPoList, pagination.perPage]
    );

    const clearDateRange = useCallback(() => {
        const emptyDateRange = { startDate: '', endDate: '' };
        setDateRange(emptyDateRange);
        setSearchError(null);
        fetchPoList(1, pagination.perPage, null, null, emptyDateRange, false);
    }, [fetchPoList, pagination.perPage]);

    const handlePageChange = useCallback(
        (newPage) => {
            fetchPoList(newPage, pagination.perPage, null, null, null, false);
        },
        [fetchPoList, pagination.perPage]
    );

    const handlePerPageChange = useCallback(
        (newPerPage) => {
            fetchPoList(1, newPerPage, null, null, null, false);
        },
        [fetchPoList]
    );

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------


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
        fetchStatistics,
        refresh: () => fetchPoList(pagination.currentPage, pagination.perPage),
    };
};

export default useQurban;