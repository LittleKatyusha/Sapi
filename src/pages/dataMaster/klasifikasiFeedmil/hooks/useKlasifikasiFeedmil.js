import { useState, useMemo, useCallback, useEffect } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useKlasifikasiFeedmil = () => {
  const [klasifikasiFeedmil, setKlasifikasiFeedmil] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MASTER.KLASIFIKASI_FEEDMIL}/data`);
      return { success: response.ok, status: response.status };
    } catch (error) {
      return { success: false, error: error.message, message: `Network error: ${error.message}` };
    }
  }, []);

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchKlasifikasiFeedmil = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_FEEDMIL}/data`);
      
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        const validatedData = result.data.map((item, index) => {
          return {
            pubid: item.pubid || `TEMP-${index + 1}`,
            pid: item.pid || item.pubid, // encrypted PID from backend
            name: item.name || 'Nama tidak tersedia',
            description: item.description || '',

          };
        });
        
        setKlasifikasiFeedmil(validatedData);
      } else {
        setKlasifikasiFeedmil([]);
      }
    } catch (err) {
      setError(`API Error: ${err.message}`);
      
      // Fallback data untuk development
      setKlasifikasiFeedmil([
        {
          pubid: "kf-001-fallback",
          pid: "kf-001-fallback",
          name: "Pakan Starter",
          description: "Pakan untuk ternak muda umur 0-8 minggu",

        },
        {
          pubid: "kf-002-fallback",
          pid: "kf-002-fallback",
          name: "Pakan Grower",
          description: "Pakan untuk ternak umur 9-20 minggu",

        },
        {
          pubid: "kf-003-fallback",
          pid: "kf-003-fallback",
          name: "Pakan Finisher",
          description: "Pakan untuk ternak siap potong umur 21+ minggu",

        },
        {
          pubid: "kf-004-fallback",
          pid: "kf-004-fallback",
          name: "Pakan Layer",
          description: "Pakan untuk ternak petelur",

        },
        {
          pubid: "kf-005-fallback",
          pid: "kf-005-fallback",
          name: "Pakan Breeder",
          description: "Pakan untuk indukan ternak",

        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create klasifikasi feedmil
  const createKlasifikasiFeedmil = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_FEEDMIL}/store`, data);
      
      if (result.status === 'ok' || result.data) {
        // Refresh data setelah create
        await fetchKlasifikasiFeedmil();
        return result;
      } else {
        throw new Error(result.message || 'Failed to create data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create klasifikasi feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiFeedmil]);

  // Update klasifikasi feedmil
  const updateKlasifikasiFeedmil = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData = {
        pid: pid, // Menggunakan encrypted PID
        ...data
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_FEEDMIL}/update`, updateData);
      
      if (result.status === 'ok' || result.data) {
        // Refresh data setelah update
        await fetchKlasifikasiFeedmil();
        return result;
      } else {
        throw new Error(result.message || 'Failed to update data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update klasifikasi feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiFeedmil]);

  // Delete klasifikasi feedmil
  const deleteKlasifikasiFeedmil = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_FEEDMIL}/hapus`, {
        pid: pid // Menggunakan encrypted PID
      });
      
      if (result.status === 'ok') {
        // Refresh data setelah delete
        await fetchKlasifikasiFeedmil();
        return result;
      } else {
        throw new Error(result.message || 'Failed to delete data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete klasifikasi feedmil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiFeedmil]);

  // Computed values
  const stats = useMemo(() => {
    return {
      total: klasifikasiFeedmil.length,
    };
  }, [klasifikasiFeedmil]);

  // Filter data berdasarkan search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return klasifikasiFeedmil;
    
    const searchLower = searchTerm.toLowerCase();
    return klasifikasiFeedmil.filter(item =>
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }, [klasifikasiFeedmil, searchTerm]);

  // Validasi data sebelum submit
  const validateKlasifikasiFeedmilData = useCallback((data) => {
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
    klasifikasiFeedmil: filteredData,
    loading,
    error,
    stats,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Actions
    fetchKlasifikasiFeedmil,
    createKlasifikasiFeedmil,
    updateKlasifikasiFeedmil,
    deleteKlasifikasiFeedmil,
    
    // Utilities
    testApiConnection,
    validateKlasifikasiFeedmilData,
  };
};

export default useKlasifikasiFeedmil;
