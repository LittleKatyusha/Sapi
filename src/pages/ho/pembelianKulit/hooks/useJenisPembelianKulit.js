import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// Global cache to prevent duplicate API calls
let globalJenisPembelianKulit = null;
let globalLoading = false;
let globalError = null;
let fetchPromise = null;

const useJenisPembelianKulit = () => {
    const [jenisPembelianKulit, setJenisPembelianKulit] = useState(globalJenisPembelianKulit || []);
    const [loading, setLoading] = useState(globalLoading);
    const [error, setError] = useState(globalError);

    const fetchJenisPembelianKulit = async () => {
        // If data is already cached, use it
        if (globalJenisPembelianKulit) {
            setJenisPembelianKulit(globalJenisPembelianKulit);
            setLoading(false);
            setError(null);
            return;
        }

        // If already fetching, wait for the existing promise
        if (fetchPromise) {
            try {
                await fetchPromise;
                setJenisPembelianKulit(globalJenisPembelianKulit || []);
                setLoading(globalLoading);
                setError(globalError);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
            return;
        }

        // Start new fetch
        setLoading(true);
        setError(null);
        globalLoading = true;
        globalError = null;
        
        fetchPromise = (async () => {
            try {
                // Fetch parameters with group filter for jenis_pembelian_kulit using the correct endpoint
                const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                    group: 'jenis_pembelian_kulit' // Filter by group
                });
                
                console.log('📦 Fetching jenis pembelian Kulit:', result);
                
                // Handle API response format from ParameterController
                if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                    globalJenisPembelianKulit = result.data;
                    setJenisPembelianKulit(result.data);
                    console.log('✅ Jenis pembelian Kulit loaded:', result.data.length, 'items');
                    
                } else {
                    throw new Error(result.message || 'Failed to fetch jenis pembelian Kulit');
                }
            } catch (err) {
                console.error('❌ Error fetching jenis pembelian Kulit:', err);
                globalError = err.message;
                setError(err.message);
                setJenisPembelianKulit([]);
                
                // Fallback to mock data if API fails
                console.log('🔄 Using fallback mock data for jenis pembelian Kulit');
                const mockData = [
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
                    },
                    {
                        pubid: 'mock-3',
                        name: 'CONTRACT',
                        value: '3',
                        group: 'jenis_pembelian_kulit',
                        description: null,
                        order_no: 3,
                        pid: 'mock-pid-3'
                    }
                ];
                globalJenisPembelianKulit = mockData;
                setJenisPembelianKulit(mockData);
            } finally {
                globalLoading = false;
                setLoading(false);
                fetchPromise = null;
            }
        })();

        await fetchPromise;
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

    // Function to clear cache and refetch
    const refetch = () => {
        globalJenisPembelianKulit = null;
        globalLoading = false;
        globalError = null;
        fetchPromise = null;
        fetchJenisPembelianKulit();
    };

    return {
        jenisPembelianKulit,
        jenisPembelianOptions,
        loading,
        error,
        refetch,
        getLabelByValue
    };
};

export default useJenisPembelianKulit;
