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
            // Prepare DataTables format parameters for backend
            const params = new URLSearchParams({
                draw: '1',
                start: '0',
                length: '1000', // Get all records for master data
                'search[value]': '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            });
            
            const jsonData = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_FEEDMIL}/data?${params}`);
            console.log('📦 Fetching klasifikasi feedmil:', jsonData);
            
            // Handle API response format from backend
            if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
                setKlasifikasiFeedmil(jsonData.data);
                console.log('✅ Klasifikasi feedmil loaded:', jsonData.data.length, 'items');
                
            } else {
                throw new Error(jsonData?.message || 'Failed to fetch klasifikasi feedmil');
            }
        } catch (err) {
            console.error('❌ Error fetching klasifikasi feedmil:', err);
            setError(err.message);
            setKlasifikasiFeedmil([]);
            
            // Fallback to mock data if API fails
            console.log('🔄 Using fallback mock data for klasifikasi feedmil');
            setKlasifikasiFeedmil([
                {
                    id: 1,
                    pid: 'encrypted_1',
                    name: 'Pakan Starter',
                    description: 'Pakan untuk anak ayam umur 0-3 minggu'
                },
                {
                    id: 2,
                    pid: 'encrypted_2',
                    name: 'Pakan Grower',
                    description: 'Pakan untuk ayam umur 4-6 minggu'
                },
                {
                    id: 3,
                    pid: 'encrypted_3',
                    name: 'Pakan Finisher',
                    description: 'Pakan untuk ayam umur 7+ minggu'
                },
                {
                    id: 4,
                    pid: 'encrypted_4',
                    name: 'Pakan Layer',
                    description: 'Pakan untuk ayam petelur'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKlasifikasiFeedmil();
    }, []);

    // Transform data to select options
    const klasifikasiFeedmilOptions = useMemo(() => {
        return klasifikasiFeedmil.map(item => ({
            value: item.pid || item.id, // Use encrypted pid as value
            label: item.name || item.description,
            id: item.id,
            name: item.name,
            description: item.description,
            rawData: item
        }));
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
