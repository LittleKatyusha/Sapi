import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useItemKulit = () => {
  const [itemKulit, setItemKulit] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchItemKulit = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add cache busting parameter to force fresh data from server
      const cacheBuster = `?t=${Date.now()}`;
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_KULIT}/data${cacheBuster}`);

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

      setItemKulit(validatedData);
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setItemKulit([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create item kulit
  const createItemKulit = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_KULIT}/store`, data);
      if (result?.status === 'ok' || result?.data) {
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat item kulit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update item kulit
  const updateItemKulit = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = { pid, ...data };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_KULIT}/update`, payload);
      if (result?.status === 'ok' || result?.data) {
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui item kulit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete item kulit
  const deleteItemKulit = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_KULIT}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus item kulit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Computed values
  const stats = useMemo(() => ({
    total: itemKulit.length,
  }), [itemKulit]);

  return {
    // Data - return raw data, filtering will be done in component
    itemKulit,
    loading,
    error,
    stats,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions
    fetchItemKulit,
    createItemKulit,
    updateItemKulit,
    deleteItemKulit,
  };
};

export default useItemKulit;


