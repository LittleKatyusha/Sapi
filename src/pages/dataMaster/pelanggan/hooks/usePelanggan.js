import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const usePelanggan = () => {
    const { getAuthHeader } = useAuthSecure();
    const [pelanggan, setPelanggan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // API Base URL - menggunakan endpoint outlet dengan kategori = 2
    const API_BASE = 'https://puput-api.ternasys.com/api/master/outlet';

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000 // Increased to fetch more data
    });

    // Fetch data dari API dengan DataTables server-side pagination format
    const fetchPelanggan = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('Fetching pelanggan from backend...');
            
            // DataTables pagination parameters (sama seperti outlet)
            const start = (page - 1) * perPage; // Calculate offset
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', '1');
            url.searchParams.append('search[value]', ''); // Empty search for now
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            url.searchParams.append('kategori', '2'); // Filter kategori = 2 untuk pelanggan
            
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
                    address: item.alamat || 'Alamat tidak tersedia',
                    status: item.status !== undefined ? item.status : 1, // 1 = aktif, 0 = tidak aktif
                    phone: item.kontak || 'Kontak tidak tersedia',
                    description: item.description || '',
                    established: item.created_at || new Date().toISOString(),
                    id: item.pubid || `TEMP-${index + 1}`
                }));
                
                // Debug logging untuk melihat status pelanggan
                console.log('Pelanggan data received:', validatedData);
                console.log('Pelanggan status breakdown:', {
                    active: validatedData.filter(item => item.status === 1).length,
                    inactive: validatedData.filter(item => item.status === 0).length,
                    total: validatedData.length
                });
                
                setPelanggan(validatedData);
                setError(null); // Clear error on success
            } else {
                throw new Error('Tidak ada data pelanggan yang diterima dari server');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback ke data dummy dengan pelanggan aktif dan tidak aktif
            setPelanggan([
                {
                    id: "PLG001",
                    pubid: "pelanggan-001",
                    name: "PT. Maju Bersama",
                    address: "Jl. Raya Jakarta No. 100, Jakarta Pusat",
                    status: 1, // 1 = aktif, 0 = tidak aktif
                    phone: "021-5551234",
                    description: "Pelanggan corporate dengan volume pembelian tinggi",
                    established: "2020-01-15"
                },
                {
                    id: "PLG002",
                    pubid: "pelanggan-002",
                    name: "CV. Sinar Harapan",
                    address: "Jl. Kemerdekaan No. 75, Jakarta Barat",
                    status: 1,
                    phone: "021-5552345",
                    description: "Pelanggan reguler dengan transaksi bulanan",
                    established: "2019-03-20"
                },
                {
                    id: "PLG003",
                    pubid: "pelanggan-003",
                    name: "Toko Berkah Jaya",
                    address: "Jl. Pasar Baru No. 45, Jakarta Timur",
                    status: 0, // Tidak aktif
                    phone: "021-5553456",
                    description: "Pelanggan sedang tidak aktif karena masalah pembayaran",
                    established: "2021-06-10"
                },
                {
                    id: "PLG004",
                    pubid: "pelanggan-004",
                    name: "UD. Mandiri Sejahtera",
                    address: "Jl. Industri No. 88, Jakarta Selatan",
                    status: 0, // Tidak aktif
                    phone: "021-5554567",
                    description: "Pelanggan sedang suspend karena tunggakan",
                    established: "2018-11-05"
                },
                {
                    id: "PLG005",
                    pubid: "pelanggan-005",
                    name: "PT. Global Nusantara",
                    address: "Jl. Sudirman No. 200, Jakarta Pusat",
                    status: 1,
                    phone: "021-5555678",
                    description: "Pelanggan premium dengan kontrak jangka panjang",
                    established: "2017-08-30"
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Create pelanggan
    const createPelanggan = useCallback(async (pelangganData) => {
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
                    nama: pelangganData.name,
                    alamat: pelangganData.address,
                    kontak: pelangganData.phone,
                    status: pelangganData.status,
                    kategori: 2 // Set kategori = 2 untuk pelanggan
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchPelanggan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Pelanggan berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPelanggan]);

    // Update pelanggan
    const updatePelanggan = useCallback(async (pubid, pelangganData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const pelangganItem = pelanggan.find(p => p.pubid === pubid);
            if (!pelangganItem) {
                throw new Error('Pelanggan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pelangganItem.encryptedPid || pelangganItem.pubid,
                    nama: pelangganData.name,
                    alamat: pelangganData.address,
                    kontak: pelangganData.phone,
                    status: pelangganData.status,
                    kategori: 2 // Set kategori = 2 untuk pelanggan
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchPelanggan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Pelanggan berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPelanggan, pelanggan]);

    // Delete pelanggan
    const deletePelanggan = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const pelangganItem = pelanggan.find(p => p.pubid === pubid);
            if (!pelangganItem) {
                throw new Error('Pelanggan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: pelangganItem.encryptedPid || pelangganItem.pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchPelanggan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Pelanggan berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            
            // Fallback: hapus dari data dummy jika API error
            console.log('API delete failed, removing from dummy data:', pubid);
            const updatedPelanggan = pelanggan.filter(p => p.pubid !== pubid);
            setPelanggan(updatedPelanggan);
            
            return {
                success: true,
                message: 'Pelanggan berhasil dihapus (simulasi)'
            };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchPelanggan, pelanggan]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        return pelanggan.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && item.status === 1) ||
                (filterStatus === 'inactive' && item.status === 0);
            
            return matchesSearch && matchesStatus;
        });
    }, [pelanggan, searchTerm, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        const total = pelanggan.length;
        const active = pelanggan.filter(item => item.status === 1).length;
        
        return {
            total,
            active
        };
    }, [pelanggan]);

    return {
        pelanggan: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        fetchPelanggan,
        createPelanggan,
        updatePelanggan,
        deletePelanggan,
        // Server pagination info
        serverPagination
    };
};

export default usePelanggan;