import { useState, useEffect, useCallback } from 'react';

const useTipePembelianMock = () => {
    const [tipePembelianOptions, setTipePembelianOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTipePembelian = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Mock data for tipe pembelian
            const mockData = [
                { value: '1', label: 'Pembelian Langsung' },
                { value: '2', label: 'Pembelian Kredit' },
                { value: '3', label: 'Pembelian Konsinyasi' },
                { value: '4', label: 'Pembelian Kontrak' }
            ];
            
            setTipePembelianOptions(mockData);
        } catch (err) {
            setError('Gagal mengambil data tipe pembelian (Mock).');
        } finally {
            setLoading(false);
        }
    }, []);

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

export default useTipePembelianMock;