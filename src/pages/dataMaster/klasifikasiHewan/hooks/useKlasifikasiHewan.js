import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

// Custom hook untuk manajemen data server-side pagination Klasifikasi Hewan
const useKlasifikasiHewan = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [jenisHewanOptions, setJenisHewanOptions] = useState([]);

  // Fetch jenis hewan options dari API
  const fetchJenisHewanOptions = useCallback(async () => {
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.JENIS_HEWAN}/data`);
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        const validatedOptions = result.data.map((item) => ({
          id: item.id,
          pubid: item.pubid,
          name: item.name || 'Nama tidak tersedia',
        }));
        setJenisHewanOptions(validatedOptions);
      }
    } catch (err) {
      console.warn('Failed to fetch jenis hewan options:', err.message);
      setJenisHewanOptions([]);
    }
  }, []);

  // Helper: get jenis hewan name by id
  const getJenisHewanName = useCallback((id) => {
    const found = jenisHewanOptions.find((j) => j.id === parseInt(id, 10));
    return found ? found.name : 'Tidak diketahui';
  }, [jenisHewanOptions]);

  // Fetch data server-side with params
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

      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/data?${queryParams.toString()}`);

      const dataArray = result?.data || [];
      const mapped = dataArray.map((item) => ({
        id: item.id || null,
        pubid: item.pubid || '',
        pid: item.pid || item.pubid,
        name: item.name || '',
        id_jenis_hewan: item.id_jenis_hewan || null,
        jenis: item.jenis || getJenisHewanName(item.id_jenis_hewan),
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
  }, [getJenisHewanName]);

  // Create
  const createKlasifikasiHewan = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const cleanData = {
        name: String(payload.name).trim(),
        id_jenis_hewan: parseInt(payload.id_jenis_hewan, 10),
        description: String(payload.description).trim(),
      };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/store`, cleanData);
      return { success: true, data: result.data, message: result.message || 'Data berhasil ditambahkan' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal membuat data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update
  const updateKlasifikasiHewan = useCallback(async (pid, payload) => {
    setLoading(true);
    setError(null);
    try {
      const cleanData = {
        pid,
        name: String(payload.name).trim(),
        id_jenis_hewan: parseInt(payload.id_jenis_hewan, 10),
        description: String(payload.description).trim(),
      };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/update`, cleanData);
      return { success: true, data: result.data, message: result.message || 'Data berhasil diperbarui' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal memperbarui data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete
  const deleteKlasifikasiHewan = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/hapus`, { pid });
      return { success: true, message: result.message || 'Data berhasil dihapus' };
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
    createKlasifikasiHewan,
    updateKlasifikasiHewan,
    deleteKlasifikasiHewan,
    totalRecords,
    filteredRecords,
    stats,
    jenisHewanOptions,
    fetchJenisHewanOptions,
    getJenisHewanName,
  };
};

export default useKlasifikasiHewan;