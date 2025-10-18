/**
 * Hook for fetching Office data for select/dropdown
 * Used in PO RPH creation and editing
 */

import { useState, useEffect, useCallback } from 'react';
import HttpClient from '../../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../../config/api';

const useOfficeSelect = () => {
  const [officeOptions, setOfficeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOffices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch office data
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.OFFICE}/data`);

      let dataArray = [];
      if (result?.data) {
        dataArray = result.data;
      } else if (Array.isArray(result)) {
        dataArray = result;
      }

      // Transform data for select options
      const options = dataArray.map(item => ({
        value: item.id || item.pubid,
        label: item.name || 'Office tidak tersedia',
        description: item.description || '',
        location: item.location || '',
        kategori: item.id_kategori,
        rawData: item
      }));

      // Sort by name
      options.sort((a, b) => a.label.localeCompare(b.label));

      // Add default option
      const optionsWithDefault = [
        { value: '', label: 'Pilih Office...', disabled: true },
        ...options
      ];

      setOfficeOptions(optionsWithDefault);
      
      console.log(`✅ Loaded ${options.length} office options`);
      return optionsWithDefault;
    } catch (err) {
      console.error('Error fetching offices:', err);
      setError(err.message || 'Gagal memuat data office');
      
      // Return default options on error
      const defaultOptions = [
        { value: '', label: 'Pilih Office...', disabled: true },
        { value: 1, label: 'Kandang Utama A' },
        { value: 2, label: 'Kandang Muda B' },
        { value: 3, label: 'Kandang Karantina' },
        { value: 4, label: 'Office Administrasi' },
        { value: 5, label: 'Kandang Betina' }
      ];
      setOfficeOptions(defaultOptions);
      return defaultOptions;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  // Helper function to get office name by ID
  const getOfficeName = useCallback((id) => {
    const option = officeOptions.find(opt => opt.value === id);
    return option ? option.label : `ID: ${id}`;
  }, [officeOptions]);

  // Helper function to validate if ID exists
  const isValidOffice = useCallback((id) => {
    if (!id) return false;
    return officeOptions.some(opt => opt.value === id);
  }, [officeOptions]);

  return {
    officeOptions,
    loading,
    error,
    fetchOffices,
    getOfficeName,
    isValidOffice
  };
};

export default useOfficeSelect;