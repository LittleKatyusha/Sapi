import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useJenisPembelianFeedmil = () => {
    const [jenisPembelianFeedmil, setJenisPembelianFeedmil] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchJenisPembelianFeedmil = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch parameters with group filter for jenis_pembelian_feedmil using the correct endpoint
            const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                group: 'jenis_pembelian_feedmil' // Filter by group
            });
            

            
            // Handle API response format from ParameterController
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                setJenisPembelianFeedmil(result.data);

                
            } else {
                throw new Error(result.message || 'Failed to fetch jenis pembelian Feedmil from database');
            }
        } catch (err) {
            console.error('❌ Error fetching jenis pembelian Feedmil from database:', err);
            setError(err.message);
            
            // Fallback to data based on database structure seen in screenshot
            console.log('🔄 Using fallback data based on database structure');
            setJenisPembelianFeedmil([
                {
                    id: 22,
                    name: 'INTERNAL',
                    value: 1, // From database screenshot
                    description: 'INTERNAL',
                    group: 'jenis_pembelian_feedmil'
                },
                {
                    id: 23,
                    name: 'EXTERNAL', 
                    value: 2, // From database screenshot
                    description: 'EXTERNAL',
                    group: 'jenis_pembelian_feedmil'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJenisPembelianFeedmil();
    }, []);

    // Transform data to select options
    const jenisPembelianOptions = useMemo(() => {
        return jenisPembelianFeedmil.map(item => ({
            value: parseInt(item.value) || item.id, // Use integer value as backend expects
            label: item.name || item.description,
            rawId: item.id,
            description: item.description,
            group: item.group,
            order_no: item.order_no
        }));
    }, [jenisPembelianFeedmil]);

    // Helper function to get label by value
    const getLabelByValue = (value) => {
        const option = jenisPembelianOptions.find(opt => opt.value === parseInt(value));
        return option ? option.label : '';
    };

    return {
        jenisPembelianFeedmil,
        jenisPembelianOptions,
        loading,
        error,
        refetch: fetchJenisPembelianFeedmil,
        getLabelByValue
    };
};

export default useJenisPembelianFeedmil;
