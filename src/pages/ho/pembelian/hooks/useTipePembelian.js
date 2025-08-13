import { useState, useEffect, useCallback } from 'react';
import useParameters from '../../../system/hooks/useParameters';

const useTipePembelian = () => {
    const { fetchParametersByGroup } = useParameters();
    const [tipePembelianOptions, setTipePembelianOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTipePembelian = useCallback(async () => {
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
                setTipePembelianOptions(options);
            } else {
                setTipePembelianOptions([]);
            }
        } catch (err) {
            setError('Gagal mengambil data tipe pembelian.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [fetchParametersByGroup]);

    useEffect(() => {
        fetchTipePembelian();
    }, [fetchTipePembelian]);

    return {
        tipePembelianOptions,
        loading,
        error,
        refetch: fetchTipePembelian
    };
};

export default useTipePembelian;