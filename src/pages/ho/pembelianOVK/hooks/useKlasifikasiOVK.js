import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useKlasifikasiOVK = () => {
    const [klasifikasiOVK, setKlasifikasiOVK] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchKlasifikasiOVK = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use centralized parameter endpoint like feedmil (includes id field)
            const jsonData = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Handle ParameterSelectController response format
            if (jsonData && jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
                const parameterData = jsonData.data[0];
                
                // Extract klasifikasi OVK data from ParameterSelectController
                const klasifikasiData = parameterData.klasifikasiovk || [];
                
                console.log('📦 Fetching klasifikasi OVK from ParameterSelectController:', klasifikasiData);
                
                // Map the data to OVK format with proper ID field
                const mappedData = klasifikasiData.map((item, index) => ({
                    id: item.id, // ✅ Now we have the ID field from ParameterSelectController!
                    pubid: item.pubid || `temp_pubid_${index}`,
                    name: item.name,
                    description: item.description || '', // Keep description separate
                    pid: item.pid || `temp_pid_${index}`
                }));
                
                setKlasifikasiOVK(mappedData);
                console.log('✅ Klasifikasi OVK loaded from ParameterSelectController:', mappedData.length, 'items');
                
            } else {
                throw new Error('Failed to fetch parameter data');
            }
        } catch (err) {
            console.error('❌ Error fetching klasifikasi OVK:', err);
            setError(err.message);
            setKlasifikasiOVK([]);
            
            // Fallback to mock data if API fails
            console.log('🔄 Using fallback mock data for klasifikasi OVK');
            setKlasifikasiOVK([
                {
                    id: 1,
                    pid: 'encrypted_1',
                    name: 'Vitamin A',
                    description: 'Vitamin untuk pertumbuhan'
                },
                {
                    id: 2,
                    pid: 'encrypted_2',
                    name: 'Vitamin B Complex',
                    description: 'Vitamin untuk metabolisme'
                },
                {
                    id: 3,
                    pid: 'encrypted_3',
                    name: 'Antibiotik',
                    description: 'Untuk pengobatan'
                },
                {
                    id: 4,
                    pid: 'encrypted_4',
                    name: 'Vaksin',
                    description: 'Untuk pencegahan penyakit'
                },
                {
                    id: 5,
                    pid: 'encrypted_5',
                    name: 'Desinfektan',
                    description: 'Untuk kebersihan kandang'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKlasifikasiOVK();
    }, []);

    // Transform data untuk SearchableSelect options
    const klasifikasiOptions = useMemo(() => {
        const options = klasifikasiOVK.map(item => {
            // ParameterSelectController provides proper integer ID field
            let rawId = item.id;
            
            // Validate that we have a proper integer ID
            if (!rawId || typeof rawId !== 'number') {
                rawId = klasifikasiOVK.indexOf(item) + 1;
            }
            
            return {
                value: rawId, // Use raw integer ID (required by backend validation)
                label: item.name, // Show only name for cleaner display
                id: rawId,
                name: item.name,
                description: item.description,
                pid: item.pid,
                rawData: item
            };
        });
        
        console.log('🔧 Klasifikasi OVK options processed:', options);
        
        return options;
    }, [klasifikasiOVK]);

    return {
        klasifikasiOVK,
        klasifikasiOptions,
        loading,
        error,
        refetch: fetchKlasifikasiOVK
    };
};

export default useKlasifikasiOVK;