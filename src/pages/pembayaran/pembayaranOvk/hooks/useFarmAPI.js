import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useFarmAPI = () => {
    const [farmData, setFarmData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchFarmData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use ParameterSelectController to get farm data
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER_SELECT}/data`);
            
            // ParameterSelectController uses compact('data') which returns {data: [...]}
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // First element contains all the parameter data
                
                if (data.farm && Array.isArray(data.farm)) {
                    setFarmData(data.farm);
                } else {
                    setFarmData([]);
                }
            } else {
                throw new Error('No data array found in ParameterSelectController response');
            }
        } catch (err) {
            console.error('Error fetching farm data:', err);
            setError(err.message);
            setFarmData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarmData();
    }, []);

    const farmOptions = useMemo(() => {
        const options = farmData.map(farm => ({
            value: String(farm.id), // Convert to string to match form field format
            label: farm.name
        }));
        return options;
    }, [farmData]);

    return {
        farmData,
        farmOptions,
        loading,
        error,
        refetch: fetchFarmData
    };
};

export default useFarmAPI;
