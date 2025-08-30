import { useState, useMemo, useCallback, useEffect } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";
import jenisHewanData from "../constants/jenisHewanData";

// Custom hook untuk manajemen data, filter, dan statistik Jenis Hewan
const useJenisHewan = () => {
  const [jenisHewan, setJenisHewan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNama, setFilterNama] = useState("all");

  // Function untuk test koneksi API
  const testApiConnection = useCallback(async () => {
    try {
      await HttpClient.get(`${API_ENDPOINTS.MASTER.JENIS_HEWAN}/data`);
      return { success: true, message: 'Koneksi API berhasil' };
    } catch (error) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }, []);

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchJenisHewan = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check authentication status first
      const token = localStorage.getItem('token');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const isTokenValid = token && token.trim() !== '' && token !== 'null' && token !== 'undefined';
      
      if (!isAuthenticated || !isTokenValid) {
        console.log('Skipping API call - user not authenticated');
        // Use fallback data directly
        setJenisHewan([
          {
            pubid: "jh-001-uuid",
            encryptedPid: "jh-001-uuid",
            name: "Sapi",
            description: "Jenis hewan ternak sapi untuk produksi daging dan susu",
  
            status: 1
          },
          {
            pubid: "jh-002-uuid",
            encryptedPid: "jh-002-uuid",
            name: "Domba",
            description: "Jenis hewan ternak domba untuk produksi wol dan daging",
  
            status: 1
          },
          {
            pubid: "jh-003-uuid",
            encryptedPid: "jh-003-uuid",
            name: "Kambing",
            description: "Jenis hewan ternak kambing untuk produksi susu dan daging",
  
            status: 1
          }
        ]);
        setLoading(false);
        return;
      }

      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.JENIS_HEWAN}/data`);
      
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        const validatedData = result.data.map((item, index) => ({
          pubid: item.pubid || `TEMP-${index + 1}`,
          encryptedPid: item.pid || item.pubid,
          name: item.name || 'Nama tidak tersedia',
          description: item.description || '',

          status: item.status !== undefined ? item.status : 1
        }));
        
        setJenisHewan(validatedData);
      } else {
        const errorMessage = result.message || result.error || 'Format response API tidak sesuai';
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(`API Error: ${err.message}`);
      
      // Fallback ke data dummy
      setJenisHewan([
        {
          pubid: "jh-001-uuid",
          encryptedPid: "jh-001-uuid",
          name: "Sapi",
          description: "Jenis hewan ternak sapi untuk produksi daging dan susu",

          status: 1
        },
        {
          pubid: "jh-002-uuid",
          encryptedPid: "jh-002-uuid",
          name: "Domba",
          description: "Jenis hewan ternak domba untuk produksi wol dan daging",

          status: 1
        },
        {
          pubid: "jh-003-uuid",
          encryptedPid: "jh-003-uuid",
          name: "Kambing",
          description: "Jenis hewan ternak kambing untuk produksi susu dan daging",

          status: 1
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create jenis hewan
  const createJenisHewan = useCallback(async (jenisHewanData) => {
    setLoading(true);
    setError(null);
    
    const requiredParams = ['name', 'description', 'status'];
    const missingParams = requiredParams.filter(param =>
      jenisHewanData[param] === undefined || jenisHewanData[param] === null || jenisHewanData[param] === ''
    );
    
    if (missingParams.length > 0) {
      const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
    
    try {
      const cleanJenisHewanData = {
        name: String(jenisHewanData.name).trim(),
        description: String(jenisHewanData.description).trim(),

        status: parseInt(jenisHewanData.status, 10)
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.JENIS_HEWAN}/store`, cleanJenisHewanData);
      await fetchJenisHewan();
      
      return { 
        success: true, 
        message: result.message || 'Data berhasil ditambahkan' 
      };
      
    } catch (err) {
      const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchJenisHewan]);

  // Update jenis hewan - menggunakan encrypted PID dari backend
  const updateJenisHewan = useCallback(async (pubid, jenisHewanData) => {
    setLoading(true);
    setError(null);
    
    try {
      const jenisHewanItem = jenisHewan.find(j => j.pubid === pubid);
      if (!jenisHewanItem) {
        throw new Error('Jenis hewan tidak ditemukan');
      }
      
      if (!jenisHewanItem.encryptedPid) {
        jenisHewanItem.encryptedPid = pubid;
      }
      
      const requiredParams = ['name', 'description', 'status'];
      const missingParams = requiredParams.filter(param =>
        jenisHewanData[param] === undefined || jenisHewanData[param] === null || jenisHewanData[param] === ''
      );
      
      if (missingParams.length > 0) {
        const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
      
      const cleanData = {
        name: String(jenisHewanData.name).trim(),
        description: String(jenisHewanData.description).trim(),

        status: parseInt(jenisHewanData.status, 10)
      };
      
      const payload = {
        pid: jenisHewanItem.encryptedPid,
        ...cleanData
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.JENIS_HEWAN}/update`, payload);
      await fetchJenisHewan();
      
      return {
        success: true,
        message: result.message || 'Data berhasil diperbarui'
      };
      
    } catch (err) {
      const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchJenisHewan, jenisHewan]);

  // Delete jenis hewan - menggunakan encrypted PID dari backend
  const deleteJenisHewan = useCallback(async (pubid) => {
    setLoading(true);
    setError(null);
    
    try {
      const jenisHewanItem = jenisHewan.find(j => j.pubid === pubid);
      if (!jenisHewanItem) {
        throw new Error('Jenis hewan tidak ditemukan');
      }
      
      if (!jenisHewanItem.encryptedPid) {
        jenisHewanItem.encryptedPid = pubid;
      }
      
      const payload = {
        pid: jenisHewanItem.encryptedPid
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.JENIS_HEWAN}/delete`, payload);
      await fetchJenisHewan();
      
      return {
        success: true,
        message: result.message || 'Data berhasil dihapus'
      };
      
    } catch (err) {
      const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchJenisHewan, jenisHewan]);

  // Filter dan search data
  const filteredData = useMemo(() => {
    if (!jenisHewan || !Array.isArray(jenisHewan)) {
      return [];
    }
    
    return jenisHewan.filter(item => {
      if (!item) return false;
      
      try {
        const matchesSearch =
          (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.pubid && item.pubid.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
          
        const matchesFilter = filterNama === 'all' ||
          (item.name && item.name.toLowerCase() === filterNama.toLowerCase());
          
        return matchesSearch && matchesFilter;
      } catch (error) {
        console.warn('Error filtering item:', item, error);
        return false;
      }
    });
  }, [jenisHewan, searchTerm, filterNama]);

  // Statistik jumlah jenis hewan
  const stats = useMemo(() => {
    if (!jenisHewan || !Array.isArray(jenisHewan)) {
      return {
        total: 0,
        sapi: 0,
        domba: 0,
        kambing: 0,
        active: 0,
        inactive: 0
      };
    }
    
    try {
      const total = jenisHewan.length;
      const active = jenisHewan.filter(item => item && item.status === 1).length;
      const inactive = jenisHewan.filter(item => item && item.status === 0).length;
      const sapi = jenisHewan.filter(j => j && j.name && j.name.toLowerCase() === "sapi").length;
      const domba = jenisHewan.filter(j => j && j.name && j.name.toLowerCase() === "domba").length;
      const kambing = jenisHewan.filter(j => j && j.name && j.name.toLowerCase() === "kambing").length;
      
      return {
        total,
        sapi,
        domba,
        kambing,
        active,
        inactive
      };
    } catch (error) {
      console.warn('Error calculating stats:', error);
      return {
        total: 0,
        sapi: 0,
        domba: 0,
        kambing: 0,
        active: 0,
        inactive: 0
      };
    }
  }, [jenisHewan]);

  return {
    jenisHewan: filteredData,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterNama,
    setFilterNama,
    stats,
    fetchJenisHewan,
    createJenisHewan,
    updateJenisHewan,
    deleteJenisHewan,
    testApiConnection
  };
};

export default useJenisHewan;