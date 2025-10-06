import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useItemLainLain = () => {
  const [itemLainLain, setItemLainLain] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchItemLainLain = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add cache busting parameter to force fresh data from server
      const cacheBuster = `?t=${Date.now()}`;
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/data${cacheBuster}`);

      // Handle berbagai bentuk respons (DataTables atau sendResponse)
      let dataArray = [];
      if (Array.isArray(result)) {
        dataArray = result;
      } else if (Array.isArray(result?.data)) {
        dataArray = result.data;
      } else if (result?.status === 'ok' && Array.isArray(result?.data)) {
        dataArray = result.data;
      }

      const validatedData = dataArray.map((item, index) => ({
        pubid: item.pubid || `TEMP-${index + 1}`,
        pid: item.pid || item.pubid, // encrypted PID from backend
        name: item.name || 'Nama tidak tersedia',
        description: item.description || '',
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));

      setItemLainLain(validatedData);
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setItemLainLain([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create item lain-lain
  const createItemLainLain = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/store`, data);
      if (result?.status === 'ok' || result?.data) {
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat item lain-lain';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemLainLain]);

  // Update item lain-lain
  const updateItemLainLain = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = { pid, ...data };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/update`, payload);
      if (result?.status === 'ok' || result?.data) {
        // Refresh data untuk mendapatkan data yang telah diupdate dari server
        await fetchItemLainLain();
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui item lain-lain';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemLainLain]);

  // Delete item lain-lain
  const deleteItemLainLain = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus item lain-lain';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemLainLain]);

  // Computed values
  const stats = useMemo(() => ({
    total: itemLainLain.length,
  }), [itemLainLain]);

  return {
    // Data - return raw data, filtering will be done in component
    itemLainLain,
    loading,
    error,
    stats,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions
    fetchItemLainLain,
    createItemLainLain,
    updateItemLainLain,
    deleteItemLainLain,
  };
};

export default useItemLainLain;