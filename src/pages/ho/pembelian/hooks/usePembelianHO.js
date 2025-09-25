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

// Constants for better maintainability
const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_DELAY = 300;
const NOTIFICATION_TIMEOUT = 5000;

// Data validation and mapping utilities
const validateAndMapPembelianItem = (item, index) => {
    return {
        pubid: item.pubid || `TEMP-${index + 1}`,
        encryptedPid: item.pid,
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
        biaya_total: parseFloat(item.biaya_total) || 0,
        berat_total: parseFloat(item.berat_total) || 0,
        jenis_pembelian: item.jenis_pembelian || '',
        jenis_pembelian_id: item.jenis_pembelian_id || null,
        file: item.file || null,
        note: item.note || null,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
        id: item.pid || `TEMP-${index + 1}`
    };
};

const usePembelianHO = () => {
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
        totalPages: 1,
        totalItems: 0,
        perPage: DEFAULT_PER_PAGE
    });

    // Refs for cleanup and optimization
    const searchTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Optimized fetch function with request cancellation
    const fetchPembelian = useCallback(async (
        page = 1, 
        perPage = null, 
        search = null, 
        filter = null, 
        dateRangeFilter = null, 
        isSearchRequest = false
    ) => {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
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
            const currentDateRange = dateRangeFilter !== null ? dateRangeFilter : dateRange;
            
            // Build API parameters
            const start = (currentPage - 1) * currentPerPage;
            const params = {
                'start': start.toString(),
                'length': currentPerPage.toString(),
                'draw': currentPage.toString(),
                'search[value]': currentSearch || '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc',
                '_': Date.now() // Cache buster
            };
            
            // Add optional filters
            if (currentFilter && currentFilter !== 'all') {
                params.filter = currentFilter;
            }
            
            if (currentDateRange.startDate) {
                params.start_date = currentDateRange.startDate;
            }
            if (currentDateRange.endDate) {
                params.end_date = currentDateRange.endDate;
            }
            
            const result = await HttpClient.get(`${API_ENDPOINTS.HO.PEMBELIAN}/data`, {
                params,
                signal: abortControllerRef.current.signal
            });
            
            // Process response data
            let dataArray = [];
            let totalRecords = 0;
            let filteredRecords = 0;
            
            if (result.draw && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.recordsTotal || result.data.length;
                filteredRecords = result.recordsFiltered || result.data.length;
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.data.length;
                filteredRecords = result.data.length;
            } else {
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update pagination state
            const newPaginationState = {
                currentPage: currentPage,
                totalPages: Math.ceil(filteredRecords / currentPerPage),
                totalItems: totalRecords,
                filteredItems: filteredRecords,
                perPage: currentPerPage
            };
            
            setServerPagination(newPaginationState);
            
            // Validate and map data
            const validatedData = dataArray.length > 0 
                ? dataArray.map(validateAndMapPembelianItem)
                : [];
            
            setPembelian(validatedData);
            
        } catch (err) {
            // Don't set error if request was aborted
            if (err.name === 'AbortError') {
                return;
            }
            
            const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data pembelian';
            
            if (isSearchRequest) {
                setSearchError(errorMessage);
            } else {
                setError(errorMessage);
            }
            
            setPembelian([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
            abortControllerRef.current = null;
        }
    }, [searchTerm, filterStatus, dateRange, serverPagination.currentPage, serverPagination.perPage]);

    // Optimized create function with better error handling
    const createPembelian = useCallback(async (pembelianData, supplierOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            // Validate required fields
            const officeIdParsed = parseInt(pembelianData.idOffice);
            const supplierIdValue = parseInt(pembelianData.idSupplier);
            
            if (!Number.isInteger(supplierIdValue) || supplierIdValue <= 0) {
                throw new Error('Supplier ID tidak valid. Pastikan supplier sudah dipilih dengan benar.');
            }
            
            if (!Number.isInteger(officeIdParsed) || officeIdParsed <= 0) {
                throw new Error('Office ID tidak valid. Pastikan office sudah dipilih dengan benar.');
            }
            
            // Prepare request data
            const headerData = {
                id_office: officeIdParsed,
                nota: pembelianData.nota,
                id_supplier: supplierIdValue,
                tgl_masuk: pembelianData.tglMasuk,
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah) || 0,
                biaya_truk: parseFloat(pembelianData.biayaTruck) || 0,
                biaya_lain: parseFloat(pembelianData.biayaLain) || 0,
                biaya_total: parseFloat(pembelianData.biayaTotal) || 0,
                berat_total: parseFloat(pembelianData.beratTotal) || 0,
                tipe_pembelian: parseInt(pembelianData.tipePembelian) || 1,
                tipe_pembayaran: parseInt(pembelianData.tipe_pembayaran) || 1,
                due_date: pembelianData.due_date || null,
                file: pembelianData.file || null,
                note: pembelianData.note || null
            };

            // Additional validation
            if (!headerData.biaya_truk || headerData.biaya_truk <= 0) {
                throw new Error(`Biaya truck harus diisi dengan nilai numerik > 0. Nilai saat ini: ${headerData.biaya_truk}`);
            }

            // Handle file upload
            let requestData;
            if (headerData.file && headerData.file instanceof File) {
                requestData = new FormData();
                Object.keys(headerData).forEach(key => {
                    if (key === 'file') {
                        requestData.append('file', headerData.file);
                    } else {
                        requestData.append(key, headerData[key]);
                    }
                });
                requestData.append('details', JSON.stringify(pembelianData.details || []));
            } else {
                requestData = {
                    ...headerData,
                    details: pembelianData.details || []
                };
                if (!requestData.file) {
                    delete requestData.file;
                }
            }
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, requestData);
            
            // Refresh data on success
            await fetchPembelian(1, serverPagination.perPage);
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian berhasil dibuat!',
                data: result.data
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.perPage]);

    // Optimized update function
    const updatePembelian = useCallback(async (data, isHeaderUpdate = true, supplierOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            const hasHeaderFields = data.id_office || data.nota || data.id_supplier;
            const isHeader = isHeaderUpdate || hasHeaderFields;
            
            let requestData;
            if (isHeader) {
                // Handle supplier ID conversion
                let supplierIdValue = data.idSupplier || data.id_supplier;
                if (supplierIdValue && supplierOptions.length > 0) {
                    const selectedSupplier = supplierOptions.find(supplier => supplier.value === supplierIdValue);
                    if (selectedSupplier && selectedSupplier.rawId) {
                        supplierIdValue = parseInt(selectedSupplier.rawId);
                    }
                }
                
                // Clean numeric field conversion
                const parseNumericField = (value) => {
                    return parseFloat(Array.isArray(value) ? value[0] : value) || 0;
                };
                
                requestData = {
                    pid: data.pid || data.encryptedPid,
                    id_office: parseInt(data.idOffice || data.id_office) || 1,
                    nota: String(data.nota || ''),
                    id_supplier: parseInt(supplierIdValue) || 0,
                    tgl_masuk: String(data.tglMasuk || data.tgl_masuk || ''),
                    nama_supir: String(data.namaSupir || data.nama_supir || ''),
                    plat_nomor: String(data.platNomor || data.plat_nomor || ''),
                    jumlah: parseInt(data.jumlah) || 0,
                    biaya_truk: parseNumericField(data.biayaTruck || data.biaya_truk),
                    biaya_lain: parseNumericField(data.biayaLain || data.biaya_lain),
                    biaya_total: parseNumericField(data.biayaTotal || data.biaya_total),
                    berat_total: parseNumericField(data.beratTotal || data.berat_total),
                    tipe_pembelian: parseInt(data.tipePembelian || data.tipe_pembelian) || 1,
                    tipe_pembayaran: parseInt(data.tipe_pembayaran) || 1,
                    due_date: data.due_date || null,
                    note: String(data.note || '')
                };
                
                if (data.file) {
                    requestData.file = data.file;
                }
                
                // Validation for header update
                const requiredFields = [
                    { field: 'id_supplier', message: 'Supplier harus dipilih', condition: !requestData.id_supplier || requestData.id_supplier <= 0 },
                    { field: 'nota', message: 'Nota harus diisi', condition: !requestData.nota.trim() },
                    { field: 'tgl_masuk', message: 'Tanggal masuk harus diisi', condition: !requestData.tgl_masuk.trim() },
                    { field: 'nama_supir', message: 'Nama supir harus diisi', condition: !requestData.nama_supir.trim() },
                    { field: 'plat_nomor', message: 'Plat nomor harus diisi', condition: !requestData.plat_nomor.trim() },
                    { field: 'biaya_truk', message: 'Biaya truk harus lebih dari 0', condition: requestData.biaya_truk <= 0 },
                    { field: 'biaya_lain', message: 'Biaya lain tidak boleh negatif', condition: requestData.biaya_lain < 0 }
                ];
                
                for (const { message, condition } of requiredFields) {
                    if (condition) {
                        throw new Error(message);
                    }
                }
            } else {
                // Detail update
                requestData = {
                    pid: data.pid || data.encryptedPid,
                    id_pembelian: data.idPembelian || data.id_pembelian,
                    id_office: data.idOffice || data.id_office,
                    eartag: data.eartag,
                    eartag_supplier: data.eartagSupplier || data.eartag_supplier || '',
                    id_klasifikasi_hewan: data.idKlasifikasiHewan || data.id_klasifikasi_hewan,
                    harga: data.harga,
                    persentase: data.persentase,
                    berat: data.berat,
                    hpp: data.hpp,
                    total_harga: data.totalHarga || data.total_harga
                };
            }
            
            // Handle file upload
            let result;
            if (isHeader && requestData.file && requestData.file instanceof File) {
                const formData = new FormData();
                Object.keys(requestData).forEach(key => {
                    if (key === 'file') {
                        formData.append('file', requestData.file);
                    } else {
                        formData.append(key, requestData[key]);
                    }
                });
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, formData);
            } else {
                if (requestData.file && typeof requestData.file === 'string') {
                    delete requestData.file;
                }
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, requestData);
            }
            
            if (result.status === 'ok' || result.success) {
                // Refresh data after successful update
                try {
                    await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                } catch (refreshError) {
                    console.warn('Refresh after update failed:', refreshError);
                }
                
                return {
                    status: 'ok',
                    success: true,
                    message: result.message || 'Data updated successfully',
                    data: result.data || result
                };
            } else {
                throw new Error(result.message || 'Update failed');
            }
            
        } catch (error) {
            setError(error.message || 'Failed to update pembelian');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage]);

    // Optimized delete function with better error handling
    const deletePembelian = useCallback(async (encryptedPid, pembelianData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid);
            
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak valid atau tidak ditemukan');
            }
            
            if (encryptedPid.startsWith('TEMP-')) {
                throw new Error('Data pembelian ini belum tersimpan di server dan tidak dapat dihapus');
            }
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/hapus`, { 
                pid: encryptedPid 
            });
            
            if (result.status === 'ok' || result.success === true) {
                // Optimistic UI update
                setPembelian(prevData => 
                    prevData.filter(item => 
                        item.encryptedPid !== encryptedPid && 
                        item.id !== encryptedPid && 
                        item.pid !== encryptedPid
                    )
                );
                
                // Update pagination
                setServerPagination(prev => ({
                    ...prev,
                    totalItems: Math.max(0, prev.totalItems - 1),
                    filteredItems: Math.max(0, prev.filteredItems - 1)
                }));
                
                // Delayed refresh to ensure backend processing is complete
                setTimeout(async () => {
                    try {
                        await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                    } catch (refreshError) {
                        console.warn('Refresh after delete failed:', refreshError);
                    }
                }, 1000);
                
                return {
                    success: true,
                    message: result.message || 'Data berhasil dihapus'
                };
            } else {
                throw new Error(result.message || 'Gagal menghapus data');
            }
            
        } catch (err) {
            // Enhanced error message handling
            const errorMessages = {
                'SQLSTATE': 'Masalah dengan struktur database. Silakan hubungi administrator sistem.',
                'Base table': 'Masalah dengan struktur database. Silakan hubungi administrator sistem.',
                'No query results': 'Data tidak ditemukan di database. Kemungkinan data ini sudah dihapus atau berasal dari view yang berbeda.',
                'Model not found': 'Data tidak ditemukan di database. Kemungkinan data ini sudah dihapus atau berasal dari view yang berbeda.',
                'firstOrFail': 'Data tidak dapat ditemukan untuk dihapus. Mungkin data ini adalah data agregat atau view yang tidak dapat dihapus langsung.',
                '500': 'Server mengalami kesalahan internal. Silakan coba lagi atau hubungi administrator.',
                '404': 'Data pembelian tidak ditemukan. Mungkin sudah dihapus sebelumnya.',
                '403': 'Anda tidak memiliki izin untuk menghapus data ini.',
                '401': 'Sesi Anda telah berakhir. Silakan login kembali.'
            };
            
            let errorMsg = 'Terjadi kesalahan saat menghapus data';
            
            for (const [key, message] of Object.entries(errorMessages)) {
                if (err.message.includes(key)) {
                    errorMsg = message;
                    break;
                }
            }
            
            if (!errorMsg.includes('Terjadi kesalahan') && err.message && err.message.length <= 100) {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null);
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage]);

    // Additional CRUD operations (simplified for brevity)
    const getPembelianDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/show`, {
                pid: encryptedPid
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

    // Memoized computed stats for better performance
    const stats = useMemo(() => {
        const total = pembelian.length;
        const totalTernak = pembelian.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        
        const todayPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        }).length;
        
        const thisMonthPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        }).length;
        
        const thisYearPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getFullYear() === thisYear;
        }).length;
        
        return {
            total,
            totalTernak,
            today: todayPurchases,
            thisMonth: thisMonthPurchases,
            thisYear: thisYearPurchases
        };
    }, [pembelian]);

    // Optimized search handler with debouncing
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (!newSearchTerm.trim()) {
            fetchPembelian(1, serverPagination.perPage, '', filterStatus, dateRange, false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            fetchPembelian(1, serverPagination.perPage, newSearchTerm, filterStatus, dateRange, true);
        }, SEARCH_DEBOUNCE_DELAY);
    }, [fetchPembelian, serverPagination.perPage, filterStatus, dateRange]);
    
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        fetchPembelian(1, serverPagination.perPage, '', filterStatus, dateRange, false);
    }, [fetchPembelian, serverPagination.perPage, filterStatus, dateRange]);

    // Filter and pagination handlers
    const handleFilter = useCallback((newFilter) => {
        setFilterStatus(newFilter);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, newFilter, dateRange, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, dateRange]);
    
    const handleDateRangeFilter = useCallback((newDateRange) => {
        setDateRange(newDateRange);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, filterStatus, newDateRange, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterStatus]);
    
    const clearDateRange = useCallback(() => {
        const emptyDateRange = { startDate: '', endDate: '' };
        setDateRange(emptyDateRange);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, filterStatus, emptyDateRange, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterStatus]);

    const handlePageChange = useCallback((newPage) => {
        fetchPembelian(newPage, serverPagination.perPage, searchTerm, filterStatus, dateRange, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterStatus, dateRange]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, searchTerm, filterStatus, dateRange, false);
    }, [fetchPembelian, searchTerm, filterStatus, dateRange]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Simplified CRUD operations for brevity
    const createDetail = useCallback(async (detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, {
                id_pembelian: detailData.idPembelian,
                id_office: parseInt(detailData.idOffice),
                eartag: String(detailData.eartag),
                eartag_supplier: String(detailData.eartagSupplier || ''),
                id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                harga: parseFloat(detailData.harga),
                persentase: parseFloat(detailData.persentase) || 0,
                berat: parseInt(detailData.berat),
                hpp: parseFloat(detailData.hpp),
                total_harga: parseFloat(detailData.totalHarga)
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

    const updateDetail = useCallback(async (encryptedPid, detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const requestData = {
                pid: encryptedPid,
                id_pembelian: detailData.idPembelian,
                eartag: String(detailData.eartag),
                eartag_supplier: String(detailData.eartagSupplier || ''),
                id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                harga: parseFloat(detailData.harga),
                persentase: detailData.persentase || 0,
                berat: parseInt(detailData.berat),
                hpp: parseFloat(detailData.hpp),
                total_harga: parseFloat(detailData.totalHarga)
            };
            
            if (!encryptedPid) {
                requestData.id_office = parseInt(detailData.idOffice);
            }
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, requestData);
            
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

    const deleteDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/hapus`, {
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

    // Additional helper functions for header and details operations
    const saveHeaderOnly = useCallback(async (headerData, supplierOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            if (!headerData.nota || !headerData.id_supplier || !headerData.tgl_masuk) {
                throw new Error('Data header tidak lengkap');
            }

            const requestData = {
                id_office: parseInt(headerData.id_office) || 1,
                nota: headerData.nota,
                id_supplier: parseInt(headerData.id_supplier),
                tgl_masuk: headerData.tgl_masuk,
                nama_supir: headerData.nama_supir,
                plat_nomor: headerData.plat_nomor,
                jumlah: parseInt(headerData.jumlah) || 0,
                biaya_truk: parseFloat(headerData.biaya_truk) || 0,
                biaya_lain: parseFloat(headerData.biaya_lain) || 0,
                biaya_total: parseFloat(headerData.biaya_total) || 0,
                berat_total: parseFloat(headerData.berat_total) || 0,
                tipe_pembelian: parseInt(headerData.tipe_pembelian) || 1,
                tipe_pembayaran: parseInt(headerData.tipe_pembayaran) || 1,
                due_date: headerData.due_date || null,
                file: headerData.file || null,
                note: headerData.note || null
            };

            let result;
            if (requestData.file && requestData.file instanceof File) {
                const formData = new FormData();
                Object.keys(requestData).forEach(key => {
                    if (key === 'file') {
                        formData.append('file', requestData.file);
                    } else {
                        formData.append(key, requestData[key]);
                    }
                });
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, formData);
            } else {
                if (!requestData.file) {
                    delete requestData.file;
                }
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, requestData);
            }

            if (result.status === 'ok' || result.success === true) {
                await fetchPembelian(1, serverPagination.perPage);
                return {
                    success: true,
                    message: 'Header pembelian berhasil disimpan!',
                    data: result.data
                };
            } else {
                throw new Error(result.message || 'Gagal menyimpan header pembelian');
            }

        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan header';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.perPage]);

    const saveDetailsOnly = useCallback(async (pid, detailsData) => {
        setLoading(true);
        setError(null);
        
        try {
            if (!pid) {
                throw new Error('ID pembelian tidak valid');
            }

            if (!Array.isArray(detailsData) || detailsData.length === 0) {
                throw new Error('Data detail tidak valid atau kosong');
            }

            detailsData.forEach((item, index) => {
                if (!item.eartag || item.eartag === '') {
                    throw new Error(`Detail ${index + 1}: Eartag tidak boleh kosong`);
                }
                if (item.id_klasifikasi_hewan === null || item.id_klasifikasi_hewan === undefined || item.id_klasifikasi_hewan === '') {
                    throw new Error(`Detail ${index + 1}: Klasifikasi hewan harus dipilih`);
                }
                if (!item.harga || item.harga <= 0) {
                    throw new Error(`Detail ${index + 1}: Harga harus diisi dan lebih dari 0`);
                }
                if (!item.berat || item.berat <= 0) {
                    throw new Error(`Detail ${index + 1}: Berat harus diisi dan lebih dari 0`);
                }
            });

            const requestData = {
                pid: pid,
                details: detailsData.map(item => ({
                    id_office: parseInt(item.id_office) || 1,
                    eartag: String(item.eartag),
                    eartag_supplier: String(item.eartag_supplier || item.eartagSupplier || ''),
                    id_klasifikasi_hewan: parseInt(item.id_klasifikasi_hewan),
                    harga: parseFloat(item.harga),
                    berat: parseInt(item.berat),
                    persentase: parseFloat(item.persentase) || 0,
                    hpp: parseFloat(item.hpp) || 0,
                    total_harga: parseFloat(item.total_harga) || parseFloat(item.hpp) || 0
                }))
            };

            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, requestData);
            
            if (result.status === 'ok' || result.success) {
                try {
                    await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                } catch (refreshError) {
                    console.warn('Refresh after detail save failed:', refreshError);
                }
                return {
                    success: true,
                    message: 'Detail pembelian berhasil disimpan!',
                    data: result.data
                };
            } else {
                throw new Error(result.message || 'Gagal menyimpan detail pembelian');
            }

        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan detail';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage]);

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

export default usePembelianHO;
