import { useState, useMemo, useCallback, useEffect } from 'react';

// Mock data generator
const generateMockData = () => {
    const suppliers = ['PT Sapi Jaya', 'CV Ternak Makmur', 'UD Sapi Sejahtera', 'PT Livestock Indonesia', 'CV Sapi Nusantara'];
    const offices = ['Kantor Pusat', 'Cabang Jakarta', 'Cabang Surabaya', 'Cabang Bandung', 'Cabang Semarang'];
    const drivers = ['Budi Santoso', 'Ahmad Yani', 'Joko Widodo', 'Susilo Bambang', 'Megawati Soekarno'];
    const plateNumbers = ['B 1234 ABC', 'D 5678 DEF', 'L 9012 GHI', 'F 3456 JKL', 'H 7890 MNO'];
    const jenisPembelian = ['Pembelian Langsung', 'Pembelian Kredit', 'Pembelian Konsinyasi', 'Pembelian Kontrak'];
    const approvalStatus = ['Disetujui', 'Menunggu', 'Ditolak'];
    
    const data = [];
    const today = new Date();
    
    // Generate 50 mock records
    for (let i = 1; i <= 50; i++) {
        const randomDate = new Date(today);
        randomDate.setDate(today.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days
        
        const jumlah = Math.floor(Math.random() * 50) + 10; // 10-60 ekor
        const hargaPerEkor = Math.floor(Math.random() * 5000000) + 15000000; // 15-20 juta per ekor
        const biayaTruk = Math.floor(Math.random() * 2000000) + 1000000; // 1-3 juta
        const biayaLain = Math.floor(Math.random() * 1000000); // 0-1 juta
        const totalBelanja = jumlah * hargaPerEkor;
        const biayaTotal = totalBelanja + biayaTruk + biayaLain;
        const beratTotal = jumlah * (Math.floor(Math.random() * 200) + 300); // 300-500 kg per ekor
        
        data.push({
            pubid: `PUB-2024-${String(i).padStart(4, '0')}`,
            encryptedPid: `ENC-${Date.now()}-${i}`,
            nota: `NOTA-${String(i).padStart(5, '0')}`,
            nota_sistem: `PS-2024-${String(i).padStart(4, '0')}`,
            nama_supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
            nama_office: offices[Math.floor(Math.random() * offices.length)],
            tgl_masuk: randomDate.toISOString().split('T')[0],
            nama_supir: drivers[Math.floor(Math.random() * drivers.length)],
            plat_nomor: plateNumbers[Math.floor(Math.random() * plateNumbers.length)],
            jumlah: jumlah,
            status: 1,
            total_belanja: totalBelanja,
            biaya_lain: biayaLain,
            biaya_truk: biayaTruk,
            biaya_total: biayaTotal,
            berat_total: beratTotal,
            jenis_pembelian: String(Math.floor(Math.random() * 4) + 1),
            jenis_pembelian_id: Math.floor(Math.random() * 4) + 1,
            persetujuan: approvalStatus[Math.floor(Math.random() * approvalStatus.length)],
            file: null,
            note: i % 3 === 0 ? `Catatan untuk pembelian ${i}` : null,
            createdAt: randomDate.toISOString(),
            updatedAt: randomDate.toISOString(),
            id: `ID-${i}`
        });
    }
    
    return data.sort((a, b) => new Date(b.tgl_masuk) - new Date(a.tgl_masuk));
};

const usePembelianHOMock = () => {
    // Generate mock data once
    const [allMockData] = useState(() => generateMockData());
    
    // State management
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    
    // Date range filter state
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        perPage: 10
    });

    // Mock fetch function with simulated delay
    const fetchPembelian = useCallback(async (
        page = 1, 
        perPage = 10, 
        search = null, 
        filter = null, 
        dateRangeFilter = null, 
        isSearchRequest = false
    ) => {
        setLoading(true);
        setError(null);
        setSearchError(null);
        
        if (isSearchRequest) {
            setIsSearching(true);
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            let filteredData = [...allMockData];
            
            // Apply search filter
            const currentSearch = search !== null ? search : searchTerm;
            if (currentSearch) {
                const searchLower = currentSearch.toLowerCase();
                filteredData = filteredData.filter(item => 
                    item.nota.toLowerCase().includes(searchLower) ||
                    item.nota_sistem.toLowerCase().includes(searchLower) ||
                    item.nama_supplier.toLowerCase().includes(searchLower) ||
                    item.nama_office.toLowerCase().includes(searchLower) ||
                    item.nama_supir.toLowerCase().includes(searchLower) ||
                    item.plat_nomor.toLowerCase().includes(searchLower)
                );
            }
            
            // Apply date range filter
            const currentDateRange = dateRangeFilter !== null ? dateRangeFilter : dateRange;
            if (currentDateRange.startDate || currentDateRange.endDate) {
                filteredData = filteredData.filter(item => {
                    const itemDate = new Date(item.tgl_masuk);
                    const startDate = currentDateRange.startDate ? new Date(currentDateRange.startDate) : null;
                    const endDate = currentDateRange.endDate ? new Date(currentDateRange.endDate) : null;
                    
                    if (startDate && endDate) {
                        return itemDate >= startDate && itemDate <= endDate;
                    } else if (startDate) {
                        return itemDate >= startDate;
                    } else if (endDate) {
                        return itemDate <= endDate;
                    }
                    return true;
                });
            }
            
            // Apply status filter
            const currentFilter = filter !== null ? filter : filterStatus;
            if (currentFilter && currentFilter !== 'all') {
                filteredData = filteredData.filter(item => item.persetujuan === currentFilter);
            }
            
            // Calculate pagination
            const currentPage = page || serverPagination.currentPage;
            const currentPerPage = perPage || serverPagination.perPage;
            const totalItems = filteredData.length;
            const totalPages = Math.ceil(totalItems / currentPerPage);
            const start = (currentPage - 1) * currentPerPage;
            const end = start + currentPerPage;
            
            // Get paginated data
            const paginatedData = filteredData.slice(start, end);
            
            // Update states
            setPembelian(paginatedData);
            setServerPagination({
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                filteredItems: totalItems,
                perPage: currentPerPage
            });
            
        } catch (err) {
            const errorMessage = 'Terjadi kesalahan saat mengambil data mock';
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
    }, [allMockData, searchTerm, filterStatus, dateRange, serverPagination.currentPage, serverPagination.perPage]);

    // Mock create function
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            // Simulate successful creation
            const newId = allMockData.length + 1;
            const newPembelian = {
                pubid: `PUB-2024-${String(newId).padStart(4, '0')}`,
                encryptedPid: `ENC-${Date.now()}-${newId}`,
                nota: pembelianData.nota || `NOTA-${String(newId).padStart(5, '0')}`,
                nota_sistem: `PS-2024-${String(newId).padStart(4, '0')}`,
                nama_supplier: 'PT Sapi Baru',
                nama_office: 'Kantor Pusat',
                tgl_masuk: pembelianData.tglMasuk || new Date().toISOString().split('T')[0],
                nama_supir: pembelianData.namaSupir || 'Driver Baru',
                plat_nomor: pembelianData.platNomor || 'B 9999 XXX',
                jumlah: parseInt(pembelianData.jumlah) || 10,
                status: 1,
                total_belanja: parseFloat(pembelianData.totalBelanja) || 150000000,
                biaya_lain: parseFloat(pembelianData.biayaLain) || 500000,
                biaya_truk: parseFloat(pembelianData.biayaTruck) || 2000000,
                biaya_total: parseFloat(pembelianData.biayaTotal) || 152500000,
                berat_total: parseFloat(pembelianData.beratTotal) || 4000,
                jenis_pembelian: pembelianData.tipePembelian || '1',
                persetujuan: 'Menunggu',
                file: null,
                note: pembelianData.note || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                id: `ID-${newId}`
            };
            
            allMockData.unshift(newPembelian);
            
            // Refresh data
            await fetchPembelian();
            
            return {
                success: true,
                message: 'Pembelian berhasil ditambahkan (Mock)',
                data: newPembelian
            };
            
        } catch (err) {
            const errorMsg = 'Terjadi kesalahan saat menyimpan data mock';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [allMockData, fetchPembelian]);

    // Mock update function
    const updatePembelian = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            const index = allMockData.findIndex(item => 
                item.encryptedPid === data.pid || 
                item.encryptedPid === data.encryptedPid
            );
            
            if (index !== -1) {
                allMockData[index] = {
                    ...allMockData[index],
                    ...data,
                    updatedAt: new Date().toISOString()
                };
            }
            
            // Refresh data
            await fetchPembelian();
            
            return {
                status: 'ok',
                success: true,
                message: 'Data berhasil diperbarui (Mock)',
                data: allMockData[index]
            };
            
        } catch (error) {
            setError('Gagal memperbarui pembelian mock');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [allMockData, fetchPembelian]);

    // Mock delete function
    const deletePembelian = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        setDeleteLoading(encryptedPid);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        try {
            const index = allMockData.findIndex(item => item.encryptedPid === encryptedPid);
            
            if (index !== -1) {
                allMockData.splice(index, 1);
                
                // Update pagination
                setServerPagination(prev => ({
                    ...prev,
                    totalItems: Math.max(0, prev.totalItems - 1),
                    filteredItems: Math.max(0, prev.filteredItems - 1)
                }));
                
                // Refresh data
                await fetchPembelian();
                
                return {
                    success: true,
                    message: 'Data berhasil dihapus (Mock)'
                };
            } else {
                throw new Error('Data tidak ditemukan');
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data mock';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null);
            setLoading(false);
        }
    }, [allMockData, fetchPembelian]);

    // Mock get detail function
    const getPembelianDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            const pembelian = allMockData.find(item => item.encryptedPid === encryptedPid);
            
            if (pembelian) {
                // Generate mock details
                const details = [];
                for (let i = 1; i <= pembelian.jumlah; i++) {
                    details.push({
                        id: `DETAIL-${encryptedPid}-${i}`,
                        eartag: `ET-${String(i).padStart(6, '0')}`,
                        eartag_supplier: `SUPP-${String(i).padStart(4, '0')}`,
                        klasifikasi_hewan: 'Sapi Limosin',
                        berat: Math.floor(Math.random() * 200) + 300,
                        harga: Math.floor(Math.random() * 5000000) + 15000000,
                        persentase: Math.floor(Math.random() * 20) + 80,
                        hpp: Math.floor(Math.random() * 1000000) + 14000000,
                        total_harga: Math.floor(Math.random() * 5000000) + 15000000
                    });
                }
                
                return {
                    success: true,
                    data: {
                        header: pembelian,
                        details: details
                    },
                    message: 'Detail pembelian berhasil diambil (Mock)'
                };
            } else {
                throw new Error('Data tidak ditemukan');
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail mock';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [allMockData]);

    // Calculate stats
    const stats = useMemo(() => {
        const today = new Date();
        const todayString = today.toDateString();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        
        // Calculate start of week (Monday)
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Today's data
        const todayData = allMockData.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === todayString;
        });
        
        const todayPurchases = todayData.length;
        const todayAnimals = todayData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        const todayValue = todayData.reduce((sum, item) => sum + (item.biaya_total || 0), 0);
        
        // This week's data
        const weekData = allMockData.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate >= startOfWeek && itemDate <= today;
        });
        
        const weekPurchases = weekData.length;
        const weekAnimals = weekData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        const weekValue = weekData.reduce((sum, item) => sum + (item.biaya_total || 0), 0);
        
        // This month's data
        const monthData = allMockData.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        });
        
        const monthPurchases = monthData.length;
        const monthAnimals = monthData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        const monthValue = monthData.reduce((sum, item) => sum + (item.biaya_total || 0), 0);
        
        // This year's data
        const yearData = allMockData.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getFullYear() === thisYear;
        });
        
        const yearPurchases = yearData.length;
        const yearAnimals = yearData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        const yearValue = yearData.reduce((sum, item) => sum + (item.biaya_total || 0), 0);
        
        return {
            total: allMockData.length,
            totalTernak: allMockData.reduce((sum, item) => sum + (item.jumlah || 0), 0),
            // Today
            todayPurchases,
            todayAnimals,
            todayValue,
            // This week
            weekPurchases,
            weekAnimals,
            weekValue,
            // This month
            monthPurchases,
            monthAnimals,
            monthValue,
            // This year
            yearPurchases,
            yearAnimals,
            yearValue
        };
    }, [allMockData]);

    // Search handler
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        // Debounced search
        setTimeout(() => {
            fetchPembelian(1, null, newSearchTerm, null, null, true);
        }, 300);
    }, [fetchPembelian]);
    
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchPembelian(1, null, '', null, null, false);
    }, [fetchPembelian]);

    // Filter handlers
    const handleFilter = useCallback((newFilter) => {
        setFilterStatus(newFilter);
        setSearchError(null);
        fetchPembelian(1, null, null, newFilter, null, false);
    }, [fetchPembelian]);
    
    const handleDateRangeFilter = useCallback((newDateRange) => {
        setDateRange(newDateRange);
        setSearchError(null);
        fetchPembelian(1, null, null, null, newDateRange, false);
    }, [fetchPembelian]);
    
    const clearDateRange = useCallback(() => {
        const emptyDateRange = { startDate: '', endDate: '' };
        setDateRange(emptyDateRange);
        setSearchError(null);
        fetchPembelian(1, null, null, null, emptyDateRange, false);
    }, [fetchPembelian]);

    const handlePageChange = useCallback((newPage) => {
        fetchPembelian(newPage, null, null, null, null, false);
    }, [fetchPembelian]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, null, null, null, false);
    }, [fetchPembelian]);

    // Initialize data on mount
    useEffect(() => {
        fetchPembelian();
    }, []);

    // Mock additional functions
    const createDetail = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Detail ternak berhasil ditambahkan (Mock)' };
    }, []);

    const updateDetail = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Detail ternak berhasil diperbarui (Mock)' };
    }, []);

    const deleteDetail = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Detail ternak berhasil dihapus (Mock)' };
    }, []);

    const saveHeaderOnly = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Header pembelian berhasil disimpan (Mock)' };
    }, []);

    const saveDetailsOnly = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Detail pembelian berhasil disimpan (Mock)' };
    }, []);

    // Return all hook functions and state
    return {
        pembelian,
        allPembelian: pembelian,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        dateRange,
        setDateRange,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPembelian,
        handleSearch,
        clearSearch,
        handleFilter,
        handleDateRangeFilter,
        clearDateRange,
        handlePageChange,
        handlePerPageChange,
        createPembelian,
        updatePembelian,
        deletePembelian,
        deleteLoading,
        getPembelianDetail,
        createDetail,
        updateDetail,
        deleteDetail,
        saveHeaderOnly,
        saveDetailsOnly
    };
};

export default usePembelianHOMock;