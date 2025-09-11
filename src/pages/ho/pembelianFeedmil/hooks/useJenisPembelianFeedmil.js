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
            
            // Fallback to mock data if API fails
            console.log('🔄 Using fallback mock data for jenis pembelian Feedmil');
            setJenisPembelianFeedmil([
                {
                    pubid: 'mock-1',
                    name: 'INTERNAL',
                    value: '1',
                    group: 'jenis_pembelian_feedmil',
                    description: null,
                    order_no: 1,
                    pid: 'mock-pid-1'
                },
                {
                    pubid: 'mock-2',
                    name: 'EXTERNAL',
                    value: '2',
                    group: 'jenis_pembelian_feedmil',
                    description: null,
                    order_no: 2,
                    pid: 'mock-pid-2'
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
            value: item.value, // Keep as string since API returns string values
            label: item.name || item.description,
            rawId: item.pubid || item.id,
            description: item.description,
            group: item.group,
            order_no: item.order_no,
            pid: item.pid
        }));
    }, [jenisPembelianFeedmil]);

    // Helper function to get label by value
    const getLabelByValue = (value) => {
        const option = jenisPembelianOptions.find(opt => String(opt.value) === String(value));
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
