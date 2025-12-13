import { useState, useEffect, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';

/**
 * Custom hook untuk fetch data Persetujuan HO
 * Menggunakan API /api/master/persetujuanho/data
 */
const usePersetujuanHoAPI = () => {
    const [persetujuanOptions, setPersetujuanOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch data persetujuan HO dari API
     */
    const fetchPersetujuanHo = useCallback(async () => {
        console.log('🔄 [PERSETUJUAN HO] Fetching data...');
        setLoading(true);
        setError(null);

        try {
            const response = await HttpClient.get('/api/master/persetujuanho/data', {
                params: {
                    draw: 1,
                    start: 0,
                    length: 10000,
                    'search[value]': '',
                    'order[0][column]': 0,
                    'order[0][dir]': 'asc',
                    t: Date.now()
                }
            });

            console.log('✅ [PERSETUJUAN HO] Data received:', response);

            // Transform data ke format options untuk SearchableSelect
            // Format: { value: id (integer), label: nama, pid: encrypted_id }
            const options = (response.data || []).map(item => ({
                value: item.id || item.pubid,  // Use integer ID for backend
                label: item.nama || item.name || 'Unknown',
                pid: item.pid,  // Keep encrypted PID for reference
                rawData: item  // Keep full data for reference
            }));

            setPersetujuanOptions(options);
            return { success: true, data: options };

        } catch (err) {
            console.error('❌ [PERSETUJUAN HO] Error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Gagal mengambil data persetujuan HO';
            setError(errorMessage);
            setPersetujuanOptions([]);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        persetujuanOptions,
        loading,
        error,
        fetchPersetujuanHo,
        refetch: fetchPersetujuanHo
    };
};

export default usePersetujuanHoAPI;