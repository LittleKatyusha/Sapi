import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// HttpClient already handles JSON parsing and error handling internally

const usePembelianFeedmil = () => {
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterJenisPembelian, setFilterJenisPembelian] = useState('all');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [klasifikasiFeedmil, setKlasifikasiFeedmil] = useState([]);

    // Mapping function to convert tipe_pembelian to jenis_pembelian
    // This will be passed from the main component to avoid duplicate fetching
    const mapTipePembelianToJenis = useCallback((tipePembelian, jenisPembelianOptions = []) => {
        if (!tipePembelian || !jenisPembelianOptions.length) {
            return 'INTERNAL'; // Default fallback based on actual API response
        }
        
        // Convert tipePembelian to string for comparison since API returns string values
        const tipePembelianStr = String(tipePembelian);
        const found = jenisPembelianOptions.find(option => String(option.value) === tipePembelianStr);
        return found ? found.label : 'INTERNAL';
    }, []);

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 10
    });

    // Base API endpoint for feedmil pembelian
    const FEEDMIL_API_BASE = API_ENDPOINTS.HO.FEEDMIL.PEMBELIAN;
    
    // Fetch klasifikasi feedmil data from ParameterSelectController
    const fetchKlasifikasiFeedmil = useCallback(async () => {
        try {
            const data = await HttpClient.get(API_ENDPOINTS.MASTER.PARAMETER + '/data');
            if (data && data.data && data.data.length > 0) {
                // Get klasifikasifeedmil from ParameterSelectController
                const klasifikasifeedmil = data.data[0].klasifikasifeedmil || [];
                // Map the data to consistent format for getKlasifikasiName function
                const mappedData = klasifikasifeedmil.map((item) => ({
                    id: item.id, // Use integer id as unique identifier
                    name: item.name,
                    originalData: item
                }));
                setKlasifikasiFeedmil(mappedData);
            }
        } catch (err) {
            console.error('Error fetching klasifikasi feedmil:', err);
            // Don't set error state for this as it's not critical
        }
    }, []);

    // Get klasifikasi name by ID
    const getKlasifikasiName = useCallback((id) => {
        console.log('getKlasifikasiName called with id:', id, 'type:', typeof id);
        console.log('klasifikasiFeedmil data:', klasifikasiFeedmil);
        
        if (!id || !klasifikasiFeedmil.length) {
            console.log('No id or no klasifikasiFeedmil data');
            return null;
        }
        
        // Convert to integer for comparison since we now use integer IDs
        const numId = parseInt(id);
        
        let klasifikasi = klasifikasiFeedmil.find(k => {
            // Match by integer ID
            return k.id === numId;
        });
        
        console.log('Found klasifikasi:', klasifikasi);
        
        if (klasifikasi) {
            const name = klasifikasi.name || klasifikasi.nama;
            console.log('Returning name:', name);
            return name;
        }
        
        console.log('No klasifikasi found for id:', id);
        return null;
    }, [klasifikasiFeedmil]);

    // Fetch pembelian feedmil data from API
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, filter = null, isSearchRequest = false) => {
        setLoading(true);
        setError(null);
        setSearchError(null);
        
        if (isSearchRequest) {
            setIsSearching(true);
        }
        
        try {
            const currentPage = page || serverPagination.currentPage;
            const currentPerPage = perPage || serverPagination.perPage;
            const currentSearch = search !== null ? search : searchTerm;
            
            // Prepare DataTables format parameters for backend
            const params = new URLSearchParams({
                draw: '1',
                start: ((currentPage - 1) * currentPerPage).toString(),
                length: currentPerPage.toString(),
                'search[value]': currentSearch || '',
                'order[0][column]': '3', // tgl_masuk column
                'order[0][dir]': 'desc'
            });
            
            const jsonData = await HttpClient.get(`${FEEDMIL_API_BASE}/data?${params}`);
            
            if (jsonData && jsonData.data) {
                // Transform backend data to match frontend expectations
                const transformedData = jsonData.data.map(item => ({
                    id: item.pid, // Use encrypted pid as id
                    encryptedPid: item.pid,
                    nota: item.nota,
                    nama_supplier: item.nama_supplier, // Can be null according to backend
                    nama_office: item.nama_office,
                    tgl_masuk: item.tgl_masuk,
                    nama_supir: item.nama_supir,
                    plat_nomor: item.plat_nomor,
                    jumlah: item.jumlah,
                    satuan: 'item', // Default unit
                    berat_total: item.berat_total,
                    biaya_total: item.biaya_total,
                    total_belanja: item.total_belanja, // Add total_belanja field from backend
                    biaya_lain: item.biaya_lain,
                    biaya_truk: item.biaya_truk,
                    jenis_pembelian: item.jenis_pembelian || 'Feedmil', // This is supplier classification like "SUPPLIER (PERUSAHAAN)"
                    tipe_pembelian: item.tipe_pembelian, // This should be external/internal classification
                    tipe_pembelian_id: item.tipe_pembelian_id || item.tipe_pembelian, // ID for external/internal
                    file: item.file,
                    note: item.note,
                    // Add the missing fields for the new columns
                    farm: item.farm,
                    syarat_pembelian: item.syarat_pembelian,
                    nota_ho: item.nota_ho,
                    // Also include the ID fields for potential conversion
                    id_farm: item.id_farm,
                    id_syarat_pembelian: item.id_syarat_pembelian
                }));
                
                // Update pagination state from server response
                setServerPagination({
                    currentPage: currentPage,
                    totalPages: Math.ceil((jsonData.recordsFiltered || 0) / currentPerPage),
                    totalItems: jsonData.recordsFiltered || 0,
                    recordsTotal: jsonData.recordsTotal || 0, // Total records before filtering
                    perPage: currentPerPage
                });
                
                setPembelian(transformedData);
            } else {
                setPembelian([]);
                setServerPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
            }
            
        } catch (err) {
            console.error('Fetch pembelian feedmil error:', err);
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
    }, [searchTerm, filterJenisPembelian]); // Remove serverPagination dependencies to prevent infinite loops

    // Create pembelian feedmil
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Prepare form data for backend
            const formData = new FormData();
            
            // Header data mapping to backend fields - aligned with backend validation rules
            formData.append('id_office', parseInt(pembelianData.idOffice) || 1); // Use selected office ID
            formData.append('nota', pembelianData.nota || '');
            formData.append('id_supplier', pembelianData.idSupplier || pembelianData.id_supplier || '');
            formData.append('tgl_masuk', pembelianData.tgl_masuk || '');
            formData.append('nama_supir', pembelianData.nama_supir || '');
            formData.append('plat_nomor', pembelianData.plat_nomor || '');
            formData.append('jumlah', pembelianData.total_feedmil || pembelianData.totalJumlah || 0);
            formData.append('biaya_truk', pembelianData.biaya_truck || pembelianData.biaya_truk || 0); // Fixed: backend expects 'biaya_truk'
            formData.append('biaya_lain', pembelianData.biaya_lain || 0);
            formData.append('biaya_total', pembelianData.harga_total || pembelianData.totalHPP || 0); // Backend expects 'biaya_total'
            formData.append('berat_total', pembelianData.berat_total || pembelianData.totalBerat || 0);
            // Map values to integers as per backend validation
            // Handle both string values from dropdown and integer values from API
            const mapTipePembelian = (tipe) => {
                // Handle integer values from dropdown/API
                if (tipe === 1 || tipe === '1') return 1; // FEEDMIL - SUPPLIER
                if (tipe === 2 || tipe === '2') return 2; // FEEDMIL - LANGSUNG
                if (tipe === 3 || tipe === '3') return 3; // FEEDMIL - KONTRAK
                return parseInt(tipe) || 1; // Default to SUPPLIER if can't parse
            };
            formData.append('tipe_pembelian', mapTipePembelian(pembelianData.tipePembelian));
            formData.append('note', pembelianData.note || 'Pembelian Feedmil dari Head Office'); // Required field
            formData.append('nota_ho', pembelianData.nota_ho || ''); // Required field
            formData.append('id_farm', pembelianData.id_farm || ''); // Required field
            formData.append('id_syarat_pembelian', pembelianData.id_syarat_pembelian || ''); // Required field
            
            // Add file if exists
            if (pembelianData.file && pembelianData.file instanceof File) {
                formData.append('file', pembelianData.file);
            }
            
            // Add detail items if exists - aligned with backend detail validation rules
            if (pembelianData.detailItems && pembelianData.detailItems.length > 0) {
                pembelianData.detailItems.forEach((item, index) => {
                    // Only append fields that match backend DETAIL_VALIDATION_RULES with proper type conversion
                    formData.append(`details[${index}][item_name]`, item.item_name || '');
                    
                    // Handle id_klasifikasi_feedmil - send integer ID to backend
                    const klasifikasiValue = item.id_klasifikasi_feedmil;
                    if (klasifikasiValue && (typeof klasifikasiValue === 'number' || !isNaN(parseInt(klasifikasiValue)))) {
                        // Send integer ID directly to backend for validation
                        formData.append(`details[${index}][id_klasifikasi_feedmil]`, parseInt(klasifikasiValue));
                    }
                    
                    // Ensure numeric fields are properly formatted according to backend validation
                    formData.append(`details[${index}][harga]`, parseFloat(item.harga) || 0);
                    
                     // Parse persentase with comma support - send as decimal for backend
                     const persentaseValue = (() => {
                         if (!item.persentase) return 0;
                         const cleanValue = item.persentase.toString().replace(',', '.');
                         const parsed = parseFloat(cleanValue);
                         const result = isNaN(parsed) ? 0 : parsed; // Send as decimal (15.5% -> 15.5)
                         return result;
                     })();
                     formData.append(`details[${index}][persentase]`, persentaseValue);
                    
                    formData.append(`details[${index}][berat]`, parseInt(item.berat) || 0);
                    formData.append(`details[${index}][hpp]`, parseFloat(item.hpp) || 0);
                    formData.append(`details[${index}][total_harga]`, parseFloat(item.total_harga || item.hpp) || 0);
                });
            }
            
            
            // Debug: Log detail items data types
            if (pembelianData.detailItems && pembelianData.detailItems.length > 0) {
            }
            
            // Debug: Check if auth token exists
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            // Try with explicit options to handle 302 redirect issue
            const jsonData = await HttpClient.post(`${FEEDMIL_API_BASE}/store`, formData, {
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
                skipCsrf: true, // Skip CSRF token for JWT-based API
                credentials: 'omit', // Don't send cookies that might interfere with JWT
                redirect: 'error' // Throw error on redirect instead of following it
            });
            
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                await fetchPembelian(1, serverPagination.perPage);
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembelian feedmil berhasil dibuat!',
                    data: jsonData.data
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal menyimpan data';
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            console.error('Create pembelian feedmil error:', err);
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            
            // Check if it's an authentication error (401 or redirect to login)
            if (err.message.includes('401') || err.message.includes('login') || err.message.includes('302')) {
                const authError = 'Sesi Anda telah berakhir atau ada masalah authentikasi. Silakan login kembali.';
                setError(authError);
                return { success: false, message: authError, needsLogin: true };
            }
            
            // Check if it's a 405 Method Not Allowed (might be CSRF issue)
            if (err.message.includes('405')) {
                const methodError = 'Method tidak diizinkan. Kemungkinan masalah CSRF token atau routing.';
                setError(methodError);
                return { success: false, message: methodError };
            }
            
            // For development: provide more detailed error info
            const errorMsg = `${err.message || 'Terjadi kesalahan saat menyimpan data'}\n\nDetail: ${JSON.stringify({
                endpoint: `${FEEDMIL_API_BASE}/store`,
                hasFormData: true,
                errorType: err.name || 'Unknown'
            }, null, 2)}`;
            
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
            // Prepare form data for backend
            const formData = new FormData();
            
            formData.append('pid', data.id || data.encryptedPid);
            
            // Header data mapping to backend fields - aligned with backend validation rules
            formData.append('id_office', parseInt(data.idOffice) || 1); // Use selected office ID, fallback to Head Office
            formData.append('nota', data.nota || '');
            formData.append('id_supplier', data.idSupplier || data.id_supplier || '');
            formData.append('tgl_masuk', data.tgl_masuk || '');
            formData.append('nama_supir', data.nama_supir || '');
            formData.append('plat_nomor', data.plat_nomor || '');
            formData.append('jumlah', data.total_feedmil || data.totalJumlah || 0);
            formData.append('biaya_truk', data.biaya_truck || data.biaya_truk || 0); // Fixed: backend expects 'biaya_truk'
            formData.append('biaya_lain', data.biaya_lain || 0);
            formData.append('biaya_total', data.harga_total || data.totalHPP || 0); // Backend expects 'biaya_total'
            formData.append('berat_total', data.berat_total || data.totalBerat || 0);
            // Map values to integers as per backend validation
            // Handle both string values from dropdown and integer values from API
            const mapTipePembelian = (tipe) => {
                // Handle integer values from dropdown/API
                if (tipe === 1 || tipe === '1') return 1; // FEEDMIL - SUPPLIER
                if (tipe === 2 || tipe === '2') return 2; // FEEDMIL - LANGSUNG
                if (tipe === 3 || tipe === '3') return 3; // FEEDMIL - KONTRAK
                return parseInt(tipe) || 1; // Default to SUPPLIER if can't parse
            };
            formData.append('tipe_pembelian', mapTipePembelian(data.tipePembelian));
            formData.append('note', data.note || 'Pembelian Feedmil dari Head Office'); // Required field
            formData.append('nota_ho', data.nota_ho || ''); // Required field
            formData.append('id_farm', data.id_farm || ''); // Required field
            formData.append('id_syarat_pembelian', data.id_syarat_pembelian || ''); // Required field
            
            // Add file if exists
            if (data.file && data.file instanceof File) {
                formData.append('file', data.file);
            }
            
            const jsonData = await HttpClient.post(`${FEEDMIL_API_BASE}/update`, formData, {
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                await fetchPembelian();
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembelian feedmil berhasil diperbarui!'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal memperbarui data';
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('Error updating pembelian feedmil:', error);
            const errorMsg = error.message || 'Failed to update pembelian feedmil';
            setError(errorMsg);
            return { success: false, message: errorMsg };
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
            
            const jsonData = await HttpClient.post(`${FEEDMIL_API_BASE}/hapus`, {
                pid: encryptedPid
            }, {
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
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
                
                // Refresh data
                setTimeout(async () => {
                    try {
                        await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                    } catch (refreshError) {
                        console.warn('Refresh after delete failed:', refreshError);
                    }
                }, 500);
                
                return {
                    success: true,
                    message: jsonData.message || 'Data berhasil dihapus'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal menghapus data';
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            console.error('Delete pembelian feedmil error:', err);
            let errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage]);

    // Get pembelian detail
    const getPembelianDetail = useCallback(async (encryptedPid, jenisPembelianOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            const jsonData = await HttpClient.post(`${FEEDMIL_API_BASE}/show`, {
                pid: encryptedPid
            }, {
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Map tipe_pembelian to jenis_pembelian in header data
                let headerData = jsonData.header;
                if (headerData && headerData.tipe_pembelian) {
                    headerData = {
                        ...headerData,
                        jenis_pembelian: mapTipePembelianToJenis(headerData.tipe_pembelian, jenisPembelianOptions)
                    };
                }

                return {
                    success: true,
                    data: jsonData.data || [],
                    header: headerData || null, // Include header data from /show endpoint with mapped jenis_pembelian
                    message: jsonData.message || 'Detail pembelian berhasil diambil'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Detail tidak ditemukan';
                console.warn('Backend returned error:', errorMessage);
                return { success: false, data: [], message: errorMessage };
            }
            
        } catch (err) {
            console.error('Get pembelian detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail pembelian';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [mapTipePembelianToJenis]);

    // Update individual detail item (feedmil specific)
    const updateDetail = useCallback(async (encryptedPid, detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend now uses post method and expects specific detail fields
            // Backend validator always requires id_pembelian for detail operations
            const idPembelian = detailData.idPembelian || detailData.id_pembelian;
            
            if (!idPembelian) {
                throw new Error('ID pembelian tidak ditemukan. Field idPembelian atau id_pembelian harus ada.');
            }
            
            const requestData = {
                pid: encryptedPid, // Backend expects encrypted PID (null for new items)
                id_pembelian: idPembelian, // Always required by backend validator
                item_name: String(detailData.item_name || ''),
                id_klasifikasi_feedmil: (() => {
                    const value = detailData.id_klasifikasi_feedmil;
                    // Send integer ID to backend for validation
                    if (value === null || value === undefined || value === '') return null;
                    return parseInt(value); // Convert to integer for backend validation
                })(),
                harga: parseFloat(detailData.harga || 0),
                 persentase: (() => {
                     if (!detailData.persentase) return 0;
                     const cleanValue = detailData.persentase.toString().replace(',', '.');
                     const parsed = parseFloat(cleanValue);
                     const result = isNaN(parsed) ? 0 : parsed; // Send as decimal (15.5% -> 15.5)
                     return result;
                 })(),
                berat: parseInt(detailData.berat || 0),
                hpp: parseFloat(detailData.hpp || 0),
                total_harga: parseFloat(detailData.total_harga || detailData.hpp || 0)
            };
            
            // Add id_office for new detail creation (when pid is null)
            if (!encryptedPid) {
                requestData.id_office = parseInt(detailData.idOffice || 1);
            }
            

            
            const result = await HttpClient.post(`${FEEDMIL_API_BASE}/update`, requestData);
            
            if (result && result.status === 'ok') {
                return {
                    success: true,
                    message: result.message || 'Detail feedmil berhasil diperbarui',
                    data: result.data
                };
            } else {
                throw new Error(result?.message || 'Gagal memperbarui detail feedmil');
            }
            
        } catch (err) {
            console.error('Update detail feedmil error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui detail feedmil';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete individual detail item (feedmil specific)
    const deleteDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend delete method menggunakan POST method
            const result = await HttpClient.post(`${FEEDMIL_API_BASE}/hapus`, {
                pid: encryptedPid
            });
            
            
            if (result && result.status === 'ok') {
                return {
                    success: true,
                    message: result.message || 'Detail feedmil berhasil dihapus'
                };
            } else {
                throw new Error(result?.message || 'Gagal menghapus detail feedmil');
            }
            
        } catch (err) {
            console.error('Delete detail feedmil error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus detail feedmil';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Computed stats based on current data
    const stats = useMemo(() => {
        const total = pembelian.length;
        const totalFeedmil = pembelian.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
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
            total: serverPagination.recordsTotal || serverPagination.totalItems || total, // Use recordsTotal from API response
            totalFeedmil: totalFeedmil,
            today: todayPurchases,
            thisMonth: thisMonthPurchases
        };
    }, [pembelian, serverPagination.totalItems, serverPagination.recordsTotal]);

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
    
    // Fetch klasifikasi feedmil data on mount
    useEffect(() => {
        fetchKlasifikasiFeedmil();
    }, [fetchKlasifikasiFeedmil]);

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
        getPembelianDetail,
        updateDetail,
        deleteDetail,
        klasifikasiFeedmil,
        fetchKlasifikasiFeedmil,
        getKlasifikasiName
    };
};

export default usePembelianFeedmil;
