import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useJenisPembelianOVK = () => {
    const [jenisPembelianOVK, setJenisPembelianOVK] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchJenisPembelianOVK = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch parameters with group filter for jenis_pembelian_ovk using the correct endpoint
            const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                group: 'jenis_pembelian_ovk' // Filter by group
            });
            
            console.log('📦 Fetching jenis pembelian OVK:', result);
            
            // Handle API response format from ParameterController
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                setJenisPembelianOVK(result.data);
                console.log('✅ Jenis pembelian OVK loaded:', result.data.length, 'items');
                
            } else {
                throw new Error(result.message || 'Failed to fetch jenis pembelian OVK');
            }
        } catch (err) {
            console.error('❌ Error fetching jenis pembelian OVK:', err);
            setError(err.message);
            setJenisPembelianOVK([]);
            
            // Fallback to mock data if API fails
            console.log('🔄 Using fallback mock data for jenis pembelian OVK');
            setJenisPembelianOVK([
                {
                    pubid: 'mock-1',
                    name: 'INTERNAL',
                    value: '1',
                    group: 'jenis_pembelian_ovk',
                    description: null,
                    order_no: 1,
                    pid: 'mock-pid-1'
                },
                {
                    pubid: 'mock-2',
                    name: 'EXTERNAL',
                    value: '2',
                    group: 'jenis_pembelian_ovk',
                    description: null,
                    order_no: 2,
                    pid: 'mock-pid-2'
                },
                {
                    pubid: 'mock-3',
                    name: 'CONTRACT',
                    value: '3',
                    group: 'jenis_pembelian_ovk',
                    description: null,
                    order_no: 3,
                    pid: 'mock-pid-3'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJenisPembelianOVK();
    }, []);

    // Transform data to select options
    const jenisPembelianOptions = useMemo(() => {
        return jenisPembelianOVK.map(item => ({
            value: item.value, // Keep as string since API returns string values
            label: item.name || item.description,
            rawId: item.pubid || item.id,
            description: item.description,
            group: item.group,
            order_no: item.order_no,
            pid: item.pid
        }));
    }, [jenisPembelianOVK]);

    return {
        jenisPembelianOVK,
        jenisPembelianOptions,
        loading,
        error,
        refetch: fetchJenisPembelianOVK
    };
};

export default useJenisPembelianOVK;
