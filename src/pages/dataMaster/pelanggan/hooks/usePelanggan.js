import { useState, useMemo, useCallback, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const STORAGE_KEY = 'pelanggan-filters';

const DEFAULT_STATE = {
    page: 1,
    perPage: 10,
    search: '',
    sortField: 'id',
    sortDir: 'asc',
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

const usePelanggan = () => {
    const persisted = useMemo(loadPersistedState, []);

    const [pelanggan, setPelanggan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState(persisted.search);
    const [searchTerm, setSearchTerm] = useState(persisted.search);
    const [page, setPage] = useState(persisted.page);
    const [perPage, setPerPage] = useState(persisted.perPage);
    const [sortField, setSortField] = useState(persisted.sortField);
    const [sortDir, setSortDir] = useState(persisted.sortDir);
    const [selectedIds, setSelectedIds] = useState([]);

    const [meta, setMeta] = useState({
        total: 0,
        current_page: 1,
        per_page: perPage,
        last_page: 1,
        from: 0,
        to: 0,
    });

    const API_BASE = API_ENDPOINTS.MASTER.OUTLET;

    // Persist filter state
    useEffect(() => {
        const state = { page, perPage, search: searchInput, sortField, sortDir };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [page, perPage, searchInput, sortField, sortDir]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchTerm(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const fetchPelanggan = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                per_page: perPage,
                search: searchTerm,
                sort_field: sortField,
                sort_dir: sortDir,
                kategori: 2, // Filter kategori = 2 untuk pelanggan
            };

            const result = await HttpClient.get(`${API_BASE}/data`, { params, cache: false });

            if (result.status === 'ok' && result.data) {
                const payload = result.data;
                const rows = Array.isArray(payload.data) ? payload.data : [];
                const validatedData = rows.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    id: item.id || item.pubid,
                    name: item.nama || 'Nama tidak tersedia',
                    address: item.alamat || '-',
                    phone: item.kontak || '-',
                    status: 1, // Backend tidak punya kolom status; default aktif
                    description: '',
                    established: item.created_at || '',
                }));
                setPelanggan(validatedData);
                const m = payload.meta || {};
                setMeta({
                    total: m.total != null ? m.total : rows.length,
                    current_page: m.current_page != null ? m.current_page : page,
                    per_page: m.per_page != null ? m.per_page : perPage,
                    last_page: m.last_page != null ? m.last_page : 1,
                    from: m.from != null ? m.from : 0,
                    to: m.to != null ? m.to : 0,
                });
            } else {
                throw new Error('Format response API tidak sesuai');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            setPelanggan([]);
            setMeta({ total: 0, current_page: 1, per_page: perPage, last_page: 1, from: 0, to: 0 });
        } finally {
            setLoading(false);
        }
    }, [API_BASE, page, perPage, searchTerm, sortField, sortDir]);

    useEffect(() => {
        fetchPelanggan();
    }, [fetchPelanggan]);

    useEffect(() => {
        setSelectedIds([]);
    }, [searchTerm, page, perPage, sortField, sortDir]);

    const createPelanggan = useCallback(async (pelangganData) => {
        setLoading(true);
        setError(null);
        try {
            const cleanData = {
                nama: String(pelangganData.name).trim(),
                alamat: String(pelangganData.address || '').trim(),
                kontak: String(pelangganData.phone || '').trim(),
                kategori: 2,
            };
            const result = await HttpClient.post(`${API_BASE}/store`, cleanData);
            fetchPelanggan();
            return { success: true, message: result.message || 'Pelanggan berhasil ditambahkan' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchPelanggan]);

    const updatePelanggan = useCallback(async (pubid, pelangganData) => {
        setLoading(true);
        setError(null);
        try {
            const item = pelanggan.find((p) => p.pubid === pubid);
            if (!item) throw new Error('Pelanggan tidak ditemukan');
            const cleanData = {
                pid: item.encryptedPid || pubid,
                nama: String(pelangganData.name).trim(),
                alamat: String(pelangganData.address || '').trim(),
                kontak: String(pelangganData.phone || '').trim(),
                kategori: 2,
            };
            const result = await HttpClient.post(`${API_BASE}/update`, cleanData);
            fetchPelanggan();
            return { success: true, message: result.message || 'Pelanggan berhasil diperbarui' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchPelanggan, pelanggan]);

    const deletePelanggan = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        try {
            const item = pelanggan.find((p) => p.pubid === pubid);
            if (!item) throw new Error('Pelanggan tidak ditemukan');
            const result = await HttpClient.post(`${API_BASE}/hapus`, {
                pid: item.encryptedPid || pubid,
            });
            fetchPelanggan();
            return { success: true, message: result.message || 'Pelanggan berhasil dihapus' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchPelanggan, pelanggan]);

    const bulkDelete = useCallback(async (pubids) => {
        if (!pubids || pubids.length === 0) return { success: true, message: 'Tidak ada data dipilih' };
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled(
                pubids.map((pid) => {
                    const item = pelanggan.find((p) => p.pubid === pid);
                    if (!item) return Promise.resolve();
                    return HttpClient.post(`${API_BASE}/hapus`, {
                        pid: item.encryptedPid || pid,
                    });
                })
            );
            const failed = results.filter((r) => r.status === 'rejected');
            fetchPelanggan();
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
    }, [API_BASE, fetchPelanggan, pelanggan]);

    const stats = useMemo(() => ({
        total: meta.total,
        active: meta.total,
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
            if (prev.length === pelanggan.length && pelanggan.length > 0) return [];
            return pelanggan.map((p) => p.pubid);
        });
    }, [pelanggan]);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

    return {
        pelanggan,
        loading,
        error,
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
        // filters
        resetFilters,
        // selection
        selectedIds,
        toggleSelectId,
        toggleSelectAll,
        clearSelection,
        // stats
        stats,
        // CRUD
        fetchPelanggan,
        createPelanggan,
        updatePelanggan,
        deletePelanggan,
        bulkDelete,
    };
};

export default usePelanggan;
