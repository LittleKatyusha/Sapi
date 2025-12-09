import { useState, useCallback } from 'react';
import pengeluaranService from '../../../../services/pengeluaranService';

const useKeuanganKas = (activeTab = 'belum-dibayar') => {
    const [keuanganKas, setKeuanganKas] = useState([]);
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

    // Fetch keuangan kas data from API
    const fetchKeuanganKas = useCallback(async (
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
            const paymentStatus = pengeluaranService.getPaymentStatusByTab(tab);
            
            // Convert to DataTables format
            const dataTablesParams = pengeluaranService.convertToDataTablesParams(
                page,
                perPage,
                search,
                'due_date',
                'desc',
                {
                    ...(paymentStatus !== null ? { payment_status: paymentStatus } : {}),
                    tipe_pembayaran: 1  // Filter only payment_type = 1 (Kas)
                }
            );

            console.log('📤 [API REQUEST] DataTables params:', dataTablesParams);

            // Call API
            const response = await pengeluaranService.getPengeluaran(dataTablesParams);

            console.log('📥 [API RESPONSE]:', response);

            // Handle response
            if (response && response.data) {
                let data = response.data;

                // Special handling for "Belum Lunas" tab - filter partial payments
                if (tab === 'belum-lunas') {
                    console.log('🔍 [BELUM LUNAS] Data sebelum filter:', {
                        totalData: data.length,
                        sampleData: data.slice(0, 2).map(item => ({
                            nota: item.nota,
                            total_tagihan: item.total_tagihan,
                            total_terbayar: item.total_terbayar,
                            payment_status: item.payment_status,
                            payment_status_text: item.payment_status_text
                        }))
                    });
                    
                    const filteredData = pengeluaranService.filterBelumLunas(data);
                    
                    console.log('🔍 [BELUM LUNAS] Data setelah filter:', {
                        totalFiltered: filteredData.length,
                        sampleFiltered: filteredData.slice(0, 2).map(item => ({
                            nota: item.nota,
                            total_tagihan: item.total_tagihan,
                            total_terbayar: item.total_terbayar,
                            sisa: item.total_tagihan - item.total_terbayar
                        }))
                    });
                    
                    data = filteredData;
                }

                setKeuanganKas(data);

                // Update pagination info from DataTables response
                const totalFiltered = tab === 'belum-lunas' ? data.length : response.recordsFiltered;
                setServerPagination({
                    currentPage: page,
                    perPage: perPage,
                    totalPages: Math.ceil(totalFiltered / perPage) || 1,
                    totalItems: totalFiltered
                });

                console.log('✅ [FETCH] Success:', {
                    dataCount: data.length,
                    totalItems: totalFiltered
                });
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (err) {
            console.error('❌ [FETCH] Error fetching keuangan kas:', err);
            setKeuanganKas([]);
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
            fetchKeuanganKas(1, serverPagination.perPage, value, activeTab, false);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchKeuanganKas, serverPagination.perPage, activeTab]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchKeuanganKas(1, serverPagination.perPage, '', activeTab, false);
    }, [fetchKeuanganKas, serverPagination.perPage, activeTab]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        fetchKeuanganKas(page, serverPagination.perPage, searchTerm, activeTab, true);
    }, [fetchKeuanganKas, serverPagination.perPage, searchTerm, activeTab]);

    // Handle per page change
    const handlePerPageChange = useCallback((perPage) => {
        fetchKeuanganKas(1, perPage, searchTerm, activeTab, true);
    }, [fetchKeuanganKas, searchTerm, activeTab]);

    // Create keuangan kas - Not implemented in PengeluaranController
    const createKeuanganKas = useCallback(async (data) => {
        console.log('💾 [CREATE HOOK] Create operation not available for pengeluaran');
        return {
            success: false,
            message: 'Fungsi create tidak tersedia untuk data pengeluaran'
        };
    }, []);

    // Update keuangan kas - Not implemented in PengeluaranController
    const updateKeuanganKas = useCallback(async (id, data) => {
        console.log('💾 [UPDATE HOOK] Update operation not available for pengeluaran');
        return {
            success: false,
            message: 'Fungsi update tidak tersedia untuk data pengeluaran'
        };
    }, []);

    // Delete keuangan kas - Not implemented in PengeluaranController
    const deleteKeuanganKas = useCallback(async (id) => {
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
        keuanganKas,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchKeuanganKas,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createKeuanganKas,
        updateKeuanganKas,
        deleteKeuanganKas,
        getPengeluaranDetail
    };
};

export default useKeuanganKas;