import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';
import useKategoriOffice from './useKategoriOffice';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const STORAGE_KEY = 'kandang-office-filters';

const DEFAULT_STATE = {
    page: 1,
    perPage: 10,
    search: '',
    sortField: 'id',
    sortDir: 'asc',
    filterKategori: 'all',
};

const loadPersistedState = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_STATE;
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_STATE, ...parsed, page: 1 };
    } catch {
        return DEFAULT_STATE;
    }
};

const useOffices = () => {
    const { getAuthHeader } = useAuthSecure();
    const persisted = useMemo(loadPersistedState, []);

    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(persisted.page);
    const [perPage, setPerPage] = useState(persisted.perPage);
    const [searchInput, setSearchInput] = useState(persisted.search);
    const [searchTerm, setSearchTerm] = useState(persisted.search);
    const [sortField, setSortField] = useState(persisted.sortField);
    const [sortDir, setSortDir] = useState(persisted.sortDir);
    const [filterKategori, setFilterKategori] = useState(persisted.filterKategori);

    const [meta, setMeta] = useState({
        total: 0,
        current_page: 1,
        per_page: perPage,
        last_page: 1,
        from: 0,
        to: 0,
    });

    const [selectedIds, setSelectedIds] = useState([]);
    const debounceRef = useRef(null);

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

    // Persist filter state to localStorage
    useEffect(() => {
        const state = { page, perPage, search: searchInput, sortField, sortDir, filterKategori };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // ignore quota errors
        }
    }, [page, perPage, searchInput, sortField, sortDir, filterKategori]);

    // Debounced search (400ms)
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            setSearchTerm(searchInput);
            setPage(1);
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchInput]);

    // Fetch data dari API dengan server-side pagination
    const fetchOffices = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }

            const params = {
                page,
                per_page: perPage,
                search: searchTerm,
                sort_field: sortField,
                sort_dir: sortDir,
                id_kategori: filterKategori,
            };

            const result = await HttpClient.get(`${API_BASE}/data`, { params, cache: false });

            if (result.status === 'ok' && result.data) {
                const payload = result.data;
                const rows = Array.isArray(payload.data) ? payload.data : [];
                const validatedData = rows.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    id: item.id,
                    name: item.name || 'Nama tidak tersedia',
                    description: item.description || '',
                    location: item.location || '',
                    id_kategori: item.id_kategori || 5,
                }));

                setOffices(validatedData);
                setMeta(payload.meta || {
                    total: rows.length,
                    current_page: page,
                    per_page: perPage,
                    last_page: 1,
                    from: rows.length > 0 ? (page - 1) * perPage + 1 : 0,
                    to: rows.length,
                });
            } else {
                const errorMessage = result.message || result.error || 'Format response API tidak sesuai';
                throw new Error(errorMessage);
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            setOffices([]);
            setMeta({ total: 0, current_page: page, per_page: perPage, last_page: 1, from: 0, to: 0 });
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, API_BASE, page, perPage, searchTerm, sortField, sortDir, filterKategori]);

    // Refetch saat pagination/sort/filter berubah
    useEffect(() => {
        fetchOffices();
    }, [fetchOffices]);

    // Reset selection saat data berubah
    useEffect(() => {
        setSelectedIds([]);
    }, [page, perPage, searchTerm, sortField, sortDir, filterKategori]);

    // Function untuk test koneksi API
    const testApiConnection = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                return { success: false, message: 'Token authorization tidak ditemukan' };
            }
            await HttpClient.head(`${API_BASE}/data`);
            return { success: true, message: 'Koneksi API berhasil' };
        } catch (error) {
            return { success: false, message: `Network error: ${error.message}` };
        }
    }, [getAuthHeader, API_BASE]);

    const testEncryption = useCallback(async () => ({ success: true, message: 'ok' }), []);
    const analyzeEncryption = useCallback(async () => ({ success: true, message: 'ok' }), []);

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
    }, [API_BASE, fetchOffices]);

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
    }, [API_BASE, fetchOffices, offices]);

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
    }, [API_BASE, fetchOffices, offices]);

    // Bulk delete offices
    const bulkDelete = useCallback(async (pubids) => {
        if (!pubids || pubids.length === 0) return { success: true, message: 'Tidak ada data dipilih' };
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled(
                pubids.map((pid) => {
                    const office = offices.find((o) => o.pubid === pid);
                    if (!office) return Promise.resolve();
                    return HttpClient.post(`${API_BASE}/hapus`, { pid: office.encryptedPid || pid });
                })
            );
            const failed = results.filter((r) => r.status === 'rejected');
            await fetchOffices();
            if (failed.length > 0) {
                return { success: false, message: `${failed.length} dari ${pubids.length} gagal dihapus` };
            }
            return { success: true, message: `${pubids.length} data berhasil dihapus` };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchOffices, offices]);

    // Statistics
    const stats = useMemo(() => ({
        total: meta.total,
        kandang: meta.total,
    }), [meta.total]);

    const handleSort = useCallback((field) => {
        if (sortField === field) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
        setPage(1);
    }, [sortField]);

    const resetFilters = useCallback(() => {
        setSearchInput('');
        setSearchTerm('');
        setFilterKategori('all');
        setSortField('id');
        setSortDir('asc');
        setPage(1);
    }, []);

    const toggleSelectId = useCallback((pubid) => {
        setSelectedIds((prev) =>
            prev.includes(pubid) ? prev.filter((id) => id !== pubid) : [...prev, pubid]
        );
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds((prev) => {
            if (prev.length === offices.length && offices.length > 0) return [];
            return offices.map((o) => o.pubid);
        });
    }, [offices]);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

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
        offices,
        loading: loading || kategoriLoading,
        error: error || kategoriError,
        // search
        searchInput,
        setSearchInput,
        searchTerm,
        // pagination
        page,
        setPage,
        perPage,
        setPerPage,
        meta,
        // sorting
        sortField,
        sortDir,
        handleSort,
        // filter
        filterKategori,
        setFilterKategori,
        resetFilters,
        // selection (bulk)
        selectedIds,
        toggleSelectId,
        toggleSelectAll,
        clearSelection,
        // stats
        stats,
        // CRUD
        fetchOffices,
        createOffice,
        updateOffice,
        deleteOffice,
        bulkDelete,
        getKategoriName,
        testApiConnection,
        testEncryption,
        analyzeEncryption,
        // kategori data
        kategoriList,
        getActiveKategori,
        kategoriLoading,
        kategoriError,
    };
};

export default useOffices;