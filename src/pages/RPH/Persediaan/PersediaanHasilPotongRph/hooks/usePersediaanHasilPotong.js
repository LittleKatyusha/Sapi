import { useState, useCallback, useRef } from 'react';
import PersediaanHasilPotongService from '../../../../../services/persediaanHasilPotongService';

const usePersediaanHasilPotong = (type) => {
  const [dataList, setDataList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverPagination, setServerPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10,
  });

  const drawRef = useRef(1);
  const searchTimeoutRef = useRef(null);

  const fetchData = useCallback(async (page = 1, perPage = 10, search = '') => {
    setLoading(true);
    setError(null);
    drawRef.current += 1;
    try {
      const res = await PersediaanHasilPotongService.getData(type, {
        draw: drawRef.current,
        start: (page - 1) * perPage,
        length: perPage,
        search,
        'search[value]': search,
      });

      if (res.success) {
        setDataList(res.data || []);
        setSummary(res.summary || null);
        const total = res.recordsFiltered || res.recordsTotal || 0;
        setServerPagination({
          currentPage: page,
          perPage,
          totalItems: total,
          totalPages: Math.ceil(total / perPage) || 1,
        });
      } else {
        setError(res.message || 'Gagal memuat data');
      }
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [type]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchData(1, serverPagination.perPage, term);
    }, 300);
  }, [fetchData, serverPagination.perPage]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    fetchData(1, serverPagination.perPage, '');
  }, [fetchData, serverPagination.perPage]);

  const handlePageChange = useCallback((page) => {
    fetchData(page, serverPagination.perPage, searchTerm);
  }, [fetchData, serverPagination.perPage, searchTerm]);

  const handlePerPageChange = useCallback((perPage) => {
    fetchData(1, perPage, searchTerm);
  }, [fetchData, searchTerm]);

  const refresh = useCallback(() => {
    fetchData(serverPagination.currentPage, serverPagination.perPage, searchTerm);
  }, [fetchData, serverPagination, searchTerm]);

  return {
    dataList,
    summary,
    loading,
    error,
    searchTerm,
    serverPagination,
    fetchData,
    handleSearch,
    clearSearch,
    handlePageChange,
    handlePerPageChange,
    refresh,
  };
};

export default usePersediaanHasilPotong;
