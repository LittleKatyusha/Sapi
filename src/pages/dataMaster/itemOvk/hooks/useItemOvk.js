import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useItemOvk = () => {
  const [itemOvk, setItemOvk] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchItemOvk = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add cache busting parameter to force fresh data from server
      const cacheBuster = `?t=${Date.now()}`;
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_OVK}/data${cacheBuster}`);

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

      setItemOvk(validatedData);
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setItemOvk([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create item OVK
  const createItemOvk = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_OVK}/store`, data);
      if (result?.status === 'ok' || result?.data) {
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat item OVK';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemOvk]);

  // Update item OVK
  const updateItemOvk = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = { pid, ...data };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_OVK}/update`, payload);
      if (result?.status === 'ok' || result?.data) {
        // Refresh data untuk mendapatkan data yang telah diupdate dari server
        await fetchItemOvk();
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui item OVK';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemOvk]);

  // Delete item OVK
  const deleteItemOvk = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_OVK}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus item OVK';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemOvk]);

  // Computed values
  const stats = useMemo(() => ({
    total: itemOvk.length,
  }), [itemOvk]);

  return {
    // Data - return raw data, filtering will be done in component
    itemOvk,
    loading,
    error,
    stats,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions
    fetchItemOvk,
    createItemOvk,
    updateItemOvk,
    deleteItemOvk,
  };
};

export default useItemOvk;
