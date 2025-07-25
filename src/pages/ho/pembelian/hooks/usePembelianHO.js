import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const usePembelianHO = () => {
    const { getAuthHeader } = useAuthSecure();
    const [pembelian, setPembelian] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // API Base URL - using the HO pembelian endpoint from backend
    const API_BASE = 'https://puput-api.ternasys.com/api/ho/pembelian';

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
            
            console.log('Fetching pembelian HO from backend...');
            
            // DataTables pagination parameters for server-side processing
            const start = (page - 1) * perPage;
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', Date.now().toString()); // Use timestamp for draw
            url.searchParams.append('search[value]', searchTerm || '');
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
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

            const result = await response.json();
            
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
                const validatedData = dataArray.map((item, index) => ({
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
                }));
                
                console.log('Validated pembelian data:', validatedData.slice(0, 2));
                setPembelian(validatedData);
            } else {
                console.warn('No pembelian data received from API');
                setPembelian([]);
            }
            
        } catch (err) {
            console.error('Error in fetchPembelian:', err);
            setError(err.message || 'Terjadi kesalahan saat mengambil data pembelian');
            
            // Fallback to empty data
            setPembelian([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, searchTerm]);

    // Create pembelian - special handling for empty database bootstrap
    const createPembelian = useCallback(async (pembelianData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // Convert string ID to integer for backend validation
            const headerData = {
                id_office: parseInt(pembelianData.idOffice),
                nota: pembelianData.nota,
                id_supplier: parseInt(pembelianData.idSupplier),
                tgl_masuk: pembelianData.tglMasuk,
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah)
            };

            // For empty database, we need to create a complete record with valid detail
            // Since we can't create header-only due to backend validation, we'll create
            // a record with a self-referencing approach by creating both simultaneously
            
            // Strategy: Create with placeholder id_pembelian that backend will replace
            // The backend should handle this by:
            // 1. Creating header first and getting its ID
            // 2. Using that ID for the detail record
            
            const detailData = {
                // Use a placeholder - backend should replace this with actual header ID
                id_pembelian: 0, // Placeholder that backend will replace
                id_office: parseInt(pembelianData.idOffice),
                eartag: `START-${Date.now()}`, // First eartag for bootstrap
                code_eartag: `BOOTSTRAP-${Date.now()}`, // Bootstrap identifier
                id_klasifikasi_hewan: 1, // Default classification (should exist in sys_ms_klasifikasi_hewan)
                harga: 1000, // Sample price
                biaya_truck: 100, // Sample truck cost
                berat: 100, // Sample weight (100kg)
                hpp: 1100, // harga + biaya_truck
                total_harga: 1100 // Same as hpp
            };
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    ...headerData,
                    ...detailData
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                
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
            
            const result = await response.json();
            await fetchPembelian(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian pertama berhasil dibuat!'
            };
            
        } catch (err) {
            console.error('Create pembelian error:', err);
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
            
            // Prepare header update data
            const updateData = {
                pid: pubid,
                id_office: parseInt(pembelianData.idOffice),
                nota: pembelianData.nota,
                id_supplier: parseInt(pembelianData.idSupplier),
                tgl_masuk: pembelianData.tglMasuk,
                nama_supir: pembelianData.namaSupir,
                plat_nomor: pembelianData.platNomor,
                jumlah: parseInt(pembelianData.jumlah)
            };
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            await fetchPembelian(1, 1000); // Refresh data
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Pembelian berhasil diperbarui'
            };
            
        } catch (err) {
            console.error('Update pembelian error:', err);
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
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
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
            
            const result = await response.json();
            console.log('Detail response:', result);
            
            return {
                success: result.status === 'ok' || result.success === true,
                data: result.data || [],
                message: result.message || 'Detail pembelian berhasil diambil'
            };
            
        } catch (err) {
            console.error('Get detail error:', err);
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
                    ...authHeader
                },
                body: JSON.stringify({
                    // Detail fields only (no header fields to trigger detail creation)
                    id_pembelian: parseInt(detailData.idPembelian),
                    id_office: parseInt(detailData.idOffice),
                    eartag: detailData.eartag,
                    code_eartag: detailData.codeEartag,
                    id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                    harga: parseFloat(detailData.harga),
                    biaya_truck: parseFloat(detailData.biayaTruck),
                    berat: parseInt(detailData.berat),
                    hpp: parseFloat(detailData.hpp),
                    total_harga: parseFloat(detailData.totalHarga)
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil ditambahkan'
            };
            
        } catch (err) {
            console.error('Create detail error:', err);
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
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pubid,
                    // Detail fields only (no header fields)
                    id_pembelian: parseInt(detailData.idPembelian),
                    id_office: parseInt(detailData.idOffice),
                    eartag: detailData.eartag,
                    code_eartag: detailData.codeEartag,
                    id_klasifikasi_hewan: parseInt(detailData.idKlasifikasiHewan),
                    harga: parseFloat(detailData.harga),
                    biaya_truck: parseFloat(detailData.biayaTruck),
                    berat: parseInt(detailData.berat),
                    hpp: parseFloat(detailData.hpp),
                    total_harga: parseFloat(detailData.totalHarga)
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil diperbarui'
            };
            
        } catch (err) {
            console.error('Update detail error:', err);
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
            
            const result = await response.json();
            
            return {
                success: result.status === 'ok' || result.success === true,
                message: result.message || 'Detail ternak berhasil dihapus'
            };
            
        } catch (err) {
            console.error('Delete detail error:', err);
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