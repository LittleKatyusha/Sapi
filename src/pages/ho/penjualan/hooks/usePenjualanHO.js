import { useState, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

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
    const [penjualan, setPenjualan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

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
            console.log('Fetching penjualan HO from backend...');
            
            // DataTables pagination parameters for server-side processing
            const start = (page - 1) * perPage;
            const params = {
                'start': start.toString(),
                'length': perPage.toString(),
                'draw': Date.now().toString(),
                'search[value]': searchTerm || '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            };
            
            const result = await HttpClient.get(`${API_ENDPOINTS.HO.PENJUALAN}/data`, {
                params: params
            });
            
            console.log('Response received');
            
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
    }, [searchTerm]);

    // Get nota by supplier
    const getNotaBySupplier = useCallback(async (supplierId) => {
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN}/nota-by-supplier`, {
                id_supplier: supplierId
            });
            
            return {
                success: true,
                data: result.data || []
            };
        } catch (err) {
            console.error('Get nota by supplier error:', err);
            return { success: false, data: [], message: err.message };
        }
    }, []);

    // Create penjualan - simplified based on backend API structure
    const createPenjualan = useCallback(async (penjualanData) => {
        setLoading(true);
        setError(null);
        
        try {
            // Backend expects these specific fields for sales creation
            const officeIdParsed = parseInt(penjualanData.idOffice);
            
            const requestData = {
                id_office: !isNaN(officeIdParsed) ? officeIdParsed : 1,
                nota: penjualanData.nota,
                id_supplier: parseInt(penjualanData.idSupplier),
                tgl_masuk_rph: penjualanData.tglMasukRph
            };

            // Validate required fields before sending
            if (!requestData.id_supplier) {
                throw new Error('Supplier harus dipilih sebelum menyimpan data');
            }
            if (!requestData.nota) {
                throw new Error('Nota harus dipilih sebelum menyimpan data');
            }

            console.log('🔧 DEBUG: Create sales data:', requestData);

            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN}/store`, requestData);
            await fetchPenjualan(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Penjualan berhasil dibuat!'
            };
            
        } catch (err) {
            console.error('Create penjualan error:', err);
            
            let errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            if (errorMsg.includes('Data pembelian not found')) {
                errorMsg = 'Error: Data pembelian tidak ditemukan untuk dijual.';
            } else if (errorMsg.includes('Data is not already to sell')) {
                errorMsg = 'Error: Data belum siap untuk dijual.';
            }
            
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchPenjualan]);

    // Update penjualan
    const updatePenjualan = useCallback(async (pubid, penjualanData) => {
        setLoading(true);
        setError(null);
        
        try {
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

            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN}/update`, updateData);
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
    }, [fetchPenjualan]);

    // Delete penjualan
    const deletePenjualan = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN}/hapus`, {
                pid: pubid
            });
            
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
    }, [fetchPenjualan]);

    // Get penjualan details
    const getPenjualanDetail = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.HO.PENJUALAN}/show`, {
                pid: pubid
            });
            
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
    }, []);

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
        getNotaBySupplier,
    };
};

export default usePenjualanHO;