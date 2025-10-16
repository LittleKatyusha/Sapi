import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const usePersetujuanHo = () => {
  const [persetujuanHo, setPersetujuanHo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch data dari API dengan DataTables format
  const fetchPersetujuanHo = useCallback(async (searchValue = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // Use DataTables format to fetch all records
      const params = {
        draw: 1,
        start: 0,
        length: 10000, // Large number to get all records
        'search[value]': searchValue || '',
        'order[0][column]': 0,
        'order[0][dir]': 'asc',
        t: Date.now() // Cache busting
      };
      
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_HO}/data`, { params });

      // Handle DataTables response format
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
        id: item.id || null,
        pubid: item.pubid || `TEMP-${index + 1}`,
        pid: item.pid || item.pubid, // encrypted PID from backend
        name: item.name || 'Nama tidak tersedia',
        description: item.description || '',
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));

      setPersetujuanHo(validatedData);
      setTotalRecords(total);
      console.log(`✅ Fetched ${validatedData.length} of ${total} total persetujuan HO records`);
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setPersetujuanHo([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create persetujuan HO
  const createPersetujuanHo = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_HO}/store`, data);
      if (result?.status === 'ok' || result?.data) {
        // Refresh data after successful creation
        await fetchPersetujuanHo();
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat persetujuan HO';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanHo]);

  // Update persetujuan HO
  const updatePersetujuanHo = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = { pid, ...data };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_HO}/update`, payload);
      if (result?.status === 'ok' || result?.data) {
        // Refresh data untuk mendapatkan data yang telah diupdate dari server
        await fetchPersetujuanHo();
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui persetujuan HO';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanHo]);

  // Delete persetujuan HO
  const deletePersetujuanHo = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_HO}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        // Refresh data after successful deletion
        await fetchPersetujuanHo();
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus persetujuan HO';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanHo]);

  // Computed values
  const stats = useMemo(() => ({
    total: totalRecords || persetujuanHo.length,
    displayed: persetujuanHo.length,
  }), [persetujuanHo, totalRecords]);

  return {
    // Data - return raw data, filtering will be done in component
    persetujuanHo,
    loading,
    error,
    stats,
    totalRecords,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions
    fetchPersetujuanHo,
    createPersetujuanHo,
    updatePersetujuanHo,
    deletePersetujuanHo,
  };
};

export default usePersetujuanHo;