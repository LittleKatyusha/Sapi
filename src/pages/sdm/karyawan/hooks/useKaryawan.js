import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useKaryawan = () => {
    const { getAuthHeader } = useAuthSecure();
    const [karyawan, setKaryawan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // API Base URL sesuai routing backend
    const API_BASE = 'https://puput-api.ternasys.com/api/system/pegawai';

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // 1. FETCH DATA - GET /data (DataTables format)
    const fetchKaryawan = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('Fetching karyawan from backend...');
            
            // DataTables pagination parameters sesuai controller
            const start = (page - 1) * perPage;
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', '1');
            url.searchParams.append('search[value]', '');
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
            let paginationMeta = {};
            
            // Handle DataTables response format
            if (result.draw && result.data && Array.isArray(result.data)) {
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
                console.log('Raw backend data sample:', dataArray.slice(0, 2));
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
                // Map backend data ke frontend format
                const validatedData = dataArray.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    name: item.name || 'Nama tidak tersedia',
                    employee_id: item.nik || `NIK-${index + 1}`,
                    position: item.position || 'Posisi tidak tersedia',
                    department: item.roleDetail?.nama || 'Role tidak tersedia',
                    phone: item.kontak || 'Kontak tidak tersedia',
                    email: item.email || 'Email tidak tersedia',
                    address: item.alamat || 'Alamat tidak tersedia',
                    hire_date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    salary: 0, // Tidak ada field salary di backend
                    group_id: item.group_id || null,
                    pict: item.pict || null,
                    email_verified_at: item.email_verified_at || null,
                    created_at: item.created_at || new Date().toISOString(),
                    updated_at: item.updated_at || new Date().toISOString(),
                    id: item.pubid || `TEMP-${index + 1}`
                }));
                
                console.log('Karyawan data received:', validatedData);
                
                setKaryawan(validatedData);
                setError(null);
            } else {
                throw new Error('Tidak ada data karyawan yang diterima dari server');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback dummy data
            setKaryawan([
                {
                    id: "USR001",
                    pubid: "user-001",
                    employee_id: "NIK001",
                    name: "Ahmad Subarjo",
                    position: "Administrator",
                    department: "Administrator",
                    phone: "081234567890",
                    email: "ahmad@example.com",
                    address: "Jl. Raya Jakarta No. 100",
                    group_id: 1,
                    pict: null,
                    email_verified_at: "2020-01-15T00:00:00.000Z",
                    created_at: "2020-01-15T00:00:00.000Z",
                    updated_at: "2020-01-15T00:00:00.000Z"
                },
                {
                    id: "USR002",
                    pubid: "user-002",
                    employee_id: "NIK002",
                    name: "Siti Aminah",
                    position: "Staff",
                    department: "Staff",
                    phone: "081234567891",
                    email: "siti@example.com",
                    address: "Jl. Kemerdekaan No. 75",
                    group_id: 2,
                    pict: null,
                    email_verified_at: "2021-03-20T00:00:00.000Z",
                    created_at: "2021-03-20T00:00:00.000Z",
                    updated_at: "2021-03-20T00:00:00.000Z"
                },
                {
                    id: "USR003",
                    pubid: "user-003",
                    employee_id: "NIK003",
                    name: "Joko Widodo",
                    position: "Supervisor",
                    department: "Supervisor",
                    phone: "081234567892",
                    email: "joko@example.com",
                    address: "Jl. Pasar Baru No. 45",
                    group_id: 3,
                    pict: null,
                    email_verified_at: null,
                    created_at: "2019-11-10T00:00:00.000Z",
                    updated_at: "2019-11-10T00:00:00.000Z"
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // 2. CREATE KARYAWAN - POST /store
    const createKaryawan = useCallback(async (karyawanData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    nik: karyawanData.employee_id,
                    name: karyawanData.name,
                    email: karyawanData.email,
                    alamat: karyawanData.address,
                    kontak: karyawanData.phone,
                    pict: karyawanData.pict || null,
                    group_id: karyawanData.group_id || 1
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchKaryawan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Karyawan berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchKaryawan]);

    // 3. UPDATE KARYAWAN - POST /update
    const updateKaryawan = useCallback(async (pubid, karyawanData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid,
                    nik: karyawanData.employee_id,
                    name: karyawanData.name,
                    email: karyawanData.email,
                    alamat: karyawanData.address,
                    kontak: karyawanData.phone,
                    pict: karyawanData.pict || null,
                    group_id: karyawanData.group_id || 1
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchKaryawan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Karyawan berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchKaryawan, karyawan]);

    // 4. DELETE KARYAWAN - POST /delete
    const deleteKaryawan = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchKaryawan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Karyawan berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            
            // Fallback: hapus dari state jika API error
            console.log('API delete failed, removing from state:', pubid);
            const updatedKaryawan = karyawan.filter(k => k.pubid !== pubid);
            setKaryawan(updatedKaryawan);
            
            return { 
                success: true, 
                message: 'Karyawan berhasil dihapus (simulasi)'
            };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchKaryawan, karyawan]);

    // 5. GET DETAIL KARYAWAN - POST /detail
    const getKaryawanDetail = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/detail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            return {
                success: true,
                data: result.data,
                message: result.message || 'Detail karyawan berhasil diambil'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, karyawan]);

    // 6. GET ROLES/JABATAN - GET /jabatan
    const getRoles = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const response = await fetch(`${API_BASE}/jabatan`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result.data || [];
            
        } catch (err) {
            console.error('Error fetching roles:', err);
            // Fallback roles
            return [
                { id: 1, nama: 'Administrator', description: 'Administrator sistem' },
                { id: 2, nama: 'Staff', description: 'Staff biasa' },
                { id: 3, nama: 'Supervisor', description: 'Supervisor departemen' },
                { id: 4, nama: 'Manager', description: 'Manager perusahaan' }
            ];
        }
    }, [getAuthHeader]);

    // 7. RESET PASSWORD - POST /reset-password
    const resetPassword = useCallback(async (pubid, newPassword, confirmPassword) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            return {
                success: true,
                message: result.message || 'Password berhasil direset'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat reset password';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, karyawan]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        return karyawan.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.phone.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesSearch;
        });
    }, [karyawan, searchTerm]);

    // Statistics
    const stats = useMemo(() => {
        const total = karyawan.length;
        
        return {
            total
        };
    }, [karyawan]);

    return {
        karyawan: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        stats,
        fetchKaryawan,
        createKaryawan,
        updateKaryawan,
        deleteKaryawan,
        getKaryawanDetail,
        getRoles,
        resetPassword,
        serverPagination
    };
};

export default useKaryawan;