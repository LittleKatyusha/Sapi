import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useJenisPembelianKulit = () => {
    const [jenisPembelianKulit, setJenisPembelianKulit] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchJenisPembelianKulit = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch parameters with group filter for jenis_pembelian_kulit using the correct endpoint
            const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                group: 'jenis_pembelian_kulit' // Filter by group
            });
            

            
            // Handle API response format from ParameterController
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                setJenisPembelianKulit(result.data);

                
            } else {
                throw new Error(result.message || 'Failed to fetch jenis pembelian Kulit from database');
            }
        } catch (err) {
            console.error('❌ Error fetching jenis pembelian Kulit from database:', err);
            setError(err.message);
            
            // Fallback to mock data if API fails
            console.log('🔄 Using fallback mock data for jenis pembelian Kulit');
            setJenisPembelianKulit([
                {
                    pubid: 'mock-1',
                    name: 'INTERNAL',
                    value: '1',
                    group: 'jenis_pembelian_kulit',
                    description: null,
                    order_no: 1,
                    pid: 'mock-pid-1'
                },
                {
                    pubid: 'mock-2',
                    name: 'EXTERNAL',
                    value: '2',
                    group: 'jenis_pembelian_kulit',
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
        fetchJenisPembelianKulit();
    }, []);

    // Transform data to select options
    const jenisPembelianOptions = useMemo(() => {
        return jenisPembelianKulit.map(item => ({
            value: item.value, // Keep as string since API returns string values
            label: item.name || item.description,
            rawId: item.pubid || item.id,
            description: item.description,
            group: item.group,
            order_no: item.order_no,
            pid: item.pid
        }));
    }, [jenisPembelianKulit]);

    // Helper function to get label by value
    const getLabelByValue = (value) => {
        const option = jenisPembelianOptions.find(opt => String(opt.value) === String(value));
        return option ? option.label : '';
    };

    return {
        jenisPembelianKulit,
        jenisPembelianOptions,
        loading,
        error,
        refetch: fetchJenisPembelianKulit,
        getLabelByValue
    };
};

export default useJenisPembelianKulit;
