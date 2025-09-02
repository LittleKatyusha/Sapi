import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useOfficesAPI = () => {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOffices = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Correct endpoint from backend routes: /api/master/office/data
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.OFFICE}/data`);
            
            
            
            if (result.status === 'ok' && result.data) {
                setOffices(result.data);
                
            } else {
                throw new Error(result.message || 'Failed to fetch offices');
            }
        } catch (err) {
            
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
            value: office.id,
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