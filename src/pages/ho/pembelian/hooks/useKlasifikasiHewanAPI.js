import { useState, useEffect, useMemo } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useKlasifikasiHewanAPI = () => {
    const [klasifikasiHewan, setKlasifikasiHewan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { getAuthHeader } = useAuthSecure();

    const fetchKlasifikasiHewan = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeaders = getAuthHeader();
            // Correct endpoint from backend routes: /api/master/klasifikasihewan/data
            const response = await fetch('https://puput-api.ternasys.com/api/master/klasifikasihewan/data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': '92b1d1ee96659e5b9630a51808b9372c',
                    ...authHeaders
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Klasifikasi Hewan API Response:', result);
            
            if (result.status === 'ok' && result.data) {
                setKlasifikasiHewan(result.data);
                console.log(`✅ Klasifikasi hewan loaded: ${result.data.length} items`);
            } else {
                throw new Error(result.message || 'Failed to fetch klasifikasi hewan');
            }
        } catch (err) {
            console.error('Error fetching klasifikasi hewan:', err);
            setError(err.message);
            setKlasifikasiHewan([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKlasifikasiHewan();
    }, []);

    const klasifikasiOptions = useMemo(() => {
        return klasifikasiHewan.map(item => ({
            value: item.pubid,
            label: item.name
        }));
    }, [klasifikasiHewan]);

    return {
        klasifikasiHewan,
        klasifikasiOptions,
        loading,
        error,
        refetch: fetchKlasifikasiHewan
    };
};

export default useKlasifikasiHewanAPI;