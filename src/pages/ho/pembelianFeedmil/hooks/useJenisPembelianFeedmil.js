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
            
            console.log('📦 Fetching jenis pembelian Feedmil:', result);
            
            // Handle API response format from ParameterController
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                setJenisPembelianFeedmil(result.data);
                console.log('✅ Jenis pembelian Feedmil loaded:', result.data.length, 'items');
                
            } else {
                throw new Error(result.message || 'Failed to fetch jenis pembelian Feedmil');
            }
        } catch (err) {
            console.error('❌ Error fetching jenis pembelian Feedmil:', err);
            setError(err.message);
            setJenisPembelianFeedmil([]);
            
            // Fallback to mock data if API fails
            console.log('🔄 Using fallback mock data for jenis pembelian Feedmil');
            setJenisPembelianFeedmil([
                {
                    id: 1,
                    name: 'FEEDMIL - SUPPLIER',
                    value: 1,
                    description: 'FEEDMIL - SUPPLIER',
                    group: 'jenis_pembelian_feedmil'
                },
                {
                    id: 2,
                    name: 'FEEDMIL - LANGSUNG', 
                    value: 2,
                    description: 'FEEDMIL - LANGSUNG',
                    group: 'jenis_pembelian_feedmil'
                },
                {
                    id: 3,
                    name: 'FEEDMIL - KONTRAK',
                    value: 3,
                    description: 'FEEDMIL - KONTRAK',
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
            value: parseInt(item.value) || item.id, // Use value field from parameter table
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
