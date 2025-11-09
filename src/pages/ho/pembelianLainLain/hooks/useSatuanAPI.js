import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useSatuanAPI = () => {
    const [satuanData, setSatuanData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSatuanData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch satuan data from master data
            const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.SATUAN}/data`);
            
            console.log('📦 Satuan API Response:', response);
            
            // Handle different response structures
            if (response && response.data) {
                // If response.data is an array
                if (Array.isArray(response.data)) {
                    setSatuanData(response.data);
                }
                // If response.data.data is an array (nested structure)
                else if (response.data.data && Array.isArray(response.data.data)) {
                    setSatuanData(response.data.data);
                }
                // If response has success flag and data
                else if (response.success && response.data) {
                    setSatuanData(Array.isArray(response.data) ? response.data : []);
                }
                else {
                    setSatuanData([]);
                }
            } else {
                throw new Error('No data found in response');
            }
        } catch (err) {
            console.error('❌ Error fetching satuan data:', err);
            setError(err.message || 'Failed to fetch satuan data');
            setSatuanData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSatuanData();
    }, []);

    // Transform satuan data to select options format
    const satuanOptions = useMemo(() => {
        if (!Array.isArray(satuanData) || satuanData.length === 0) {
            return [];
        }

        return satuanData.map(satuan => ({
            value: String(satuan.id), // Convert to string for consistency
            label: satuan.nama_satuan || satuan.name || satuan.satuan || 'Unknown'
        }));
    }, [satuanData]);

    return {
        satuanData,
        satuanOptions,
        loading,
        error,
        refetch: fetchSatuanData
    };
};

export default useSatuanAPI;