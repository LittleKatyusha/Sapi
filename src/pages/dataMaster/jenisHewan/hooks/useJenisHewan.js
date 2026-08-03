import { useState, useMemo, useCallback, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const STORAGE_KEY = 'jenis-hewan-filters';

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

const useJenisHewan = () => {
    const persisted = useMemo(loadPersistedState, []);

    const [jenisHewan, setJenisHewan] = useState([]);
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

    const API_BASE = API_ENDPOINTS.MASTER.JENIS_HEWAN;

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

    const fetchJenisHewan = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                per_page: perPage,
                search: searchTerm,
                sort_field: sortField,
                sort_dir: sortDir,
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
                    order_no: item.order_no,
                    status: item.status !== undefined ? item.status : 1,
                    created_at: item.created_at || '',
                }));
                setJenisHewan(validatedData);
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
            setJenisHewan([]);
            setMeta({ total: 0, current_page: 1, per_page: perPage, last_page: 1, from: 0, to: 0 });
        } finally {
            setLoading(false);
        }
    }, [API_BASE, page, perPage, searchTerm, sortField, sortDir]);

    useEffect(() => {
        fetchJenisHewan();
    }, [fetchJenisHewan]);

    useEffect(() => {
        setSelectedIds([]);
    }, [searchTerm, page, perPage, sortField, sortDir]);

    const createJenisHewan = useCallback(async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const cleanData = {
                name: String(formData.name).trim(),
                description: String(formData.description || '').trim(),
            };
            if (formData.order_no != null && formData.order_no !== '') {
                cleanData.order_no = parseInt(formData.order_no, 10);
            }
            const result = await HttpClient.post(`${API_BASE}/store`, cleanData);
            fetchJenisHewan();
            return { success: true, message: result.message || 'Data berhasil ditambahkan' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchJenisHewan]);

    const updateJenisHewan = useCallback(async (pubid, formData) => {
        setLoading(true);
        setError(null);
        try {
            const item = jenisHewan.find((j) => j.pubid === pubid);
            if (!item) throw new Error('Jenis hewan tidak ditemukan');
            const cleanData = {
                pid: item.encryptedPid || pubid,
                name: String(formData.name).trim(),
                description: String(formData.description || '').trim(),
            };
            if (formData.order_no != null && formData.order_no !== '') {
                cleanData.order_no = parseInt(formData.order_no, 10);
            }
            const result = await HttpClient.post(`${API_BASE}/update`, cleanData);
            fetchJenisHewan();
            return { success: true, message: result.message || 'Data berhasil diperbarui' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchJenisHewan, jenisHewan]);

    const deleteJenisHewan = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        try {
            const item = jenisHewan.find((j) => j.pubid === pubid);
            if (!item) throw new Error('Jenis hewan tidak ditemukan');
            const result = await HttpClient.post(`${API_BASE}/hapus`, {
                pid: item.encryptedPid || pubid,
            });
            fetchJenisHewan();
            return { success: true, message: result.message || 'Data berhasil dihapus' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchJenisHewan, jenisHewan]);

    const bulkDelete = useCallback(async (pubids) => {
        if (!pubids || pubids.length === 0) return { success: true, message: 'Tidak ada data dipilih' };
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled(
                pubids.map((pid) => {
                    const item = jenisHewan.find((j) => j.pubid === pid);
                    if (!item) return Promise.resolve();
                    return HttpClient.post(`${API_BASE}/hapus`, {
                        pid: item.encryptedPid || pid,
                    });
                })
            );
            const failed = results.filter((r) => r.status === 'rejected');
            fetchJenisHewan();
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
    }, [API_BASE, fetchJenisHewan, jenisHewan]);

    const stats = useMemo(() => ({
        total: meta.total,
        active: meta.total,
        sapi: 0,
        domba: 0,
        kambing: 0,
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
            if (prev.length === jenisHewan.length && jenisHewan.length > 0) return [];
            return jenisHewan.map((j) => j.pubid);
        });
    }, [jenisHewan]);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

    return {
        jenisHewan,
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
        fetchJenisHewan,
        createJenisHewan,
        updateJenisHewan,
        deleteJenisHewan,
        bulkDelete,
    };
};

export default useJenisHewan;
