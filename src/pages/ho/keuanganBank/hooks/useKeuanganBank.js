import { useState, useCallback } from 'react';
import pengeluaranService from '../../../../services/pengeluaranService';

const useKeuanganBank = (activeTab = 'belum-dibayar') => {
    const [keuanganBank, setKeuanganBank] = useState([]);
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

    // Fetch keuangan bank data from API
    const fetchKeuanganBank = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        tab = activeTab,
        showLoading = true,
        forceRefresh = false
    ) => {
        console.log('🔄 [FETCH] Starting fetch with params:', { page, perPage, search, tab, showLoading, forceRefresh });
        
        // Skip API call for tabs that use mock data
        if (tab === 'pengajuan' || tab === 'kredit-bank') {
            console.log('⏭️ [FETCH] Skipping API call for mock data tab:', tab);
            return;
        }
        
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            // Get payment status filter based on active tab
            // Payment Status Values: 0 = Belum Lunas, 1 = Lunas, 2 = Belum Bayar
            const paymentStatus = pengeluaranService.getPaymentStatusByTab(tab);
            
            // Convert to DataTables format with payment_status filter
            const dataTablesParams = pengeluaranService.convertToDataTablesParams(
                page,
                perPage,
                search,
                'due_date',
                'desc',
                {
                    tipe_pembayaran: 2,  // Filter only payment_type = 2 (Bank)
                    ...(paymentStatus !== null ? { payment_status: paymentStatus } : {})
                }
            );

            console.log('📤 [API REQUEST] DataTables params:', dataTablesParams);

            // Call API
            const response = await pengeluaranService.getPengeluaran(dataTablesParams);

            console.log('📥 [API RESPONSE]:', response);

            // Handle response
            if (response && response.data) {
                const data = response.data;

                setKeuanganBank(data);

                // Update pagination info from server response
                setServerPagination({
                    currentPage: page,
                    perPage: perPage,
                    totalPages: Math.ceil(response.recordsFiltered / perPage) || 1,
                    totalItems: response.recordsFiltered
                });

                console.log('✅ [FETCH] Success:', {
                    dataCount: data.length,
                    totalItems: response.recordsFiltered
                });
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (err) {
            console.error('❌ [FETCH] Error fetching keuangan bank:', err);
            setKeuanganBank([]);
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
    }, [activeTab]);

    // Handle search with debounce
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setIsSearching(true);
        setSearchError(null);

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchKeuanganBank(1, serverPagination.perPage, value, activeTab, false);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchKeuanganBank, serverPagination.perPage, activeTab]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchKeuanganBank(1, serverPagination.perPage, '', activeTab, false);
    }, [fetchKeuanganBank, serverPagination.perPage, activeTab]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        fetchKeuanganBank(page, serverPagination.perPage, searchTerm, activeTab, true);
    }, [fetchKeuanganBank, serverPagination.perPage, searchTerm, activeTab]);

    // Handle per page change
    const handlePerPageChange = useCallback((perPage) => {
        fetchKeuanganBank(1, perPage, searchTerm, activeTab, true);
    }, [fetchKeuanganBank, searchTerm, activeTab]);

    // Create keuangan bank - Not implemented in PengeluaranController
    const createKeuanganBank = useCallback(async (data) => {
        console.log('💾 [CREATE HOOK] Create operation not available for pengeluaran');
        return {
            success: false,
            message: 'Fungsi create tidak tersedia untuk data pengeluaran'
        };
    }, []);

    // Update keuangan bank - Not implemented in PengeluaranController
    const updateKeuanganBank = useCallback(async (id, data) => {
        console.log('💾 [UPDATE HOOK] Update operation not available for pengeluaran');
        return {
            success: false,
            message: 'Fungsi update tidak tersedia untuk data pengeluaran'
        };
    }, []);

    // Delete keuangan bank - Not implemented in PengeluaranController
    const deleteKeuanganBank = useCallback(async (id) => {
        console.log('🗑️ [DELETE HOOK] Delete operation not available for pengeluaran');
        return {
            success: false,
            message: 'Fungsi delete tidak tersedia untuk data pengeluaran'
        };
    }, []);

    // Get pengeluaran detail
    const getPengeluaranDetail = useCallback(async (pid) => {
        console.log('🔍 [DETAIL HOOK] Fetching detail for PID:', pid);
        try {
            const response = await pengeluaranService.getPengeluaranDetail(pid);
            
            if (response && response.success) {
                return {
                    success: true,
                    data: response.data
                };
            } else {
                throw new Error(response.message || 'Gagal mengambil detail data');
            }
        } catch (error) {
            console.error('❌ [DETAIL HOOK] Error fetching detail:', error);
            return {
                success: false,
                message: error.message || 'Gagal mengambil detail data dari server'
            };
        }
    }, []);

    return {
        keuanganBank,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchKeuanganBank,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createKeuanganBank,
        updateKeuanganBank,
        deleteKeuanganBank,
        getPengeluaranDetail
    };
};

export default useKeuanganBank;