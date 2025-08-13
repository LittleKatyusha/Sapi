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

const usePembelianHO = () => {
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null); // Track which item is being deleted

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 10
    });

    // Fetch pembelian data from API with DataTables server-side pagination format
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, filter = null, isSearchRequest = false) => {
        setLoading(true);
        setError(null);
        setSearchError(null);
        
        if (isSearchRequest) {
            setIsSearching(true);
        }
        
        try {
            // Use current state if parameters not provided
            const currentPage = page || serverPagination.currentPage;
            const currentPerPage = perPage || serverPagination.perPage;
            const currentSearch = search !== null ? search : searchTerm;
            const currentFilter = filter !== null ? filter : filterStatus;
            
            // DataTables pagination parameters for server-side processing
            const start = (currentPage - 1) * currentPerPage;
            const params = {
                'start': start.toString(),
                'length': currentPerPage.toString(),
                'draw': Date.now().toString(),
                'search[value]': currentSearch || '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            };
            
            // Add filter parameter if needed (can be extended for date filters)
            if (currentFilter && currentFilter !== 'all') {
                params.filter = currentFilter;
            }
            
            const result = await HttpClient.get(`${API_ENDPOINTS.HO.PEMBELIAN}/data`, {
                params: params
            });
            
            let dataArray = [];
            let totalRecords = 0;
            let filteredRecords = 0;
            
            // Handle DataTables server-side response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.recordsTotal || result.data.length;
                filteredRecords = result.recordsFiltered || result.data.length;
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // Fallback for simple response format
                dataArray = result.data;
                totalRecords = result.data.length;
                filteredRecords = result.data.length;
            } else {
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state with backend data
            setServerPagination({
                currentPage: currentPage,
                totalPages: Math.ceil(filteredRecords / currentPerPage),
                totalItems: totalRecords,
                filteredItems: filteredRecords,
                perPage: currentPerPage
            });
            
            if (dataArray.length >= 0) {
                const validatedData = dataArray.map((item, index) => {
                    const mappedItem = {
                        pubid: item.pubid || `TEMP-${index + 1}`, // Raw pubid (biasanya tidak ada dari backend)
                        encryptedPid: item.pid, // Backend mengirim encrypted value sebagai 'pid'
                        nota: item.nota || '',
                        nama_supplier: item.nama_supplier || 'Supplier tidak tersedia',
                        nama_office: item.nama_office || '',
                        tgl_masuk: item.tgl_masuk || new Date().toISOString().split('T')[0],
                        nama_supir: item.nama_supir || '',
                        plat_nomor: item.plat_nomor || '',
                        jumlah: parseInt(item.jumlah) || 0,
                        status: item.status !== undefined ? item.status : 1,
                        total_belanja: parseFloat(item.total_belanja) || 0,
                        biaya_lain: parseFloat(item.biaya_lain) || 0,
                        biaya_truk: parseFloat(item.biaya_truk) || 0,
                        berat_total: parseFloat(item.berat_total) || 0, // Field baru dari backend
                        jenis_pembelian: item.jenis_pembelian || '', // Field baru dari backend
                        createdAt: item.created_at || new Date().toISOString(),
                        updatedAt: item.updated_at || new Date().toISOString(),
                        id: item.pid || `TEMP-${index + 1}` // Gunakan encrypted PID sebagai primary ID
                    };
                    
                    return mappedItem;
                });
                setPembelian(validatedData);
            } else {
                setPembelian([]);
            }
            
        } catch (err) {
            const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data pembelian';
            
            if (isSearchRequest) {
                setSearchError(errorMessage);
            } else {
                setError(errorMessage);
            }
            
            // Fallback to empty data
            setPembelian([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchTerm, filterStatus, serverPagination.currentPage, serverPagination.perPage]);

    // Create pembelian - handle header + details array format
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            
            // Backend expects integer IDs for supplier and office
            const officeIdParsed = parseInt(pembelianData.idOffice);
            const supplierIdParsed = parseInt(pembelianData.idSupplier);
            
            const headerData = {
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: pembelianData.nota,
                id_supplier: !isNaN(supplierIdParsed) ? supplierIdParsed : null, // Backend expects integer ID from supplier table
                tgl_masuk: pembelianData.tglMasuk,
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah) || 0,
                biaya_truk: parseFloat(pembelianData.biayaTruck) || 0, // Backend requires numeric
                biaya_lain: parseFloat(pembelianData.biayaLain) || 0, // Backend validation requires this field as numeric
                berat_total: parseFloat(pembelianData.beratTotal) || 0, // Field baru dari backend
                tipe_pembelian: parseInt(pembelianData.tipePembelian) || 1, // Field baru dari backend
                file: pembelianData.file || '' // Field baru dari backend
            };

            // Validate required fields before sending - backend expects integer ID
            if (!headerData.id_supplier || isNaN(headerData.id_supplier) || headerData.id_supplier <= 0) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }
            
            // Validate biaya_truk is provided as backend requires it
            if (!headerData.biaya_truk || headerData.biaya_truk <= 0) {
                throw new Error('Biaya truck harus diisi dan lebih dari 0');
            }
            
            if (!headerData.biaya_truk || headerData.biaya_truk <= 0 || isNaN(headerData.biaya_truk)) {
                throw new Error(`Biaya truck harus diisi dengan nilai numerik > 0. Nilai saat ini: ${headerData.biaya_truk} (type: ${typeof headerData.biaya_truk})`);
            }

            // Backend expects header + details array format
            const requestData = {
                ...headerData,
                details: pembelianData.details || [] // Details array from form
            };
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, requestData);
            await fetchPembelian(1, serverPagination.perPage); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian pertama berhasil dibuat!'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian]);

    // Update pembelian - backend expects encrypted PID dan fields sesuai validation rules
    const updatePembelian = useCallback(async (encryptedPid, pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend expects integer IDs for supplier and office
            const officeIdParsed = parseInt(pembelianData.idOffice);
            const supplierIdParsed = parseInt(pembelianData.idSupplier);
            
            const updateData = {
                pid: encryptedPid, // Backend expects encrypted PID untuk update
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: pembelianData.nota,
                id_supplier: !isNaN(supplierIdParsed) ? supplierIdParsed : null, // Backend expects integer ID from supplier table
                tgl_masuk: pembelianData.tglMasuk,
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah) || 0,
                biaya_truk: parseFloat(pembelianData.biayaTruck) || 0, // Backend requires numeric
                biaya_lain: parseFloat(pembelianData.biayaLain) || 0, // Backend validation requires this field as numeric
                berat_total: parseFloat(pembelianData.beratTotal) || 0, // Field baru dari backend
                tipe_pembelian: parseInt(pembelianData.tipePembelian) || 1, // Field baru dari backend
                file: pembelianData.file || '' // Field baru dari backend
            };

            // Validate required fields before sending - backend expects integer ID
            if (!updateData.id_supplier || isNaN(updateData.id_supplier) || updateData.id_supplier <= 0) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }
            
            // Validate biaya_truk is provided as backend requires it
            if (!updateData.biaya_truk || updateData.biaya_truk <= 0) {
                throw new Error('Biaya truck harus diisi dan lebih dari 0');
            }

            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, updateData);
            await fetchPembelian(serverPagination.currentPage, serverPagination.perPage); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian]);

    // Delete pembelian - dengan fallback method jika pubid tidak cocok
    const deletePembelian = useCallback(async (encryptedPid, pembelianData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid); // Set loading untuk item ini
            
            // Validate that we have the encrypted PID
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak valid atau tidak ditemukan');
            }
            
            // Check if it's a temporary ID (which shouldn't be deleted)
            if (encryptedPid.startsWith('TEMP-')) {
                throw new Error('Data pembelian ini belum tersimpan di server dan tidak dapat dihapus');
            }
            
            // First, try the standard delete method with encrypted PID
            const requestPayload = { pid: encryptedPid };
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/delete`, requestPayload);
            
            if (result.status === 'ok' || result.success === true) {
                // Track deleted PID for debugging
                window.lastDeletedPid = encryptedPid;
                
                // Optimistic UI update: Remove item dari state sebelum refresh
                // Gunakan multiple fallback untuk memastikan item terhapus
                setPembelian(prevData => 
                    prevData.filter(item => 
                        item.encryptedPid !== encryptedPid && 
                        item.id !== encryptedPid && 
                        item.pid !== encryptedPid
                    )
                );
                
                // Update pagination jika diperlukan
                setServerPagination(prev => ({
                    ...prev,
                    totalItems: Math.max(0, prev.totalItems - 1),
                    filteredItems: Math.max(0, prev.filteredItems - 1)
                }));
                
                // Delay sebelum refresh untuk memastikan backend selesai processing
                setTimeout(async () => {
                    try {
                        await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                    } catch (refreshError) {
                        // Jika refresh gagal, tetap return success karena delete berhasil
                    }
                }, 1000); // Increase delay to 1000ms
                
                return {
                    success: true,
                    message: result.message || 'Data deleted successfully'
                };
            } else {
                throw new Error(result.message || 'Delete failed');
            }
            
        } catch (err) {
            let errorMsg = 'Terjadi kesalahan saat menghapus data';
            
            // Handle specific backend error responses
            if (err.message.includes('SQLSTATE') || err.message.includes('Base table')) {
                errorMsg = 'Masalah dengan struktur database. Silakan hubungi administrator sistem.';
            } else if (err.message.includes('No query results') || err.message.includes('Model not found')) {
                errorMsg = 'Data tidak ditemukan di database. Kemungkinan data ini sudah dihapus atau berasal dari view yang berbeda.';
            } else if (err.message.includes('firstOrFail')) {
                errorMsg = 'Data tidak dapat ditemukan untuk dihapus. Mungkin data ini adalah data agregat atau view yang tidak dapat dihapus langsung.';
            } else if (err.message.includes('500')) {
                errorMsg = 'Server mengalami kesalahan internal. Silakan coba lagi atau hubungi administrator.';
            } else if (err.message.includes('404')) {
                errorMsg = 'Data pembelian tidak ditemukan. Mungkin sudah dihapus sebelumnya.';
            } else if (err.message.includes('403')) {
                errorMsg = 'Anda tidak memiliki izin untuk menghapus data ini.';
            } else if (err.message.includes('401')) {
                errorMsg = 'Sesi Anda telah berakhir. Silakan login kembali.';
            } else if (err.message) {
                // If it's a detailed error message from backend, show it
                if (err.message.length > 100) {
                    errorMsg = 'Terjadi kesalahan pada server. Silakan hubungi administrator untuk bantuan teknis.';
                } else {
                    errorMsg = err.message;
                }
            }
            
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null); // Clear loading state
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage]);

    // Get pembelian details - backend expects encrypted PID
    const getPembelianDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend show method: DataPembelianDetail::where('pubid', decrypt($validatedData['pid']))->get()
            // Jadi backend expects encrypted PID yang akan di-decrypt
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/show`, {
                pid: encryptedPid // Backend expects encrypted PID sebagai 'pid'
            });
            
            return {
                success: result.status === 'ok' || result.success === true,
                data: result.data || [],
                message: result.message || 'Detail pembelian berhasil diambil'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail pembelian';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create detail ternak
    const createDetail = useCallback(async (detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, {
                // Detail fields only (no header fields to trigger detail creation)
                id_pembelian: parseInt(detailData.idPembelian),
                id_office: parseInt(detailData.idOffice),
                eartag: String(detailData.eartag), // Convert to string
                id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                harga: parseFloat(detailData.harga),
                persentase: parseFloat(detailData.persentase) || 0, // Field baru dari backend
                berat: parseInt(detailData.berat),
                // biaya_truk removed from detail since it's now in header only
                hpp: parseFloat(detailData.hpp),
                total_harga: parseFloat(detailData.totalHarga),
                status: parseInt(detailData.status) || 1, // Field baru dari backend
                tgl_masuk_rph: detailData.tglMasukRph || null, // Field baru dari backend
                tgl_pemotongan: detailData.tglPemotongan || null // Field baru dari backend
            });
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menambah detail ternak';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update detail ternak - backend expects encrypted PID
    const updateDetail = useCallback(async (encryptedPid, detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, {
                pid: encryptedPid, // Backend expects encrypted PID
                // Detail fields only (no header fields)
                id_pembelian: parseInt(detailData.idPembelian),
                id_office: parseInt(detailData.idOffice),
                eartag: String(detailData.eartag), // Convert to string
                id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                harga: parseFloat(detailData.harga),
                persentase: parseFloat(detailData.persentase) || 0, // Field baru dari backend
                berat: parseInt(detailData.berat),
                hpp: parseFloat(detailData.hpp),
                total_harga: parseFloat(detailData.totalHarga),
                status: parseInt(detailData.status) || 1, // Field baru dari backend
                tgl_masuk_rph: detailData.tglMasukRph || null, // Field baru dari backend
                tgl_pemotongan: detailData.tglPemotongan || null // Field baru dari backend
            });
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui detail ternak';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete detail ternak - sesuaikan dengan backend yang menggunakan POST method
    const deleteDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend delete method menggunakan POST, bukan DELETE
            // Backend expects: { pid: encryptedPid }
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/delete`, {
                pid: encryptedPid
            });
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus detail ternak';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Computed stats
    const stats = useMemo(() => {
        const total = pembelian.length;
        const totalTernak = pembelian.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        // Today's purchases
        const today = new Date().toDateString();
        const todayPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        }).length;
        
        // This month's purchases
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        }).length;
        
        return {
            total: total,
            totalTernak: totalTernak,
            today: todayPurchases,
            thisMonth: thisMonthPurchases
        };
    }, [pembelian]);

    // Enhanced debounced search handler with loading states
    const searchTimeoutRef = useRef(null);
    
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // If search term is empty, fetch immediately without debouncing
        if (!newSearchTerm.trim()) {
            fetchPembelian(1, serverPagination.perPage, '', filterStatus, false);
            return;
        }
        
        // Set new timeout for debounced search with shorter delay (300ms)
        searchTimeoutRef.current = setTimeout(() => {
            fetchPembelian(1, serverPagination.perPage, newSearchTerm, filterStatus, true);
        }, 300); // 300ms delay for better UX
    }, [fetchPembelian, serverPagination.perPage, filterStatus]);
    
    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Fetch data without search filter
        fetchPembelian(1, serverPagination.perPage, '', filterStatus, false);
    }, [fetchPembelian, serverPagination.perPage, filterStatus]);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Filter handler - triggers new API request and resets to page 1
    const handleFilter = useCallback((newFilter) => {
        setFilterStatus(newFilter);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, newFilter, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm]);

    // Pagination handlers - maintain search term and filter
    const handlePageChange = useCallback((newPage) => {
        fetchPembelian(newPage, serverPagination.perPage, searchTerm, filterStatus, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterStatus]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, searchTerm, filterStatus, false);
    }, [fetchPembelian, searchTerm, filterStatus]);

    // For server-side pagination, we don't need client-side filtering
    // The data returned is already filtered by the server
    const filteredPembelian = pembelian;

    return {
        pembelian: filteredPembelian,
        allPembelian: pembelian,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
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
        deleteLoading, // Export delete loading state
        getPembelianDetail,
        createDetail,
        updateDetail,
        deleteDetail
    };
};

export default usePembelianHO;