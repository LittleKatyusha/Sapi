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
                    id: 1,
                    name: 'OVK - SUPPLIER',
                    value: 1,
                    description: 'OVK - SUPPLIER',
                    group: 'jenis_pembelian_ovk'
                },
                {
                    id: 2,
                    name: 'OVK - LANGSUNG', 
                    value: 2,
                    description: 'OVK - LANGSUNG',
                    group: 'jenis_pembelian_ovk'
                },
                {
                    id: 3,
                    name: 'OVK - KONTRAK',
                    value: 3,
                    description: 'OVK - KONTRAK',
                    group: 'jenis_pembelian_ovk'
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
            value: parseInt(item.value) || item.id, // Use value field from parameter table
            label: item.name || item.description,
            rawId: item.id,
            description: item.description,
            group: item.group,
            order_no: item.order_no
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
