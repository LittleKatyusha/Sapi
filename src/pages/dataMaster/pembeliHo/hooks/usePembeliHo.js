import { useState, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const usePembeliHo = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchData = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/data`, {
        params: { draw: 1, start: 0, length: 1000 },
        cache: true,
      });

      let dataArray = [];
      let total = 0;
      if (result?.data) {
        dataArray = result.data;
        total = result.recordsTotal || dataArray.length;
      } else if (Array.isArray(result)) {
        dataArray = result;
        total = dataArray.length;
      }

      const mapped = dataArray.map((item, i) => ({
        id: item.id || null,
        pubid: item.pubid || `TEMP-${i}`,
        pid: item.pid || item.pubid,
        name: item.name || '',
        description: item.description || '',
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));

      setData(mapped);
      setTotalRecords(total);
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const createItem = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/store`, payload);
      if (result?.status === 'ok' || result?.data) {
        HttpClient.clearCache?.('pembeliho');
        await fetchData();
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal membuat data';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const updateItem = useCallback(async (pid, payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/update`, { pid, ...payload });
      if (result?.status === 'ok' || result?.data) {
        HttpClient.clearCache?.('pembeliho');
        await fetchData();
        return result;
      }
      throw new Error(result?.message || 'Gagal mengubah data');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal mengubah data';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const deleteItem = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PEMBELI_HO}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data !== undefined) {
        HttpClient.clearCache?.('pembeliho');
        await fetchData();
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghapus data';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

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
    searchTerm,
    setSearchTerm,
    stats,
  };
};

export default usePembeliHo;
