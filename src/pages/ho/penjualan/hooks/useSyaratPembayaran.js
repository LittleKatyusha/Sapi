import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook to fetch syarat pembayaran (bank) options from API
 * @param {string|null} filterType - Filter options: 'KAS' for cash-only, 'BANK' for bank-only, null for all
 * @returns {{ syaratPembayaranOptions: Array, syaratPembayaranLoading: boolean, syaratPembayaranError: string|null, refetch: Function }}
 */
const useSyaratPembayaran = (filterType = null) => {
    const [syaratPembayaran, setSyaratPembayaran] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSyaratPembayaran = async () => {
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
                throw new Error(result.message || 'Failed to fetch syarat pembayaran - invalid response format');
            }
            
            setSyaratPembayaran(dataArray);
        } catch (err) {
            console.error('Error fetching syarat pembayaran:', err);
            setError(`Failed to fetch syarat pembayaran: ${err.message}`);
            setSyaratPembayaran([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSyaratPembayaran();
    }, []);

    const syaratPembayaranOptions = useMemo(() => {
        let options = syaratPembayaran.map(bank => ({
            value: String(bank.id), // Convert to string to match form field format
            label: bank.display_name || (bank.kode ? `[${bank.kode}] ${bank.nama}` : bank.nama),
            id: bank.id,
            kode: bank.kode,
            nama: bank.nama,
            display_name: bank.display_name
        }));

        // Add "Kas" option at the beginning
        const kasOption = {
            value: 'KAS',
            label: 'Kas',
            id: 'KAS',
            kode: 'KAS',
            nama: 'Kas',
            isKas: true
        };

        if (filterType === 'KAS') {
            // Only show Kas option
            options = [kasOption];
        } else if (filterType === 'BANK') {
            // Exclude Kas option (both manual 'KAS' value and bank records with kode/nama 'KAS'), show only actual banks
            options = options.filter(opt => {
                // Exclude manual KAS option
                if (opt.value === 'KAS') return false;
                // Exclude bank records that represent KAS (kode '001' and nama 'KAS')
                if (opt.kode === '001' && opt.nama && opt.nama.toUpperCase() === 'KAS') return false;
                return true;
            });
        } else {
            // Show all options with Kas at the beginning, but filter out duplicate KAS from bank list
            options = options.filter(opt => {
                // Skip bank records that represent KAS when showing all options
                if (opt.kode === '001' && opt.nama && opt.nama.toUpperCase() === 'KAS') return false;
                return true;
            });
            options = [kasOption, ...options];
        }

        return options;
    }, [syaratPembayaran, filterType]);

    return {
        syaratPembayaran,
        syaratPembayaranOptions,
        syaratPembayaranLoading: loading,
        syaratPembayaranError: error,
        refetch: fetchSyaratPembayaran
    };
};

export default useSyaratPembayaran;