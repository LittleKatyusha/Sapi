import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useKlasifikasiKulit = () => {
    const [klasifikasiKulit, setKlasifikasiKulit] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchKlasifikasiKulit = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use dedicated klasifikasi kulit endpoint to avoid loading unnecessary eartag data
            const jsonData = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_KULIT}/data`);
            
            // Handle direct klasifikasi kulit response format
            if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
                const klasifikasiData = jsonData.data;
                
                console.log('📦 Fetching klasifikasi kulit from dedicated endpoint:', klasifikasiData.length, 'items');
                
                // Map the data to kulit format - use integer id as unique identifier
                const mappedData = klasifikasiData.map((item, index) => ({
                    id: item.id, // Use integer id as unique identifier for backend validation
                    pubid: item.pubid,
                    name: item.name,
                    description: item.description,
                    pid: item.pid,
                    originalData: item
                }));
                
                setKlasifikasiKulit(mappedData);
                console.log('✅ Klasifikasi kulit loaded from dedicated endpoint:', mappedData.length, 'items');
                
            } else {
                throw new Error('Failed to fetch klasifikasi kulit data');
            }
        } catch (err) {
            console.error('❌ Error fetching klasifikasi kulit:', err);
            setError(err.message);
            setKlasifikasiKulit([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKlasifikasiKulit();
    }, []);

    // Transform data to select options
    const klasifikasiKulitOptions = useMemo(() => {
        console.log('🔄 Processing klasifikasi kulit data:', klasifikasiKulit);
        
        const options = klasifikasiKulit.map((item, index) => {
            // Use integer ID as value since backend validation expects integer
            const value = item.id;
            
            // Validate that we have a valid id
            if (!value || typeof value !== 'number') {
                console.warn('⚠️ Skipping klasifikasi kulit item without valid id:', item);
                return null;
            }
            
            return {
                value: value, // Use integer ID as value for backend validation
                label: item.name || item.description || `Item ${index + 1}`,
                id: value,
                name: item.name,
                description: item.description,
                pid: item.pid,
                pubid: item.pubid,
                rawData: item
            };
        }).filter(Boolean); // Remove null items
        
        console.log('📋 Klasifikasi kulit options prepared:', options.length, 'valid options out of', klasifikasiKulit.length, 'total items');
        console.log('📋 Options:', options);
        
        return options;
    }, [klasifikasiKulit]);

    return {
        klasifikasiKulit,
        klasifikasiKulitOptions,
        loading,
        error,
        refetch: fetchKlasifikasiKulit
    };
};

export default useKlasifikasiKulit;
