import { useState, useCallback } from 'react';
import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Lazy loading hook for tipe pembayaran (payment type) options
 * Only fetches data when explicitly called (e.g., when modal opens)
 * Use this when you want to defer loading until needed
 * 
 * @returns {Object} tipePembayaranOptions, loading, error, fetchTipePembayaran
 */
const useTipePembayaranLazy = () => {
    const [tipePembayaranOptions, setTipePembayaranOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTipePembayaran = useCallback(async () => {
        // Don't fetch if already loaded
        if (tipePembayaranOptions.length > 0) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch from backend parameter API
            const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                group: 'tipe_pembayaran'
            });
            
            if (response.data && Array.isArray(response.data)) {
                const options = response.data.map(item => ({
                    value: parseInt(item.value),
                    label: item.name
                }));
                setTipePembayaranOptions(options);
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            setError('Gagal mengambil data tipe pembayaran.');
            console.error('Error fetching tipe pembayaran:', err);
            
            // Fallback to empty array if API fails
            setTipePembayaranOptions([]);
        } finally {
            setLoading(false);
        }
    }, [tipePembayaranOptions.length]);

    return {
        tipePembayaranOptions,
        loading,
        error,
        fetchTipePembayaran
    };
};

export default useTipePembayaranLazy;