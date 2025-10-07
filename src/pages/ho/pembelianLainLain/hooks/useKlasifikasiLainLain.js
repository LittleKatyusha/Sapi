import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useKlasifikasiLainLain = () => {
    const [klasifikasiLainLain, setKlasifikasiLainLain] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchKlasifikasiLainLain = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use dedicated klasifikasi Lain-Lain endpoint to avoid loading unnecessary data
            const jsonData = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_LAINLAIN}/data`);

            // Handle direct klasifikasi Lain-Lain response format
            if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
                const klasifikasiData = jsonData.data;
                
                console.log('📦 Fetching klasifikasi Lain-Lain from dedicated endpoint:', klasifikasiData.length, 'items');

                // Map the data to Lain-Lain format with proper ID field
                const mappedData = klasifikasiData.map((item, index) => ({
                    id: item.id || item.pid, // Use id or pid as fallback
                    pubid: item.pubid || `temp_pubid_${index}`,
                    name: item.name || item.nama,
                    description: item.description || item.name || item.nama,
                    pid: item.pid || `temp_pid_${index}`
                }));
                setKlasifikasiLainLain(mappedData);
                console.log('✅ Klasifikasi Lain-Lain loaded from dedicated endpoint:', mappedData.length, 'items');

                
            } else {
                throw new Error('Failed to fetch parameter data');
            }
        } catch (err) {
            console.error('❌ Error fetching klasifikasi Lain-Lain:', err);
            setError(err.message);
            setKlasifikasiLainLain([]);

            // Fallback to mock data if API fails
            console.log('🔄 Using fallback mock data for klasifikasi Lain-Lain');
            setKlasifikasiLainLain([
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
        fetchKlasifikasiLainLain();
    }, []);

    // Transform data untuk SearchableSelect options
    const klasifikasiOptions = useMemo(() => {
        const options = klasifikasiLainLain.map(item => {
            // ParameterSelectController provides proper integer ID field
            let rawId = item.id;
            
            // Validate that we have a proper integer ID
            if (!rawId || typeof rawId !== 'number') {
                rawId = klasifikasiLainLain.indexOf(item) + 1;
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
        
        console.log('🔧 Klasifikasi Lain-Lain options processed:', options);

        return options;
    }, [klasifikasiLainLain]);

    return {
        klasifikasiLainLain,
        klasifikasiOptions,
        loading,
        error,
        refetch: fetchKlasifikasiLainLain
    };
};

export default useKlasifikasiLainLain;