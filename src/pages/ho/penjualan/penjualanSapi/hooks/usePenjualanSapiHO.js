import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PenjualanDokaSapiService from '../../../../../services/penjualanDokaSapiService';
import HttpClient from '../../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../../config/api';

// Constants for better maintainability
const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_DELAY = 300;
const NOTIFICATION_TIMEOUT = 5000;

// Data validation and mapping utilities
const validateAndMapPenjualanItem = (item, index) => {
    // Use the service's transform method for consistency
    return PenjualanDokaSapiService.transformData(item);
};

// Mock data for testing - Using current date for better testing
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0');
const day = String(currentDate.getDate()).padStart(2, '0');
const today = `${year}-${month}-${day}`;

// Helper to get date days ago
const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const MOCK_DATA = [
    {
        pubid: 'PSJ-2025-001',
        encryptedPid: 'enc_001',
        pid: 'enc_001',
        nota: 'INV-2025-001',
        nota_sistem: 'SYS-2025-001',
        nama_supplier: 'PT. Sapi Nusantara',
        nama_office: 'Kantor Pusat Jakarta',
        tgl_masuk: today, // Today's data
        nama_supir: 'Budi Santoso',
        plat_nomor: 'B 1234 ABC',
        jumlah: 25,
        status: 'completed',
        total_belanja: 375000000,
        biaya_lain: 5000000,
        biaya_truk: 10000000,
        biaya_total: 390000000,
        berat_total: 12500,
        jenis_penjualan: '1',
        jenis_penjualan_id: 1,
        saldo_sebelum: 500000000,
        saldo_setelah: 110000000,
        file: null,
        note: 'Pengiriman tepat waktu',
        createdAt: `${today}T08:00:00Z`,
        updatedAt: `${today}T08:00:00Z`,
        id: 'enc_001'
    },
    {
        pubid: 'PSJ-2025-002',
        encryptedPid: 'enc_002',
        pid: 'enc_002',
        nota: 'INV-2025-002',
        nota_sistem: 'SYS-2025-002',
        nama_supplier: 'CV. Ternak Makmur',
        nama_office: 'Kantor Cabang Surabaya',
        tgl_masuk: today, // Today's data
        nama_supir: 'Ahmad Rizki',
        plat_nomor: 'L 5678 DEF',
        jumlah: 30,
        status: 'pending',
        total_belanja: 450000000,
        biaya_lain: 6000000,
        biaya_truk: 12000000,
        biaya_total: 468000000,
        berat_total: 15000,
        jenis_penjualan: '2',
        jenis_penjualan_id: 2,
        saldo_sebelum: 110000000,
        saldo_setelah: -358000000,
        file: null,
        note: 'Menunggu konfirmasi pembayaran',
        createdAt: `${today}T09:30:00Z`,
        updatedAt: `${today}T09:30:00Z`,
        id: 'enc_002'
    },
    {
        pubid: 'PSJ-2025-003',
        encryptedPid: 'enc_003',
        pid: 'enc_003',
        nota: 'INV-2025-003',
        nota_sistem: null,
        nama_supplier: 'UD. Sapi Jaya',
        nama_office: 'Kantor Cabang Bandung',
        tgl_masuk: getDaysAgo(1), // Yesterday
        nama_supir: 'Dedi Kurniawan',
        plat_nomor: 'D 9012 GHI',
        jumlah: 20,
        status: 'draft',
        total_belanja: 300000000,
        biaya_lain: 4000000,
        biaya_truk: 8000000,
        biaya_total: 312000000,
        berat_total: 10000,
        jenis_penjualan: '1',
        jenis_penjualan_id: 1,
        saldo_sebelum: -358000000,
        saldo_setelah: -670000000,
        file: null,
        note: 'Draft pesanan',
        createdAt: `${getDaysAgo(1)}T10:00:00Z`,
        updatedAt: `${getDaysAgo(1)}T10:00:00Z`,
        id: 'enc_003'
    },
    {
        pubid: 'PSJ-2025-004',
        encryptedPid: 'enc_004',
        pid: 'enc_004',
        nota: 'INV-2025-004',
        nota_sistem: 'SYS-2025-004',
        nama_supplier: 'PT. Ternak Indonesia',
        nama_office: 'Kantor Pusat Jakarta',
        tgl_masuk: getDaysAgo(5), // 5 days ago (this month)
        nama_supir: 'Eko Prasetyo',
        plat_nomor: 'B 3456 JKL',
        jumlah: 35,
        status: 'completed',
        total_belanja: 525000000,
        biaya_lain: 7000000,
        biaya_truk: 14000000,
        biaya_total: 546000000,
        berat_total: 17500,
        jenis_penjualan: '2',
        jenis_penjualan_id: 2,
        saldo_sebelum: -670000000,
        saldo_setelah: -1216000000,
        file: null,
        note: 'Pembayaran lunas',
        createdAt: `${getDaysAgo(5)}T11:00:00Z`,
        updatedAt: `${getDaysAgo(5)}T11:00:00Z`,
        id: 'enc_004'
    },
    {
        pubid: 'PSJ-2025-005',
        encryptedPid: 'enc_005',
        pid: 'enc_005',
        nota: 'INV-2025-005',
        nota_sistem: 'SYS-2025-005',
        nama_supplier: 'CV. Sapi Berkah',
        nama_office: 'Kantor Cabang Medan',
        tgl_masuk: getDaysAgo(10), // 10 days ago (this month)
        nama_supir: 'Fahmi Abdullah',
        plat_nomor: 'BK 7890 MNO',
        jumlah: 28,
        status: 'completed',
        total_belanja: 420000000,
        biaya_lain: 5500000,
        biaya_truk: 11000000,
        biaya_total: 436500000,
        berat_total: 14000,
        jenis_penjualan: '1',
        jenis_penjualan_id: 1,
        saldo_sebelum: -1216000000,
        saldo_setelah: -1652500000,
        file: null,
        note: 'Pengiriman selesai',
        createdAt: `${getDaysAgo(10)}T12:00:00Z`,
        updatedAt: `${getDaysAgo(10)}T12:00:00Z`,
        id: 'enc_005'
    },
    {
        pubid: 'PSJ-2025-006',
        encryptedPid: 'enc_006',
        pid: 'enc_006',
        nota: 'INV-2025-006',
        nota_sistem: 'SYS-2025-006',
        nama_supplier: 'PT. Maju Bersama',
        nama_office: 'Kantor Cabang Yogyakarta',
        tgl_masuk: getDaysAgo(35), // Last month
        nama_supir: 'Gunawan Wibowo',
        plat_nomor: 'AB 4567 XYZ',
        jumlah: 40,
        status: 'completed',
        total_belanja: 600000000,
        biaya_lain: 8000000,
        biaya_truk: 16000000,
        biaya_total: 624000000,
        berat_total: 20000,
        jenis_penjualan: '2',
        jenis_penjualan_id: 2,
        saldo_sebelum: -1652500000,
        saldo_setelah: -2276500000,
        file: null,
        note: 'Transaksi bulan lalu',
        createdAt: `${getDaysAgo(35)}T13:00:00Z`,
        updatedAt: `${getDaysAgo(35)}T13:00:00Z`,
        id: 'enc_006'
    },
    {
        pubid: 'PSJ-2025-007',
        encryptedPid: 'enc_007',
        pid: 'enc_007',
        nota: 'INV-2025-007',
        nota_sistem: 'SYS-2025-007',
        nama_supplier: 'UD. Sumber Rejeki',
        nama_office: 'Kantor Cabang Semarang',
        tgl_masuk: getDaysAgo(100), // 3+ months ago (last year data)
        nama_supir: 'Hendra Susanto',
        plat_nomor: 'H 8901 ABC',
        jumlah: 15,
        status: 'completed',
        total_belanja: 225000000,
        biaya_lain: 3000000,
        biaya_truk: 6000000,
        biaya_total: 234000000,
        berat_total: 7500,
        jenis_penjualan: '1',
        jenis_penjualan_id: 1,
        saldo_sebelum: -2276500000,
        saldo_setelah: -2510500000,
        file: null,
        note: 'Transaksi tahun lalu',
        createdAt: `${getDaysAgo(100)}T14:00:00Z`,
        updatedAt: `${getDaysAgo(100)}T14:00:00Z`,
        id: 'enc_007'
    }
];

