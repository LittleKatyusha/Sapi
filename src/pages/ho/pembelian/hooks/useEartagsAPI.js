import { useState, useEffect, useMemo } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useEartagsAPI = () => {
    const [eartags, setEartags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { getAuthHeader } = useAuthSecure();

    const fetchEartags = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeaders = getAuthHeader();
            // Use same URL pattern as other working APIs with pagination to get all records
            const response = await fetch('https://puput-api.ternasys.com/api/master/eartag/data?length=1000&start=0', {
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