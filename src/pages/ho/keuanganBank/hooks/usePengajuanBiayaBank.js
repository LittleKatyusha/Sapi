import { useState, useCallback, useEffect } from 'react';
import PengeluaranPengajuanBiayaBankService from '../../../../services/pengeluaranPengajuanBiayaBankService';

/**
 * Custom hook untuk mengelola data Pengajuan Biaya Bank
 * Menggunakan API real dari pengeluaranPengajuanBiayaBankService
 * yang memanggil endpoint khusus Bank (/api/ho/pengeluaranpengajuanbiayabank)
 */
const usePengajuanBiayaBank = () => {
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
        console.log('🔄 [FETCH] Fetching pengajuan biaya bank...', { page, perPage, search, status, start_date, end_date });
        setLoading(true);
        setError(null);

        try {
            // Panggil service khusus Bank yang menggunakan endpoint /api/ho/pengeluaranpengajuanbiayabank
            // Endpoint ini sudah otomatis filter hanya data Bank (menggunakan DataPengeluaranPengajuanBiayaBank model)
            const response = await PengeluaranPengajuanBiayaBankService.getData({
                start: (page - 1) * perPage,
                length: perPage,
                search: search,
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
     * Note: Card data endpoint may need to be implemented in Bank service
     */
    const fetchCardData = useCallback(async () => {
        console.log('🔄 [CARD] Fetching card statistics...');
        
        try {
            // TODO: Implement getCardData in PengeluaranPengajuanBiayaBankService if needed
            // For now, we'll skip card data for Bank
            console.log('ℹ️ [CARD] Card data not implemented for Bank service yet');
            setCardData(null);
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
     * Approve pengajuan biaya bank
     * @param {string} pid - Encrypted PID
     * @param {Object} data - Approval data
     */
    const approvePengajuanBiaya = useCallback(async (pid, data) => {
        console.log('✅ [APPROVE] Approving pengajuan biaya bank...', { pid, data });
        setLoading(true);
        setError(null);

        try {
            const response = await PengeluaranPengajuanBiayaBankService.approve(pid, data);
            console.log('✅ [APPROVE] Success:', response);
            
            // Refresh data setelah approve
            await refreshData();
            
            return { success: true, data: response };
        } catch (err) {
            console.error('❌ [APPROVE] Error:', err);
            setError(err.message || 'Gagal menyetujui pengajuan biaya');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Reject pengajuan biaya bank
     * @param {string} pid - Encrypted PID
     * @param {string} reason - Rejection reason
     */
    const rejectPengajuanBiaya = useCallback(async (pid, reason) => {
        console.log('❌ [REJECT] Rejecting pengajuan biaya bank...', { pid, reason });
        setLoading(true);
        setError(null);

        try {
            const response = await PengeluaranPengajuanBiayaBankService.reject(pid, reason);
            console.log('✅ [REJECT] Success:', response);
            
            // Refresh data setelah reject
            await refreshData();
            
            return { success: true, data: response };
        } catch (err) {
            console.error('❌ [REJECT] Error:', err);
            setError(err.message || 'Gagal menolak pengajuan biaya');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Delete pengajuan biaya bank
     * @param {string} pid - Encrypted PID
     */
    const deletePengajuanBiaya = useCallback(async (pid) => {
        console.log('🗑️ [DELETE] Deleting pengajuan biaya bank...', pid);
        setLoading(true);
        setError(null);

        try {
            const response = await PengeluaranPengajuanBiayaBankService.delete(pid);
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
     * Get detail pengajuan biaya bank
     * @param {string} pid - Encrypted PID
     */
    const getPengajuanBiayaDetail = useCallback(async (pid) => {
        console.log('🔍 [DETAIL] Getting pengajuan biaya bank detail...', pid);
        
        try {
            const response = await PengeluaranPengajuanBiayaBankService.getDetail(pid);
            console.log('✅ [DETAIL] Success:', response);
            return { success: true, data: response };
        } catch (err) {
            console.error('❌ [DETAIL] Error:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // Note: Initial data fetch is handled by parent component (KeuanganBankPage) based on active tab
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
        approvePengajuanBiaya,
        rejectPengajuanBiaya,
        deletePengajuanBiaya,
        getPengajuanBiayaDetail
    };
};

export default usePengajuanBiayaBank;