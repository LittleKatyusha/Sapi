import { useState, useCallback, useEffect } from 'react';
import pengajuanBiayaService from '../../../../services/pengajuanBiayaService';

/**
 * Custom hook untuk mengelola data Pengajuan Biaya Kas
 * Menggunakan API real dari pengajuanBiayaService
 */
const usePengajuanBiayaKas = () => {
    // State untuk data pengajuan biaya
    const [pengajuanBiaya, setPengajuanBiaya] = useState([]);
    const [cardData, setCardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State untuk search
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // State untuk date filter
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // State untuk server-side pagination
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        totalPages: 0,
        from: 0,
        to: 0
    });

    /**
     * Fetch data pengajuan biaya dari API
     * @param {number} page - Nomor halaman
     * @param {number} perPage - Jumlah item per halaman
     * @param {string} search - Search term
     * @param {string} status - Status filter (1=pending, 2=approved, 3=rejected)
     * @param {string} start_date - Start date filter
     * @param {string} end_date - End date filter
     */
    const fetchPengajuanBiaya = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        status = '',
        start_date = '',
        end_date = ''
    ) => {
        console.log('🔄 [FETCH] Fetching pengajuan biaya...', { page, perPage, search, status, start_date, end_date });
        setLoading(true);
        setError(null);

        try {
            // Panggil service dengan format DataTables
            const response = await pengajuanBiayaService.getData({
                start: (page - 1) * perPage,
                length: perPage,
                search: search,
                status: status,
                start_date: start_date,
                end_date: end_date
            });

            console.log('✅ [FETCH] Data received:', response);

            // Update state dengan data dari response
            setPengajuanBiaya(response.data || []);
            
            // Update pagination info
            setServerPagination({
                currentPage: page,
                perPage: perPage,
                total: response.recordsFiltered || 0,
                totalPages: Math.ceil((response.recordsFiltered || 0) / perPage),
                from: response.data && response.data.length > 0 ? ((page - 1) * perPage) + 1 : 0,
                to: response.data && response.data.length > 0 ? ((page - 1) * perPage) + response.data.length : 0
            });

        } catch (err) {
            console.error('❌ [FETCH] Error:', err);
            setError(err.message || 'Gagal mengambil data pengajuan biaya');
            setPengajuanBiaya([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch card statistics data
     */
    const fetchCardData = useCallback(async () => {
        console.log('🔄 [CARD] Fetching card statistics...');
        
        try {
            const response = await pengajuanBiayaService.getCardData();
            console.log('✅ [CARD] Statistics received:', response);
            setCardData(response);
        } catch (err) {
            console.error('❌ [CARD] Error:', err);
            // Don't set error state for card data, just log it
        }
    }, []);

    /**
     * Handle search dengan debounce
     * @param {string} term - Search term
     */
    const handleSearch = useCallback((term) => {
        console.log('🔍 [SEARCH] Search term:', term);
        setSearchTerm(term);
        setIsSearching(true);
        setSearchError(null);

        // Reset ke halaman 1 saat search
        fetchPengajuanBiaya(1, serverPagination.perPage, term, '', startDate, endDate)
            .finally(() => setIsSearching(false));
    }, [fetchPengajuanBiaya, serverPagination.perPage, startDate, endDate]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        console.log('🔄 [SEARCH] Clearing search...');
        setSearchTerm('');
        setSearchError(null);
        fetchPengajuanBiaya(1, serverPagination.perPage, '', '', startDate, endDate);
    }, [fetchPengajuanBiaya, serverPagination.perPage, startDate, endDate]);

    /**
     * Handle page change
     * @param {number} page - Nomor halaman baru
     */
    const handlePageChange = useCallback((page) => {
        console.log('📄 [PAGE] Changing to page:', page);
        fetchPengajuanBiaya(page, serverPagination.perPage, searchTerm, '', startDate, endDate);
    }, [fetchPengajuanBiaya, serverPagination.perPage, searchTerm, startDate, endDate]);

    /**
     * Handle per page change
     * @param {number} perPage - Jumlah item per halaman baru
     */
    const handlePerPageChange = useCallback((perPage) => {
        console.log('📊 [PER PAGE] Changing to:', perPage);
        fetchPengajuanBiaya(1, perPage, searchTerm, '', startDate, endDate);
    }, [fetchPengajuanBiaya, searchTerm, startDate, endDate]);

    /**
     * Handle date filter change
     * @param {string} start - Start date
     * @param {string} end - End date
     */
    const handleDateFilter = useCallback((start, end) => {
        console.log('📅 [DATE FILTER] Applying filter:', { start, end });
        setStartDate(start);
        setEndDate(end);
        fetchPengajuanBiaya(1, serverPagination.perPage, searchTerm, '', start, end);
    }, [fetchPengajuanBiaya, serverPagination.perPage, searchTerm]);

    /**
     * Refresh data (reload current page)
     */
    const refreshData = useCallback(() => {
        console.log('🔄 [REFRESH] Refreshing data...');
        fetchPengajuanBiaya(
            serverPagination.currentPage,
            serverPagination.perPage,
            searchTerm,
            '',
            startDate,
            endDate
        );
        fetchCardData();
    }, [fetchPengajuanBiaya, fetchCardData, serverPagination, searchTerm, startDate, endDate]);

    /**
     * Create new pengajuan biaya
     * @param {Object} data - Data pengajuan biaya baru
     */
    const createPengajuanBiaya = useCallback(async (data) => {
        console.log('➕ [CREATE] Creating pengajuan biaya...', data);
        setLoading(true);
        setError(null);

        try {
            const response = await pengajuanBiayaService.store(data);
            console.log('✅ [CREATE] Success:', response);
            
            // Refresh data setelah create
            await refreshData();
            
            return { success: true, data: response };
        } catch (err) {
            console.error('❌ [CREATE] Error:', err);
            setError(err.message || 'Gagal membuat pengajuan biaya');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Update existing pengajuan biaya
     * @param {number} id - ID pengajuan biaya
     * @param {Object} data - Data yang akan diupdate
     */
    const updatePengajuanBiaya = useCallback(async (id, data) => {
        console.log('✏️ [UPDATE] Updating pengajuan biaya...', { id, data });
        setLoading(true);
        setError(null);

        try {
            const response = await pengajuanBiayaService.update(id, data);
            console.log('✅ [UPDATE] Success:', response);
            
            // Refresh data setelah update
            await refreshData();
            
            return { success: true, data: response };
        } catch (err) {
            console.error('❌ [UPDATE] Error:', err);
            setError(err.message || 'Gagal mengupdate pengajuan biaya');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Delete pengajuan biaya
     * @param {number} id - ID pengajuan biaya
     */
    const deletePengajuanBiaya = useCallback(async (id) => {
        console.log('🗑️ [DELETE] Deleting pengajuan biaya...', id);
        setLoading(true);
        setError(null);

        try {
            const response = await pengajuanBiayaService.delete(id);
            console.log('✅ [DELETE] Success:', response);
            
            // Refresh data setelah delete
            await refreshData();
            
            return { success: true };
        } catch (err) {
            console.error('❌ [DELETE] Error:', err);
            setError(err.message || 'Gagal menghapus pengajuan biaya');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Get detail pengajuan biaya
     * @param {number} id - ID pengajuan biaya
     */
    const getPengajuanBiayaDetail = useCallback(async (id) => {
        console.log('🔍 [DETAIL] Getting pengajuan biaya detail...', id);
        
        try {
            const response = await pengajuanBiayaService.getDetail(id);
            console.log('✅ [DETAIL] Success:', response);
            return { success: true, data: response };
        } catch (err) {
            console.error('❌ [DETAIL] Error:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // Note: Initial data fetch is handled by parent component (KeuanganKasPage) based on active tab
    // to avoid double fetching when component mounts

    return {
        // Data
        pengajuanBiaya,
        cardData,
        loading,
        error,
        
        // Search
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        handleSearch,
        clearSearch,
        
        // Date filter
        startDate,
        endDate,
        handleDateFilter,
        
        // Pagination
        serverPagination,
        handlePageChange,
        handlePerPageChange,
        
        // CRUD operations
        fetchPengajuanBiaya,
        fetchCardData,
        refreshData,
        createPengajuanBiaya,
        updatePengajuanBiaya,
        deletePengajuanBiaya,
        getPengajuanBiayaDetail
    };
};

export default usePengajuanBiayaKas;