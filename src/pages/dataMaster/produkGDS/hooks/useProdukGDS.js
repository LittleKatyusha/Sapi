import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useProdukGDS = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);

  const API_BASE = API_ENDPOINTS.MASTER.BARANG;

  const fetchProdukGDS = useCallback(async (params = {}) => {
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

      const result = await HttpClient.get(`${API_BASE}/data?${queryParams.toString()}`);

      const dataArray = result?.data || [];
      const mapped = dataArray.map((item, index) => ({
        pid: item.pid || item.pubid || `TEMP-${index + 1}`,
        rawPubid: item.pubid,
        id: item.id,
        name: item.name || 'Nama tidak tersedia',
        description: item.description || '',
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));

      setData(mapped);
      setTotalRecords(result?.recordsTotal || 0);
      setFilteredRecords(result?.recordsFiltered || 0);
      return {
        success: true,
        data: mapped,
        recordsTotal: result?.recordsTotal || 0,
        recordsFiltered: result?.recordsFiltered || 0,
      };
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data';
      setError(msg);
      setData([]);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const createProdukGDS = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_BASE}/store`, payload);
      return { success: true, message: result?.message || 'Data berhasil ditambahkan' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal membuat data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const updateProdukGDS = useCallback(async (pid, payload) => {
    setLoading(true);
    setError(null);
    try {
      const item = data.find((d) => d.pid === pid);
      const actualPid = item?.rawPubid || item?.pid || pid;
      const result = await HttpClient.post(`${API_BASE}/update`, { pid: String(actualPid).trim(), ...payload });
      return { success: true, message: result?.message || 'Data berhasil diperbarui' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal memperbarui data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [API_BASE, data]);

  const deleteProdukGDS = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const item = data.find((d) => d.pid === pid);
      const actualPid = item?.rawPubid || item?.pid || pid;
      const result = await HttpClient.post(`${API_BASE}/hapus`, { pid: String(actualPid).trim() });
      return { success: true, message: result?.message || 'Data berhasil dihapus' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menghapus data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [API_BASE, data]);

  const stats = useMemo(() => ({
    total: totalRecords,
    displayed: data.length,
  }), [totalRecords, data]);

  return {
    produkGDS: data,
    data,
    loading,
    error,
    stats,
    totalRecords,
    filteredRecords,
    fetchProdukGDS,
    createProdukGDS,
    updateProdukGDS,
    deleteProdukGDS,
  };
};

export default useProdukGDS;
