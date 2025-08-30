import { useState, useMemo, useCallback, useEffect } from "react";
import HttpClient from "../../../../services/httpClient";
import { API_ENDPOINTS } from "../../../../config/api";

// Custom hook untuk manajemen data, filter, dan statistik Klasifikasi Hewan
const useKlasifikasiHewan = () => {
  const [klasifikasiHewan, setKlasifikasiHewan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [jenisHewanOptions, setJenisHewanOptions] = useState([]);

  // Helper function untuk mengkonversi ID jenis hewan ke nama menggunakan data dinamis
  const getJenisHewanName = useCallback((id) => {
    // Jika jenisHewanOptions belum tersedia, gunakan fallback mapping
    if (!jenisHewanOptions || jenisHewanOptions.length === 0) {
      const fallbackMap = {
        1: 'Sapi',
        2: 'Domba',
        3: 'Kambing'
      };
      return fallbackMap[id] || 'Tidak diketahui';
    }
    
    const jenisHewan = jenisHewanOptions.find(j => j.id === parseInt(id));
    return jenisHewan ? jenisHewan.name : 'Tidak diketahui';
  }, [jenisHewanOptions]);

  // Helper function untuk mengkonversi nama jenis hewan ke ID menggunakan data dinamis
  const getJenisHewanId = useCallback((nama) => {
    const jenisHewan = jenisHewanOptions.find(j => j.name.toLowerCase() === nama.toLowerCase());
    return jenisHewan ? jenisHewan.id : (jenisHewanOptions[0]?.id || 1);
  }, [jenisHewanOptions]);

  // Fetch jenis hewan options dari API
  const fetchJenisHewanOptions = useCallback(async () => {
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.JENIS_HEWAN}/data`);
      
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        const validatedOptions = result.data.map((item, index) => ({
          id: index + 1, // Menggunakan index sebagai ID
          pubid: item.pubid,
          name: item.name || 'Nama tidak tersedia'
        }));
        setJenisHewanOptions(validatedOptions);
      }
    } catch (err) {
      console.warn('Failed to fetch jenis hewan options:', err.message);
      // Fallback ke data default jika API gagal
      setJenisHewanOptions([
        { id: 1, pubid: 'default-1', name: 'Sapi' },
        { id: 2, pubid: 'default-2', name: 'Domba' },
        { id: 3, pubid: 'default-3', name: 'Kambing' }
      ]);
    }
  }, []);

  // Function untuk test koneksi API
  const testApiConnection = useCallback(async () => {
    try {
      await HttpClient.head(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/data`);
      return { success: true, message: 'Koneksi API berhasil' };
    } catch (error) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }, []);

  // Fetch data dari API dengan encrypted PID dari backend
  const fetchKlasifikasiHewan = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/data`);
      
      if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
        const validatedData = result.data.map((item, index) => {
          const jenisName = getJenisHewanName(item.id_jenis_hewan);
          
          return {
            pubid: item.pubid || `TEMP-${index + 1}`,
            encryptedPid: item.pid || item.pubid,
            name: item.name || 'Nama tidak tersedia',
            id_jenis_hewan: item.id_jenis_hewan || 1,
            jenis: jenisName,
            description: item.description || '',

            status: item.status !== undefined ? item.status : 1
          };
        });
        
        setKlasifikasiHewan(validatedData);
      } else {
        setKlasifikasiHewan([]);
      }
    } catch (err) {
      setError(`API Error: ${err.message}`);
      
      // Fallback data
      setKlasifikasiHewan([
        {
          pubid: "kh-001-fallback",
          encryptedPid: "kh-001-fallback",
          name: "Sapi Brahman",
          id_jenis_hewan: 1,
          jenis: getJenisHewanName(1),
          description: "Jenis sapi potong hasil persilangan",

          status: 1
        },
        {
          pubid: "kh-002-fallback",
          encryptedPid: "kh-002-fallback",
          name: "Domba Garut",
          id_jenis_hewan: 2,
          jenis: getJenisHewanName(2),
          description: "Domba aduan dan pedaging asli Garut",

          status: 1
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [getJenisHewanName]);

  // Create klasifikasi hewan
  const createKlasifikasiHewan = useCallback(async (klasifikasiData) => {
    setLoading(true);
    setError(null);
    
    const requiredParams = ['name', 'id_jenis_hewan', 'description', 'status'];
    const missingParams = requiredParams.filter(param =>
      klasifikasiData[param] === undefined || klasifikasiData[param] === null || klasifikasiData[param] === ''
    );
    
    if (missingParams.length > 0) {
      const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
    
    try {
      const cleanKlasifikasiData = {
        name: String(klasifikasiData.name).trim(),
        id_jenis_hewan: parseInt(klasifikasiData.id_jenis_hewan, 10),
        description: String(klasifikasiData.description).trim(),

        status: parseInt(klasifikasiData.status, 10)
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/store`, cleanKlasifikasiData);
      await fetchKlasifikasiHewan();
      
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
  }, [fetchKlasifikasiHewan]);

  // Update klasifikasi hewan - menggunakan encrypted PID dari backend
  const updateKlasifikasiHewan = useCallback(async (pubid, klasifikasiData) => {
    setLoading(true);
    setError(null);
    
    try {
      const klasifikasiItem = klasifikasiHewan.find(k => k.pubid === pubid);
      if (!klasifikasiItem) {
        throw new Error('Klasifikasi hewan tidak ditemukan');
      }
      
      if (!klasifikasiItem.encryptedPid) {
        klasifikasiItem.encryptedPid = pubid;
      }
      
      const requiredParams = ['name', 'id_jenis_hewan', 'description', 'status'];
      const missingParams = requiredParams.filter(param =>
        klasifikasiData[param] === undefined || klasifikasiData[param] === null || klasifikasiData[param] === ''
      );
      
      if (missingParams.length > 0) {
        const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
      
      const cleanData = {
        name: String(klasifikasiData.name).trim(),
        id_jenis_hewan: parseInt(klasifikasiData.id_jenis_hewan, 10),
        description: String(klasifikasiData.description).trim(),

        status: parseInt(klasifikasiData.status, 10)
      };
      
      const payload = {
        pid: klasifikasiItem.encryptedPid,
        ...cleanData
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/update`, payload);
      await fetchKlasifikasiHewan();
      
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
  }, [fetchKlasifikasiHewan, klasifikasiHewan]);

  // Delete klasifikasi hewan - menggunakan encrypted PID dari backend
  const deleteKlasifikasiHewan = useCallback(async (pubid) => {
    setLoading(true);
    setError(null);
    
    try {
      const klasifikasiItem = klasifikasiHewan.find(k => k.pubid === pubid);
      if (!klasifikasiItem) {
        throw new Error('Klasifikasi hewan tidak ditemukan');
      }
      
      if (!klasifikasiItem.encryptedPid) {
        klasifikasiItem.encryptedPid = pubid;
      }
      
      const payload = {
        pid: klasifikasiItem.encryptedPid
      };
      
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/delete`, payload);
      await fetchKlasifikasiHewan();
      
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
  }, [fetchKlasifikasiHewan, klasifikasiHewan]);

  // Filter dan search data
  const filteredData = useMemo(() => {
    if (!klasifikasiHewan || !Array.isArray(klasifikasiHewan)) {
      return [];
    }
    
    return klasifikasiHewan.filter(item => {
      if (!item) return false;
      
      try {
        const matchesSearch =
          (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.pubid && item.pubid.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.jenis && item.jenis.toLowerCase().includes(searchTerm.toLowerCase()));
          
        const matchesFilter = filterJenis === 'all' ||
          (item.jenis && item.jenis.toLowerCase() === filterJenis.toLowerCase());
          
        return matchesSearch && matchesFilter;
      } catch (error) {
        console.warn('Error filtering item:', item, error);
        return false;
      }
    });
  }, [klasifikasiHewan, searchTerm, filterJenis]);

  // Statistik jumlah klasifikasi hewan - dinamis berdasarkan jenis yang tersedia
  const stats = useMemo(() => {
    if (!klasifikasiHewan || !Array.isArray(klasifikasiHewan)) {
      const emptyStats = {
        total: 0,
        active: 0,
        inactive: 0
      };
      
      // Tambahkan stat untuk setiap jenis hewan yang tersedia
      jenisHewanOptions.forEach(jenis => {
        emptyStats[jenis.name.toLowerCase()] = 0;
      });
      
      return emptyStats;
    }
    
    try {
      const total = klasifikasiHewan.length;
      const active = klasifikasiHewan.filter(item => item && item.status === 1).length;
      const inactive = klasifikasiHewan.filter(item => item && item.status === 0).length;
      
      const stats = {
        total,
        active,
        inactive
      };
      
      // Hitung stat untuk setiap jenis hewan yang tersedia secara dinamis
      jenisHewanOptions.forEach(jenisOption => {
        const jenisName = jenisOption.name.toLowerCase();
        stats[jenisName] = klasifikasiHewan.filter(k =>
          k && k.jenis && k.jenis.toLowerCase() === jenisName
        ).length;
      });
      
      return stats;
    } catch (error) {
      console.warn('Error calculating stats:', error);
      const errorStats = {
        total: 0,
        active: 0,
        inactive: 0
      };
      
      jenisHewanOptions.forEach(jenis => {
        errorStats[jenis.name.toLowerCase()] = 0;
      });
      
      return errorStats;
    }
  }, [klasifikasiHewan, jenisHewanOptions]);

  return {
    klasifikasiHewan: filteredData,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterJenis,
    setFilterJenis,
    stats,
    fetchKlasifikasiHewan,
    createKlasifikasiHewan,
    updateKlasifikasiHewan,
    deleteKlasifikasiHewan,
    testApiConnection,
    getJenisHewanName,
    getJenisHewanId,
    jenisHewanOptions,
    fetchJenisHewanOptions
  };
};

export default useKlasifikasiHewan;