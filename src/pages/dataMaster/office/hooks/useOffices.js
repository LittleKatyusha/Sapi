import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';
import useKategoriOffice from './useKategoriOffice';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useOffices = () => {
    const { getAuthHeader } = useAuthSecure();
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
    const API_BASE = API_ENDPOINTS.MASTER.OFFICE;

    // Function untuk test koneksi API
    const testApiConnection = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            
            if (!authHeader.Authorization) {
                return { success: false, message: 'Token authorization tidak ditemukan' };
            }
            
            const response = await HttpClient.head(`${API_BASE}/data`);
            return { success: true, message: 'Koneksi API berhasil' };
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
            
            const result = await HttpClient.get(`${API_BASE}/data`);
            
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                const validatedData = result.data.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    name: item.name || 'Nama tidak tersedia',
                    description: item.description || '',
                    location: item.location || '',
                    id_kategori: item.id_kategori || 5,

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

                    location: "Blok A-1, Sektor Utara"
                },
                {
                    pubid: "OFF002",
                    encryptedPid: "OFF002",
                    name: "Kandang Muda B",
                    id_kategori: 2,
                    description: "Kandang khusus untuk sapi muda dan anak sapi",

                    location: "Blok B-1, Sektor Timur"
                },
                {
                    pubid: "OFF003",
                    encryptedPid: "OFF003",
                    name: "Kandang Karantina",
                    id_kategori: 3,
                    description: "Kandang isolasi untuk sapi sakit atau dalam masa karantina",

                    location: "Blok C-1, Sektor Selatan"
                },
                {
                    pubid: "OFF004",
                    encryptedPid: "OFF004",
                    name: "Kandang Betina",
                    id_kategori: 1,
                    description: "Kandang khusus untuk sapi betina produktif",

                    location: "Blok A-2, Sektor Utara"
                },
                {
                    pubid: "OFF005",
                    encryptedPid: "OFF005",
                    name: "Office Administrasi",
                    id_kategori: 4,
                    description: "Ruang kantor untuk administrasi dan manajemen",

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
        
        try {
            const cleanOfficeData = {
                name: String(officeData.name).trim(),
                id_kategori: kategoriId,
                description: String(officeData.description).trim(),
                location: String(officeData.location || '').trim()
            };
            
            const result = await HttpClient.post(`${API_BASE}/store`, cleanOfficeData);
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
            
            const cleanData = {
                name: String(officeData.name).trim(),
                id_kategori: kategoriId,
                description: String(officeData.description).trim(),
                location: String(officeData.location || '').trim()
            };
            
            const payload = {
                pid: office.encryptedPid,
                ...cleanData
            };
            
            const result = await HttpClient.post(`${API_BASE}/update`, payload);
            await fetchOffices();
            
            return {
                success: true,
                message: result.message || 'Data berhasil diperbarui'
            };
            
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
            
            const result = await HttpClient.post(`${API_BASE}/hapus`, payload);
            await fetchOffices();
            
            return {
                success: true,
                message: result.message || 'Data berhasil dihapus'
            };
            
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
                    
                const matchesKategori = filterKategori === 'all' ||
                    (item.id_kategori !== undefined && item.id_kategori !== null &&
                     item.id_kategori.toString() === filterKategori);
                     
                return matchesSearch && matchesKategori;
            } catch (error) {
                console.warn('Error filtering item:', item, error);
                return false;
            }
        });
    }, [offices, searchTerm, filterKategori]);

    // Statistics
    const stats = useMemo(() => {
        if (!offices || !Array.isArray(offices)) {
            return {
                total: 0,
                kandang: 0
            };
        }
        
        try {
            const total = offices.length;
            const kandang = offices.filter(item =>
                item && item.id_kategori !== undefined && item.id_kategori !== null &&
                [1, 2, 3].includes(item.id_kategori)
            ).length;
            
            return {
                total,
                kandang
            };
        } catch (error) {
            console.warn('Error calculating stats:', error);
            return {
                total: 0,
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