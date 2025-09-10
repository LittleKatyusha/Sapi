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
                
                // Map the data to feedmil format with proper ID field
                const mappedData = klasifikasiData.map((item, index) => ({
                    id: item.id || item.pid, // Use id or pid as fallback
                    pubid: item.pubid || `temp_pubid_${index}`,
                    name: item.name || item.nama,
                    description: item.description || item.name || item.nama,
                    pid: item.pid || `temp_pid_${index}`
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
        const options = klasifikasiFeedmil.map(item => {
            // ParameterSelectController now provides proper integer ID field
            let rawId = item.id;
            
            // Validate that we have a proper integer ID
            if (!rawId || typeof rawId !== 'number') {
                // Use index as fallback (should not happen with ParameterSelectController)
                rawId = klasifikasiFeedmil.indexOf(item) + 1;
            }
            
            return {
                value: rawId, // Use raw integer ID (required by backend validation)
                label: item.name || item.description || `Item ${rawId}`,
                id: rawId,
                name: item.name,
                description: item.description,
                pid: item.pid, // Keep encrypted pid for reference
                rawData: item
            };
        });
        

        
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
