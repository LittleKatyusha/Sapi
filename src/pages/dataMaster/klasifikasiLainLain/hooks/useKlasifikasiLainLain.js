import { useState, useMemo, useCallback, useEffect } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useKlasifikasiLainLain = () => {
  const [klasifikasiLainLain, setKlasifikasiLainLain] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastFetch, setLastFetch] = useState(null);

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MASTER.KLASIFIKASI_LAIN_LAIN}/data`);
      return { success: response.ok, status: response.status };
    } catch (error) {
      return { success: false, error: error.message, message: `Network error: ${error.message}` };
    }
  }, []);

  // Clear cache untuk endpoint klasifikasi lain-lain
  const clearKlasifikasiCache = useCallback(() => {
    // Clear cache for this specific endpoint
    HttpClient.clearCache(`${API_ENDPOINTS.MASTER.KLASIFIKASI_LAIN_LAIN}`);
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cache cleared for klasifikasi lain-lain');
    }
  }, []);

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchKlasifikasiLainLain = useCallback(async (forceRefresh = false) => {
    // Skip if already loading and not forcing refresh
    if (loading && !forceRefresh) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Clear cache if force refresh is requested
      if (forceRefresh) {
        clearKlasifikasiCache();
      }

      // First, make a request to get the total count
      const countParams = new URLSearchParams({
        start: '0',
        length: '1',     // Request just 1 item to get total count
        draw: '1',
      });
      
      if (forceRefresh) {
        countParams.append('_t', Date.now().toString());
      }
      
      const countEndpoint = `${API_ENDPOINTS.MASTER.KLASIFIKASI_LAIN_LAIN}/data?${countParams.toString()}`;
      const countResult = await HttpClient.get(countEndpoint, {
        cache: !forceRefresh
      });
      
      // Get total records from the response
      let totalRecords = 0;
      if (countResult?.recordsTotal) {
        totalRecords = countResult.recordsTotal;
      } else if (countResult?.data?.length) {
        totalRecords = countResult.data.length;
      }
      
      console.log(`📊 Total Klasifikasi Lain-Lain records available: ${totalRecords}`);
      
      // Now fetch all records using the total count (or use a very large number as fallback)
      const params = new URLSearchParams({
        start: '0',
        length: totalRecords > 0 ? String(totalRecords) : '999999',  // Request all records
        draw: '1',
      });
      
      if (forceRefresh) {
        params.append('_t', Date.now().toString());
      }

      const endpoint = `${API_ENDPOINTS.MASTER.KLASIFIKASI_LAIN_LAIN}/data?${params.toString()}`;
      
      const result = await HttpClient.get(endpoint, {
        cache: !forceRefresh
      });
      
      // Handle response format
      let dataArray = [];
      
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      } else if (result.draw && Array.isArray(result.data)) {
        // DataTables response format
        dataArray = result.data;
      }
      
      console.log(`✅ Successfully fetched ${dataArray.length} Klasifikasi Lain-Lain records`);
      
      if (dataArray.length > 0) {
        const validatedData = dataArray.map((item, index) => {
          // Debug log to see actual data structure
          if (index === 0) {
            console.log('🔍 First Klasifikasi Lain-Lain raw data:', item);
          }
          
          return {
            id: item.id, // Keep numeric ID
            pubid: item.pubid || `TEMP-${index + 1}`,
            pid: item.pid || item.pubid, // encrypted PID from backend
            name: item.name || 'Nama tidak tersedia',
            description: item.description || '',
            order_no: item.order_no || index + 1,
          };
        });
        
        setKlasifikasiLainLain(validatedData);
        if (validatedData.length > 0) {
          console.log('📊 Sample Klasifikasi Lain-Lain:', validatedData[0]);
        }
        setLastFetch(Date.now());
        return { success: true, data: validatedData };
      } else {
        setKlasifikasiLainLain([]);
        setLastFetch(Date.now());
        return { success: true, data: [] };
      }
    } catch (err) {
      setError(`API Error: ${err.message}`);
      
      // Don't use fallback data in production, let the error show
      if (process.env.NODE_ENV === 'development') {
        // Fallback data untuk development
        setKlasifikasiLainLain([
          {
            pubid: "kll-001-fallback",
            pid: "kll-001-fallback",
            name: "Peralatan Kandang",
            description: "Berbagai peralatan untuk operasional kandang",
            order_no: 1,
          },
          {
            pubid: "kll-002-fallback",
            pid: "kll-002-fallback",
            name: "Bahan Bangunan",
            description: "Material untuk pembangunan dan renovasi kandang",
            order_no: 2,
          },
          {
            pubid: "kll-003-fallback",
            pid: "kll-003-fallback",
            name: "Alat Kesehatan",
            description: "Peralatan medis dan kesehatan untuk ternak",
            order_no: 3,
          },
          {
            pubid: "kll-004-fallback",
            pid: "kll-004-fallback",
            name: "Perlengkapan Administrasi",
            description: "Alat tulis dan perlengkapan kantor",
            order_no: 4,
          },
        ]);
      }
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loading, clearKlasifikasiCache]);

  // Create klasifikasi lain-lain
  const createKlasifikasiLainLain = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_LAIN_LAIN}/store`, data);
      
      if (result.status === 'ok' || result.data) {
        // Clear cache immediately after successful create
        clearKlasifikasiCache();
        
        // Add small delay to ensure backend has processed the data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh data setelah create
        await fetchKlasifikasiLainLain(true);
        return result;
      } else {
        throw new Error(result.message || 'Failed to create data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create klasifikasi lain-lain';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiLainLain, clearKlasifikasiCache]);

  // Update klasifikasi lain-lain
  const updateKlasifikasiLainLain = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData = {
        pid: pid, // Menggunakan encrypted PID
        ...data
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_LAIN_LAIN}/update`, updateData);
      
      if (result.status === 'ok' || result.data) {
        // Clear cache immediately after successful update
        clearKlasifikasiCache();
        
        // Add small delay to ensure backend has processed the data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh data setelah update
        await fetchKlasifikasiLainLain(true);
        return result;
      } else {
        throw new Error(result.message || 'Failed to update data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update klasifikasi lain-lain';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiLainLain, clearKlasifikasiCache]);

  // Delete klasifikasi lain-lain
  const deleteKlasifikasiLainLain = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_LAIN_LAIN}/hapus`, {
        pid: pid // Menggunakan encrypted PID
      });
      
      if (result.status === 'ok' || result.success) {
        // Clear cache immediately after successful delete
        clearKlasifikasiCache();
        
        // Remove the deleted item from state immediately for better UX
        setKlasifikasiLainLain(prev => prev.filter(item =>
          item.pid !== pid && item.pubid !== pid
        ));
        
        // Add delay to ensure backend has processed the deletion
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Force refresh data from server to ensure consistency
        await fetchKlasifikasiLainLain(true);
        
        return result;
      } else {
        throw new Error(result.message || 'Failed to delete data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete klasifikasi lain-lain';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiLainLain, clearKlasifikasiCache]);

  // Computed values
  const stats = useMemo(() => {
    return {
      total: klasifikasiLainLain.length,
    };
  }, [klasifikasiLainLain]);

  // Filter data berdasarkan search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return klasifikasiLainLain;
    
    const searchLower = searchTerm.toLowerCase();
    return klasifikasiLainLain.filter(item =>
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }, [klasifikasiLainLain, searchTerm]);

  // Validasi data sebelum submit
  const validateKlasifikasiLainLainData = useCallback((data) => {
    const errors = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('Nama klasifikasi wajib diisi');
    }
    
    if (!data.description || data.description.trim() === '') {
      errors.push('Deskripsi wajib diisi');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Return hook interface
  return {
    // Data
    klasifikasiLainLain: filteredData,
    loading,
    error,
    stats,
    lastFetch,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Actions
    fetchKlasifikasiLainLain,
    createKlasifikasiLainLain,
    updateKlasifikasiLainLain,
    deleteKlasifikasiLainLain,
    clearKlasifikasiCache,
    
    // Utilities
    testApiConnection,
    validateKlasifikasiLainLainData,
  };
};

export default useKlasifikasiLainLain;