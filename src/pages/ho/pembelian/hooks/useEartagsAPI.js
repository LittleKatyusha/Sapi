import { useState, useEffect, useMemo } from 'react';
import { HttpClient } from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useEartagsAPI = () => {
    const [eartags, setEartags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchEartags = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use same URL pattern as other working APIs with pagination to get all records
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.EARTAG}/data`, {
                params: {
                    length: 1000,
                    start: 0
                }
            });
            
            console.log('Eartag API Response:', result);
            
            // Handle DataTables format response or standard format
            if ((result.data && Array.isArray(result.data)) || (result.status === 'ok' && result.data)) {
                const dataArray = result.data || [];
                setEartags(dataArray);
                console.log(`✅ Eartags loaded: ${dataArray.length} items`);
            } else {
                throw new Error(result.message || 'Failed to fetch eartags');
            }
        } catch (err) {
            console.error('Error fetching eartags:', err);
            setError(err.message);
            setEartags([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEartags();
    }, []);

    const eartagOptions = useMemo(() => {
        return eartags.map(eartag => ({
            value: eartag.pubid,
            label: eartag.kode || eartag.id
        }));
    }, [eartags]);

    return {
        eartags,
        eartagOptions,
        loading,
        error,
        refetch: fetchEartags
    };
};

export default useEartagsAPI;