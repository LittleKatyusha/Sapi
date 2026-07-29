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
        // Identify the real KAS bank record (kode '001' + nama 'KAS') so we can
        // send its integer id to the backend instead of a synthetic 'KAS' string.
        const isKasBank = (b) => b && b.kode === '001' && b.nama && String(b.nama).toUpperCase() === 'KAS';
        const kasBank = syaratPembayaran.find(isKasBank);

        const buildOption = (bank) => ({
            value: String(bank.id), // keep string for select matching
            label: bank.display_name || (bank.kode ? `[${bank.kode}] ${bank.nama}` : bank.nama),
            id: bank.id,            // real integer id sent to backend
            kode: bank.kode,
            nama: bank.nama,
            display_name: bank.display_name,
            isKas: isKasBank(bank)
        });

        let options = syaratPembayaran.map(buildOption);

        const kasOption = kasBank
            ? buildOption(kasBank)
            : { value: 'KAS', label: 'Kas', id: 'KAS', kode: 'KAS', nama: 'Kas', isKas: true };

        if (filterType === 'KAS') {
            // Only show Kas option
            options = kasBank ? [buildOption(kasBank)] : [kasOption];
        } else if (filterType === 'BANK') {
            // Exclude KAS record, show only actual banks
            options = options.filter(opt => !opt.isKas);
        } else {
            // Show all options with Kas at the beginning (no duplicate)
            options = options.filter(opt => !opt.isKas);
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