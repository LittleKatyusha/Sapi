/**
 * Hook for fetching Persetujuan HO data for select/dropdown
 * Used in approval process for Penjualan Doka Sapi
 */

import { useState, useEffect, useCallback } from 'react';
import HttpClient from '../../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../../config/api';

const usePersetujuanHoSelect = () => {
  const [persetujuanOptions, setPersetujuanOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPersetujuanHo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch persetujuan HO data
      const params = {
        draw: 1,
        start: 0,
        length: 1000, // Get all records for dropdown
        'search[value]': '',
        'order[0][column]': 0,
        'order[0][dir]': 'asc',
        t: Date.now()
      };

      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_HO}/data`, { params });

      let dataArray = [];
      if (result?.data) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      }

      // Transform data for select options
      const options = dataArray.map(item => ({
        value: item.id,
        label: item.name || 'Nama tidak tersedia',
        description: item.description || '',
        rawData: item
      }));

      // Add default option
      const optionsWithDefault = [
        { value: '', label: 'Pilih yang menyetujui...', disabled: true },
        ...options
      ];

      setPersetujuanOptions(optionsWithDefault);
      
      console.log(`✅ Loaded ${options.length} persetujuan HO options`);
      return optionsWithDefault;
    } catch (err) {
      console.error('Error fetching persetujuan HO:', err);
      setError(err.message || 'Gagal memuat data persetujuan');
      
      // Return default options on error
      const defaultOptions = [
        { value: '', label: 'Pilih yang menyetujui...', disabled: true },
        { value: 1, label: 'Manager RPH' },
        { value: 2, label: 'Direktur Operasional' },
        { value: 3, label: 'Kepala Divisi' },
        { value: 4, label: 'Supervisor Pembelian' },
        { value: 5, label: 'Manager Keuangan' }
      ];
      setPersetujuanOptions(defaultOptions);
      return defaultOptions;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPersetujuanHo();
  }, []);

  // Helper function to get persetujuan name by ID
  const getPersetujuanName = useCallback((id) => {
    const option = persetujuanOptions.find(opt => opt.value === id);
    return option ? option.label : `ID: ${id}`;
  }, [persetujuanOptions]);

  // Helper function to validate if ID exists
  const isValidPersetujuan = useCallback((id) => {
    if (!id) return false;
    return persetujuanOptions.some(opt => opt.value === id);
  }, [persetujuanOptions]);

  return {
    persetujuanOptions,
    loading,
    error,
    fetchPersetujuanHo,
    getPersetujuanName,
    isValidPersetujuan
  };
};

export default usePersetujuanHoSelect;