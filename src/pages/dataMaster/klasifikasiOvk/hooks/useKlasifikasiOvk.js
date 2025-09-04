import { useState, useMemo, useCallback, useEffect } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

const useKlasifikasiOvk = () => {
  const [klasifikasiOvk, setKlasifikasiOvk] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MASTER.KLASIFIKASI_OVK}/data`);
      return { success: response.ok, status: response.status };
    } catch (error) {
      return { success: false, error: error.message, message: `Network error: ${error.message}` };
    }
  }, []);

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchKlasifikasiOvk = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_OVK}/data`);
      
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        const validatedData = result.data.map((item, index) => {
          return {
            pubid: item.pubid || `TEMP-${index + 1}`,
            pid: item.pid || item.pubid, // encrypted PID from backend
            name: item.name || 'Nama tidak tersedia',
            description: item.description || '',

          };
        });
        
        setKlasifikasiOvk(validatedData);
      } else {
        setKlasifikasiOvk([]);
      }
    } catch (err) {
      setError(`API Error: ${err.message}`);
      
      // Fallback data untuk development
      setKlasifikasiOvk([
        {
          pubid: "ko-001-fallback",
          pid: "ko-001-fallback",
          name: "Antibiotik",
          description: "Obat untuk pengobatan infeksi bakteri pada ternak",

        },
        {
          pubid: "ko-002-fallback",
          pid: "ko-002-fallback",
          name: "Vaksin",
          description: "Vaksin untuk pencegahan penyakit pada ternak",

        },
        {
          pubid: "ko-003-fallback",
          pid: "ko-003-fallback",
          name: "Vitamin",
          description: "Suplemen vitamin untuk kesehatan ternak",

        },
        {
          pubid: "ko-004-fallback",
          pid: "ko-004-fallback",
          name: "Desinfektan",
          description: "Bahan kimia untuk sanitasi kandang dan peralatan",

        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create klasifikasi OVK
  const createKlasifikasiOvk = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_OVK}/store`, data);
      
      if (result.status === 'ok' || result.data) {
        // Refresh data setelah create
        await fetchKlasifikasiOvk();
        return result;
      } else {
        throw new Error(result.message || 'Failed to create data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create klasifikasi OVK';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiOvk]);

  // Update klasifikasi OVK
  const updateKlasifikasiOvk = useCallback(async (pid, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const updateData = {
        pid: pid, // Menggunakan encrypted PID
        ...data
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_OVK}/update`, updateData);
      
      if (result.status === 'ok' || result.data) {
        // Refresh data setelah update
        await fetchKlasifikasiOvk();
        return result;
      } else {
        throw new Error(result.message || 'Failed to update data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update klasifikasi OVK';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiOvk]);

  // Delete klasifikasi OVK
  const deleteKlasifikasiOvk = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_OVK}/hapus`, {
        pid: pid // Menggunakan encrypted PID
      });
      
      if (result.status === 'ok') {
        // Refresh data setelah delete
        await fetchKlasifikasiOvk();
        return result;
      } else {
        throw new Error(result.message || 'Failed to delete data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete klasifikasi OVK';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchKlasifikasiOvk]);

  // Computed values
  const stats = useMemo(() => {
    return {
      total: klasifikasiOvk.length,
    };
  }, [klasifikasiOvk]);

  // Filter data berdasarkan search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return klasifikasiOvk;
    
    const searchLower = searchTerm.toLowerCase();
    return klasifikasiOvk.filter(item =>
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }, [klasifikasiOvk, searchTerm]);

  // Validasi data sebelum submit
  const validateKlasifikasiOvkData = useCallback((data) => {
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
    klasifikasiOvk: filteredData,
    loading,
    error,
    stats,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Actions
    fetchKlasifikasiOvk,
    createKlasifikasiOvk,
    updateKlasifikasiOvk,
    deleteKlasifikasiOvk,
    
    // Utilities
    testApiConnection,
    validateKlasifikasiOvkData,
  };
};

export default useKlasifikasiOvk;
