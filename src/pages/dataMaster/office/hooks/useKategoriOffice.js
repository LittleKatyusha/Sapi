import { useState, useCallback, useEffect } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useKategoriOffice = () => {
    const { getAuthHeader } = useAuthSecure();
    const [kategoriList, setKategoriList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // API Base URL untuk system parameter
    const API_BASE = API_ENDPOINTS.SYSTEM.PARAMETERS;

    // Fetch kategori office dari sys_ms_parameter
    const fetchKategoriOffice = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan');
            }
            
            const result = await HttpClient.get(`${API_BASE}/data?group=kategori_office`);
            
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // Filter hanya row dengan group 'kategori_office'
                const filteredKategori = result.data.filter(item => item.group === 'kategori_office');
                // Filter hanya row dengan group 'status_active' untuk status
                const filteredStatus = result.data.filter(item => item.group === 'status_active');

                // Mapping kategori dan pastikan id/value selalu unik
                const mappedKategori = filteredKategori.map((item, idx) => {
                    const kategoriData = {
                        id: item.id || item.kode || `kategori-${idx}`,
                        value: item.value || item.kode || item.id || `kategori-${idx}`, // Gunakan value asli dari API
                        label: item.nama || item.name || item.description || item.label || `Kategori ${idx + 1}`,
                        description: item.keterangan || item.description || '',
                        order_no: item.order_no || idx,
                        status: item.status !== undefined ? item.status : 1
                    };
                    return kategoriData;
                });
                // Sort berdasarkan order_no
                mappedKategori.sort((a, b) => a.order_no - b.order_no);
                setKategoriList(mappedKategori);

                // Jika Anda ingin menyimpan status aktif ke state lain, tambahkan state dan setter
                // Contoh:
                // setStatusList(filteredStatus);
            } else {
                throw new Error('Format response tidak sesuai');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback ke data hardcoded jika API gagal
            setKategoriList([
                { id: 1, value: 1, label: 'Kandang Utama', description: 'Kandang utama untuk ternak dewasa', order_no: 1, status: 1 },
                { id: 2, value: 2, label: 'Kandang Muda', description: 'Kandang untuk ternak muda', order_no: 2, status: 1 },
                { id: 3, value: 3, label: 'Kandang Karantina', description: 'Kandang isolasi dan karantina', order_no: 3, status: 1 },
                { id: 4, value: 4, label: 'Office', description: 'Ruang kantor dan administrasi', order_no: 4, status: 1 },
                { id: 5, value: 5, label: 'Lainnya', description: 'Kategori lainnya', order_no: 5, status: 1 }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Helper function untuk mendapatkan nama kategori berdasarkan ID/value
    const getKategoriName = useCallback((idKategori) => {
        // Null/undefined checking
        if (!idKategori || !kategoriList || kategoriList.length === 0) {
            return 'Tidak Diketahui';
        }
        
        try {
            const kategori = kategoriList.find(k => {
                return k && k.value !== undefined && k.value !== null &&
                    k.value.toString() === idKategori.toString();
            });
            
            return kategori ? kategori.label : 'Tidak Diketahui';
        } catch (error) {
            return 'Tidak Diketahui';
        }
    }, [kategoriList]);

    // Helper function untuk mendapatkan kategori aktif saja
    const getActiveKategori = useCallback(() => {
        if (!kategoriList || kategoriList.length === 0) {
            return [];
        }
        
        try {
            return kategoriList.filter(k => k && k.status === 1);
        } catch (error) {
            return [];
        }
    }, [kategoriList]);

    // Auto fetch saat hook di-mount
    useEffect(() => {
        fetchKategoriOffice();
    }, [fetchKategoriOffice]);

    return {
        kategoriList,
        loading,
        error,
        fetchKategoriOffice,
        getKategoriName,
        getActiveKategori
    };
};

export default useKategoriOffice;