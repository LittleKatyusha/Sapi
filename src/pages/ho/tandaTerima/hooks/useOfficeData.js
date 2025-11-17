import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook for fetching office data from parameter select API
 * Used for populating "Office/Lokasi" dropdown in Tanda Terima
 */
const useOfficeData = () => {
    const [officeData, setOfficeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOfficeData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use ParameterSelectController to get office data
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER_SELECT}/data`);
            
            // ParameterSelectController uses compact('data') which returns {data: [...]}
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // First element contains all the parameter data
                
                // Check for office data (could be 'office', 'offices', or 'farm')
                if (data.office && Array.isArray(data.office)) {
                    setOfficeData(data.office);
                } else if (data.offices && Array.isArray(data.offices)) {
                    setOfficeData(data.offices);
                } else if (data.farm && Array.isArray(data.farm)) {
                    // Fallback to farm data if office not available
                    setOfficeData(data.farm);
                } else {
                    setOfficeData([]);
                }
            } else {
                throw new Error('No data array found in ParameterSelectController response');
            }
        } catch (err) {
            console.error('Error fetching office data:', err);
            setError(err.message || 'Gagal memuat data office');
            setOfficeData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfficeData();
    }, []);

    // Transform office data to options format for SearchableSelect
    const officeOptions = useMemo(() => {
        return officeData.map(office => ({
            value: office.id, // Use numeric ID
            label: office.name,
            numericId: office.id
        }));
    }, [officeData]);

    return {
        officeData,
        officeOptions,
        loading,
        error,
        refetch: fetchOfficeData
    };
};

export default useOfficeData;