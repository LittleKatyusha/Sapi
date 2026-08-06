import { useState, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const usePembeliHo = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        draw: params.draw || 1,
        start: params.start ?? 0,
        length: params.length ?? 10,
        'search[value]': params.search || '',
        'order[0][column]': params.orderColumn ?? 1,
        'order[0][dir]': params.orderDir || 'asc',
        _ts: Date.now(),
      });

      const filters = params.filters || {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(`filters[${key}]`, value);
        }
      });

      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/data?${queryParams.toString()}`);

      const dataArray = result?.data || [];
      const mapped = dataArray.map((item) => ({
        id: item.id || null,
        pubid: item.pubid || '',
        pid: item.pid || item.pubid,
        name: item.name || '',
        description: item.description || '',
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));

      setData(mapped);
      setTotalRecords(result?.recordsTotal || 0);
      setFilteredRecords(result?.recordsFiltered || 0);
      return { success: true, data: mapped, recordsTotal: result?.recordsTotal || 0, recordsFiltered: result?.recordsFiltered || 0 };
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data';
      setError(msg);
      setData([]);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/store`, payload);
      if (result?.status === 'ok' || result?.data) {
        return { success: true, data: result.data };
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal membuat data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (pid, payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/update`, { pid, ...payload });
      if (result?.status === 'ok' || result?.data) {
        return { success: true, data: result.data };
      }
      throw new Error(result?.message || 'Gagal mengubah data');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal mengubah data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data !== undefined) {
        return { success: true };
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghapus data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const stats = useMemo(() => ({
    total: totalRecords,
    displayed: data.length,
  }), [totalRecords, data.length]);

  return {
    data,
    loading,
    error,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    totalRecords,
    filteredRecords,
    stats,
  };
};

export default usePembeliHo;
