import { useState, useCallback } from 'react';
import PengajuanBiayaService from '../../../../services/pengajuanBiayaService';

const usePengajuanDisetujui = () => {
    const [pengajuan, setPengajuan] = useState([]);
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

    // Fetch pengajuan data dengan tipe: 1 (Disetujui)
    const fetchPengajuan = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        showLoading = true,
        forceRefresh = false
    ) => {
        console.log('🔄 [FETCH DISETUJUI] Starting fetch with params:', { page, perPage, search, showLoading, forceRefresh });
        
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            // Call backend API with DataTables params and tipe: 1 for approved
            const response = await PengajuanBiayaService.getData({
                start: (page - 1) * perPage,
                length: perPage,
                search: search,
                draw: page,
                tipe: 1
            });

            // Transform backend data to frontend format
            const transformedData = response.data.map(item =>
                PengajuanBiayaService.transformData(item)
            );
            
            setPengajuan(transformedData);

            // Update pagination info
            setServerPagination({
                currentPage: page,
                perPage: perPage,
                totalPages: Math.ceil(response.recordsFiltered / perPage) || 1,
                totalItems: response.recordsFiltered
            });
        } catch (err) {
            console.error('Error fetching pengajuan disetujui:', err);
            
            // Set empty data and show error
            setPengajuan([]);
            setServerPagination({
                currentPage: 1,
                perPage: perPage,
                totalPages: 0,
                totalItems: 0
            });
            
            setError(err.response?.data?.message || err.message || 'Gagal memuat data dari server');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    // Handle search with debounce
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setIsSearching(true);
        setSearchError(null);

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchPengajuan(1, serverPagination.perPage, value, false);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [fetchPengajuan, serverPagination.perPage]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchPengajuan(1, serverPagination.perPage, '', false);
    }, [fetchPengajuan, serverPagination.perPage]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        fetchPengajuan(page, serverPagination.perPage, searchTerm, true);
    }, [fetchPengajuan, serverPagination.perPage, searchTerm]);

    // Handle per page change
    const handlePerPageChange = useCallback((perPage) => {
        fetchPengajuan(1, perPage, searchTerm, true);
    }, [fetchPengajuan, searchTerm]);

    return {
        pengajuan,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchPengajuan,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange
    };
};

export default usePengajuanDisetujui;