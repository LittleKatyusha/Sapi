import { useState, useEffect, useCallback } from 'react';
import PersediaanOvkService from '../../../../../services/persediaanOvkService';

const usePersediaanOvk = () => {
  // State
  const [persediaanData, setPersediaanData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch inventory data
  const fetchPersediaanData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await PersediaanOvkService.getPersediaanData();
      if (response.success) {
        setPersediaanData(response.data.data || []);
      } else {
        setError(response.message || 'Gagal memuat data persediaan OVK');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersediaanData();
  }, [fetchPersediaanData]);

  return {
    persediaanData,
    loading,
    error,
    refresh: fetchPersediaanData,
  };
};

export default usePersediaanOvk;
