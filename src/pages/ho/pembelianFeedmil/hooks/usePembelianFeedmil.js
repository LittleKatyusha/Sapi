import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// Helper function to safely parse JSON response
const safeJsonParse = async (response) => {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON. This usually means the API endpoint is not properly configured or the server returned an error page. Response: ${responseText.substring(0, 200)}...`);
    }
    
    const jsonData = await response.json();
    return jsonData;
};

const usePembelianFeedmil = () => {
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenisPembelian, setFilterJenisPembelian] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 10
    });

    // Mock data untuk sementara - nanti bisa diganti dengan API call
    const mockData = [
        {
            id: 1,
            encryptedPid: 'encrypted_1',
            nota: 'FM-001-2024',
            nama_supplier: 'PT Feedmil Sukses',
            tgl_masuk: '2024-01-15',
            nama_supir: 'Budi Santoso',
            plat_nomor: 'B 1234 AB',
            jumlah: 50,
            satuan: 'sak',
            berat_total: 2500,
            biaya_total: 15000000,
            biaya_lain: 500000,
            jenis_pembelian: 'Feedmil'
        },
        {
            id: 2,
            encryptedPid: 'encrypted_2',
            nota: 'FM-002-2024',
            nama_supplier: 'CV Pakan Ternak',
            tgl_masuk: '2024-01-16',
            nama_supir: 'Sukarno',
            plat_nomor: 'B 5678 CD',
            jumlah: 30,
            satuan: 'sak',
            berat_total: 1500,
            biaya_total: 9000000,
            biaya_lain: 300000,
            jenis_pembelian: 'Supplier'
        },
        {
            id: 3,
            encryptedPid: 'encrypted_3',
            nota: 'FM-003-2024',
            nama_supplier: 'PT Nutrisi Ternak',
            tgl_masuk: '2024-01-17',
            nama_supir: 'Joko Widodo',
            plat_nomor: 'B 9999 EF',
            jumlah: 75,
            satuan: 'sak',
            berat_total: 3750,
            biaya_total: 22500000,
            biaya_lain: 750000,
            jenis_pembelian: 'Pakan'
        }
    ];

    // Fetch pembelian feedmil data from API
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, filter = null, isSearchRequest = false) => {
        setLoading(true);
        setError(null);
        setSearchError(null);
        
        if (isSearchRequest) {
            setIsSearching(true);
        }
        
        try {
            // Simulate API call with mock data for now
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
            
            // Use mock data untuk sekarang
            let filteredData = [...mockData];
            
            // Apply search filter
            const currentSearch = search !== null ? search : searchTerm;
            if (currentSearch && currentSearch.trim()) {
                filteredData = filteredData.filter(item => 
                    item.nota.toLowerCase().includes(currentSearch.toLowerCase()) ||
                    item.nama_supplier.toLowerCase().includes(currentSearch.toLowerCase()) ||
                    item.nama_supir.toLowerCase().includes(currentSearch.toLowerCase()) ||
                    item.plat_nomor.toLowerCase().includes(currentSearch.toLowerCase())
                );
            }
            
            // Apply jenis pembelian filter
            const currentFilter = filter !== null ? filter : filterJenisPembelian;
            if (currentFilter && currentFilter !== 'all') {
                filteredData = filteredData.filter(item => item.jenis_pembelian === currentFilter);
            }
            
            // Apply pagination
            const currentPage = page || serverPagination.currentPage;
            const currentPerPage = perPage || serverPagination.perPage;
            const totalItems = filteredData.length;
            const totalPages = Math.ceil(totalItems / currentPerPage);
            const startIndex = (currentPage - 1) * currentPerPage;
            const endIndex = startIndex + currentPerPage;
            const paginatedData = filteredData.slice(startIndex, endIndex);
            
            // Update pagination state
            setServerPagination({
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                perPage: currentPerPage
            });
            
            setPembelian(paginatedData);
            
        } catch (err) {
            const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data pembelian feedmil';
            
            if (isSearchRequest) {
                setSearchError(errorMessage);
            } else {
                setError(errorMessage);
            }
            
            setPembelian([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchTerm, filterJenisPembelian, serverPagination.currentPage, serverPagination.perPage]);

    // Create pembelian feedmil
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newItem = {
                id: Date.now(),
                encryptedPid: `encrypted_${Date.now()}`,
                ...pembelianData,
                jenis_pembelian: 'Feedmil'
            };
            
            // Add to mock data (in real implementation this would be API call)
            mockData.push(newItem);
            
            await fetchPembelian(1, serverPagination.perPage);
            
            return {
                success: true,
                message: 'Pembelian feedmil berhasil dibuat!',
                data: newItem
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.perPage]);

    // Update pembelian feedmil
    const updatePembelian = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update mock data
            const index = mockData.findIndex(item => item.id === data.id);
            if (index !== -1) {
                mockData[index] = { ...mockData[index], ...data };
            }
            
            await fetchPembelian();
            
            return {
                success: true,
                message: 'Pembelian feedmil berhasil diperbarui!'
            };
            
        } catch (error) {
            console.error('Error updating pembelian feedmil:', error);
            setError(error.message || 'Failed to update pembelian feedmil');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian]);

    // Delete pembelian feedmil
    const deletePembelian = useCallback(async (encryptedPid, pembelianData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid);
            
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak valid atau tidak ditemukan');
            }
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Remove from mock data
            const index = mockData.findIndex(item => item.encryptedPid === encryptedPid);
            if (index !== -1) {
                mockData.splice(index, 1);
            }
            
            // Update state immediately
            setPembelian(prevData => 
                prevData.filter(item => 
                    item.encryptedPid !== encryptedPid && 
                    item.id !== encryptedPid
                )
            );
            
            // Update pagination
            setServerPagination(prev => ({
                ...prev,
                totalItems: Math.max(0, prev.totalItems - 1)
            }));
            
            setTimeout(async () => {
                try {
                    await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                } catch (refreshError) {
                    console.warn('Refresh after delete failed:', refreshError);
                }
            }, 500);
            
            return {
                success: true,
                message: 'Data berhasil dihapus'
            };
            
        } catch (err) {
            let errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage]);

    // Get pembelian detail
    const getPembelianDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const item = mockData.find(item => item.encryptedPid === encryptedPid);
            
            return {
                success: true,
                data: item ? [item] : [],
                message: 'Detail pembelian berhasil diambil'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail pembelian';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Computed stats
    const stats = useMemo(() => {
        const total = mockData.length;
        const totalFeedmil = mockData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        // Today's purchases
        const today = new Date().toDateString();
        const todayPurchases = mockData.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        }).length;
        
        // This month's purchases
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthPurchases = mockData.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        }).length;
        
        return {
            total: total,
            totalFeedmil: totalFeedmil,
            today: todayPurchases,
            thisMonth: thisMonthPurchases
        };
    }, []);

    // Enhanced debounced search handler
    const searchTimeoutRef = useRef(null);
    
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (!newSearchTerm.trim()) {
            fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            fetchPembelian(1, serverPagination.perPage, newSearchTerm, filterJenisPembelian, true);
        }, 300);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian]);
    
    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        fetchPembelian(1, serverPagination.perPage, '', filterJenisPembelian, false);
    }, [fetchPembelian, serverPagination.perPage, filterJenisPembelian]);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Filter handler
    const handleFilter = useCallback((newFilter) => {
        setFilterJenisPembelian(newFilter);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, newFilter, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm]);

    // Pagination handlers
    const handlePageChange = useCallback((newPage) => {
        fetchPembelian(newPage, serverPagination.perPage, searchTerm, filterJenisPembelian, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterJenisPembelian]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, searchTerm, filterJenisPembelian, false);
    }, [fetchPembelian, searchTerm, filterJenisPembelian]);

    return {
        pembelian,
        allPembelian: pembelian,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterJenisPembelian,
        setFilterJenisPembelian,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPembelian,
        handleSearch,
        clearSearch,
        handleFilter,
        handlePageChange,
        handlePerPageChange,
        createPembelian,
        updatePembelian,
        deletePembelian,
        deleteLoading,
        getPembelianDetail
    };
};

export default usePembelianFeedmil;