// Flag to enable/disable mock data
// ⚠️ IMPORTANT: Set to false in production to use real API
// Set to true for testing without backend API
const USE_MOCK_DATA = false; // Now using REAL API data

const usePenjualanSapiHO = () => {
    // State management
    const [penjualan, setPenjualan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    
    // State untuk menyimpan total dari backend
    const [backendTotal, setBackendTotal] = useState(0);
    
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
    
    // Refs to hold current state values to avoid stale closures
    const currentStateRef = useRef({
        searchTerm: '',
        filterStatus: 'all',
        dateRange: { startDate: '', endDate: '' },
        serverPagination: { currentPage: 1, totalPages: 1, totalItems: 0, perPage: DEFAULT_PER_PAGE }
    });

    // Optimized fetch function with request cancellation
    const fetchPenjualan = useCallback(async (
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
            const currentPage = page || currentStateRef.current.serverPagination.currentPage;
            const currentPerPage = perPage || currentStateRef.current.serverPagination.perPage;
            const currentSearch = search !== null ? search : currentStateRef.current.searchTerm;
            const currentFilter = filter !== null ? filter : currentStateRef.current.filterStatus;
            const currentDateRange = dateRangeFilter !== null ? dateRangeFilter : currentStateRef.current.dateRange;
            
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
            
            // Use the service layer for API calls
            const result = await PenjualanDokaSapiService.getData({
                start: start,
                length: currentPerPage,
                search: currentSearch,
                start_date: currentDateRange.startDate,
                end_date: currentDateRange.endDate,
                orderColumn: params['order[0][column]'],
                orderDir: params['order[0][dir]'],
                draw: currentPage
            });
            
            // Process response data
            let dataArray = [];
            let totalRecords = 0;
            let filteredRecords = 0;
            let totalFromBackend = 0;
            
            if (result.draw && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.recordsTotal || result.data.length;
                filteredRecords = result.recordsFiltered || result.data.length;
                totalFromBackend = result.total || 0; // Get total from backend
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.data.length;
                filteredRecords = result.data.length;
                totalFromBackend = result.total || 0;
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
            
            // Save backend total
            setBackendTotal(totalFromBackend);
            
            // Validate and map data
            const validatedData = dataArray.length > 0
                ? dataArray.map(validateAndMapPenjualanItem)
                : [];
            
            setPenjualan(validatedData);
            
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
            
            setPenjualan([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
            abortControllerRef.current = null;
        }
    }, []); // Remove dependencies to prevent stale closures and infinite loops

    // Optimized create function with better error handling
    const createPenjualan = useCallback(async (penjualanData, supplierOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            // Validate required fields
            const officeIdParsed = parseInt(penjualanData.idOffice);
            const supplierIdValue = parseInt(penjualanData.idSupplier);
            
            if (!Number.isInteger(supplierIdValue) || supplierIdValue <= 0) {
                throw new Error('Supplier ID tidak valid. Pastikan supplier sudah dipilih dengan benar.');
            }
            
            if (!Number.isInteger(officeIdParsed) || officeIdParsed <= 0) {
                throw new Error('Office ID tidak valid. Pastikan office sudah dipilih dengan benar.');
            }
            
            // Prepare request data
            const headerData = {
                id_office: officeIdParsed,
                nota: penjualanData.nota,
                id_supplier: supplierIdValue,
                tgl_masuk: penjualanData.tglMasuk,
                nama_supir: penjualanData.namaSupir,
                plat_nomor: penjualanData.platNomor,
                jumlah: parseInt(penjualanData.jumlah) || 0,
                biaya_truk: parseFloat(penjualanData.biayaTruck) || 0,
                biaya_lain: parseFloat(penjualanData.biayaLain) || 0,
                biaya_total: parseFloat(penjualanData.biayaTotal) || 0,
                berat_total: parseFloat(penjualanData.beratTotal) || 0,
                tipe_pembelian: parseInt(penjualanData.tipePembelian) || 1,
                tipe_pembayaran: parseInt(penjualanData.tipe_pembayaran) || 1,
                due_date: penjualanData.due_date || null,
                id_syarat_pembelian: parseInt(penjualanData.syarat_pembelian) || null,
                file: penjualanData.file || null,
                note: penjualanData.note || null
            };

            // Additional validation
            if (!headerData.biaya_truk || headerData.biaya_truk <= 0) {
                throw new Error(`Biaya truck harus diisi dengan nilai numerik > 0. Nilai saat ini: ${headerData.biaya_truk}`);
            }
            
            if (!headerData.id_syarat_pembelian || headerData.id_syarat_pembelian <= 0) {
                throw new Error('Syarat pembelian harus dipilih');
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
                requestData.append('details', JSON.stringify(penjualanData.details || []));
            } else {
                requestData = {
                    ...headerData,
                    details: penjualanData.details || []
                };
                if (!requestData.file) {
                    delete requestData.file;
                }
            }
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/store`, requestData);
            
            // Don't fetch here - let the page handle refresh via navigation state
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Penjualan berhasil dibuat!',
                data: result.data
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Optimized update function
    const updatePenjualan = useCallback(async (data, isHeaderUpdate = true, supplierOptions = []) => {
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
                    id_syarat_pembelian: parseInt(data.syarat_pembelian || data.id_syarat_pembelian) || null,
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
                    { field: 'biaya_lain', message: 'Biaya lain tidak boleh negatif', condition: requestData.biaya_lain < 0 },
                    { field: 'id_syarat_pembelian', message: 'Syarat pembelian harus dipilih', condition: !requestData.id_syarat_pembelian || requestData.id_syarat_pembelian <= 0 }
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
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/update`, formData);
            } else {
                if (requestData.file && typeof requestData.file === 'string') {
                    delete requestData.file;
                }
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/update`, requestData);
            }
            
            if (result.status === 'ok' || result.success) {
                // Don't fetch here - let the page handle refresh via navigation state
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
    }, []);

    // Optimized delete function with better error handling
    const deletePenjualan = useCallback(async (encryptedPid, penjualanData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid);
            
            if (!encryptedPid) {
                throw new Error('ID penjualan tidak valid atau tidak ditemukan');
            }
            
            if (encryptedPid.startsWith('TEMP-')) {
                throw new Error('Data penjualan ini belum tersimpan di server dan tidak dapat dihapus');
            }
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/hapus`, {
                pid: encryptedPid 
            });
            
            if (result.status === 'ok' || result.success === true) {
                // Optimistic UI update
                setPenjualan(prevData =>
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
                
                // Don't fetch here - optimistic update is enough for delete
                
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
    }, []);

    // Additional CRUD operations using the service layer
    const getPenjualanDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await PenjualanDokaSapiService.getDetail(encryptedPid);
            return result;
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail penjualan';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Approve Penjualan
    const approvePenjualan = useCallback(async (encryptedPid, idPersetujuanHo) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await PenjualanDokaSapiService.approve(encryptedPid, idPersetujuanHo);
            
            // Refresh data after successful approval
            await fetchPenjualan();
            
            return result;
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyetujui penjualan';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Reject Penjualan
    const rejectPenjualan = useCallback(async (encryptedPid, idPersetujuanHo, catatan) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await PenjualanDokaSapiService.reject(encryptedPid, idPersetujuanHo, catatan);
            
            // Refresh data after successful rejection
            await fetchPenjualan();
            
            return result;
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menolak penjualan';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Memoized computed stats for better performance
    const stats = useMemo(() => {
        const now = new Date();
        const today = now.toDateString();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        // Pending orders - check for numeric status (1 = pending)
        const pendingOrders = penjualan.filter(item => {
            // Handle both numeric and string status
            return item.status === 1 || item.status === '1' ||
                   (typeof item.status === 'string' &&
                    (item.status.toLowerCase() === 'pending' ||
                     item.status.toLowerCase() === 'menunggu'));
        });
        
        // Today's data
        const todayData = penjualan.filter(item => {
            if (!item.tgl_masuk && !item.created_at) return false;
            const itemDate = new Date(item.tgl_masuk || item.created_at).toDateString();
            return itemDate === today;
        });
        
        // This week's data
        const weekData = penjualan.filter(item => {
            if (!item.tgl_masuk && !item.created_at) return false;
            const itemDate = new Date(item.tgl_masuk || item.created_at);
            return itemDate >= startOfWeek && itemDate <= now;
        });
        
        // This month's data
        const monthData = penjualan.filter(item => {
            if (!item.tgl_masuk && !item.created_at) return false;
            const itemDate = new Date(item.tgl_masuk || item.created_at);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        });
        
        // This year's data
        const yearData = penjualan.filter(item => {
            if (!item.tgl_masuk && !item.created_at) return false;
            const itemDate = new Date(item.tgl_masuk || item.created_at);
            return itemDate.getFullYear() === thisYear;
        });
        
        // Calculate totals function
        const calculateTotals = (data) => ({
            count: data.length,
            totalAnimals: data.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0),
            totalAmount: data.reduce((sum, item) => sum + (parseFloat(item.harga || item.biaya_total) || 0), 0)
        });
        
        return {
            // Total dari backend
            totalFromBackend: backendTotal,
            totalRecords: serverPagination.totalItems,
            
            // Calculated stats from current page data
            pending: pendingOrders.length,
            today: calculateTotals(todayData),
            week: calculateTotals(weekData),
            month: calculateTotals(monthData),
            year: calculateTotals(yearData),
            
            // Summary info
            currentPageTotal: penjualan.length,
            currentPageAnimals: penjualan.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0)
        };
    }, [penjualan, backendTotal, serverPagination.totalItems]);

    // Optimized search handler with debouncing
    const handleSearch = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (!newSearchTerm.trim()) {
            fetchPenjualan(1, null, '', null, null, false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            fetchPenjualan(1, null, newSearchTerm, null, null, true);
        }, SEARCH_DEBOUNCE_DELAY);
    }, []);
    
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        fetchPenjualan(1, null, '', null, null, false);
    }, []);

    // Filter and pagination handlers
    const handleFilter = useCallback((newFilter) => {
        setFilterStatus(newFilter);
        setSearchError(null);
        fetchPenjualan(1, null, null, newFilter, null, false);
    }, []);
    
    const handleDateRangeFilter = useCallback((newDateRange) => {
        setDateRange(newDateRange);
        setSearchError(null);
        fetchPenjualan(1, null, null, null, newDateRange, false);
    }, []);
    
    const clearDateRange = useCallback(() => {
        const emptyDateRange = { startDate: '', endDate: '' };
        setDateRange(emptyDateRange);
        setSearchError(null);
        fetchPenjualan(1, null, null, null, emptyDateRange, false);
    }, []);

    const handlePageChange = useCallback((newPage) => {
        fetchPenjualan(newPage, null, null, null, null, false);
    }, []);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPenjualan(1, newPerPage, null, null, null, false);
    }, []);

    // Update refs when state changes to avoid stale closures
    useEffect(() => {
        currentStateRef.current.searchTerm = searchTerm;
    }, [searchTerm]);

    useEffect(() => {
        currentStateRef.current.filterStatus = filterStatus;
    }, [filterStatus]);

    useEffect(() => {
        currentStateRef.current.dateRange = dateRange;
    }, [dateRange]);

    useEffect(() => {
        currentStateRef.current.serverPagination = serverPagination;
    }, [serverPagination]);

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
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/store`, {
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
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/update`, requestData);
            
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
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/hapus`, {
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
            
            if (!headerData.syarat_pembelian && !headerData.id_syarat_pembelian) {
                throw new Error('Syarat pembelian harus dipilih');
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
                id_syarat_pembelian: parseInt(headerData.syarat_pembelian || headerData.id_syarat_pembelian) || null,
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
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/store`, formData);
            } else {
                if (!requestData.file) {
                    delete requestData.file;
                }
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/store`, requestData);
            }

            if (result.status === 'ok' || result.success === true) {
                // Don't fetch here - let the page handle refresh via navigation state
                
                return {
                    success: true,
                    message: 'Header penjualan berhasil disimpan!',
                    data: result.data
                };
            } else {
                throw new Error(result.message || 'Gagal menyimpan header penjualan');
            }

        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan header';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const saveDetailsOnly = useCallback(async (pid, detailsData) => {
        setLoading(true);
        setError(null);
        
        try {
            if (!pid) {
                throw new Error('ID penjualan tidak valid');
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

            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN_DOKA_SAPI}/update`, requestData);
            
            if (result.status === 'ok' || result.success) {
                // Don't fetch here - let the page handle refresh via navigation state
                
                return {
                    success: true,
                    message: 'Detail penjualan berhasil disimpan!',
                    data: result.data
                };
            } else {
                throw new Error(result.message || 'Gagal menyimpan detail penjualan');
            }

        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan detail';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Return all hook functions and state
    return {
        penjualan,
        allPenjualan: penjualan,
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
        backendTotal,
        fetchPenjualan,
        handleSearch,
        clearSearch,
        handleFilter,
        handleDateRangeFilter,
        clearDateRange,
        handlePageChange,
        handlePerPageChange,
        createPenjualan,
        updatePenjualan,
        deletePenjualan,
        deleteLoading,
        getPenjualanDetail,
        createDetail,
        updateDetail,
        deleteDetail,
        saveHeaderOnly,
        saveDetailsOnly,
        approvePenjualan,
        rejectPenjualan
    };
};

export default usePenjualanSapiHO;
