import { useState, useMemo, useCallback, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const STORAGE_KEY = 'outlet-filters';

const DEFAULT_STATE = {
    page: 1,
    perPage: 10,
    search: '',
    sortField: 'id',
    sortDir: 'asc',
    filterStatus: 'all',
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

const useOutlets = () => {
    const persisted = useMemo(loadPersistedState, []);

    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState(persisted.search);
    const [searchTerm, setSearchTerm] = useState(persisted.search);
    const [page, setPage] = useState(persisted.page);
    const [perPage, setPerPage] = useState(persisted.perPage);
    const [sortField, setSortField] = useState(persisted.sortField);
    const [sortDir, setSortDir] = useState(persisted.sortDir);
    const [filterStatus, setFilterStatus] = useState(persisted.filterStatus);
    const [selectedIds, setSelectedIds] = useState([]);

    const [meta, setMeta] = useState({
        total: 0,
        current_page: 1,
        per_page: perPage,
        last_page: 1,
        from: 0,
        to: 0,
    });

    // Persist filter state to localStorage
    useEffect(() => {
        const state = {
            page,
            perPage,
            search: searchInput,
            sortField,
            sortDir,
            filterStatus,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [page, perPage, searchInput, sortField, sortDir, filterStatus]);

    // Debounce search input → searchTerm (400ms)
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchTerm(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const fetchOutlets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                per_page: perPage,
                search: searchTerm,
                sort_field: sortField,
                sort_dir: sortDir,
                kategori: 1,
            };

            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.OUTLET}/data`, { params, cache: false });

            if (result.status === 'ok' && result.data) {
                const payload = result.data;
                const rows = Array.isArray(payload.data) ? payload.data : [];
                const validatedData = rows.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    id: item.id,
                    name: item.nama || 'Nama tidak tersedia',
                    location: item.alamat || '-',
                    phone: item.kontak || '-',
                    status: item.status !== undefined ? item.status : 1,
                    description: item.description || '',
                    established: item.created_at || new Date().toISOString(),
                }));
                setOutlets(validatedData);
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
            setOutlets([]);
            setMeta({ total: 0, current_page: 1, per_page: perPage, last_page: 1, from: 0, to: 0 });
        } finally {
            setLoading(false);
        }
    }, [page, perPage, searchTerm, sortField, sortDir]);

    // Refetch when params change
    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    // Clear selection when data params change
    useEffect(() => {
        setSelectedIds([]);
    }, [searchTerm, page, perPage, sortField, sortDir, filterStatus]);

    // Create outlet
    const createOutlet = useCallback(async (outletData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.OUTLET}/store`, {
                nama: outletData.name,
                alamat: outletData.location,
                kontak: outletData.phone,
                status: outletData.status,
                kategori: 1,
            });
            fetchOutlets();
            return { success: true, message: result.message || 'Outlet berhasil ditambahkan' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchOutlets]);

    // Update outlet
    const updateOutlet = useCallback(async (pubid, outletData) => {
        setLoading(true);
        setError(null);
        try {
            const outlet = outlets.find((o) => o.pubid === pubid);
            if (!outlet) throw new Error('Outlet tidak ditemukan');
            const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.OUTLET}/update`, {
                pid: outlet.encryptedPid || outlet.pubid,
                nama: outletData.name,
                alamat: outletData.location,
                kontak: outletData.phone,
                status: outletData.status,
                kategori: 1,
            });
            fetchOutlets();
            return { success: true, message: result.message || 'Outlet berhasil diperbarui' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchOutlets, outlets]);

    // Delete outlet
    const deleteOutlet = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        try {
            const outlet = outlets.find((o) => o.pubid === pubid);
            if (!outlet) throw new Error('Outlet tidak ditemukan');
            const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.OUTLET}/hapus`, {
                pid: outlet.encryptedPid || outlet.pubid,
            });
            fetchOutlets();
            return { success: true, message: result.message || 'Outlet berhasil dihapus' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchOutlets, outlets]);

    // Bulk delete
    const bulkDelete = useCallback(async (pubids) => {
        if (!pubids || pubids.length === 0) return { success: true, message: 'Tidak ada data dipilih' };
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled(
                pubids.map((pid) => {
                    const outlet = outlets.find((o) => o.pubid === pid);
                    if (!outlet) return Promise.resolve();
                    return HttpClient.post(`${API_ENDPOINTS.MASTER.OUTLET}/hapus`, {
                        pid: outlet.encryptedPid || pid,
                    });
                })
            );
            const failed = results.filter((r) => r.status === 'rejected');
            fetchOutlets();
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
    }, [fetchOutlets, outlets]);

    // Statistics
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
        setFilterStatus('all');
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
            if (prev.length === outlets.length && outlets.length > 0) return [];
            return outlets.map((o) => o.pubid);
        });
    }, [outlets]);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

    return {
        outlets,
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
        // filter
        filterStatus,
        setFilterStatus,
        resetFilters,
        // selection
        selectedIds,
        toggleSelectId,
        toggleSelectAll,
        clearSelection,
        // stats
        stats,
        // CRUD
        fetchOutlets,
        createOutlet,
        updateOutlet,
        deleteOutlet,
        bulkDelete,
    };
};

export default useOutlets;
