import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useBanksAPI = () => {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBanks = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Try the /all endpoint first (simpler, no pagination needed)
            let result;
            try {
                console.log('🔄 Trying /all endpoint first...');
                result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BANK}/all`);
                console.log('✅ /all endpoint response:', result);
            } catch (allError) {
                console.log('⚠️ /all endpoint failed, trying /data endpoint...', allError.message);
                // Fallback to /data endpoint with pagination
                result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BANK}/data`, {
                    params: {
                        length: 1000,
                        start: 0
                    }
                });
                console.log('✅ /data endpoint response:', result);
            }
            
            console.log('🔄 Fetching banks from API...', result);
            
            // Handle different response formats
            let dataArray = [];
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // /all endpoint format
                dataArray = result.data;
                console.log('✅ Bank data fetched from /all endpoint:', dataArray);
            } else if (result.data && Array.isArray(result.data)) {
                // /data endpoint format (DataTables)
                dataArray = result.data;
                console.log('✅ Bank data fetched from /data endpoint:', dataArray);
            } else {
                throw new Error(result.message || 'Failed to fetch banks - invalid response format');
            }
            
            setBanks(dataArray);
        } catch (err) {
            console.error('❌ Error fetching banks:', err);
            console.error('❌ Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name,
                endpoint: `${API_ENDPOINTS.MASTER.BANK}/data`
            });
            setError(`Failed to fetch banks: ${err.message}`);
            setBanks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const bankOptions = useMemo(() => {
        const options = banks.map(bank => ({
            value: String(bank.id), // Convert to string to match form field format
            label: bank.display_name || (bank.kode ? `[${bank.kode}] ${bank.nama}` : bank.nama)
        }));
        console.log('✅ Bank options created:', options);
        return options;
    }, [banks]);

    return {
        banks,
        bankOptions,
        loading,
        error,
        refetch: fetchBanks
    };
};

export default useBanksAPI;
