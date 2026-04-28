import { useState, useEffect, useCallback, useRef } from 'react';
import PersediaanPakanService from '../../../../../services/persediaanPakanService';

const usePersediaanPakan = () => {
  // State
  const [persediaanData, setPersediaanData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalJumlah, setTotalJumlah] = useState(0);
  const [totalHarga, setTotalHarga] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Server-side pagination state
  const [serverPagination, setServerPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalRows: 0,
  });

  // DataTable params
  const [params, setParams] = useState({
    draw: 1,
    start: 0,
    length: 10,
    search: '',
    orderColumn: 0,
    orderDir: 'desc',
  });

  // Fetch resep pakan data
  const fetchPersediaanData = useCallback(async (customParams = null) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = customParams || params;
      const response = await PersediaanPakanService.getResepData(queryParams);
      
      if (response.success) {
        setPersediaanData(response.data || []);
        setTotalRecords(response.recordsTotal || 0);
        setTotalFiltered(response.recordsFiltered || 0);
        setTotalJumlah(response.total_jumlah || 0);
        setTotalHarga(response.total_harga || 0);
        
        // Update server pagination
        setServerPagination(prev => ({
          ...prev,
          totalRows: response.recordsFiltered || response.recordsTotal || 0,
        }));
      } else {
        setError(response.message || 'Gagal memuat data resep pakan');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Fetch data on mount and when params change
  useEffect(() => {
    fetchPersediaanData();
  }, [fetchPersediaanData]);

  // Update params and trigger refresh
  const updateParams = useCallback((newParams) => {
    setParams(prev => ({
      ...prev,
      ...newParams,
      draw: prev.draw + 1,
    }));
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchPersediaanData();
  }, [fetchPersediaanData]);

  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setSearchError(null);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      // Clear search
      setIsSearching(false);
      updateParams({
        search: '',
        start: 0,
      });
      setServerPagination(prev => ({ ...prev, currentPage: 1 }));
      return;
    }

    setIsSearching(true);

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      updateParams({
        search: value,
        start: 0,
      });
      setServerPagination(prev => ({ ...prev, currentPage: 1 }));
      setIsSearching(false);
    }, 500);
  }, [updateParams]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchError(null);
    setIsSearching(false);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    updateParams({
      search: '',
      start: 0,
    });
    setServerPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [updateParams]);

  // Handle page change (server-side)
  const handlePageChange = useCallback((page) => {
    const newStart = (page - 1) * serverPagination.perPage;
    updateParams({
      start: newStart,
    });
    setServerPagination(prev => ({ ...prev, currentPage: page }));
  }, [serverPagination.perPage, updateParams]);

  // Handle per page change (server-side)
  const handlePerPageChange = useCallback((newPerPage) => {
    updateParams({
      length: newPerPage,
      start: 0,
    });
    setServerPagination(prev => ({
      ...prev,
      currentPage: 1,
      perPage: newPerPage,
    }));
  }, [updateParams]);

  // Handle sort
  const handleSort = useCallback((column, direction) => {
    updateParams({
      orderColumn: column,
      orderDir: direction,
    });
  }, [updateParams]);

  // Stats for stat cards
  const stats = {
    totalResep: totalRecords,
    totalJumlah: totalJumlah,
    totalHarga: totalHarga,
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    persediaanData,
    loading,
    error,
    totalRecords,
    totalFiltered,
    totalJumlah,
    totalHarga,
    params,
    searchTerm,
    isSearching,
    searchError,
    serverPagination,
    stats,
    fetchPersediaanData,
    refresh,
    updateParams,
    handleSearch,
    clearSearch,
    handlePageChange,
    handlePerPageChange,
    handleSort,
  };
};

export default usePersediaanPakan;
