import { useState, useEffect, useCallback } from 'react';
import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Shared hook for tipe pembayaran (payment type) options
 * Used across all pembelian forms (HO, OVK, Feedmil, Kulit)
 * Fetches data from backend sys_ms_parameter table
 * 
 * @returns {Object} tipePembayaranOptions, loading, error, refetch
 */
const useTipePembayaran = () => {
    const [tipePembayaranOptions, setTipePembayaranOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTipePembayaran = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchTipePembayaran();
    }, [fetchTipePembayaran]);

    return {
        tipePembayaranOptions,
        loading,
        error,
        refetch: fetchTipePembayaran
    };
};

export default useTipePembayaran;
