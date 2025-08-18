import { useState, useEffect, useMemo } from 'react';
import { HttpClient } from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useKlasifikasiHewanAPI = () => {
    const [klasifikasiHewan, setKlasifikasiHewan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchKlasifikasiHewan = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Correct endpoint from backend routes: /api/master/klasifikasihewan/data
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/data`);
            
            
            
            if (result.status === 'ok' && result.data) {
                setKlasifikasiHewan(result.data);
                
            } else {
                throw new Error(result.message || 'Failed to fetch klasifikasi hewan');
            }
        } catch (err) {
            
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