import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useItemFeedmil = () => {
  const [itemFeedmil, setItemFeedmil] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch data dari API dengan DataTables format
  const fetchItemFeedmil = useCallback(async (searchValue = '') => {
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
      
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_FEEDMIL}/data`, { params });

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
        pubid: item.pubid || `TEMP-${index + 1}`,
        pid: item.pid || item.pubid, // encrypted PID from backend
        name: item.name || 'Nama tidak tersedia',
        description: item.description || '',
        id_satuan: item.id_satuan || null,
        satuan_name: item.satuan_name || item.satuan?.name || null,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
      }));

      setItemFeedmil(validatedData);
      setTotalRecords(total);
      console.log(`✅ Fetched ${validatedData.length} of ${total} total item feedmil records`);
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setItemFeedmil([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create item feedmil
  const createItemFeedmil = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_FEEDMIL}/store`, data);
      if (result?.status === 'ok' || result?.data) {
        // Refresh data after successful creation
        await fetchItemFeedmil();
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat item feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemFeedmil]);

  // Update item feedmil
  const updateItemFeedmil = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = { pid, ...data };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_FEEDMIL}/update`, payload);
      
      if (result?.status === 'ok' || result?.data) {
        // Refresh data after successful update
        await fetchItemFeedmil();
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui item feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemFeedmil]);

  // Delete item feedmil
  const deleteItemFeedmil = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_FEEDMIL}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        // Refresh data after successful deletion
        await fetchItemFeedmil();
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus item feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchItemFeedmil]);

  // Computed values
  const stats = useMemo(() => ({
    total: totalRecords || itemFeedmil.length,
    displayed: itemFeedmil.length,
  }), [itemFeedmil, totalRecords]);

  return {
    // Data - return raw data, filtering will be done in component
    itemFeedmil,
    loading,
    error,
    stats,
    totalRecords,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions
    fetchItemFeedmil,
    createItemFeedmil,
    updateItemFeedmil,
    deleteItemFeedmil,
  };
};

export default useItemFeedmil;

