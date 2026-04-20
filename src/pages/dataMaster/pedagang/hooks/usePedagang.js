import { useState, useCallback, useRef, useEffect } from 'react';
import PedagangService from '../../../../services/pedagangService';

const usePedagang = () => {
  const [pedagangList, setPedagangList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pasarFilter, setPasarFilter] = useState('');

  // Server-side pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10,
  });

  // Statistics state
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Debounce search term
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm]);

  /**
   * Fetch paginated pedagang list from server
   */
  const fetchPedagang = useCallback(async (page = 1, perPage = 10) => {
    setLoading(true);
    setError(null);

    try {
      const start = (page - 1) * perPage;
      const result = await PedagangService.getData({
        draw: 1,
        start,
        length: perPage,
        search: debouncedSearch,
        orderColumn: 0,
        orderDir: 'desc',
        status_pedagang: statusFilter,
        pasar: pasarFilter,
      });

      if (result.success) {
        setPedagangList(result.data || []);
        setPagination({
          currentPage: page,
          totalPages: Math.ceil((result.recordsFiltered || 0) / perPage),
          totalItems: result.recordsFiltered || 0,
          perPage,
        });
      } else {
        setError(result.message);
        setPedagangList([]);
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data pedagang');
      setPedagangList([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pasarFilter]);

  /**
   * Fetch dashboard statistics
   */
  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await PedagangService.getStatistic();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch {
      // Silently fail for stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Get pedagang detail by encrypted PID
   */
  const fetchDetail = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PedagangService.show(pid);
      if (result.success) {
        return result;
      }
      return { success: false, message: result.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new pedagang
   */
  const createPedagang = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PedagangService.store(payload);
      if (result.success) {
        await fetchPedagang(1, pagination.perPage);
      }
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPedagang, pagination.perPage]);

  /**
   * Update existing pedagang
   */
  const updatePedagang = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PedagangService.update(payload);
      if (result.success) {
        await fetchPedagang(pagination.currentPage, pagination.perPage);
      }
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPedagang, pagination.currentPage, pagination.perPage]);

  /**
   * Delete pedagang
   */
  const deletePedagang = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PedagangService.delete(pid);
      if (result.success) {
        await fetchPedagang(pagination.currentPage, pagination.perPage);
        await fetchStatistics();
      }
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPedagang, fetchStatistics, pagination.currentPage, pagination.perPage]);

  /**
   * Record transaksi (angkatan)
   */
  const storeTransaksi = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PedagangService.storeTransaksi(payload);
      if (result.success) {
        await fetchPedagang(pagination.currentPage, pagination.perPage);
        await fetchStatistics();
      }
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPedagang, fetchStatistics, pagination.currentPage, pagination.perPage]);

  /**
   * Record setoran (payment)
   */
  const storeSetoran = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PedagangService.storeSetoran(payload);
      if (result.success) {
        await fetchPedagang(pagination.currentPage, pagination.perPage);
        await fetchStatistics();
      }
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPedagang, fetchStatistics, pagination.currentPage, pagination.perPage]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page) => {
    fetchPedagang(page, pagination.perPage);
  }, [fetchPedagang, pagination.perPage]);

  /**
   * Handle per page change
   */
  const handlePerPageChange = useCallback((newPerPage, page) => {
    fetchPedagang(page, newPerPage);
  }, [fetchPedagang]);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setPasarFilter('');
  }, []);

  return {
    pedagangList,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    pasarFilter,
    setPasarFilter,
    pagination,
    statistics,
    statsLoading,
    fetchPedagang,
    fetchStatistics,
    fetchDetail,
    createPedagang,
    updatePedagang,
    deletePedagang,
    storeTransaksi,
    storeSetoran,
    handlePageChange,
    handlePerPageChange,
    resetFilters,
  };
};

export default usePedagang;
