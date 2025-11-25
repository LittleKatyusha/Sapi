import { useState, useCallback } from 'react';
import PengajuanBiayaService from '../../../../services/pengajuanBiayaService';

const usePengajuan = () => {
    const [pengajuan, setPengajuan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [stats, setStats] = useState({
        pending: { count: 0, nominal: 0 },
        today: { count: 0, nominal: 0 },
        thisWeek: { count: 0, nominal: 0 },
        thisMonth: { count: 0, nominal: 0 },
        thisYear: { count: 0, nominal: 0 }
    });
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalPages: 1,
        totalItems: 0
    });

    // Fetch card statistics from API
    const fetchStats = useCallback(async () => {
        try {
            const response = await PengajuanBiayaService.getCardData();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Set default stats on error
            setStats({
                pending: { count: 0, nominal: 0 },
                today: { count: 0, nominal: 0 },
                thisWeek: { count: 0, nominal: 0 },
                thisMonth: { count: 0, nominal: 0 },
                thisYear: { count: 0, nominal: 0 }
            });
        }
    }, []);

    // Fetch pengajuan data
    const fetchPengajuan = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        showLoading = true,
        forceRefresh = false
    ) => {
        console.log('🔄 [FETCH] Starting fetch with params:', { page, perPage, search, showLoading, forceRefresh });
        
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            // Call backend API with DataTables params
            const response = await PengajuanBiayaService.getData({
                start: (page - 1) * perPage,
                length: perPage,
                search: search,
                draw: page,
                tipe: 2
            });

            // Transform backend data to frontend format
            const transformedData = response.data.map(item =>
                PengajuanBiayaService.transformData(item)
            );
            
            setPengajuan(transformedData);

            // Fetch stats from API
            await fetchStats();

            // Update pagination info
            setServerPagination({
                currentPage: page,
                perPage: perPage,
                totalPages: Math.ceil(response.recordsFiltered / perPage) || 1,
                totalItems: response.recordsFiltered
            });
        } catch (err) {
            console.error('Error fetching pengajuan:', err);
            
            // Set empty data and show error
            setPengajuan([]);
            setStats({
                pending: { count: 0, nominal: 0 },
                today: { count: 0, nominal: 0 },
                thisWeek: { count: 0, nominal: 0 },
                thisMonth: { count: 0, nominal: 0 },
                thisYear: { count: 0, nominal: 0 }
            });
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
    }, [fetchStats]);

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

    // Create pengajuan
    const createPengajuan = useCallback(async (data) => {
        console.log('💾 [CREATE HOOK] Starting create operation');
        try {
            // Transform frontend data to backend format
            const backendData = PengajuanBiayaService.transformToBackend(data);
            
            // Call API to create
            const response = await PengajuanBiayaService.store(backendData);
            
            if (response.success) {
                // Refresh data after successful creation
                await fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: response.message || 'Data pengajuan berhasil disimpan',
                    data: response.data
                };
            }

            return {
                success: false,
                message: response.message || 'Gagal menyimpan data pengajuan'
            };
        } catch (error) {
            console.error('❌ [CREATE HOOK] Error creating pengajuan:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal menyimpan data ke server'
            };
        }
    }, [fetchPengajuan, serverPagination, searchTerm]);

    // Update pengajuan
    const updatePengajuan = useCallback(async (pid, data) => {
        console.log('💾 [UPDATE HOOK] Starting update operation for PID:', pid);
        try {
            // Transform frontend data to backend format
            const backendData = PengajuanBiayaService.transformToBackend(data);
            
            // Call API to update
            const response = await PengajuanBiayaService.update(pid, backendData);
            
            if (response.success) {
                // Refresh data after successful update
                await fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: response.message || 'Data pengajuan berhasil diperbarui',
                    data: response.data
                };
            }

            return {
                success: false,
                message: response.message || 'Gagal memperbarui data pengajuan'
            };
        } catch (error) {
            console.error('❌ [UPDATE HOOK] Error updating pengajuan:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal memperbarui data ke server'
            };
        }
    }, [fetchPengajuan, serverPagination, searchTerm]);

    // Delete pengajuan
    const deletePengajuan = useCallback(async (pid) => {
        console.log('🗑️ [DELETE HOOK] Starting delete operation for PID:', pid);
        try {
            // Call API to delete
            const response = await PengajuanBiayaService.delete(pid);
            
            if (response.success) {
                // Refresh data after successful deletion
                await fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                
                return {
                    success: true,
                    message: response.message || 'Data pengajuan berhasil dihapus'
                };
            }

            return {
                success: false,
                message: response.message || 'Gagal menghapus data pengajuan'
            };
        } catch (error) {
            console.error('❌ [DELETE HOOK] Error deleting pengajuan:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal menghapus data dari server'
            };
        }
    }, [fetchPengajuan, serverPagination, searchTerm]);

    // Get pengajuan by PID
    const getPengajuanById = useCallback(async (pid) => {
        try {
            // Call API to get detail
            const response = await PengajuanBiayaService.getDetail(pid);
            
            if (response.success) {
                // Transform backend data to frontend format
                const transformedData = PengajuanBiayaService.transformData(response.data);
                
                return {
                    success: true,
                    data: transformedData
                };
            }

            return {
                success: false,
                message: response.message || 'Data tidak ditemukan'
            };
        } catch (error) {
            console.error('Error fetching pengajuan by PID:', error);
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal memuat data dari server'
            };
        }
    }, []);

    return {
        pengajuan,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPengajuan,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createPengajuan,
        updatePengajuan,
        deletePengajuan,
        getPengajuanById
    };
};

export default usePengajuan;