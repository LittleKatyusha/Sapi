import { useState, useCallback, useEffect } from 'react';
import pengeluaranPengajuanBiayaBankService from '../../../../services/pengeluaranPengajuanBiayaBankService';

/**
 * Custom hook untuk mengelola data Pengeluaran Pengajuan Biaya Bank
 * Hook ini untuk approval/disbursement page - mengelola persetujuan dan penolakan pengajuan
 * Menggunakan API real dari pengeluaranPengajuanBiayaBankService
 */
const usePengeluaranBank = () => {
    // State untuk data pengeluaran
    const [pengeluaranData, setPengeluaranData] = useState([]);
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
     * Fetch data pengeluaran dari API
     * @param {number} page - Nomor halaman
     * @param {number} perPage - Jumlah item per halaman
     * @param {string} search - Search term
     * @param {string} start_date - Start date filter
     * @param {string} end_date - End date filter
     */
    const fetchPengeluaran = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        start_date = '',
        end_date = ''
    ) => {
        console.log('🔄 [FETCH] Fetching pengeluaran data...', { page, perPage, search, start_date, end_date });
        setLoading(true);
        setError(null);

        try {
            // Panggil service dengan format DataTables
            const response = await pengeluaranPengajuanBiayaBankService.getData({
                start: (page - 1) * perPage,
                length: perPage,
                search: search,
                start_date: start_date,
                end_date: end_date
            });

            console.log('✅ [FETCH] Data received:', response);

            // Transform data menggunakan service transformer
            const transformedData = (response.data || []).map(item =>
                pengeluaranPengajuanBiayaBankService.transformData(item)
            );

            // Update state dengan data dari response
            setPengeluaranData(transformedData);
            
            // Update pagination info
            setServerPagination({
                currentPage: page,
                perPage: perPage,
                total: response.recordsFiltered || 0,
                totalPages: Math.ceil((response.recordsFiltered || 0) / perPage),
                from: transformedData.length > 0 ? ((page - 1) * perPage) + 1 : 0,
                to: transformedData.length > 0 ? ((page - 1) * perPage) + transformedData.length : 0
            });

        } catch (err) {
            console.error('❌ [FETCH] Error:', err);
            setError(err.message || 'Gagal mengambil data pengeluaran');
            setPengeluaranData([]);
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
            const response = await pengeluaranPengajuanBiayaBankService.getCardData();
            console.log('✅ [CARD] Statistics received:', response);
            setCardData(response.data);
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
        fetchPengeluaran(1, serverPagination.perPage, term, startDate, endDate)
            .finally(() => setIsSearching(false));
    }, [fetchPengeluaran, serverPagination.perPage, startDate, endDate]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        console.log('🔄 [SEARCH] Clearing search...');
        setSearchTerm('');
        setSearchError(null);
        fetchPengeluaran(1, serverPagination.perPage, '', startDate, endDate);
    }, [fetchPengeluaran, serverPagination.perPage, startDate, endDate]);

    /**
     * Handle page change
     * @param {number} page - Nomor halaman baru
     */
    const handlePageChange = useCallback((page) => {
        console.log('📄 [PAGE] Changing to page:', page);
        fetchPengeluaran(page, serverPagination.perPage, searchTerm, startDate, endDate);
    }, [fetchPengeluaran, serverPagination.perPage, searchTerm, startDate, endDate]);

    /**
     * Handle per page change
     * @param {number} perPage - Jumlah item per halaman baru
     */
    const handlePerPageChange = useCallback((perPage) => {
        console.log('📊 [PER PAGE] Changing to:', perPage);
        fetchPengeluaran(1, perPage, searchTerm, startDate, endDate);
    }, [fetchPengeluaran, searchTerm, startDate, endDate]);

    /**
     * Handle date filter change
     * @param {string} start - Start date
     * @param {string} end - End date
     */
    const handleDateFilter = useCallback((start, end) => {
        console.log('📅 [DATE FILTER] Applying filter:', { start, end });
        setStartDate(start);
        setEndDate(end);
        fetchPengeluaran(1, serverPagination.perPage, searchTerm, start, end);
    }, [fetchPengeluaran, serverPagination.perPage, searchTerm]);

    /**
     * Refresh data (reload current page)
     */
    const refreshData = useCallback(() => {
        console.log('🔄 [REFRESH] Refreshing data...');
        fetchPengeluaran(
            serverPagination.currentPage,
            serverPagination.perPage,
            searchTerm,
            startDate,
            endDate
        );
        fetchCardData();
    }, [fetchPengeluaran, fetchCardData, serverPagination, searchTerm, startDate, endDate]);

    /**
     * Approve pengajuan biaya with file upload
     * @param {string} pid - Encrypted PID
     * @param {Object} data - Approval data
     */
    const approvePengajuan = useCallback(async (pid, data) => {
        console.log('✅ [APPROVE] Approving pengajuan...', { pid, data });
        setLoading(true);
        setError(null);

        try {
            // Validate data before submission
            const validation = pengeluaranPengajuanBiayaBankService.validateApprovalData(data);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Transform data to backend format
            const backendData = pengeluaranPengajuanBiayaBankService.transformApprovalToBackend(data);

            // Call approve service
            const response = await pengeluaranPengajuanBiayaBankService.approve(pid, backendData);
            console.log('✅ [APPROVE] Success:', response);
            
            // Refresh data setelah approve
            await refreshData();
            
            return { 
                success: true, 
                message: response.message || 'Pengajuan berhasil disetujui',
                data: response.data 
            };
        } catch (err) {
            console.error('❌ [APPROVE] Error:', err);
            setError(err.message || 'Gagal menyetujui pengajuan');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Reject pengajuan biaya
     * @param {string} pid - Encrypted PID
     * @param {string} reason - Rejection reason
     */
    const rejectPengajuan = useCallback(async (pid, reason) => {
        console.log('❌ [REJECT] Rejecting pengajuan...', { pid, reason });
        setLoading(true);
        setError(null);

        try {
            // Validate rejection reason
            const validation = pengeluaranPengajuanBiayaBankService.validateRejectionData(reason);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Call reject service
            const response = await pengeluaranPengajuanBiayaBankService.reject(pid, reason);
            console.log('✅ [REJECT] Success:', response);
            
            // Refresh data setelah reject
            await refreshData();
            
            return { 
                success: true, 
                message: response.message || 'Pengajuan berhasil ditolak',
                data: response.data 
            };
        } catch (err) {
            console.error('❌ [REJECT] Error:', err);
            setError(err.message || 'Gagal menolak pengajuan');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Delete pengeluaran
     * @param {string} pid - Encrypted PID
     */
    const deletePengeluaran = useCallback(async (pid) => {
        console.log('🗑️ [DELETE] Deleting pengeluaran...', pid);
        setLoading(true);
        setError(null);

        try {
            const response = await pengeluaranPengajuanBiayaBankService.delete(pid);
            console.log('✅ [DELETE] Success:', response);
            
            // Refresh data setelah delete
            await refreshData();
            
            return { 
                success: true,
                message: response.message || 'Data berhasil dihapus'
            };
        } catch (err) {
            console.error('❌ [DELETE] Error:', err);
            setError(err.message || 'Gagal menghapus data');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    /**
     * Get detail pengeluaran
     * @param {string} pid - Encrypted PID
     */
    const getPengeluaranDetail = useCallback(async (pid) => {
        console.log('🔍 [DETAIL] Getting pengeluaran detail...', pid);
        
        try {
            const response = await pengeluaranPengajuanBiayaBankService.getDetail(pid);
            console.log('✅ [DETAIL] Success:', response);
            return { 
                success: true, 
                data: response.data,
                message: response.message 
            };
        } catch (err) {
            console.error('❌ [DETAIL] Error:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // Fetch initial data on mount
    useEffect(() => {
        fetchPengeluaran();
        fetchCardData();
    }, [fetchPengeluaran, fetchCardData]);

    return {
        // Data
        pengeluaranData,
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
        
        // Operations
        fetchPengeluaran,
        fetchCardData,
        refreshData,
        approvePengajuan,
        rejectPengajuan,
        deletePengeluaran,
        getPengeluaranDetail,
        
        // Helper functions from service
        getStatusInfo: pengeluaranPengajuanBiayaBankService.getStatusInfo,
        formatCurrency: pengeluaranPengajuanBiayaBankService.formatCurrency,
        formatDate: pengeluaranPengajuanBiayaBankService.formatDate,
        getFileUrl: pengeluaranPengajuanBiayaBankService.getFileUrl
    };
};

export default usePengeluaranBank;