import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook for fetching master data for Pengajuan Biaya form
 * Fetches: Jenis Biaya, Metode Bayar, Persetujuan HO
 */
const useMasterData = () => {
  // Jenis Biaya state
  const [jenisBiayaData, setJenisBiayaData] = useState([]);
  const [jenisBiayaLoading, setJenisBiayaLoading] = useState(false);
  const [jenisBiayaError, setJenisBiayaError] = useState(null);

  // Metode Bayar state
  const [metodeBayarData, setMetodeBayarData] = useState([]);
  const [metodeBayarLoading, setMetodeBayarLoading] = useState(false);
  const [metodeBayarError, setMetodeBayarError] = useState(null);

  // Persetujuan HO state
  const [persetujuanHoData, setPersetujuanHoData] = useState([]);
  const [persetujuanHoLoading, setPersetujuanHoLoading] = useState(false);
  const [persetujuanHoError, setPersetujuanHoError] = useState(null);

  /**
   * Fetch Jenis Biaya data from Item Lain-Lain API
   */
  const fetchJenisBiaya = useCallback(async () => {
    setJenisBiayaLoading(true);
    setJenisBiayaError(null);
    
    try {
      // Use Item Lain-Lain endpoint with DataTables format
      const params = {
        draw: 1,
        start: 0,
        length: 10000, // Large number to get all records
        'search[value]': '',
        'order[0][column]': 0,
        'order[0][dir]': 'asc',
        t: Date.now() // Cache busting
      };
      
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/data`, { params });

      // Debug logging
      console.log('=== JENIS BIAYA RESPONSE ===');
      console.log('Full response:', result);
      console.log('result.data:', result.data);

      // Handle DataTables response format
      let dataArray = [];
      
      if (result?.data) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      }

      console.log('Data array:', dataArray);

      if (dataArray && Array.isArray(dataArray) && dataArray.length > 0) {
        const options = dataArray.map(item => ({
          value: parseInt(item.id), // Use actual database ID, not pubid
          label: item.name,
          id: parseInt(item.id),
          pubid: item.pubid // Store pubid for reference if needed
        }));
        console.log('Mapped options:', options);
        setJenisBiayaData(options);
      } else {
        console.log('No data found, setting empty array');
        setJenisBiayaData([]);
      }
    } catch (err) {
      console.error('Error fetching jenis biaya:', err);
      setJenisBiayaError('Gagal memuat data jenis biaya');
      setJenisBiayaData([]);
    } finally {
      setJenisBiayaLoading(false);
    }
  }, []);

  /**
   * Fetch Metode Bayar data from Parameter API using 'tipe_pembayaran' group
   */
  const fetchMetodeBayar = useCallback(async () => {
    setMetodeBayarLoading(true);
    setMetodeBayarError(null);
    
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group: 'tipe_pembayaran'
      });

      if (response.data && Array.isArray(response.data)) {
        const options = response.data.map(item => ({
          value: parseInt(item.value),
          label: item.name,
          id: parseInt(item.value)
        }));
        setMetodeBayarData(options);
      } else {
        setMetodeBayarData([]);
      }
    } catch (err) {
      console.error('Error fetching metode bayar:', err);
      setMetodeBayarError('Gagal memuat data metode bayar');
      setMetodeBayarData([]);
    } finally {
      setMetodeBayarLoading(false);
    }
  }, []);

  /**
   * Fetch Persetujuan HO data from Persetujuan HO API
   */
  const fetchPersetujuanHo = useCallback(async () => {
    setPersetujuanHoLoading(true);
    setPersetujuanHoError(null);
    
    try {
      const params = {
        draw: 1,
        start: 0,
        length: 10000, // Large number to get all records
        'search[value]': '',
        'order[0][column]': 0,
        'order[0][dir]': 'asc',
        t: Date.now() // Cache busting
      };
      
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_HO}/data`, { params });
      
      // Handle DataTables response format
      let dataArray = [];
      
      if (result?.data) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      }
      
      setPersetujuanHoData(dataArray);
    } catch (err) {
      console.error('Error fetching persetujuan HO data:', err);
      setPersetujuanHoError(err.message || 'Gagal memuat data persetujuan HO');
      setPersetujuanHoData([]);
    } finally {
      setPersetujuanHoLoading(false);
    }
  }, []);

  /**
   * Fetch all master data
   * Now includes jenis biaya for lazy loading
   */
  const fetchAllMasterData = useCallback(async () => {
    await Promise.all([
      fetchJenisBiaya(),
      fetchMetodeBayar(),
      fetchPersetujuanHo()
    ]);
  }, [fetchJenisBiaya, fetchMetodeBayar, fetchPersetujuanHo]);

  // Check if any data is loading
  const isLoading = jenisBiayaLoading || metodeBayarLoading || persetujuanHoLoading;

  // Check if there are any errors
  const hasError = jenisBiayaError || metodeBayarError || persetujuanHoError;

  return {
    // Jenis Biaya
    jenisBiayaData,
    jenisBiayaLoading,
    jenisBiayaError,
    fetchJenisBiaya,

    // Metode Bayar
    metodeBayarData,
    metodeBayarLoading,
    metodeBayarError,
    fetchMetodeBayar,

    // Persetujuan HO
    persetujuanHoData,
    persetujuanHoLoading,
    persetujuanHoError,
    fetchPersetujuanHo,

    // Combined
    fetchAllMasterData,
    isLoading,
    hasError
  };
};

export default useMasterData;