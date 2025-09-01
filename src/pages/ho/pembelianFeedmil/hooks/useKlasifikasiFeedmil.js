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
            // Use centralized parameter endpoint like pembelian HO (includes id field)
            const jsonData = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Handle ParameterSelectController response format
            if (jsonData && jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
                const parameterData = jsonData.data[0];
                
                // Extract klasifikasi feedmil data from ParameterSelectController
                const klasifikasiData = parameterData.klasifikasifeedmil || [];
                

                
                // Map the data to feedmil format with proper ID field
                const mappedData = klasifikasiData.map((item, index) => ({
                    id: item.id, // ✅ Now we have the ID field from ParameterSelectController!
                    pubid: item.pubid || `temp_pubid_${index}`,
                    name: item.name,
                    description: item.description || item.name, // Use description or fallback to name
                    pid: item.pid || `temp_pid_${index}`
                }));
                
                setKlasifikasiFeedmil(mappedData);
                
            } else {

                throw new Error('Failed to fetch parameter data');
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
