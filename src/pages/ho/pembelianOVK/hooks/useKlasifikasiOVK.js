import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useKlasifikasiOVK = () => {
    const [klasifikasiOVK, setKlasifikasiOVK] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchKlasifikasiOVK = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Call backend API: GET /api/master/klasifikasiovk/data
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_OVK}/data`);
            
            console.log('📦 Fetching klasifikasi OVK:', result);
            
            if (result.status === 'ok' && result.data) {
                setKlasifikasiOVK(result.data);
                console.log('✅ Klasifikasi OVK loaded:', result.data.length, 'items');
            } else {
                throw new Error(result.message || 'Failed to fetch klasifikasi OVK');
            }
        } catch (err) {
            console.error('❌ Error fetching klasifikasi OVK:', err);
            setError(err.message);
            
            // Fallback data untuk development
            setKlasifikasiOVK([
                {
                    pubid: "ovk-001-fallback",
                    pid: "ovk-001-fallback", 
                    name: "Vitamin A",
                    description: "Vitamin untuk pertumbuhan dan penglihatan",
                    order_no: 1
                },
                {
                    pubid: "ovk-002-fallback",
                    pid: "ovk-002-fallback",
                    name: "Vitamin B Complex", 
                    description: "Kompleks vitamin B untuk metabolisme",
                    order_no: 2
                },
                {
                    pubid: "ovk-003-fallback",
                    pid: "ovk-003-fallback",
                    name: "Antibiotik Amoxicillin",
                    description: "Antibiotik untuk pengobatan infeksi bakteri",
                    order_no: 3
                },
                {
                    pubid: "ovk-004-fallback", 
                    pid: "ovk-004-fallback",
                    name: "Vaksin Newcastle Disease",
                    description: "Vaksin untuk mencegah penyakit Newcastle pada unggas",
                    order_no: 4
                },
                {
                    pubid: "ovk-005-fallback",
                    pid: "ovk-005-fallback", 
                    name: "Desinfektan Kandang",
                    description: "Cairan desinfektan untuk kebersihan kandang",
                    order_no: 5
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKlasifikasiOVK();
    }, []);

    // Transform data untuk SearchableSelect options
    const klasifikasiOptions = useMemo(() => {
        return klasifikasiOVK.map(item => ({
            value: item.id || item.pubid, // Use ID if available, fallback to pubid
            label: `${item.name}${item.description ? ` - ${item.description}` : ''}`,
            name: item.name,
            description: item.description,
            pubid: item.pubid,
            pid: item.pid
        }));
    }, [klasifikasiOVK]);

    return {
        klasifikasiOVK,
        klasifikasiOptions,
        loading,
        error,
        refetch: fetchKlasifikasiOVK
    };
};

export default useKlasifikasiOVK;
