import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const usePersetujuanFeedmil = () => {
  const [persetujuanFeedmil, setPersetujuanFeedmil] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);

  // Optimized fetch - load all data once for client-side filtering
  const fetchPersetujuanFeedmil = useCallback(async () => {
    // Prevent duplicate requests
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data directly without DataTables params for better performance
      // Since this is master data, it shouldn't be too large
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_FEEDMIL}/data`, {
        cache: true // Enable caching for master data
      });

      // Handle response format
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

      setPersetujuanFeedmil(validatedData);
      setTotalRecords(total);
      console.log(`✅ Fetched ${validatedData.length} persetujuan Feedmil records`);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(`API Error: ${err.message}`);
      setPersetujuanFeedmil([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Create persetujuan Feedmil - Optimized to update local state immediately
  const createPersetujuanFeedmil = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_FEEDMIL}/store`, data);
      if (result?.status === 'ok' || result?.data) {
        // Clear cache for this endpoint
        HttpClient.clearCache('persetujuanfeedmil');
        
        // Refresh data after successful creation
        await fetchPersetujuanFeedmil();
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat persetujuan Feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanFeedmil]);

  // Update persetujuan Feedmil - Optimized to update local state immediately
  const updatePersetujuanFeedmil = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = { pid, ...data };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_FEEDMIL}/update`, payload);
      if (result?.status === 'ok' || result?.data) {
        // Clear cache for this endpoint
        HttpClient.clearCache('persetujuanfeedmil');
        
        // Optimistic update - update local state immediately
        setPersetujuanFeedmil(prev =>
          prev.map(item =>
            (item.pid === pid || item.pubid === pid)
              ? { ...item, ...data }
              : item
          )
        );
        
        // Then refresh from server to ensure consistency
        await fetchPersetujuanFeedmil();
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui persetujuan Feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanFeedmil]);

  // Delete persetujuan Feedmil - Optimized to update local state immediately
  const deletePersetujuanFeedmil = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_FEEDMIL}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        // Clear cache for this endpoint
        HttpClient.clearCache('persetujuanfeedmil');
        
        // Optimistic delete - remove from local state immediately
        setPersetujuanFeedmil(prev => prev.filter(item => item.pid !== pid && item.pubid !== pid));
        setTotalRecords(prev => Math.max(0, prev - 1));
        
        // Then refresh from server to ensure consistency
        await fetchPersetujuanFeedmil();
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus persetujuan Feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanFeedmil]);

  // Computed values
  const stats = useMemo(() => ({
    total: totalRecords || persetujuanFeedmil.length,
    displayed: persetujuanFeedmil.length,
  }), [persetujuanFeedmil, totalRecords]);

  return {
    // Data - return raw data, filtering will be done in component
    persetujuanFeedmil,
    loading,
    error,
    stats,
    totalRecords,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions
    fetchPersetujuanFeedmil,
    createPersetujuanFeedmil,
    updatePersetujuanFeedmil,
    deletePersetujuanFeedmil,
  };
};

export default usePersetujuanFeedmil;