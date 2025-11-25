import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Hook for fetching jenis biaya (expense type) options
 * Uses lazy loading pattern - fetches data only when manually called
 *
 * @returns {Object} jenisBiayaOptions, loading, error, fetchJenisBiaya
 */
const useJenisBiayaAPI = () => {
    const [jenisBiayaOptions, setJenisBiayaOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch jenis biaya data from backend
     * Can be called manually when needed (e.g., when modal opens)
     */
    const fetchJenisBiaya = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch from backend parameter API with correct group name
            const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                group: 'tipe_pembayaran'
            });

            if (response.data && Array.isArray(response.data)) {
                const options = response.data.map(item => ({
                    value: parseInt(item.value),
                    label: item.name
                }));
                setJenisBiayaOptions(options);
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            setError('Gagal mengambil data jenis biaya.');
            console.error('Error fetching jenis biaya:', err);
            
            // Fallback to empty array if API fails
            setJenisBiayaOptions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return { jenisBiayaOptions, loading, error, fetchJenisBiaya };
};

export default useJenisBiayaAPI;