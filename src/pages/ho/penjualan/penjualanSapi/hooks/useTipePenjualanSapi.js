import { useState, useEffect, useCallback } from 'react';
import useParameters from '../../../../system/hooks/useParameters';

const useTipePenjualanSapi = () => {
    const { fetchParametersByGroup } = useParameters();
    const [tipePenjualanOptions, setTipePenjualanOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTipePenjualan = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Menggunakan 'jenis_pembelian' sesuai instruksi
            const data = await fetchParametersByGroup('jenis_pembelian');
            if (data && data.length > 0) {
                const options = data.map(item => ({
                    value: item.value,
                    label: item.name
                }));
                setTipePenjualanOptions(options);
            } else {
                setTipePenjualanOptions([]);
            }
        } catch (err) {
            setError('Gagal mengambil data tipe penjualan.');
            setTipePenjualanOptions([]); // Ensure it's always an array even on error
        } finally {
            setLoading(false);
        }
    }, [fetchParametersByGroup]);

    useEffect(() => {
        fetchTipePenjualan();
    }, [fetchTipePenjualan]);

    return {
        tipePenjualanOptions: tipePenjualanOptions || [],  // Always return an array
        loading,
        error,
        refetch: fetchTipePenjualan
    };
};

export default useTipePenjualanSapi;