import { useState, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useDaging = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.DAGING}/data`, { cache: true });
      const arr = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setData(arr);
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
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.DAGING}/store`, payload);
      if (result?.status === 'ok' || result?.data) {
        HttpClient.clearCache?.('daging');
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
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.DAGING}/update`, { pid, ...payload });
      if (result?.status === 'ok' || result?.data) {
        HttpClient.clearCache?.('daging');
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
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.DAGING}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data !== undefined) {
        HttpClient.clearCache?.('daging');
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

  const stats = useMemo(() => ({ total: data.length }), [data.length]);

  return { data, loading, error, fetchData, createItem, updateItem, deleteItem, searchTerm, setSearchTerm, stats };
};

export default useDaging;
