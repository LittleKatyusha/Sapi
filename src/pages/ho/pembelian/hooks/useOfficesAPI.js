import { useState, useEffect, useMemo } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useOfficesAPI = () => {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { getAuthHeader } = useAuthSecure();

    const fetchOffices = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeaders = getAuthHeader();
            // Correct endpoint from backend routes: /api/master/office/data
            const response = await fetch('https://puput-api.ternasys.com/api/master/office/data', {
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
            console.log('Office API Response:', result);
            
            if (result.status === 'ok' && result.data) {
                setOffices(result.data);
                console.log(`✅ Offices loaded: ${result.data.length} items`);
            } else {
                throw new Error(result.message || 'Failed to fetch offices');
            }
        } catch (err) {
            console.error('Error fetching offices:', err);
            setError(err.message);
            setOffices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffices();
    }, []);

    const officeOptions = useMemo(() => {
        return offices.map(office => ({
            value: office.pubid,
            label: office.name
        }));
    }, [offices]);

    return {
        offices,
        officeOptions,
        loading,
        error,
        refetch: fetchOffices
    };
};

export default useOfficesAPI;