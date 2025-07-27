import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

// Helper function to safely parse JSON response
const safeJsonParse = async (response) => {
    const contentType = response.headers.get('content-type');
    
    // Enhanced logging for debugging
    console.log('🔍 DEBUG: Response details:', {
        status: response.status,
        statusText: response.statusText,
        contentType: contentType,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Expected JSON but received:', {
            contentType,
            responseText: responseText.substring(0, 500),
            fullResponseLength: responseText.length
        });
        throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON. This usually means the API endpoint is not properly configured or the server returned an error page. Response: ${responseText.substring(0, 200)}...`);
    }
    
    const jsonData = await response.json();
    console.log('✅ Successfully parsed JSON:', jsonData);
    return jsonData;
};

const usePenjualanHO = () => {
    const { getAuthHeader } = useAuthSecure();
    const [penjualan, setPenjualan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // API Base URL - updated for sales endpoint
    const API_BASE = `https://puput-api.ternasys.com/api/ho/penjualan`;

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // Fetch penjualan data from API with DataTables server-side pagination format
    const fetchPenjualan = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('Fetching penjualan HO from backend...');
            
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
            
            console.log('Response received:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Token tidak valid atau sudah expired');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - Tidak memiliki akses ke endpoint ini');
                } else if (response.status === 404) {
                    throw new Error('Endpoint tidak ditemukan');
                } else if (response.status === 500) {
                    throw new Error('Server error - Silakan coba lagi nanti');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
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
                console.log('DataTables response received:', dataArray.length, 'items');
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // Fallback for simple response format
                dataArray = result.data;
                totalRecords = result.data.length;
                filteredRecords = result.data.length;
                console.log('API response received:', dataArray.length, 'items');
            } else {
                console.error('Unexpected API response format:', result);
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
                    // Base data structure for sales (adapted from purchase structure)
                    const baseData = {
                        pubid: item.pubid || `TEMP-${index + 1}`,
                        encryptedPid: item.pid || item.pubid, // pid is already encrypted from backend
                        nota: item.nota || '',
                        nama_supplier: item.nama_supplier || 'Supplier tidak tersedia',
                        nama_office: item.nama_office || '',
                        tgl_masuk: item.tgl_masuk || new Date().toISOString().split('T')[0],
                        nama_supir: item.nama_supir || '',
                        plat_nomor: item.plat_nomor || '',
                        jumlah: parseInt(item.jumlah) || 0,
                        hpp: parseFloat(item.hpp) || 0,
                        total_harga: parseFloat(item.total_harga) || 0,
                        status: item.status !== undefined ? item.status : 1,
                        createdAt: item.created_at || new Date().toISOString(),
                        updatedAt: item.updated_at || new Date().toISOString(),
                        id: item.pubid || `TEMP-${index + 1}`
                    };


                    return baseData;
                }));
                
                console.log('Validated penjualan data:', validatedData.slice(0, 2));
                setPenjualan(validatedData);
            } else {
                console.warn('No penjualan data received from API');
                setPenjualan([]);
            }
            
        } catch (err) {
            console.error('Error in fetchPenjualan:', err);
            setError(err.message || 'Terjadi kesalahan saat mengambil data penjualan');
            
            // Fallback to empty data
            setPenjualan([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, searchTerm]);

    // Create penjualan - handle header + details array format
    const createPenjualan = useCallback(async (penjualanData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // For sales, the structure might be different from purchase
            const officeIdParsed = parseInt(penjualanData.idOffice);
            
            const headerData = {
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: penjualanData.nota,
                id_supplier: penjualanData.idSupplier,
                tgl_masuk_rph: penjualanData.tglMasukRph || penjualanData.tglMasuk,
            };

            // Validate required fields before sending
            if (!headerData.id_supplier) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }

            console.log('🔧 DEBUG: Create sales header data:', headerData);

            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(headerData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                
                if (errorText.includes('Data pembelian not found')) {
                    throw new Error('Error: Data pembelian tidak ditemukan untuk dijual.');
                } else if (errorText.includes('Data is not already to sell')) {
                    throw new Error('Error: Data belum siap untuk dijual.');
                }
                
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await safeJsonParse(response);
            await fetchPenjualan(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Penjualan berhasil dibuat!'
            };
            
        } catch (err) {
            console.error('Create penjualan error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPenjualan]);

    // Update penjualan
    const updatePenjualan = useCallback(async (pubid, penjualanData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const officeIdParsed = parseInt(penjualanData.idOffice);
            
            const updateData = {
                pid: pubid,
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: penjualanData.nota,
                id_supplier: penjualanData.idSupplier,
                tgl_masuk: penjualanData.tglMasuk,
                nama_supir: penjualanData.namaSupir,
                plat_nomor: penjualanData.platNomor,
                jumlah: parseInt(penjualanData.jumlah) || 0
            };

            // Validate required fields before sending
            if (!updateData.id_supplier) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }

            console.log('🔧 DEBUG: Update data being sent:', updateData);

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
                console.error('Backend error response:', errorText);
                
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.data && typeof errorJson.data === 'object') {
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
            await fetchPenjualan(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Penjualan berhasil diperbarui'
            };
            
        } catch (err) {
            console.error('Update penjualan error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPenjualan]);

    // Delete penjualan
    const deletePenjualan = useCallback(async (pubid) => {
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
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Expected JSON but received:', contentType, responseText.substring(0, 200));
                throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON. Response: ${responseText.substring(0, 200)}...`);
            }
            
            const result = await safeJsonParse(response);
            await fetchPenjualan(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Penjualan berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPenjualan]);

    // Get penjualan details
    const getPenjualanDetail = useCallback(async (pubid) => {
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
                    pid: pubid
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await safeJsonParse(response);
            console.log('Detail response:', result);
            
            return {
                success: result.status === 'ok' || result.success === true,
                data: result.data || [],
                message: result.message || 'Detail penjualan berhasil diambil'
            };
            
        } catch (err) {
            console.error('Get detail error:', err);
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail penjualan';
            setError(errorMsg);
            return { success: false, data: [], message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Computed stats
    const stats = useMemo(() => {
        const total = penjualan.length;
        const totalTernak = penjualan.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        // Today's sales
        const today = new Date().toDateString();
        const todaySales = penjualan.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        }).length;
        
        // This month's sales
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthSales = penjualan.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        }).length;
        
        return {
            total: total,
            totalTernak: totalTernak,
            today: todaySales,
            thisMonth: thisMonthSales
        };
    }, [penjualan]);

    // Filtered data based on search and filter
    const filteredPenjualan = useMemo(() => {
        let filtered = penjualan;
        
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
    }, [penjualan, searchTerm, filterStatus]);

    return {
        penjualan: filteredPenjualan,
        allPenjualan: penjualan,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        serverPagination,
        fetchPenjualan,
        createPenjualan,
        updatePenjualan,
        deletePenjualan,
        getPenjualanDetail,
    };
};

export default usePenjualanHO;