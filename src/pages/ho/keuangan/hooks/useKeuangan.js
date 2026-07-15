import { useState, useCallback } from 'react';
import pengeluaranService from '../../../../services/pengeluaranService';

/**
 * Unified hook for Keuangan (Kas & Bank)
 * @param {string} activeTab - current active tab
 * @param {number} tipePembayaran - 1 for Kas, 2 for Bank
 */
const useKeuangan = (activeTab = 'belum-dibayar', tipePembayaran = 1) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalPages: 1,
        totalItems: 0
    });
    const [cardData, setCardData] = useState(null);
    const [advancedFilters, setAdvancedFilters] = useState({
        payment_status: '',
        start_date: '',
        end_date: '',
        purchase_type: ''
    });

    // Fetch card data
    const fetchCardData = useCallback(async () => {
        try {
            const response = await pengeluaranService.getPengeluaranCards({
                tipe_pembayaran: tipePembayaran
            });

            if (response && response.data && Array.isArray(response.data)) {
                setCardData(response.data[0]);
            } else if (response && response.data) {
                setCardData(response.data);
            }
        } catch (err) {
            console.error('❌ [FETCH CARD] Error fetching card data:', err);
        }
    }, [tipePembayaran]);

    // Fetch keuangan data from API
    const fetchData = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        tab = activeTab,
        showLoading = true,
        forceRefresh = false,
        extraFilters = null
    ) => {
        // Skip API call for tabs that use other data sources
        if (tab === 'pengajuan' || tab === 'kredit-bank') {
            return;
        }

        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            const filtersToUse = extraFilters !== null ? extraFilters : advancedFilters;

            const filterObj = {
                tipe_pembayaran: tipePembayaran,
                ...(filtersToUse.payment_status !== '' && filtersToUse.payment_status != null
                    ? { payment_status: filtersToUse.payment_status }
                    : {}),
                ...(filtersToUse.start_date ? { start_date: filtersToUse.start_date } : {}),
                ...(filtersToUse.end_date ? { end_date: filtersToUse.end_date } : {}),
                ...(filtersToUse.purchase_type ? { purchase_type: filtersToUse.purchase_type } : {})
            };

            const dataTablesParams = pengeluaranService.convertToDataTablesParams(
                page,
                perPage,
                search,
                'tgl_masuk',
                'desc',
                filterObj
            );

            const response = await pengeluaranService.getPengeluaran(dataTablesParams);

            if (response && response.data) {
                const responseData = response.data;
                setData(responseData);
                setServerPagination({
                    currentPage: page,
                    perPage: perPage,
                    totalPages: Math.ceil(response.recordsFiltered / perPage) || 1,
                    totalItems: response.recordsFiltered
                });
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (err) {
            console.error('❌ [FETCH] Error fetching keuangan data:', err);
            setData([]);
            setServerPagination({
                currentPage: 1,
                perPage: perPage,
                totalPages: 0,
                totalItems: 0
            });
            setError(err.message || 'Gagal memuat data dari server');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [activeTab, tipePembayaran, advancedFilters]);

    // Handle search with debounce
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setIsSearching(true);
        setSearchError(null);

        const timeoutId = setTimeout(() => {
            fetchData(1, serverPagination.perPage, value, activeTab, false);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchData, serverPagination.perPage, activeTab]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchData(1, serverPagination.perPage, '', activeTab, false);
    }, [fetchData, serverPagination.perPage, activeTab]);

    // Apply advanced filters
    const applyFilters = useCallback((newFilters) => {
        setAdvancedFilters(newFilters);
        setSearchTerm('');
        fetchData(1, serverPagination.perPage, '', activeTab, true, false, newFilters);
    }, [fetchData, serverPagination.perPage, activeTab]);

    // Reset advanced filters
    const resetFilters = useCallback(() => {
        const emptyFilters = { payment_status: '', start_date: '', end_date: '', purchase_type: '' };
        setAdvancedFilters(emptyFilters);
        setSearchTerm('');
        fetchData(1, serverPagination.perPage, '', activeTab, true, false, emptyFilters);
    }, [fetchData, serverPagination.perPage, activeTab]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        fetchData(page, serverPagination.perPage, searchTerm, activeTab, true);
    }, [fetchData, serverPagination.perPage, searchTerm, activeTab]);

    // Handle per page change
    const handlePerPageChange = useCallback((perPage) => {
        fetchData(1, perPage, searchTerm, activeTab, true);
    }, [fetchData, searchTerm, activeTab]);

    // CRUD stubs (not available for pengeluaran)
    const createItem = useCallback(async () => ({
        success: false,
        message: 'Fungsi create tidak tersedia untuk data pengeluaran'
    }), []);

    const updateItem = useCallback(async () => ({
        success: false,
        message: 'Fungsi update tidak tersedia untuk data pengeluaran'
    }), []);

    const deleteItem = useCallback(async () => ({
        success: false,
        message: 'Fungsi delete tidak tersedia untuk data pengeluaran'
    }), []);

    // Get pengeluaran detail
    const getDetail = useCallback(async (pid) => {
        try {
            const response = await pengeluaranService.getPengeluaranDetail(pid);
            if (response && response.success) {
                return { success: true, data: response.data };
            }
            throw new Error(response.message || 'Gagal mengambil detail data');
        } catch (err) {
            console.error('❌ [DETAIL HOOK] Error fetching detail:', err);
            return { success: false, message: err.message || 'Gagal mengambil detail data dari server' };
        }
    }, []);

    return {
        data,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchData,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        applyFilters,
        resetFilters,
        advancedFilters,
        createItem,
        updateItem,
        deleteItem,
        getDetail,
        cardData,
        fetchCardData
    };
};

export default useKeuangan;
