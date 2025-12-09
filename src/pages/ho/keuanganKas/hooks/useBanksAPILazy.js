import { useState, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useBanksAPILazy = () => {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBanks = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Try the /all endpoint first (simpler, no pagination needed)
            let result;
            try {
                result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BANK}/all`);
            } catch (allError) {
                // Fallback to /data endpoint with pagination
                result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BANK}/data`, {
                    params: {
                        length: 1000,
                        start: 0
                    }
                });
            }
            
            // Handle different response formats
            let dataArray = [];
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // /all endpoint format
                dataArray = result.data;
            } else if (result.data && Array.isArray(result.data)) {
                // /data endpoint format (DataTables)
                dataArray = result.data;
            } else {
                throw new Error(result.message || 'Failed to fetch banks - invalid response format');
            }
            
            setBanks(dataArray);
        } catch (err) {
            console.error('Error fetching banks:', err);
            setError(`Failed to fetch banks: ${err.message}`);
            setBanks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCache = useCallback(() => {
        setBanks([]);
        setError(null);
        setLoading(false);
    }, []);

    const bankOptions = useMemo(() => {
        const options = banks.map(bank => ({
            value: String(bank.id), // Convert to string to match form field format
            label: bank.display_name || (bank.kode ? `[${bank.kode}] ${bank.nama}` : bank.nama)
        }));
        return options;
    }, [banks]);

    return {
        banks,
        bankOptions,
        loading,
        error,
        fetchBanks,
        clearCache
    };
};

export default useBanksAPILazy;