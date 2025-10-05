import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

// Global cache to prevent duplicate API calls
let globalJenisPembelianLainLain = null;
let globalLoading = false;
let globalError = null;
let fetchPromise = null;

const useJenisPembelianLainLain = () => {
    const [jenisPembelianLainLain, setJenisPembelianLainLain] = useState(globalJenisPembelianLainLain || []);
    const [loading, setLoading] = useState(globalLoading);
    const [error, setError] = useState(globalError);

    const fetchJenisPembelianLainLain = async () => {
        // If data is already cached, use it
        if (globalJenisPembelianLainLain) {
            setJenisPembelianLainLain(globalJenisPembelianLainLain);
            setLoading(false);
            setError(null);
            return;
        }

        // If already fetching, wait for the existing promise
        if (fetchPromise) {
            try {
                await fetchPromise;
                setJenisPembelianLainLain(globalJenisPembelianLainLain || []);
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
                // Fetch parameters with group filter for jenis_pembelian_lainlain using the correct endpoint
                const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                    group: 'jenis_pembelian_lainlain' // Filter by group
                });
                
                console.log('📦 Fetching jenis pembelian Lain-Lain:', result);
                
                // Handle API response format from ParameterController
                if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                    globalJenisPembelianLainLain = result.data;
                    setJenisPembelianLainLain(result.data);
                    console.log('✅ Jenis pembelian Lain-Lain loaded:', result.data.length, 'items');
                    
                } else {
                    throw new Error(result.message || 'Failed to fetch jenis pembelian Lain-Lain');
                }
            } catch (err) {
                console.error('❌ Error fetching jenis pembelian Lain-Lain:', err);
                globalError = err.message;
                setError(err.message);
                setJenisPembelianLainLain([]);
                
                // Fallback to mock data if API fails
                console.log('🔄 Using fallback mock data for jenis pembelian Lain-Lain');
                const mockData = [
                    {
                        pubid: 'mock-1',
                        name: 'INTERNAL',
                        value: '1',
                        group: 'jenis_pembelian_lainlain',
                        description: null,
                        order_no: 1,
                        pid: 'mock-pid-1'
                    },
                    {
                        pubid: 'mock-2',
                        name: 'EXTERNAL',
                        value: '2',
                        group: 'jenis_pembelian_lainlain',
                        description: null,
                        order_no: 2,
                        pid: 'mock-pid-2'
                    },
                    {
                        pubid: 'mock-3',
                        name: 'CONTRACT',
                        value: '3',
                        group: 'jenis_pembelian_lainlain',
                        description: null,
                        order_no: 3,
                        pid: 'mock-pid-3'
                    }
                ];
                globalJenisPembelianLainLain = mockData;
                setJenisPembelianLainLain(mockData);
            } finally {
                globalLoading = false;
                setLoading(false);
                fetchPromise = null;
            }
        })();

        await fetchPromise;
    };

    useEffect(() => {
        fetchJenisPembelianLainLain();
    }, []);

    // Transform data to select options
    const jenisPembelianOptions = useMemo(() => {
        return jenisPembelianLainLain.map(item => ({
            value: item.value, // Keep as string since API returns string values
            label: item.name || item.description,
            rawId: item.pubid || item.id,
            description: item.description,
            group: item.group,
            order_no: item.order_no,
            pid: item.pid
        }));
    }, [jenisPembelianLainLain]);

    // Function to clear cache and refetch
    const refetch = () => {
        globalJenisPembelianLainLain = null;
        globalLoading = false;
        globalError = null;
        fetchPromise = null;
        fetchJenisPembelianLainLain();
    };

    return {
        jenisPembelianLainLain,
        jenisPembelianOptions,
        loading,
        error,
        refetch
    };
};

export default useJenisPembelianLainLain;
