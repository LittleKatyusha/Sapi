import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook for fetching master data for Pengajuan Biaya form
 * Fetches: Metode Bayar, Persetujuan HO
 * Note: Jenis Biaya now fetched via useItemBebanBiayaAPI hook (from /api/master/parameter/data)
 */
const useMasterData = () => {
  // Metode Bayar state
  const [metodeBayarData, setMetodeBayarData] = useState([]);
  const [metodeBayarLoading, setMetodeBayarLoading] = useState(false);
  const [metodeBayarError, setMetodeBayarError] = useState(null);

  // Persetujuan HO state
  const [persetujuanHoData, setPersetujuanHoData] = useState([]);
  const [persetujuanHoLoading, setPersetujuanHoLoading] = useState(false);
  const [persetujuanHoError, setPersetujuanHoError] = useState(null);

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
   * Note: Jenis Biaya removed - now fetched via useItemBebanBiayaAPI
   */
  const fetchAllMasterData = useCallback(async () => {
    await Promise.all([
      fetchMetodeBayar(),
      fetchPersetujuanHo()
    ]);
  }, [fetchMetodeBayar, fetchPersetujuanHo]);

  // Check if any data is loading
  const isLoading = metodeBayarLoading || persetujuanHoLoading;

  // Check if there are any errors
  const hasError = metodeBayarError || persetujuanHoError;

  return {
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