import { useState, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';

const useJenisPembelianAPI = () => {
    const [jenisPembelianOptions, setJenisPembelianOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJenisPembelian = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await HttpClient.post('/api/system/parameter/dataByGroup', {
                    group: 'jenis_pembelian_lainlain'
                });

                if (response.data && response.data.success) {
                    const options = response.data.data.map(item => ({
                        value: parseInt(item.value),
                        label: item.name
                    }));
                    setJenisPembelianOptions(options);
                } else {
                    setError('Failed to fetch jenis pembelian data');
                }
            } catch (err) {
                setError(err.message || 'An error occurred while fetching jenis pembelian');
                console.error('Error fetching jenis pembelian:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchJenisPembelian();
    }, []);

    return { jenisPembelianOptions, loading, error };
};

export default useJenisPembelianAPI;