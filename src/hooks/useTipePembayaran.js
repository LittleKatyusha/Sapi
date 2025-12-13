import { useQuery } from '@tanstack/react-query';
import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Shared hook for tipe pembayaran (payment type) options
 * Used across all pembelian forms (HO, OVK, Feedmil, Kulit)
 * Fetches data from backend sys_ms_parameter table
 * Uses React Query to prevent redundant API calls across components
 *
 * @returns {Object} tipePembayaranOptions, loading, error, refetch
 */
const useTipePembayaran = () => {
    const {
        data: tipePembayaranOptions,
        isLoading: loading,
        error,
        refetch
    } = useQuery({
        queryKey: ['tipe-pembayaran'],
        queryFn: async () => {
            const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
                group: 'tipe_pembayaran'
            });

            if (response.data && Array.isArray(response.data)) {
                return response.data.map(item => ({
                    value: parseInt(item.value),
                    label: item.name
                }));
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - longer than default for master data
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        retry: (failureCount, error) => {
            // Don't retry on 4xx errors
            if (error?.status >= 400 && error?.status < 500) {
                return false;
            }
            return failureCount < 2; // Fewer retries for master data
        },
        onError: (err) => {
            console.error('Error fetching tipe pembayaran:', err);
        }
    });

    return {
        tipePembayaranOptions: tipePembayaranOptions || [],
        loading,
        error: error?.message || null,
        refetch
    };
};

export default useTipePembayaran;
