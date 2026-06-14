import { useState, useCallback, useRef } from 'react';
import PenjualanBoningService from '../../../../../services/penjualanBoningService';

const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

const usePenjualanBoning = () => {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [serverPagination, setServerPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0, perPage: 10,
  });
  const [pedagangList, setPedagangList] = useState([]);
  const [boningItems, setBoningItems] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const drawRef = useRef(1);
  const user = getCurrentUser();
  const idOffice = user?.id_office;

  const fetchData = useCallback(async (page = 1, perPage = 10, search = '', startDate = '', endDate = '') => {
    setLoading(true);
    setError(null);
    drawRef.current += 1;
    try {
      const res = await PenjualanBoningService.getData({
        draw: drawRef.current,
        start: (page - 1) * perPage,
        length: perPage,
        search,
        startDate,
        endDate,
        idOffice,
      });
      if (res.success) {
        setDataList(res.data);
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
  }, [idOffice]);

  const fetchPedagang = useCallback(async () => {
    if (!idOffice) return { success: false, data: [] };
    const res = await PenjualanBoningService.getPedagang(idOffice);
    if (res.success) setPedagangList(res.data);
    return res;
  }, [idOffice]);

  const fetchBoningItems = useCallback(async () => {
    const res = await PenjualanBoningService.getBoningItems();
    if (res.success) setBoningItems(res.data);
    return res;
  }, []);

  const fetchHarga = useCallback(async (pidPedagang) => {
    return PenjualanBoningService.getHarga(pidPedagang);
  }, []);

  const show = useCallback(async (pid) => {
    return PenjualanBoningService.show(pid);
  }, []);

  const store = useCallback(async (payload) => {
    setCreateLoading(true);
    try {
      return await PenjualanBoningService.store(payload);
    } finally {
      setCreateLoading(false);
    }
  }, []);

  const update = useCallback(async (payload) => {
    setUpdateLoading(true);
    try {
      return await PenjualanBoningService.update(payload);
    } finally {
      setUpdateLoading(false);
    }
  }, []);

  const hapus = useCallback(async (pid) => {
    setDeleteLoading(true);
    try {
      return await PenjualanBoningService.hapus(pid);
    } finally {
      setDeleteLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page) => {
    fetchData(page, serverPagination.perPage, searchTerm, dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination.perPage, searchTerm, dateRange]);

  const handlePerPageChange = useCallback((perPage) => {
    fetchData(1, perPage, searchTerm, dateRange.startDate, dateRange.endDate);
  }, [fetchData, searchTerm, dateRange]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    fetchData(1, serverPagination.perPage, term, dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination.perPage, dateRange]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    fetchData(1, serverPagination.perPage, '', dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination.perPage, dateRange]);

  const handleDateRange = useCallback((range) => {
    setDateRange(range);
    fetchData(1, serverPagination.perPage, searchTerm, range.startDate, range.endDate);
  }, [fetchData, serverPagination.perPage, searchTerm]);

  const clearDateRange = useCallback(() => {
    setDateRange({ startDate: '', endDate: '' });
    fetchData(1, serverPagination.perPage, searchTerm, '', '');
  }, [fetchData, serverPagination.perPage, searchTerm]);

  const refresh = useCallback(() => {
    fetchData(serverPagination.currentPage, serverPagination.perPage, searchTerm, dateRange.startDate, dateRange.endDate);
  }, [fetchData, serverPagination, searchTerm, dateRange]);

  return {
    dataList, loading, error,
    searchTerm, dateRange, serverPagination,
    pedagangList, boningItems,
    createLoading, updateLoading, deleteLoading,
    fetchData, fetchPedagang, fetchBoningItems, fetchHarga,
    show, store, update, hapus,
    handlePageChange, handlePerPageChange,
    handleSearch, clearSearch,
    handleDateRange, clearDateRange,
    refresh, idOffice,
  };
};

export default usePenjualanBoning;
