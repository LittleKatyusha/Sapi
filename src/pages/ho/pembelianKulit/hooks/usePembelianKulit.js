import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// HttpClient already handles JSON parsing and error handling internally

const usePembelianKulit = () => {
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

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

    // Base API endpoint for kulit pembelian
    const KULIT_API_BASE = API_ENDPOINTS.HO.KULIT.PEMBELIAN;

    // Fetch pembelian kulit data from API
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, isSearchRequest = false, forceRefresh = false) => {
        console.log('🔄 Kulit Hook: fetchPembelian called with params:', { page, perPage, search, isSearchRequest, forceRefresh });
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
            
            // Add cache-busting parameter when forceRefresh is true
            const finalParams = forceRefresh ? `${params}&_t=${Date.now()}` : params;
            const apiUrl = `${KULIT_API_BASE}/data?${finalParams}`;
            console.log('🔄 Kulit Hook: Making API call to:', apiUrl);
            const jsonData = await HttpClient.get(apiUrl);
            
            if (jsonData && jsonData.data) {
                // Debug: Log raw API response to check nota_sistem field
                console.log('🔍 Kulit API Response Sample:', jsonData.data[0]);
                console.log('🔍 Kulit nota_sistem field:', jsonData.data[0]?.nota_sistem);
                
                // Transform backend data to match frontend expectations
                const transformedData = jsonData.data.map(item => ({
                    id: item.pid, // Use encrypted pid as id
                    encryptedPid: item.pid,
                    nota: item.nota,
                    nota_sistem: item.nota_sistem,
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
            console.error('Fetch pembelian kulit error:', err);
            const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data pembelian kulit';
            
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
    }, [searchTerm]); // Remove serverPagination dependencies to prevent infinite loops

    // Create pembelian kulit
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Prepare form data for backend
            const formData = new FormData();
            
            // Header data mapping to backend fields - aligned with backend validation rules
            formData.append('id_office', parseInt(pembelianData.idOffice) || 1); // Use selected office ID
            formData.append('id_supplier', pembelianData.idSupplier || pembelianData.id_supplier || '');
            formData.append('tgl_masuk', pembelianData.tgl_masuk || '');
            formData.append('jumlah', pembelianData.total_kulit || pembelianData.totalJumlah || 0);
            formData.append('biaya_total', pembelianData.harga_total || pembelianData.totalHPP || 0); // Backend expects 'biaya_total'
            formData.append('berat_total', pembelianData.berat_total || pembelianData.totalBerat || 0);
            formData.append('biaya_truk', pembelianData.biaya_truk || 0); // Send 0 as default if not provided
            formData.append('note', pembelianData.note || 'Pembelian Kulit dari Head Office'); // Required field
            formData.append('nota', pembelianData.nota_ho || ''); // Map nota_ho to nota for backend
            formData.append('nota_ho', pembelianData.nota_ho || ''); // Required field
            formData.append('id_farm', pembelianData.id_farm || ''); // Required field
            formData.append('id_syarat_pembelian', pembelianData.id_syarat_pembelian || ''); // Required field
            
            // Add the missing required fields
            formData.append('tipe_pembelian', pembelianData.tipe_pembelian || ''); // Required field
            formData.append('tipe_pembayaran', pembelianData.tipe_pembayaran || ''); // Required field
            formData.append('due_date', pembelianData.due_date || ''); // Required field
            
            // Add file if exists
            if (pembelianData.file && pembelianData.file instanceof File) {
                formData.append('file', pembelianData.file);
            }
            
            // Add detail items if exists - aligned with backend detail validation rules
            if (pembelianData.detailItems && pembelianData.detailItems.length > 0) {
                pembelianData.detailItems.forEach((item, index) => {
                    // Only append fields that match backend DETAIL_VALIDATION_RULES with proper type conversion
                    formData.append(`details[${index}][id_office]`, parseInt(pembelianData.idOffice) || 1); // Add id_office for detail
                    formData.append(`details[${index}][id_item]`, parseInt(item.item_name_id) || 0); // Send item_name_id as id_item
                    
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
            const jsonData = await HttpClient.post(`${KULIT_API_BASE}/store`, formData, {
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
                skipCsrf: true, // Skip CSRF token for JWT-based API
                credentials: 'omit', // Don't send cookies that might interfere with JWT
                redirect: 'error' // Throw error on redirect instead of following it
            });
            
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Force refresh to get the latest data
                try {
                    await fetchPembelian(1, serverPagination.perPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after create failed:', refreshError);
                    // If refresh fails, try to refresh without search term
                    try {
                        await fetchPembelian(1, serverPagination.perPage, '', false, true);
                    } catch (fallbackError) {
                        console.error('Fallback refresh also failed:', fallbackError);
                    }
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembelian kulit berhasil dibuat!',
                    data: jsonData.data
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal menyimpan data';
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            console.error('Create pembelian kulit error:', err);
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
                endpoint: `${KULIT_API_BASE}/store`,
                hasFormData: true,
                errorType: err.name || 'Unknown'
            }, null, 2)}`;
            
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.perPage, searchTerm]);

    // Update pembelian kulit
    const updatePembelian = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            // Prepare form data for backend
            const formData = new FormData();
            
            formData.append('pid', data.id || data.encryptedPid);
            
            // Header data mapping to backend fields - aligned with backend validation rules
            formData.append('id_office', parseInt(data.idOffice) || 1); // Use selected office ID, fallback to Head Office
            formData.append('nota', data.nota || data.nota_ho || ''); // Required for header update detection
            formData.append('id_supplier', data.idSupplier || data.id_supplier || '');
            formData.append('tgl_masuk', data.tgl_masuk || '');
            formData.append('jumlah', data.total_kulit || data.totalJumlah || 0);
            formData.append('biaya_total', data.harga_total || data.totalHPP || 0); // Backend expects 'biaya_total'
            formData.append('berat_total', data.berat_total || data.totalBerat || 0);
            formData.append('note', data.note || 'Pembelian Feedmil dari Head Office'); // Required field
            formData.append('nota_ho', data.nota_ho || ''); // Required field
            formData.append('id_farm', data.id_farm || ''); // Required field
            formData.append('id_syarat_pembelian', data.id_syarat_pembelian || ''); // Required field
            
            // Add the missing required fields
            formData.append('tipe_pembelian', data.tipe_pembelian || ''); // Required field
            formData.append('tipe_pembayaran', data.tipe_pembayaran || ''); // Required field
            formData.append('due_date', data.due_date || ''); // Required field
            
            // Add file if exists
            if (data.file && data.file instanceof File) {
                formData.append('file', data.file);
            }
            
            const jsonData = await HttpClient.post(`${KULIT_API_BASE}/update`, formData, {
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Force refresh to get the latest data
                try {
                    await fetchPembelian(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after update failed:', refreshError);
                    // If refresh fails, try to refresh the first page
                    try {
                        await fetchPembelian(1, serverPagination.perPage, searchTerm, false, true);
                    } catch (fallbackError) {
                        console.error('Fallback refresh also failed:', fallbackError);
                    }
                }
                
                return {
                    success: true,
                    message: jsonData.message || 'Pembelian kulit berhasil diperbarui!'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Gagal memperbarui data';
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('Error updating pembelian kulit:', error);
            const errorMsg = error.message || 'Failed to update pembelian kulit';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    // Delete pembelian kulit
    const deletePembelian = useCallback(async (encryptedPid, pembelianData = null) => {
        setLoading(true);
        setError(null);
        
        try {
            setDeleteLoading(encryptedPid);
            
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak valid atau tidak ditemukan');
            }
            
            const jsonData = await HttpClient.post(`${KULIT_API_BASE}/hapus`, {
                pid: encryptedPid
            }, {
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Calculate the current page after deletion
                const currentPage = serverPagination.currentPage;
                const currentPerPage = serverPagination.perPage;
                const totalItemsAfterDelete = Math.max(0, serverPagination.totalItems - 1);
                const totalPagesAfterDelete = Math.ceil(totalItemsAfterDelete / currentPerPage);
                
                // If current page is empty after deletion, go to previous page
                let targetPage = currentPage;
                if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
                    targetPage = totalPagesAfterDelete;
                }
                
                // Update pagination state
                setServerPagination(prev => ({
                    ...prev,
                    totalItems: totalItemsAfterDelete,
                    totalPages: totalPagesAfterDelete,
                    currentPage: targetPage
                }));
                
                // Refresh data with the correct page
                try {
                    await fetchPembelian(targetPage, currentPerPage, searchTerm, false, true);
                } catch (refreshError) {
                    console.warn('Refresh after delete failed:', refreshError);
                    // If refresh fails, try to refresh the first page
                    try {
                        await fetchPembelian(1, currentPerPage, searchTerm, false, true);
                    } catch (fallbackError) {
                        console.error('Fallback refresh also failed:', fallbackError);
                    }
                }
                
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
            console.error('Delete pembelian kulit error:', err);
            let errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setDeleteLoading(null);
            setLoading(false);
        }
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    // Get pembelian detail
    const getPembelianDetail = useCallback(async (encryptedPid, jenisPembelianOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            const jsonData = await HttpClient.post(`${KULIT_API_BASE}/show`, {
                pid: encryptedPid
            }, {
                skipCsrf: true // Skip CSRF token for JWT-based API
            });
            
            // Backend uses sendResponse() which returns { status: 'ok', data: [...], message: '...' }
            if (jsonData && jsonData.status === 'ok') {
                // Validasi dan proses data yang diterima
                let headerData = jsonData.header || null;
                let detailData = Array.isArray(jsonData.data) ? jsonData.data : [];
                
                // Jika tidak ada header tapi ada detail, gunakan data dari detail pertama
                if (!headerData && detailData.length > 0) {
                    const firstItem = detailData[0];
                    headerData = {
                        encryptedPid: firstItem.pid || encryptedPid,
                        nota: firstItem.nota || '',
                        nota_ho: firstItem.nota_ho || '',
                        nama_supplier: firstItem.nama_supplier || '',
                        nama_office: firstItem.nama_office || 'Head Office (HO)',
                        tgl_masuk: firstItem.tgl_masuk || '',
                        nama_supir: firstItem.nama_supir || '',
                        plat_nomor: firstItem.plat_nomor || '',
                        biaya_lain: parseFloat(firstItem.biaya_lain) || 0,
                        biaya_truk: parseFloat(firstItem.biaya_truk) || 0,
                        biaya_total: parseFloat(firstItem.biaya_total) || 0,
                        jumlah: parseInt(firstItem.jumlah) || 0,
                        berat_total: parseFloat(firstItem.berat_total) || 0,
                        file: firstItem.file || null,
                        // Extract farm and syarat pembelian IDs from detail data
                        id_farm: firstItem.id_farm,
                        id_syarat_pembelian: firstItem.id_syarat_pembelian
                    };
                }
                
                // Ensure header data has id_farm and id_syarat_pembelian from detail data if not present
                if (headerData && detailData.length > 0) {
                    const firstItem = detailData[0];
                    if (!headerData.id_farm && firstItem.id_farm) {
                        headerData.id_farm = firstItem.id_farm;
                    }
                    if (!headerData.id_syarat_pembelian && firstItem.id_syarat_pembelian) {
                        headerData.id_syarat_pembelian = firstItem.id_syarat_pembelian;
                    }
                }
                
                // Map tipe_pembelian to jenis_pembelian in header data
                if (headerData && headerData.tipe_pembelian) {
                    headerData = {
                        ...headerData,
                        jenis_pembelian: mapTipePembelianToJenis(headerData.tipe_pembelian, jenisPembelianOptions)
                    };
                }
                
                return {
                    success: true,
                    data: detailData,
                    header: headerData,
                    message: jsonData.message || 'Detail pembelian berhasil diambil'
                };
            } else {
                // Backend returned error response with { status: 'no', message: '...' }
                const errorMessage = jsonData?.message || 'Detail tidak ditemukan';
                console.warn('Backend returned error:', errorMessage);
                return { success: false, data: [], header: null, message: errorMessage };
            }
            
        } catch (err) {
            console.error('Get pembelian detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail pembelian';
            setError(errorMsg);
            return { success: false, data: [], header: null, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [mapTipePembelianToJenis]);

    // Update individual detail item (kulit specific)
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
            

            
            const result = await HttpClient.post(`${KULIT_API_BASE}/update`, requestData);
            
            if (result && result.status === 'ok') {
                return {
                    success: true,
                    message: result.message || 'Detail kulit berhasil diperbarui',
                    data: result.data
                };
            } else {
                throw new Error(result?.message || 'Gagal memperbarui detail kulit');
            }
            
        } catch (err) {
            console.error('Update detail kulit error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui detail kulit';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete individual detail item (kulit specific)
    const deleteDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend delete method menggunakan POST method
            const result = await HttpClient.post(`${KULIT_API_BASE}/hapus`, {
                pid: encryptedPid
            });
            
            
            if (result && result.status === 'ok') {
                return {
                    success: true,
                    message: result.message || 'Detail kulit berhasil dihapus'
                };
            } else {
                throw new Error(result?.message || 'Gagal menghapus detail kulit');
            }
            
        } catch (err) {
            console.error('Delete detail kulit error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus detail kulit';
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
            totalKulit: totalFeedmil, // Renamed to match kulit context
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
            fetchPembelian(1, serverPagination.perPage, '', false);
            return;
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            fetchPembelian(1, serverPagination.perPage, newSearchTerm, true);
        }, 300);
    }, [fetchPembelian, serverPagination.perPage]);
    
    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        fetchPembelian(1, serverPagination.perPage, '', false);
    }, [fetchPembelian, serverPagination.perPage]);
    

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);


    // Pagination handlers
    const handlePageChange = useCallback((newPage) => {
        fetchPembelian(newPage, serverPagination.perPage, searchTerm, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, searchTerm, false);
    }, [fetchPembelian, searchTerm]);

    return {
        pembelian,
        allPembelian: pembelian,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPembelian,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createPembelian,
        updatePembelian,
        deletePembelian,
        deleteLoading,
        getPembelianDetail,
        updateDetail,
        deleteDetail
    };
};

export default usePembelianKulit;
