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
        perPage: 10
    });

    // Fetch pembelian data from API with DataTables server-side pagination format
    const fetchPembelian = useCallback(async (page = 1, perPage = null, search = null, filter = null, dateRangeFilter = null, isSearchRequest = false) => {
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
            
            // DataTables pagination parameters for server-side processing
            const start = (currentPage - 1) * currentPerPage;
            const params = {
                'start': start.toString(),
                'length': currentPerPage.toString(),
                'draw': currentPage.toString(), // Use page number for consistent tracking
                'search[value]': currentSearch || '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            };
            
            // Add filter parameter if needed (can be extended for date filters)
            if (currentFilter && currentFilter !== 'all') {
                params.filter = currentFilter;
            }
            
            // Add date range filter parameters
            if (currentDateRange.startDate) {
                params.start_date = currentDateRange.startDate;
                console.log('🗓️ Adding start_date filter:', currentDateRange.startDate);
            }
            if (currentDateRange.endDate) {
                params.end_date = currentDateRange.endDate;
                console.log('🗓️ Adding end_date filter:', currentDateRange.endDate);
            }
            
            // Log all parameters being sent to backend
            console.log('📤 API Parameters:', params);
            

            
            // Force clear any potential caching
            const timestamp = Date.now();
            const paramsWithCache = {
                ...params,
                '_': timestamp // Cache buster
            };
            
            const result = await HttpClient.get(`${API_ENDPOINTS.HO.PEMBELIAN}/data`, {
                params: paramsWithCache
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
            const newPaginationState = {
                currentPage: currentPage,
                totalPages: Math.ceil(filteredRecords / currentPerPage),
                totalItems: totalRecords,
                filteredItems: filteredRecords,
                perPage: currentPerPage
            };
            

            
            setServerPagination(newPaginationState);
            
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
                        biaya_total: parseFloat(item.biaya_total) || 0, // Field yang missing!
                        berat_total: parseFloat(item.berat_total) || 0, // Field baru dari backend
                        jenis_pembelian: item.jenis_pembelian || '', // Field baru dari backend (now label)
                        jenis_pembelian_id: item.jenis_pembelian_id || null, // ID untuk forms
                        file: item.file || null, // File path dari backend
                        note: item.note || null, // Note field dari backend
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
            
            console.error('❌ Error in fetchPembelian:', {
                error: err,
                message: errorMessage,
                isSearchRequest: isSearchRequest,
                params: { page, perPage, search, filter }
            });
            
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
    }, [searchTerm, filterStatus, dateRange, serverPagination.currentPage, serverPagination.perPage]);

    // Create pembelian - handle header + details array format
    const createPembelian = useCallback(async (pembelianData, supplierOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend expects integer IDs for office and supplier
            const officeIdParsed = parseInt(pembelianData.idOffice);
            
            // Since frontend now uses raw database ID as value, we can use it directly
            const supplierIdValue = parseInt(pembelianData.idSupplier);
            
            if (!Number.isInteger(supplierIdValue) || supplierIdValue <= 0) {
                throw new Error('Supplier ID tidak valid. Pastikan supplier sudah dipilih dengan benar.');
            }
            
            const headerData = {
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: pembelianData.nota,
                id_supplier: supplierIdValue, // Use the resolved numeric ID
                tgl_masuk: pembelianData.tglMasuk, // Use original date format
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah) || 0,
                biaya_truk: parseFloat(pembelianData.biayaTruck) || 0,
                biaya_lain: parseFloat(pembelianData.biayaLain) || 0,
                biaya_total: parseFloat(pembelianData.biayaTotal) || 0,
                berat_total: parseFloat(pembelianData.beratTotal) || 0, // Add missing berat_total mapping
                tipe_pembelian: parseInt(pembelianData.tipePembelian) || 1,
                file: pembelianData.file || null
            };

            // Validate required fields before sending - handle both numeric and encrypted supplier IDs
            if (!headerData.id_supplier || 
                (typeof headerData.id_supplier === 'string' && headerData.id_supplier.trim() === '') ||
                (typeof headerData.id_supplier === 'number' && (isNaN(headerData.id_supplier) || headerData.id_supplier <= 0))) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }
            
            if (!headerData.biaya_truk || headerData.biaya_truk <= 0 || isNaN(headerData.biaya_truk)) {
                throw new Error(`Biaya truck harus diisi dengan nilai numerik > 0. Nilai saat ini: ${headerData.biaya_truk}`);
            }

            // File upload is now optional - no validation needed

            // Backend expects header + details array format
            let requestData;
            
            // If there's a file, use FormData for proper file upload
            if (headerData.file && headerData.file instanceof File) {
                requestData = new FormData();
                
                // Add all header fields to FormData
                Object.keys(headerData).forEach(key => {
                    if (key === 'file') {
                        requestData.append('file', headerData.file);
                    } else {
                        requestData.append(key, headerData[key]);
                    }
                });
                
                // Add details as JSON string
                requestData.append('details', JSON.stringify(pembelianData.details || []));
                
            } else {
                // No file upload, use regular JSON format
                requestData = {
                    ...headerData,
                    details: pembelianData.details || []
                };
                
                // Remove file field if null to avoid validation issues
                if (!requestData.file) {
                    delete requestData.file;
                }
            };
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, requestData);
            await fetchPembelian(1, serverPagination.perPage); // Refresh data
            
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

    // Update pembelian (header or detail based on data type)
    const updatePembelian = useCallback(async (data, isHeaderUpdate = true, supplierOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            // Determine if this is a header or detail update based on the data structure
            const hasHeaderFields = data.id_office || data.nota || data.id_supplier;
            const isHeader = isHeaderUpdate || hasHeaderFields;
            
            // If it's a header update, ensure all required fields are present
            let requestData;
            if (isHeader) {
                // Handle supplier ID conversion for header updates
                let supplierIdValue = data.idSupplier || data.id_supplier;
                if (supplierIdValue && supplierOptions.length > 0) {
                    const selectedSupplier = supplierOptions.find(supplier => supplier.value === supplierIdValue);
                    if (selectedSupplier && selectedSupplier.rawId) {
                        supplierIdValue = parseInt(selectedSupplier.rawId);
                    }
                }
                
                // Create clean request data with only backend field names (no duplicates)
                // Ensure all numeric fields are properly converted and not arrays
                const biayaTrukValue = data.biayaTruck || data.biaya_truk;
                const biayaLainValue = data.biayaLain || data.biaya_lain;
                const biayaTotalValue = data.biayaTotal || data.biaya_total;
                const beratTotalValue = data.beratTotal || data.berat_total;
                
                requestData = {
                    pid: data.pid || data.encryptedPid, // Use encrypted PID
                    id_office: parseInt(data.idOffice || data.id_office) || 1,
                    nota: String(data.nota || ''),
                    id_supplier: parseInt(supplierIdValue) || 0, // Use the resolved supplier ID
                    tgl_masuk: String(data.tglMasuk || data.tgl_masuk || ''),
                    nama_supir: String(data.namaSupir || data.nama_supir || ''),
                    plat_nomor: String(data.platNomor || data.plat_nomor || ''),
                    jumlah: parseInt(data.jumlah) || 0,
                    biaya_truk: parseFloat(Array.isArray(biayaTrukValue) ? biayaTrukValue[0] : biayaTrukValue) || 0,
                    biaya_lain: parseFloat(Array.isArray(biayaLainValue) ? biayaLainValue[0] : biayaLainValue) || 0,
                    biaya_total: parseFloat(Array.isArray(biayaTotalValue) ? biayaTotalValue[0] : biayaTotalValue) || 0,
                    berat_total: parseFloat(Array.isArray(beratTotalValue) ? beratTotalValue[0] : beratTotalValue) || 0, // Add missing berat_total mapping
                    tipe_pembelian: parseInt(data.tipePembelian || data.tipe_pembelian) || 1
                };
                
                // Add file if it exists
                if (data.file) {
                    requestData.file = data.file;
                }
                
                // Validate required fields for header update
                if (!requestData.id_supplier || requestData.id_supplier <= 0) {
                    throw new Error('Supplier harus dipilih');
                }
                if (!requestData.nota || requestData.nota.trim() === '') {
                    throw new Error('Nota harus diisi');
                }
                if (!requestData.tgl_masuk || requestData.tgl_masuk.trim() === '') {
                    throw new Error('Tanggal masuk harus diisi');
                }
                if (!requestData.nama_supir || requestData.nama_supir.trim() === '') {
                    throw new Error('Nama supir harus diisi');
                }
                if (!requestData.plat_nomor || requestData.plat_nomor.trim() === '') {
                    throw new Error('Plat nomor harus diisi');
                }
                if (requestData.biaya_truk <= 0) {
                    throw new Error('Biaya truk harus lebih dari 0');
                }
                if (requestData.biaya_lain < 0) {
                    throw new Error('Biaya lain tidak boleh negatif');
                }
            } else {
                // Detail update - create clean request data with only backend field names
                requestData = {
                    pid: data.pid || data.encryptedPid, // Use encrypted PID
                    id_pembelian: data.idPembelian || data.id_pembelian,
                    id_office: data.idOffice || data.id_office,
                    eartag: data.eartag,
                    eartag_supplier: data.eartagSupplier || data.eartag_supplier || '', // Add eartag_supplier
                    id_klasifikasi_hewan: data.idKlasifikasiHewan || data.id_klasifikasi_hewan,
                    harga: data.harga,
                    persentase: data.persentase,
                    berat: data.berat,
                    hpp: data.hpp,
                    total_harga: data.totalHarga || data.total_harga
                };
            }
            
            // Debug logging to help identify data issues
            console.log('📤 Sending update request:', {
                isHeader: isHeader,
                requestData: requestData,
                originalData: data
            });
            
            // Handle file upload for update - use FormData if file exists
            let result;
            if (isHeader && requestData.file && requestData.file instanceof File) {
                const formData = new FormData();
                
                // Add all request data to FormData
                Object.keys(requestData).forEach(key => {
                    if (key === 'file') {
                        formData.append('file', requestData.file);
                    } else {
                        formData.append(key, requestData[key]);
                    }
                });
                
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, formData);
            } else {
                // No file upload or not a header update, use regular JSON
                if (requestData.file && typeof requestData.file === 'string') {
                    // If file is a string (path from backend), remove it to avoid validation error
                    delete requestData.file;
                }
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/update`, requestData);
            }
            
            console.log('📥 Update response received:', result);
            
            if (result.status === 'ok' || result.success) {
                console.log('✅ Update successful, refreshing data...');
                
                // Refresh data after successful update - use current pagination state
                try {
                    await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                    console.log('✅ Data refresh successful');
                } catch (refreshError) {
                    // Log the refresh error but don't throw it - update was successful
                    console.warn('⚠️ Refresh after update failed:', refreshError);
                    console.warn('⚠️ But update was successful, continuing...');
                }
                
                console.log('📤 Returning successful result:', result);
                
                // Return consistent format for the calling component
                return {
                    status: 'ok',
                    success: true,
                    message: result.message || 'Data updated successfully',
                    data: result.data || result // Handle both response formats
                };
            } else {
                console.error('❌ Update failed - invalid response:', result);
                throw new Error(result.message || 'Update failed');
            }
            
        } catch (error) {
            console.error('Error updating pembelian:', error);
            setError(error.message || 'Failed to update pembelian');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchPembelian]);

    // New function: Save header only (without details)
    const saveHeaderOnly = useCallback(async (headerData, supplierOptions = []) => {
        setLoading(true);
        setError(null);
        
        try {
            // Validate header data
            if (!headerData.nota || !headerData.id_supplier || !headerData.tgl_masuk) {
                throw new Error('Data header tidak lengkap');
            }

            // Prepare header data without details
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
                berat_total: parseFloat(headerData.berat_total) || 0, // Add missing berat_total mapping
                tipe_pembelian: parseInt(headerData.tipe_pembelian) || 1,
                file: headerData.file || null,
            };

            // Handle file upload if present
            let result;
            if (requestData.file && requestData.file instanceof File) {
                const formData = new FormData();
                Object.keys(requestData).forEach(key => {
                    if (key === 'file') {
                        formData.append('file', requestData.file);
                    } else if (key === 'details') {
                        formData.append('details', JSON.stringify(requestData[key]));
                    } else {
                        formData.append(key, requestData[key]);
                    }
                });
                result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, formData);
            } else {
                // Remove file field if null
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

    // New function: Save details only (requires existing header)
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

            // Validate each detail item - check for null/undefined specifically, not falsy values
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

            // Prepare request data for details update
            const requestData = {
                pid: pid,
                details: detailsData.map(item => ({
                    id_office: parseInt(item.id_office) || 1,
                    eartag: String(item.eartag),
                    eartag_supplier: String(item.eartag_supplier || item.eartagSupplier || ''), // Add eartag_supplier
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
                // Refresh data after successful update - use current pagination state
                try {
                    await fetchPembelian(serverPagination.currentPage, serverPagination.perPage);
                } catch (refreshError) {
                    // Log the refresh error but don't throw it - update was successful
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
            
            // Backend expects POST method with pid parameter
            const requestPayload = { pid: encryptedPid };
            
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/hapus`, requestPayload);
            
            if (result.status === 'ok' || result.success === true) {
                // Track deleted PID for debugging
                window.lastDeletedPid = encryptedPid;
                
                // Optimistic UI update: Remove item dari state sebelum refresh
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
            // Backend expects specific detail fields for creation
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PEMBELIAN}/store`, {
                id_pembelian: detailData.idPembelian, // Keep encrypted, backend will decrypt
                id_office: parseInt(detailData.idOffice),
                eartag: String(detailData.eartag),
                eartag_supplier: String(detailData.eartagSupplier || ''), // Add eartag_supplier
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

    // Update detail ternak - backend expects encrypted PID
    const updateDetail = useCallback(async (encryptedPid, detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend now uses post method and expects specific detail fields
            // Backend validator always requires id_pembelian for detail operations
            const requestData = {
                pid: encryptedPid, // Backend expects encrypted PID (null for new items)
                id_pembelian: detailData.idPembelian, // Always required by backend validator
                eartag: String(detailData.eartag),
                eartag_supplier: String(detailData.eartagSupplier || ''), // Add eartag_supplier
                id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                harga: parseFloat(detailData.harga),
                persentase: detailData.persentase || 0,
                berat: parseInt(detailData.berat),
                hpp: parseFloat(detailData.hpp),
                total_harga: parseFloat(detailData.totalHarga)
            };
            
            // Add id_office for new detail creation (when pid is null)
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

    // Delete detail ternak - sesuaikan dengan backend yang menggunakan POST method
    const deleteDetail = useCallback(async (encryptedPid) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend delete method menggunakan POST method
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
        
        // This year's purchases
        const thisYearPurchases = pembelian.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getFullYear() === thisYear;
        }).length;
        
        return {
            total: total,
            totalTernak: totalTernak,
            today: todayPurchases,
            thisMonth: thisMonthPurchases,
            thisYear: thisYearPurchases
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
            fetchPembelian(1, serverPagination.perPage, '', filterStatus, dateRange, false);
            return;
        }
        
        // Set new timeout for debounced search with shorter delay (300ms)
        searchTimeoutRef.current = setTimeout(() => {
            fetchPembelian(1, serverPagination.perPage, newSearchTerm, filterStatus, dateRange, true);
        }, 300); // 300ms delay for better UX
    }, [fetchPembelian, serverPagination.perPage, filterStatus, dateRange]);
    
    // Clear search function
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        
        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Fetch data without search filter
        fetchPembelian(1, serverPagination.perPage, '', filterStatus, dateRange, false);
    }, [fetchPembelian, serverPagination.perPage, filterStatus, dateRange]);
    
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
        fetchPembelian(1, serverPagination.perPage, searchTerm, newFilter, dateRange, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, dateRange]);
    
    // Date range filter handler
    const handleDateRangeFilter = useCallback((newDateRange) => {
        console.log('🎯 Date range filter triggered:', newDateRange);
        setDateRange(newDateRange);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, filterStatus, newDateRange, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterStatus]);
    
    // Clear date range filter
    const clearDateRange = useCallback(() => {
        const emptyDateRange = { startDate: '', endDate: '' };
        setDateRange(emptyDateRange);
        setSearchError(null);
        fetchPembelian(1, serverPagination.perPage, searchTerm, filterStatus, emptyDateRange, false);
    }, [fetchPembelian, serverPagination.perPage, searchTerm, filterStatus]);

    // Pagination handlers - maintain search term and filter
    const handlePageChange = useCallback((newPage) => {

        fetchPembelian(newPage, serverPagination.perPage, searchTerm, filterStatus, dateRange, false);
    }, [fetchPembelian, serverPagination.currentPage, serverPagination.perPage, serverPagination.totalPages, searchTerm, filterStatus, dateRange]);

    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPembelian(1, newPerPage, searchTerm, filterStatus, dateRange, false);
    }, [fetchPembelian, searchTerm, filterStatus, dateRange]);

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
        deleteLoading, // Export delete loading state
        getPembelianDetail,
        createDetail,
        updateDetail,
        deleteDetail,
        saveHeaderOnly, // New function for saving header only
        saveDetailsOnly // New function for saving details only
    };
};

export default usePembelianHO;