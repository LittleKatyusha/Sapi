import { useState, useMemo, useCallback, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const STORAGE_KEY = 'supplier-filters';

const DEFAULT_STATE = {
    page: 1,
    perPage: 10,
    search: '',
    sortField: 'id',
    sortDir: 'asc',
    filterJenis: 'all',
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

const useSuppliers = () => {
    const persisted = useMemo(loadPersistedState, []);

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState(persisted.search);
    const [searchTerm, setSearchTerm] = useState(persisted.search);
    const [page, setPage] = useState(persisted.page);
    const [perPage, setPerPage] = useState(persisted.perPage);
    const [sortField, setSortField] = useState(persisted.sortField);
    const [sortDir, setSortDir] = useState(persisted.sortDir);
    const [filterJenis, setFilterJenis] = useState(persisted.filterJenis);
    const [filterKategori, setFilterKategori] = useState(persisted.filterKategori);
    const [selectedIds, setSelectedIds] = useState([]);

    const [meta, setMeta] = useState({
        total: 0,
        current_page: 1,
        per_page: perPage,
        last_page: 1,
        from: 0,
        to: 0,
    });

    const API_BASE = API_ENDPOINTS.MASTER.SUPPLIER;

    // Persist filter state
    useEffect(() => {
        const state = {
            page,
            perPage,
            search: searchInput,
            sortField,
            sortDir,
            filterJenis,
            filterKategori,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [page, perPage, searchInput, sortField, sortDir, filterJenis, filterKategori]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchTerm(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const fetchSuppliers = useCallback(async () => {
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
            if (filterJenis && filterJenis !== 'all') params.jenis_supplier = filterJenis;
            if (filterKategori && filterKategori !== 'all') params.kategori_supplier = filterKategori;

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
                    address: item.address || '',
                    jenis_supplier: item.jenis_supplier || '-',
                    jenis_supplier_raw: item.jenis_supplier_raw != null ? item.jenis_supplier_raw : item.jenis_supplier,
                    kategori_supplier: item.kategori_supplier || '-',
                    kategori_supplier_raw: item.kategori_supplier_raw != null ? item.kategori_supplier_raw : item.kategori_supplier,
                    created_at: item.created_at || '',
                }));
                setSuppliers(validatedData);
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
            setSuppliers([]);
            setMeta({ total: 0, current_page: 1, per_page: perPage, last_page: 1, from: 0, to: 0 });
        } finally {
            setLoading(false);
        }
    }, [API_BASE, page, perPage, searchTerm, sortField, sortDir, filterJenis, filterKategori]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    useEffect(() => {
        setSelectedIds([]);
    }, [searchTerm, page, perPage, sortField, sortDir, filterJenis, filterKategori]);

    // Create
    const createSupplier = useCallback(async (supplierData) => {
        setLoading(true);
        setError(null);
        try {
            const cleanData = {
                name: String(supplierData.name).trim(),
                description: String(supplierData.description || '').trim(),
                address: String(supplierData.address || '').trim(),
                jenis_supplier: parseInt(supplierData.jenis_supplier, 10),
                kategori_supplier: parseInt(supplierData.kategori_supplier, 10),
            };
            const result = await HttpClient.post(`${API_BASE}/store`, cleanData);
            fetchSuppliers();
            return { success: true, message: result.message || 'Data berhasil ditambahkan' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchSuppliers]);

    // Update
    const updateSupplier = useCallback(async (pubid, supplierData) => {
        setLoading(true);
        setError(null);
        try {
            const supplier = suppliers.find((s) => s.pubid === pubid);
            if (!supplier) throw new Error('Supplier tidak ditemukan');
            const cleanData = {
                pid: supplier.encryptedPid || pubid,
                name: String(supplierData.name).trim(),
                description: String(supplierData.description || '').trim(),
                address: String(supplierData.address || '').trim(),
                jenis_supplier: parseInt(supplierData.jenis_supplier, 10),
                kategori_supplier: parseInt(supplierData.kategori_supplier, 10),
            };
            const result = await HttpClient.post(`${API_BASE}/update`, cleanData);
            fetchSuppliers();
            return { success: true, message: result.message || 'Data berhasil diperbarui' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchSuppliers, suppliers]);

    // Delete
    const deleteSupplier = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        try {
            const supplier = suppliers.find((s) => s.pubid === pubid);
            if (!supplier) throw new Error('Supplier tidak ditemukan');
            const result = await HttpClient.post(`${API_BASE}/hapus`, {
                pid: supplier.encryptedPid || pubid,
            });
            fetchSuppliers();
            return { success: true, message: result.message || 'Data berhasil dihapus' };
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, fetchSuppliers, suppliers]);

    // Bulk delete
    const bulkDelete = useCallback(async (pubids) => {
        if (!pubids || pubids.length === 0) return { success: true, message: 'Tidak ada data dipilih' };
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled(
                pubids.map((pid) => {
                    const supplier = suppliers.find((s) => s.pubid === pid);
                    if (!supplier) return Promise.resolve();
                    return HttpClient.post(`${API_BASE}/hapus`, {
                        pid: supplier.encryptedPid || pid,
                    });
                })
            );
            const failed = results.filter((r) => r.status === 'rejected');
            fetchSuppliers();
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
    }, [API_BASE, fetchSuppliers, suppliers]);

    // Stats
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
        setFilterJenis('all');
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
            if (prev.length === suppliers.length && suppliers.length > 0) return [];
            return suppliers.map((s) => s.pubid);
        });
    }, [suppliers]);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

    return {
        suppliers,
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
        filterJenis,
        setFilterJenis,
        filterKategori,
        setFilterKategori,
        resetFilters,
        // selection
        selectedIds,
        toggleSelectId,
        toggleSelectAll,
        clearSelection,
        // stats
        stats,
        // CRUD
        fetchSuppliers,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        bulkDelete,
    };
};

export default useSuppliers;
