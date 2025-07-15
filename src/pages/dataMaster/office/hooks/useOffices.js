import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';
import useKategoriOffice from './useKategoriOffice';

const useOffices = () => {
    const { getAuthHeader } = useAuthSecure();
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterKategori, setFilterKategori] = useState('all');

    // Integrate kategori hook
    const {
        kategoriList,
        loading: kategoriLoading,
        error: kategoriError,
        getKategoriName: getKategoriNameFromDB,
        getActiveKategori
    } = useKategoriOffice();

    // API Base URL
    const API_BASE = 'https://puput-api.ternasys.com/api/master/office';

    // Function untuk test koneksi API
    const testApiConnection = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            
            if (!authHeader.Authorization) {
                return { success: false, message: 'Token authorization tidak ditemukan' };
            }
            
            const response = await fetch(`${API_BASE}/data`, {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            if (response.ok) {
                return { success: true, message: 'Koneksi API berhasil' };
            } else {
                return { success: false, message: `API connection failed: ${response.status}` };
            }
        } catch (error) {
            return { success: false, message: `Network error: ${error.message}` };
        }
    }, [getAuthHeader]);

    // Fetch data dari API dengan encrypted PID dari backend
    const fetchOffices = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(`${API_BASE}/data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });

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
            
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                const validatedData = result.data.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    name: item.name || 'Nama tidak tersedia',
                    description: item.description || '',
                    location: item.location || '',
                    id_kategori: item.id_kategori || 5,
                    status: item.status !== undefined ? item.status : 1,
                    order_no: item.order_no || index + 1
                }));
                
                setOffices(validatedData);
            } else {
                const errorMessage = result.message || result.error || 'Format response API tidak sesuai';
                throw new Error(errorMessage);
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback ke data dummy
            setOffices([
                {
                    pubid: "OFF001",
                    encryptedPid: "OFF001",
                    name: "Kandang Utama A",
                    id_kategori: 1,
                    description: "Kandang utama untuk sapi perah dengan fasilitas lengkap",
                    order_no: 1,
                    status: 1,
                    location: "Blok A-1, Sektor Utara"
                },
                {
                    pubid: "OFF002",
                    encryptedPid: "OFF002",
                    name: "Kandang Muda B",
                    id_kategori: 2,
                    description: "Kandang khusus untuk sapi muda dan anak sapi",
                    order_no: 2,
                    status: 1,
                    location: "Blok B-1, Sektor Timur"
                },
                {
                    pubid: "OFF003",
                    encryptedPid: "OFF003",
                    name: "Kandang Karantina",
                    id_kategori: 3,
                    description: "Kandang isolasi untuk sapi sakit atau dalam masa karantina",
                    order_no: 3,
                    status: 0,
                    location: "Blok C-1, Sektor Selatan"
                },
                {
                    pubid: "OFF004",
                    encryptedPid: "OFF004",
                    name: "Kandang Betina",
                    id_kategori: 1,
                    description: "Kandang khusus untuk sapi betina produktif",
                    order_no: 4,
                    status: 1,
                    location: "Blok A-2, Sektor Utara"
                },
                {
                    pubid: "OFF005",
                    encryptedPid: "OFF005",
                    name: "Office Administrasi",
                    id_kategori: 4,
                    description: "Ruang kantor untuk administrasi dan manajemen",
                    order_no: 5,
                    status: 1,
                    location: "Gedung Utama, Lantai 1"
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Create office
    const createOffice = useCallback(async (officeData) => {
        setLoading(true);
        setError(null);
        
        // Validasi khusus untuk id_kategori
        if (!officeData.id_kategori || officeData.id_kategori === '' || officeData.id_kategori === null || officeData.id_kategori === undefined) {
            const errorMsg = 'Kategori harus dipilih';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
        
        const kategoriId = parseInt(officeData.id_kategori, 10);
        if (isNaN(kategoriId) || kategoriId <= 0) {
            const errorMsg = 'ID Kategori tidak valid';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
        
        const requiredParams = ['name', 'description', 'order_no', 'status'];
        const missingParams = requiredParams.filter(param =>
            officeData[param] === undefined || officeData[param] === null || officeData[param] === ''
        );
        
        if (missingParams.length > 0) {
            const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
        
        try {
            const cleanOfficeData = {
                name: String(officeData.name).trim(),
                id_kategori: kategoriId,
                description: String(officeData.description).trim(),
                order_no: parseInt(officeData.order_no, 10),
                status: parseInt(officeData.status, 10),
                location: String(officeData.location || '').trim()
            };
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(cleanOfficeData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.data && typeof errorData.data === 'object') {
                        const validationErrors = Object.values(errorData.data).flat().join(', ');
                        throw new Error(`Validation error: ${validationErrors}`);
                    }
                    throw new Error(errorData.message || 'Gagal menambahkan data');
                } catch (e) {
                    throw new Error('Gagal menambahkan data');
                }
            }

            const result = await response.json();
            await fetchOffices();
            
            return { 
                success: true, 
                message: result.message || 'Data berhasil ditambahkan' 
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchOffices]);

    // Update office - menggunakan encrypted PID dari backend
    const updateOffice = useCallback(async (pubid, officeData) => {
        setLoading(true);
        setError(null);
        
        try {
            const office = offices.find(o => o.pubid === pubid);
            if (!office) {
                throw new Error('Office tidak ditemukan');
            }
            
            if (!office.encryptedPid) {
                office.encryptedPid = pubid;
            }
            
            // Validasi khusus untuk id_kategori
            if (!officeData.id_kategori || officeData.id_kategori === '' || officeData.id_kategori === null || officeData.id_kategori === undefined) {
                const errorMsg = 'Kategori harus dipilih';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
            
            const kategoriId = parseInt(officeData.id_kategori, 10);
            if (isNaN(kategoriId) || kategoriId <= 0) {
                const errorMsg = 'ID Kategori tidak valid';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
            
            const requiredParams = ['name', 'description', 'order_no', 'status'];
            const missingParams = requiredParams.filter(param =>
                officeData[param] === undefined || officeData[param] === null || officeData[param] === ''
            );
            
            if (missingParams.length > 0) {
                const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
            
            const cleanData = {
                name: String(officeData.name).trim(),
                id_kategori: kategoriId,
                description: String(officeData.description).trim(),
                order_no: parseInt(officeData.order_no, 10),
                status: parseInt(officeData.status, 10),
                location: String(officeData.location || '').trim()
            };
            
            const payload = {
                pid: office.encryptedPid,
                ...cleanData
            };
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                await fetchOffices();
                
                return {
                    success: true,
                    message: result.message || 'Data berhasil diperbarui'
                };
            } else {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.data && typeof errorData.data === 'object') {
                        const validationErrors = Object.values(errorData.data).flat().join(', ');
                        throw new Error(`Validation error: ${validationErrors}`);
                    }
                    throw new Error(errorData.message || errorData.data || 'Gagal memperbarui data');
                } catch (e) {
                    throw new Error(errorText || 'Gagal memperbarui data');
                }
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchOffices, getAuthHeader, offices]);

    // Delete office - menggunakan encrypted PID dari backend
    const deleteOffice = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const office = offices.find(o => o.pubid === pubid);
            if (!office) {
                throw new Error('Office tidak ditemukan');
            }
            
            if (!office.encryptedPid) {
                office.encryptedPid = pubid;
            }
            
            const payload = {
                pid: office.encryptedPid
            };
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                await fetchOffices();
                
                return {
                    success: true,
                    message: result.message || 'Data berhasil dihapus'
                };
            } else {
                const errorText = await response.text();
                let errorMessage = 'Gagal menghapus data';
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.data) {
                        errorMessage = errorData.data;
                    }
                } catch (e) {
                    errorMessage = errorText || 'Gagal menghapus data';
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchOffices, getAuthHeader, offices]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        if (!offices || !Array.isArray(offices)) {
            return [];
        }
        
        return offices.filter(item => {
            if (!item) return false;
            
            try {
                const matchesSearch =
                    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.pubid && item.pubid.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
                    
                const matchesStatus = filterStatus === 'all' ||
                    (filterStatus === 'active' && item.status === 1) ||
                    (filterStatus === 'inactive' && item.status === 0);
                    
                const matchesKategori = filterKategori === 'all' ||
                    (item.id_kategori !== undefined && item.id_kategori !== null &&
                     item.id_kategori.toString() === filterKategori);
                     
                return matchesSearch && matchesStatus && matchesKategori;
            } catch (error) {
                console.warn('Error filtering item:', item, error);
                return false;
            }
        });
    }, [offices, searchTerm, filterStatus, filterKategori]);

    // Statistics
    const stats = useMemo(() => {
        if (!offices || !Array.isArray(offices)) {
            return {
                total: 0,
                active: 0,
                inactive: 0,
                kandang: 0
            };
        }
        
        try {
            const total = offices.length;
            const active = offices.filter(item => item && item.status === 1).length;
            const inactive = offices.filter(item => item && item.status === 0).length;
            const kandang = offices.filter(item =>
                item && item.id_kategori !== undefined && item.id_kategori !== null &&
                [1, 2, 3].includes(item.id_kategori)
            ).length;
            
            return {
                total,
                active,
                inactive,
                kandang
            };
        } catch (error) {
            console.warn('Error calculating stats:', error);
            return {
                total: 0,
                active: 0,
                inactive: 0,
                kandang: 0
            };
        }
    }, [offices]);

    // Helper function untuk mendapatkan nama kategori - gunakan dari database
    const getKategoriName = useCallback((id_kategori) => {
        // Null/undefined checking
        if (id_kategori === null || id_kategori === undefined) {
            return 'Tidak Diketahui';
        }
        
        try {
            // Prioritas: gunakan data dari database
            if (kategoriList && kategoriList.length > 0) {
                return getKategoriNameFromDB(id_kategori);
            }
            
            // Fallback ke mapping lama jika data kategori belum loaded
            const kategoriMap = {
                1: 'Kandang Utama',
                2: 'Kandang Muda',
                3: 'Kandang Karantina',
                4: 'Office',
                5: 'Lainnya'
            };
            return kategoriMap[id_kategori] || 'Tidak Diketahui';
        } catch (error) {
            console.warn('Error in getKategoriName:', error);
            return 'Tidak Diketahui';
        }
    }, [kategoriList, getKategoriNameFromDB]);

    return {
        offices: filteredData,
        loading: loading || kategoriLoading,
        error: error || kategoriError,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterKategori,
        setFilterKategori,
        stats,
        fetchOffices,
        createOffice,
        updateOffice,
        deleteOffice,
        getKategoriName,
        testApiConnection,
        // Expose kategori data
        kategoriList,
        getActiveKategori,
        kategoriLoading,
        kategoriError
    };
};

export default useOffices;