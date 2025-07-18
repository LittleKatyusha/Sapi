import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useOutlets = () => {
    const { getAuthHeader } = useAuthSecure();
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // API Base URL
    const API_BASE = 'https://puput-api.ternasys.com/api/master/outlet';

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000 // Increased to fetch more data
    });

    // Fetch data dari API dengan DataTables server-side pagination format
    const fetchOutlets = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('Fetching outlets from backend...');
            
            // DataTables pagination parameters (sama seperti eartag)
            const start = (page - 1) * perPage; // Calculate offset
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', '1');
            url.searchParams.append('search[value]', ''); // Empty search for now
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            url.searchParams.append('kategori', '1'); // Filter hanya kategori = 1
            
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
            let paginationMeta = {};
            
            // Handle DataTables response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                // DataTables format: {draw: 1, recordsTotal: 100, recordsFiltered: 100, data: [...]}
                dataArray = result.data;
                paginationMeta = {
                    draw: result.draw,
                    recordsTotal: result.recordsTotal,
                    recordsFiltered: result.recordsFiltered,
                    total: result.recordsTotal,
                    filtered: result.recordsFiltered,
                    current_page: page,
                    per_page: perPage,
                    last_page: Math.ceil(result.recordsTotal / perPage)
                };
                console.log('DataTables response received:', dataArray.length, 'items');
                console.log('Raw backend data sample:', dataArray.slice(0, 2)); // Log first 2 items
                console.log('Backend data fields:', dataArray[0] ? Object.keys(dataArray[0]) : 'No data');
            } else {
                console.error('Unexpected API response format:', result);
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state
            if (Object.keys(paginationMeta).length > 0) {
                setServerPagination({
                    currentPage: paginationMeta.current_page || page,
                    totalPages: paginationMeta.last_page || Math.ceil((paginationMeta.total || paginationMeta.recordsTotal || dataArray.length) / perPage),
                    totalItems: paginationMeta.total || paginationMeta.recordsTotal || dataArray.length,
                    perPage: paginationMeta.per_page || perPage
                });
            }
            
            if (dataArray.length >= 0) {
                const validatedData = dataArray.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    name: item.nama || 'Nama tidak tersedia',
                    location: item.alamat || 'Alamat tidak tersedia',
                    manager: item.manager || 'Manager tidak tersedia',
                    type: item.type || 'Type tidak tersedia',
                    status: item.status !== undefined ? item.status : 1, // 1 = aktif, 0 = tidak aktif
                    phone: item.kontak || 'Kontak tidak tersedia',
                    description: item.description || '',
                    openTime: item.openTime || '08:00',
                    closeTime: item.closeTime || '17:00',
                    established: item.created_at || new Date().toISOString(),
                    id: item.pubid || `TEMP-${index + 1}`
                }));
                
                // Debug logging untuk melihat status outlet
                console.log('Outlet data received:', validatedData);
                console.log('Outlet status breakdown:', {
                    active: validatedData.filter(item => item.status === 1).length,
                    inactive: validatedData.filter(item => item.status === 0).length,
                    total: validatedData.length
                });
                
                setOutlets(validatedData);
                setError(null); // Clear error on success
            } else {
                throw new Error('Tidak ada data outlet yang diterima dari server');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback ke data dummy dengan outlet aktif dan tidak aktif
            setOutlets([
                {
                    id: "OUT001",
                    pubid: "outlet-001",
                    name: "Outlet Peternakan Maju",
                    location: "Jl. Raya Bogor No. 123, Jakarta Timur",
                    manager: "Budi Santoso",
                    type: "Retail",
                    status: 1, // 1 = aktif, 0 = tidak aktif
                    phone: "021-8876543",
                    description: "Outlet utama untuk penjualan produk sapi segar dan olahan daging",
                    openTime: "06:00",
                    closeTime: "18:00",
                    established: "2020-01-15"
                },
                {
                    id: "OUT002",
                    pubid: "outlet-002",
                    name: "Outlet Ternak Sejahtera",
                    location: "Jl. Sudirman No. 45, Jakarta Selatan",
                    manager: "Siti Rahayu",
                    type: "Wholesale",
                    status: 1,
                    phone: "021-7765432",
                    description: "Outlet grosir untuk distribusi ke restoran dan hotel",
                    openTime: "05:00",
                    closeTime: "20:00",
                    established: "2019-03-20"
                },
                {
                    id: "OUT003",
                    pubid: "outlet-003",
                    name: "Outlet Sapi Premium",
                    location: "Jl. Kemang Raya No. 88, Jakarta Selatan",
                    manager: "Ahmad Wijaya",
                    type: "Retail",
                    status: 0, // Tidak aktif
                    phone: "021-6654321",
                    description: "Outlet sedang dalam renovasi",
                    openTime: "07:00",
                    closeTime: "21:00",
                    established: "2021-06-10"
                },
                {
                    id: "OUT004",
                    pubid: "outlet-004",
                    name: "Outlet Daging Segar",
                    location: "Jl. Fatmawati No. 67, Jakarta Selatan",
                    manager: "Rina Kartika",
                    type: "Retail",
                    status: 0, // Tidak aktif
                    phone: "021-5543210",
                    description: "Sedang dalam proses renovasi dan upgrade fasilitas",
                    openTime: "06:30",
                    closeTime: "19:00",
                    established: "2018-11-05"
                },
                {
                    id: "OUT005",
                    pubid: "outlet-005",
                    name: "Outlet Ternak Nusantara",
                    location: "Jl. Cipete Raya No. 156, Jakarta Selatan",
                    manager: "Doni Prasetyo",
                    type: "Wholesale",
                    status: 1,
                    phone: "021-4432109",
                    description: "Pusat distribusi regional untuk wilayah Jakarta dan sekitarnya",
                    openTime: "04:00",
                    closeTime: "22:00",
                    established: "2017-08-30"
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Create outlet
    const createOutlet = useCallback(async (outletData) => {
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
                    nama: outletData.name,
                    alamat: outletData.location,
                    kontak: outletData.phone,
                    status: outletData.status,
                    kategori: 1 // Set kategori = 1 untuk outlet
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchOutlets(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Outlet berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchOutlets]);

    // Update outlet
    const updateOutlet = useCallback(async (pubid, outletData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const outlet = outlets.find(o => o.pubid === pubid);
            if (!outlet) {
                throw new Error('Outlet tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: outlet.encryptedPid || outlet.pubid,
                    nama: outletData.name,
                    alamat: outletData.location,
                    kontak: outletData.phone,
                    status: outletData.status,
                    kategori: 1 // Set kategori = 1 untuk outlet
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchOutlets(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Outlet berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchOutlets, outlets]);

    // Delete outlet
    const deleteOutlet = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const outlet = outlets.find(o => o.pubid === pubid);
            if (!outlet) {
                throw new Error('Outlet tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: outlet.encryptedPid || outlet.pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchOutlets(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Outlet berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            
            // Fallback: hapus dari data dummy jika API error
            console.log('API delete failed, removing from dummy data:', pubid);
            const updatedOutlets = outlets.filter(outlet => outlet.pubid !== pubid);
            setOutlets(updatedOutlets);
            
            return {
                success: true,
                message: 'Outlet berhasil dihapus (simulasi)'
            };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchOutlets, outlets]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        return outlets.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && item.status === 1) ||
                (filterStatus === 'inactive' && item.status === 0);
            
            return matchesSearch && matchesStatus;
        });
    }, [outlets, searchTerm, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        const total = outlets.length;
        const active = outlets.filter(item => item.status === 1).length;
        
        return {
            total,
            active
        };
    }, [outlets]);

    return {
        outlets: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        fetchOutlets,
        createOutlet,
        updateOutlet,
        deleteOutlet,
        // Server pagination info
        serverPagination
    };
};

export default useOutlets;