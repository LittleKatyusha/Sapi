import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook for fetching divisi/office data from parameter select API
 * Used for populating "Divisi" dropdown in Pembelian Lain-Lain
 */
const useDivisiData = () => {
    const [divisiData, setDivisiData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDivisiData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use ParameterSelectController to get office/divisi data
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER_SELECT}/data`);
            
            // ParameterSelectController uses compact('data') which returns {data: [...]}
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // First element contains all the parameter data
                
                // Check for office data (could be 'office', 'offices', or 'farm')
                if (data.office && Array.isArray(data.office)) {
                    setDivisiData(data.office);
                } else if (data.offices && Array.isArray(data.offices)) {
                    setDivisiData(data.offices);
                } else if (data.farm && Array.isArray(data.farm)) {
                    // Fallback to farm data if office not available
                    setDivisiData(data.farm);
                } else {
                    setDivisiData([]);
                }
            } else {
                throw new Error('No data array found in ParameterSelectController response');
            }
        } catch (err) {
            console.error('Error fetching divisi data:', err);
            setError(err.message || 'Gagal memuat data divisi');
            setDivisiData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDivisiData();
    }, []);

    // Transform divisi data to options format for SearchableSelect
    const divisiOptions = useMemo(() => {
        return divisiData.map(divisi => ({
            value: divisi.id, // Use numeric ID
            label: divisi.name,
            numericId: divisi.id
        }));
    }, [divisiData]);

    return {
        divisiData,
        divisiOptions,
        loading,
        error,
        refetch: fetchDivisiData
    };
};

export default useDivisiData;