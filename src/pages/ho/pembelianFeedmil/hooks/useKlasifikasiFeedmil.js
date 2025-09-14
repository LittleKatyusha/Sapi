import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useKlasifikasiFeedmil = () => {
    const [klasifikasiFeedmil, setKlasifikasiFeedmil] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchKlasifikasiFeedmil = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use dedicated klasifikasi feedmil endpoint to avoid loading unnecessary eartag data
            const jsonData = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_FEEDMIL}/data`);
            
            // Handle direct klasifikasi feedmil response format
            if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
                const klasifikasiData = jsonData.data;
                
                console.log('📦 Fetching klasifikasi feedmil from dedicated endpoint:', klasifikasiData.length, 'items');
                
                // Map the data to feedmil format - use integer id as unique identifier
                const mappedData = klasifikasiData.map((item, index) => ({
                    id: item.id, // Use integer id as unique identifier for backend validation
                    pubid: item.pubid,
                    name: item.name,
                    description: item.description,
                    pid: item.pid,
                    originalData: item
                }));
                
                setKlasifikasiFeedmil(mappedData);
                console.log('✅ Klasifikasi feedmil loaded from dedicated endpoint:', mappedData.length, 'items');
                
            } else {
                throw new Error('Failed to fetch klasifikasi feedmil data');
            }
        } catch (err) {
            console.error('❌ Error fetching klasifikasi feedmil:', err);
            setError(err.message);
            setKlasifikasiFeedmil([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKlasifikasiFeedmil();
    }, []);

    // Transform data to select options
    const klasifikasiFeedmilOptions = useMemo(() => {
        console.log('🔄 Processing klasifikasi feedmil data:', klasifikasiFeedmil);
        
        const options = klasifikasiFeedmil.map((item, index) => {
            // Use integer ID as value since backend validation expects integer
            const value = item.id;
            
            // Validate that we have a valid id
            if (!value || typeof value !== 'number') {
                console.warn('⚠️ Skipping klasifikasi feedmil item without valid id:', item);
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
        
        console.log('📋 Klasifikasi feedmil options prepared:', options.length, 'valid options out of', klasifikasiFeedmil.length, 'total items');
        console.log('📋 Options:', options);
        
        return options;
    }, [klasifikasiFeedmil]);

    return {
        klasifikasiFeedmil,
        klasifikasiFeedmilOptions,
        loading,
        error,
        refetch: fetchKlasifikasiFeedmil
    };
};

export default useKlasifikasiFeedmil;
