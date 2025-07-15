import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuthSecure } from "../../../../hooks/useAuthSecure";
import jenisHewanData from "../constants/jenisHewanData";

// Custom hook untuk manajemen data, filter, dan statistik Jenis Hewan
const useJenisHewan = () => {
  const { getAuthHeader } = useAuthSecure();
  const [jenisHewan, setJenisHewan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNama, setFilterNama] = useState("all");

  // API Base URL - sesuai dengan routing Laravel
  const API_BASE = 'https://puput-api.ternasys.com/api/master/jenishewan';

  // Function untuk test koneksi API
  const testApiConnection = useCallback(async () => {
    try {
      const authHeader = getAuthHeader();
      
      if (!authHeader.Authorization) {
        return { success: false, message: 'Token authorization tidak ditemukan' };
      }
      
      const response = await fetch(`${API_BASE}/data`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        }
      });
      
      if (response.ok) {
        return { success: true, message: 'Koneksi API berhasil' };
      } else {
        return { success: false, message: `API connection failed: ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }, [getAuthHeader]);

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchJenisHewan = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authHeader = getAuthHeader();
      if (!authHeader.Authorization) {
        throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
      }
      
      const response = await fetch(`${API_BASE}/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Token tidak valid atau sudah expired');
        } else if (response.status === 403) {
          throw new Error('Forbidden - Tidak memiliki akses ke endpoint ini');
        } else if (response.status === 404) {
          throw new Error('Endpoint tidak ditemukan');
        } else if (response.status === 500) {
          throw new Error('Server error - Silakan coba lagi nanti');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        const validatedData = result.data.map((item, index) => ({
          pubid: item.pubid || `TEMP-${index + 1}`,
          encryptedPid: item.pid || item.pubid,
          name: item.name || 'Nama tidak tersedia',
          description: item.description || '',
          order_no: item.order_no || index + 1,
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
          order_no: 1,
          status: 1
        },
        {
          pubid: "jh-002-uuid",
          encryptedPid: "jh-002-uuid",
          name: "Domba",
          description: "Jenis hewan ternak domba untuk produksi wol dan daging",
          order_no: 2,
          status: 1
        },
        {
          pubid: "jh-003-uuid",
          encryptedPid: "jh-003-uuid",
          name: "Kambing",
          description: "Jenis hewan ternak kambing untuk produksi susu dan daging",
          order_no: 3,
          status: 1
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  // Create jenis hewan
  const createJenisHewan = useCallback(async (jenisHewanData) => {
    setLoading(true);
    setError(null);
    
    const requiredParams = ['name', 'description', 'order_no', 'status'];
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
        order_no: parseInt(jenisHewanData.order_no, 10),
        status: parseInt(jenisHewanData.status, 10)
      };
      
      const response = await fetch(`${API_BASE}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(cleanJenisHewanData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.data && typeof errorData.data === 'object') {
            const validationErrors = Object.values(errorData.data).flat().join(', ');
            throw new Error(`Validation error: ${validationErrors}`);
          }
          throw new Error(errorData.message || 'Gagal menambahkan data');
        } catch (e) {
          throw new Error('Gagal menambahkan data');
        }
      }

      const result = await response.json();
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
  }, [getAuthHeader, fetchJenisHewan]);

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
      
      const requiredParams = ['name', 'description', 'order_no', 'status'];
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
        order_no: parseInt(jenisHewanData.order_no, 10),
        status: parseInt(jenisHewanData.status, 10)
      };
      
      const payload = {
        pid: jenisHewanItem.encryptedPid,
        ...cleanData
      };
      
      const response = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchJenisHewan();
        
        return {
          success: true,
          message: result.message || 'Data berhasil diperbarui'
        };
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.data && typeof errorData.data === 'object') {
            const validationErrors = Object.values(errorData.data).flat().join(', ');
            throw new Error(`Validation error: ${validationErrors}`);
          }
          throw new Error(errorData.message || errorData.data || 'Gagal memperbarui data');
        } catch (e) {
          throw new Error(errorText || 'Gagal memperbarui data');
        }
      }
      
    } catch (err) {
      const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchJenisHewan, getAuthHeader, jenisHewan]);

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
      
      const response = await fetch(`${API_BASE}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchJenisHewan();
        
        return {
          success: true,
          message: result.message || 'Data berhasil dihapus'
        };
      } else {
        const errorText = await response.text();
        let errorMessage = 'Gagal menghapus data';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.data) {
            errorMessage = errorData.data;
          }
        } catch (e) {
          errorMessage = errorText || 'Gagal menghapus data';
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (err) {
      const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchJenisHewan, getAuthHeader, jenisHewan]);

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