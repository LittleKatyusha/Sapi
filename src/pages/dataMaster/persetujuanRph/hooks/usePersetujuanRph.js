import { useState, useMemo, useCallback } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const usePersetujuanRph = () => {
  const [persetujuanRph, setPersetujuanRph] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);

  // Optimized fetch - load all data once for client-side filtering
  const fetchPersetujuanRph = useCallback(async () => {
    // Prevent duplicate requests
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data directly without DataTables params for better performance
      // Since this is master data, it shouldn't be too large
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/data`, {
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

      setPersetujuanRph(validatedData);
      setTotalRecords(total);
      console.log(`✅ Fetched ${validatedData.length} persetujuan RPH records`);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(`API Error: ${err.message}`);
      setPersetujuanRph([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Create persetujuan RPH - Optimized to update local state immediately
  const createPersetujuanRph = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/store`, data);
      if (result?.status === 'ok' || result?.data) {
        // Clear cache for this endpoint
        HttpClient.clearCache('persetujuanrph');
        
        // Refresh data after successful creation
        await fetchPersetujuanRph();
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat persetujuan RPH';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanRph]);

  // Update persetujuan RPH - Optimized to update local state immediately
  const updatePersetujuanRph = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = { pid, ...data };
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/update`, payload);
      if (result?.status === 'ok' || result?.data) {
        // Clear cache for this endpoint
        HttpClient.clearCache('persetujuanrph');
        
        // Optimistic update - update local state immediately
        setPersetujuanRph(prev =>
          prev.map(item =>
            (item.pid === pid || item.pubid === pid)
              ? { ...item, ...data }
              : item
          )
        );
        
        // Then refresh from server to ensure consistency
        await fetchPersetujuanRph();
        return result;
      }
      throw new Error(result?.message || 'Gagal memperbarui data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui persetujuan RPH';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanRph]);

  // Delete persetujuan RPH - Optimized to update local state immediately
  const deletePersetujuanRph = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/hapus`, { pid });
      if (result?.status === 'ok' || result?.data === null) {
        // Clear cache for this endpoint
        HttpClient.clearCache('persetujuanrph');
        
        // Optimistic delete - remove from local state immediately
        setPersetujuanRph(prev => prev.filter(item => item.pid !== pid && item.pubid !== pid));
        setTotalRecords(prev => Math.max(0, prev - 1));
        
        // Then refresh from server to ensure consistency
        await fetchPersetujuanRph();
        return result;
      }
      throw new Error(result?.message || 'Gagal menghapus data');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus persetujuan RPH';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchPersetujuanRph]);

  // Computed values
  const stats = useMemo(() => ({
    total: totalRecords || persetujuanRph.length,
    displayed: persetujuanRph.length,
  }), [persetujuanRph, totalRecords]);

  return {
    // Data - return raw data, filtering will be done in component
    persetujuanRph,
    loading,
    error,
    stats,
    totalRecords,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions
    fetchPersetujuanRph,
    createPersetujuanRph,
    updatePersetujuanRph,
    deletePersetujuanRph,
  };
};

export default usePersetujuanRph;