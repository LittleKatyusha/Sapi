import { useState, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';
import { extractApiData } from '../utils/apiHelpers';

/**
 * Custom hook to fetch pembeli data from API
 * @returns {{ pembeliOptions: Array, pembeliLoading: boolean, pembeliError: string|null }}
 */
const usePembeli = () => {
    const [pembeliOptions, setPembeliOptions] = useState([]);
    const [pembeliLoading, setPembeliLoading] = useState(false);
    const [pembeliError, setPembeliError] = useState(null);

    useEffect(() => {
        const fetchPembeli = async () => {
            setPembeliLoading(true);
            setPembeliError(null);
            try {
                const response = await HttpClient.get('/api/master/pembeliho/data');
                const dataArray = extractApiData(response);
                const options = dataArray.map(item => ({
                    value: item.id || item.ID,
                    label: item.nama || item.NAME || item.name || item.label,
                    ...item
                }));
                setPembeliOptions(options);
            } catch (error) {
                console.error('Error fetching pembeli:', error);
                setPembeliError('Gagal memuat data pembeli');
            } finally {
                setPembeliLoading(false);
            }
        };
        fetchPembeli();
    }, []);

    return { pembeliOptions, pembeliLoading, pembeliError };
};

export default usePembeli;