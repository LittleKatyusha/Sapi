/**
 * Hook for fetching Persetujuan RPH data for select/dropdown
 * Used in PO RPH creation and editing
 */

import { useState, useEffect, useCallback } from 'react';
import HttpClient from '../../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../../config/api';

const usePersetujuanRphSelect = () => {
  const [persetujuanOptions, setPersetujuanOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPersetujuanRph = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch persetujuan RPH data
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/data`, {
        cache: true // Enable caching for master data
      });

      let dataArray = [];
      if (result?.data) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      }

      // Transform data for select options
      const options = dataArray.map(item => ({
        value: item.id || item.pubid,
        label: item.name || 'Nama tidak tersedia',
        description: item.description || '',
        rawData: item
      }));

      // Sort by name
      options.sort((a, b) => a.label.localeCompare(b.label));

      // Add default option
      const optionsWithDefault = [
        { value: '', label: 'Pilih Persetujuan RPH...', disabled: true },
        ...options
      ];

      setPersetujuanOptions(optionsWithDefault);
      
      console.log(`✅ Loaded ${options.length} persetujuan RPH options`);
      return optionsWithDefault;
    } catch (err) {
      console.error('Error fetching persetujuan RPH:', err);
      setError(err.message || 'Gagal memuat data persetujuan RPH');
      
      // Return default options on error
      const defaultOptions = [
        { value: '', label: 'Pilih Persetujuan RPH...', disabled: true },
        { value: 1, label: 'Kepala RPH' },
        { value: 2, label: 'Manager RPH' },
        { value: 3, label: 'Supervisor RPH' },
        { value: 4, label: 'Admin RPH' },
        { value: 5, label: 'Petugas RPH' }
      ];
      setPersetujuanOptions(defaultOptions);
      return defaultOptions;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchPersetujuanRph();
  }, [fetchPersetujuanRph]);

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
    fetchPersetujuanRph,
    getPersetujuanName,
    isValidPersetujuan
  };
};

export default usePersetujuanRphSelect;