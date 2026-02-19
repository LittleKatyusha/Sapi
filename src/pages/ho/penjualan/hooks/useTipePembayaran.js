import { useState, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';
import { extractApiData } from '../utils/apiHelpers';

/**
 * Custom hook to fetch tipe pembayaran from API
 * @returns {{ tipePembayaranOptions: Array, tipePembayaranLoading: boolean, tipePembayaranError: string|null }}
 */
const useTipePembayaran = () => {
    const [tipePembayaranOptions, setTipePembayaranOptions] = useState([]);
    const [tipePembayaranLoading, setTipePembayaranLoading] = useState(false);
    const [tipePembayaranError, setTipePembayaranError] = useState(null);

    useEffect(() => {
        const fetchTipePembayaran = async () => {
            setTipePembayaranLoading(true);
            setTipePembayaranError(null);
            try {
                const response = await HttpClient.post('/api/system/parameter/dataByGroup', { group: 'tipe_pembayaran' });
                const dataArray = extractApiData(response);
                const options = dataArray.map(item => ({
                    value: item.value,
                    label: item.name,
                    pubid: item.pubid,
                    ...item
                }));
                setTipePembayaranOptions(options);
            } catch (error) {
                console.error('Error fetching tipe pembayaran:', error);
                setTipePembayaranError('Gagal memuat data tipe pembayaran');
            } finally {
                setTipePembayaranLoading(false);
            }
        };
        fetchTipePembayaran();
    }, []);

    return { tipePembayaranOptions, tipePembayaranLoading, tipePembayaranError };
};

export default useTipePembayaran;