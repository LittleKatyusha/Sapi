import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

// Helper function to safely parse JSON response
const safeJsonParse = async (response) => {
    const contentType = response.headers.get('content-type');
    
    // Enhanced logging for debugging
    // console.log('🔍 DEBUG: Response details:', {
    //     status: response.status,
    //     statusText: response.statusText,
    //     contentType: contentType,
    //     url: response.url,
    //     headers: Object.fromEntries(response.headers.entries())
    // });
    
    if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        // console.error('❌ Expected JSON but received:', {
        //     contentType,
        //     responseText: responseText.substring(0, 500),
        //     fullResponseLength: responseText.length
        // });
        throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON. This usually means the API endpoint is not properly configured or the server returned an error page. Response: ${responseText.substring(0, 200)}...`);
    }
    
    const jsonData = await response.json();
    // console.log('✅ Successfully parsed JSON:', jsonData);
    return jsonData;
};

const usePembelianHO = () => {
    const { getAuthHeader } = useAuthSecure();
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // API Base URL - hardcoded for proxy to work with CORS
    const API_BASE = `https://puput-api.ternasys.com/api/ho/pembelian`;

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // Fetch pembelian data from API with DataTables server-side pagination format
    const fetchPembelian = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // console.log('Fetching pembelian HO from backend...');
            
            // DataTables pagination parameters for server-side processing
            const start = (page - 1) * perPage;
            const params = new URLSearchParams({
                'start': start.toString(),
                'length': perPage.toString(),
                'draw': Date.now().toString(),
                'search[value]': searchTerm || '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            });
            
            const response = await fetch(`${API_BASE}/data?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...authHeader
                }
            });
            
            // console.log('Response received:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                // console.error('🚨 API Error Details:', {
                //     status: response.status,
                //     statusText: response.statusText,
                //     url: response.url,
                //     errorBody: errorText
                // });
                
                if (response.status === 401) {
                    throw new Error('Unauthorized - Token tidak valid atau sudah expired');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - Tidak memiliki akses ke endpoint ini');
                } else if (response.status === 404) {
                    throw new Error('Endpoint tidak ditemukan');
                } else if (response.status === 500) {
                    throw new Error(`Server error (500) - Ada masalah di backend API. Detail: ${errorText.substring(0, 200)}`);
                } else {
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0, 200)}`);
                }
            }

            const result = await safeJsonParse(response);
            
            let dataArray = [];
            let totalRecords = 0;
            let filteredRecords = 0;
            
            // Handle DataTables server-side response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                dataArray = result.data;
                totalRecords = result.recordsTotal || result.data.length;
                filteredRecords = result.recordsFiltered || result.data.length;
                // console.log('DataTables response received:', dataArray.length, 'items');
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // Fallback for simple response format
                dataArray = result.data;
                totalRecords = result.data.length;
                filteredRecords = result.data.length;
                // console.log('API response received:', dataArray.length, 'items');
            } else {
                // console.error('Unexpected API response format:', result);
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state with backend data
            setServerPagination({
                currentPage: page,
                totalPages: Math.ceil(totalRecords / perPage),
                totalItems: totalRecords,
                filteredItems: filteredRecords,
                perPage: perPage
            });
            
            if (dataArray.length >= 0) {
                const validatedData = await Promise.all(dataArray.map(async (item, index) => {
                    // Base data without total_belanja
                    const baseData = {
                        pubid: item.pubid || `TEMP-${index + 1}`,
                        encryptedPid: item.encrypted_pid || item.pid || item.pubid,
                        nota: item.nota || '',
                        nama_supplier: item.nama_supplier || 'Supplier tidak tersedia',
                        nama_office: item.nama_office || '',
                        tgl_masuk: item.tgl_masuk || new Date().toISOString().split('T')[0],
                        nama_supir: item.nama_supir || '',
                        plat_nomor: item.plat_nomor || '',
                        jumlah: parseInt(item.jumlah) || 0,
                        status: item.status !== undefined ? item.status : 1,
                        createdAt: item.created_at || new Date().toISOString(),
                        updatedAt: item.updated_at || new Date().toISOString(),
                        id: item.pubid || `TEMP-${index + 1}`
                    };

                    // Calculate total_belanja from detail data
                    let total_belanja = 0;
                    try {
                        if (item.pid || item.pubid) {
                            const detailResponse = await fetch(`${API_BASE}/show`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    ...authHeader
                                },
                                body: JSON.stringify({
                                    pid: item.pid || item.pubid
                                })
                            });
                            
                            if (detailResponse.ok) {
                                const detailResult = await safeJsonParse(detailResponse);
                                if (detailResult.data && Array.isArray(detailResult.data)) {
                                    total_belanja = detailResult.data.reduce((sum, detail) => {
                                        return sum + (parseFloat(detail.total_harga) || 0);
                                    }, 0);
                                }
                            }
                        }
                    } catch (error) {
                        // console.warn(`Failed to fetch details for ${item.nota}:`, error.message);
                        total_belanja = 0;
                    }

                    return {
                        ...baseData,
                        total_belanja
                    };
                }));
                
                // console.log('Validated pembelian data with calculated total_belanja:', validatedData.slice(0, 2));
                setPembelian(validatedData);
            } else {
                // console.warn('No pembelian data received from API');
                setPembelian([]);
            }
            
        } catch (err) {
            // console.error('Error in fetchPembelian:', err);
            setError(err.message || 'Terjadi kesalahan saat mengambil data pembelian');
            
            // Fallback to empty data
            setPembelian([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, searchTerm]);

    // Create pembelian - handle header + details array format
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // Backend tetap mengharapkan id_supplier, jadi kirim PID sebagai id_supplier
            const officeIdParsed = parseInt(pembelianData.idOffice);
            
            const headerData = {
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: pembelianData.nota,
                id_supplier: pembelianData.idSupplier, // Kirim PID sebagai id_supplier
                tgl_masuk: pembelianData.tglMasuk,
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah) || 0,
                biaya_truk: parseFloat(pembelianData.biayaTruck) || 0 // Truck cost at header level
            };

            // Validate required fields before sending
            if (!headerData.id_supplier) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }
            
            // Debug and validate biaya_truk
            // console.log('🔍 VALIDATION: biaya_truk value:', headerData.biaya_truk);
            // console.log('🔍 VALIDATION: biaya_truk type:', typeof headerData.biaya_truk);
            // console.log('🔍 VALIDATION: is biaya_truk truthy?', !!headerData.biaya_truk);
            // console.log('🔍 VALIDATION: biaya_truk > 0?', headerData.biaya_truk > 0);
            
            if (!headerData.biaya_truk || headerData.biaya_truk <= 0 || isNaN(headerData.biaya_truk)) {
                throw new Error(`Biaya truck harus diisi dengan nilai numerik > 0. Nilai saat ini: ${headerData.biaya_truk} (type: ${typeof headerData.biaya_truk})`);
            }

            // console.log('🔧 DEBUG: Create header data:', headerData);
            // console.log('🔧 DEBUG: Supplier PID sebagai id_supplier:', pembelianData.idSupplier);
            // console.log('🔧 DEBUG: Raw biayaTruck from form:', pembelianData.biayaTruck);
            // console.log('🔧 DEBUG: Parsed biaya_truk value:', parseFloat(pembelianData.biayaTruck) || 0);
            // console.log('🔧 DEBUG: Type of biaya_truk:', typeof headerData.biaya_truk);

            // Backend expects header + details array format
            const requestData = {
                ...headerData,
                details: pembelianData.details || [] // Details array from form
            };
            
            // console.log('🚀 DEBUG: Complete request data:', JSON.stringify(requestData, null, 2));
            // console.log('🚀 DEBUG: Header fields being sent:', Object.keys(headerData));
            // console.log('🚀 DEBUG: biaya_truk in request:', requestData.biaya_truk);
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // // console.error('Backend error response:', errorText);
                
                // Specific error messages for common bootstrap issues
                if (errorText.includes('id_pembelian')) {
                    throw new Error('Error: Backend tidak dapat membuat record pertama. Backend perlu dimodifikasi untuk handle database kosong.');
                } else if (errorText.includes('id_klasifikasi_hewan')) {
                    throw new Error('Error: Tabel klasifikasi hewan masih kosong. Silakan isi master data klasifikasi hewan terlebih dahulu.');
                } else if (errorText.includes('id_office')) {
                    throw new Error('Error: Office tidak ditemukan. Silakan isi master data office terlebih dahulu.');
                } else if (errorText.includes('id_supplier')) {
                    throw new Error('Error: Supplier tidak ditemukan. Silakan isi master data supplier terlebih dahulu.');
                }
                
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await safeJsonParse(response);
            await fetchPembelian(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian pertama berhasil dibuat!'
            };
            
        } catch (err) {
            // console.error('Create pembelian error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPembelian]);

    // Update pembelian
    const updatePembelian = useCallback(async (pubid, pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // Backend tetap mengharapkan id_supplier, jadi kirim PID sebagai id_supplier
            const officeIdParsed = parseInt(pembelianData.idOffice);
            
            const updateData = {
                pid: pubid,
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: pembelianData.nota,
                id_supplier: pembelianData.idSupplier, // Kirim PID sebagai id_supplier
                tgl_masuk: pembelianData.tglMasuk,
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah) || 0,
                biaya_truk: parseFloat(pembelianData.biayaTruck) || 0 // Truck cost at header level
            };

            // Validate required fields before sending
            if (!updateData.id_supplier) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }

            // Log the data being sent for debugging
            // console.log('🔧 DEBUG: Update data being sent:', updateData);
            // console.log('🔧 DEBUG: Supplier PID sebagai id_supplier:', pembelianData.idSupplier);
            
            // console.log('🚀 DEBUG: Making UPDATE request:', {
            //     url: `${API_BASE}/update`,
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Accept': 'application/json',
            //         ...authHeader
            //     },
            //     bodyData: updateData
            // });

            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // console.error('Backend error response:', errorText);
                
                // Try to parse the error response as JSON for better error messages
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.data && typeof errorJson.data === 'object') {
                        // Format validation errors
                        const validationErrors = Object.entries(errorJson.data)
                            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                            .join('; ');
                        throw new Error(`Validation Error: ${validationErrors}`);
                    }
                    throw new Error(errorJson.message || `HTTP error! status: ${response.status}`);
                } catch (parseError) {
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
            }
            
            const result = await safeJsonParse(response);
            await fetchPembelian(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian berhasil diperbarui'
            };
            
        } catch (err) {
            // console.error('Update pembelian error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPembelian]);

    // Delete pembelian
    const deletePembelian = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // CORS Issue Note: Backend needs CORS configuration for DELETE operations
            // Temporary workaround: Add additional headers for CORS preflight
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest', // Help with CORS preflight
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Check if response is actually JSON before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                // console.error('Expected JSON but received:', contentType, responseText.substring(0, 200));
                throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON. Response: ${responseText.substring(0, 200)}...`);
            }
            
            const result = await safeJsonParse(response);
            await fetchPembelian(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPembelian]);

    // Get pembelian details
    const getPembelianDetail = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/show`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid // This should be the encrypted PID from backend
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await safeJsonParse(response);
            // console.log('Detail response:', result);
            
            // Debug: Log the structure of first detail item to identify classification field name
            // if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            //     console.log('🔍 DEBUG: First detail item structure:', result.data[0]);
            //     console.log('🔍 DEBUG: Available fields:', Object.keys(result.data[0]));
            //     console.log('🔍 DEBUG: Classification field value:', {
            //         nama_klasifikasi_hewan: result.data[0].nama_klasifikasi_hewan,
            //         klasifikasi_hewan: result.data[0].klasifikasi_hewan,
            //         name_klasifikasi: result.data[0].name_klasifikasi,
            //         klasifikasi: result.data[0].klasifikasi,
            //         id_klasifikasi_hewan: result.data[0].id_klasifikasi_hewan
            //     });
            //     console.log('⚠️ ISSUE: id_klasifikasi_hewan is missing from API response. Backend needs to include this field in the view query.');
            // }
            
            return {
                success: result.status === 'ok' || result.success === true,
                data: result.data || [],
                message: result.message || 'Detail pembelian berhasil diambil'
            };
            
        } catch (err) {
            // console.error('Get detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail pembelian';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Create detail ternak
    const createDetail = useCallback(async (detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    // Detail fields only (no header fields to trigger detail creation)
                    id_pembelian: parseInt(detailData.idPembelian),
                    id_office: parseInt(detailData.idOffice),
                    eartag: String(detailData.eartag), // Convert to string
                    code_eartag: detailData.codeEartag,
                    id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                    harga: parseFloat(detailData.harga),
                    berat: parseInt(detailData.berat),
                    // biaya_truk removed from detail since it's now in header only
                    hpp: parseFloat(detailData.hpp),
                    total_harga: parseFloat(detailData.totalHarga)
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await safeJsonParse(response);
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil ditambahkan'
            };
            
        } catch (err) {
            // console.error('Create detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menambah detail ternak';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Update detail ternak
    const updateDetail = useCallback(async (pubid, detailData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid,
                    // Detail fields only (no header fields)
                    id_pembelian: parseInt(detailData.idPembelian),
                    id_office: parseInt(detailData.idOffice),
                    eartag: String(detailData.eartag), // Convert to string
                    code_eartag: detailData.codeEartag,
                    id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                    harga: parseFloat(detailData.harga),
                    berat: parseInt(detailData.berat),
                    // biaya_truk removed from detail since it's now in header only
                    hpp: parseFloat(detailData.hpp),
                    total_harga: parseFloat(detailData.totalHarga)
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await safeJsonParse(response);
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil diperbarui'
            };
            
        } catch (err) {
            // console.error('Update detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui detail ternak';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Delete detail ternak
    const deleteDetail = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest', // Help with CORS preflight
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await safeJsonParse(response);
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil dihapus'
            };
            
        } catch (err) {
            // console.error('Delete detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus detail ternak';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

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

    // Filtered data based on search and filter
    const filteredPembelian = useMemo(() => {
        let filtered = pembelian;
        
        // Filter based on search term
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.nama_supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nama_office.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nota.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nama_supir.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.plat_nomor.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filter based on date range
        if (filterStatus !== 'all') {
            const now = new Date();
            if (filterStatus === 'today') {
                const today = now.toDateString();
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.tgl_masuk).toDateString();
                    return itemDate === today;
                });
            } else if (filterStatus === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.tgl_masuk);
                    return itemDate >= weekAgo && itemDate <= now;
                });
            } else if (filterStatus === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.tgl_masuk);
                    return itemDate >= monthAgo && itemDate <= now;
                });
            }
        }
        
        return filtered;
    }, [pembelian, searchTerm, filterStatus]);

    return {
        pembelian: filteredPembelian,
        allPembelian: pembelian,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        serverPagination,
        fetchPembelian,
        createPembelian,
        updatePembelian,
        deletePembelian,
        getPembelianDetail,
        createDetail,
        updateDetail,
        deleteDetail
    };
};

export default usePembelianHO;