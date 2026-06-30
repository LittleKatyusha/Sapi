import { useState, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useItemPotong = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [jenisPotongOptions, setJenisPotongOptions] = useState([]);
  const [jenisPotongLoading, setJenisPotongLoading] = useState(false);
  const [jenisPotongError, setJenisPotongError] = useState(null);

  const fetchJenisPotongOptions = useCallback(async () => {
    setJenisPotongLoading(true);
    setJenisPotongError(null);

    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group: 'jenis_potong',
      });

      const rows = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setJenisPotongOptions(
        rows.map((item) => ({
          value: Number(item.value ?? item.id),
          label: item.name || String(item.value ?? item.id),
        }))
      );
    } catch (err) {
      const message = err.message || 'Gagal memuat opsi jenis potong';
      setJenisPotongError(message);
      setJenisPotongOptions([]);
    } finally {
      setJenisPotongLoading(false);
    }
  }, []);

  const fetchData = useCallback(async (searchValue = '') => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        draw: 1,
        start: 0,
        length: 10000,
        'search[value]': searchValue || '',
        'order[0][column]': 0,
        'order[0][dir]': 'asc',
        t: Date.now(),
      };

      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_POTONG}/data`, { params });

      let dataArray = [];
      let total = 0;

      if (result?.data) {
        dataArray = result.data;
        total = result.recordsTotal || result.recordsFiltered || dataArray.length;
      } else if (Array.isArray(result)) {
        dataArray = result;
        total = dataArray.length;
      }

      const validatedData = dataArray.map((item, index) => ({
        pubid: item.pubid || `TEMP-${index + 1}`,
        pid: item.pid || item.pubid,
        name: item.name || 'Nama tidak tersedia',
        id_jenis_potong: item.id_jenis_potong || null,
        jenis_potong: item.jenis_potong || '',
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));

      setData(validatedData);
      setTotalRecords(total);
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_POTONG}/store`, payload);
      if (result?.status === 'ok' || result?.data) {
        await fetchData();
        await fetchJenisPotongOptions();
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const message = err.message || 'Gagal membuat item potong';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchData, fetchJenisPotongOptions]);

  const updateItem = useCallback(async (pid, payload) => {
    setLoading(true);
    setError(null);

    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_POTONG}/update`, { pid, ...payload });
      if (result?.status === 'ok' || result?.data) {
        await fetchData();
        await fetchJenisPotongOptions();
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const message = err.message || 'Gagal memperbarui item potong';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchData, fetchJenisPotongOptions]);

  const deleteItem = useCallback(async (pid) => {
    setLoading(true);
    setError(null);

    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_POTONG}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        await fetchData();
        await fetchJenisPotongOptions();
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const message = err.message || 'Gagal menghapus item potong';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchData, fetchJenisPotongOptions]);

  const stats = useMemo(() => ({
    total: totalRecords || data.length,
    displayed: data.length,
  }), [data.length, totalRecords]);

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
    totalRecords,
    jenisPotongOptions,
    jenisPotongLoading,
    jenisPotongError,
    refreshJenisPotongOptions: fetchJenisPotongOptions,
  };
};

export default useItemPotong;
