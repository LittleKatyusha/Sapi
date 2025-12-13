/**
 * React Query Hook for Tipe Pembayaran (Payment Type)
 * Optimized with caching, background refetching, and automatic deduplication
 */

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, QUERY_OPTIONS, apiCalls } from '../utils/queryFactory';

/**
 * Hook for fetching tipe pembayaran options
 * @returns {Object} Query object with data, loading, error states
 */
export const useTipePembayaranOptions = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.MASTER.TIPE_PEMBAYARAN,
    queryFn: () => apiCalls.master.getParametersByGroup('tipe_pembayaran'),
    ...QUERY_OPTIONS.FREQUENT, // 2 min stale time, refetch on focus
    select: (data) => {
      // Transform to options format
      if (Array.isArray(data)) {
        return data.map(item => ({
          value: parseInt(item.value),
          label: item.name
        }));
      }
      return [];
    },
    ...options, // Allow custom overrides
  });
};

// For backward compatibility, export alias
export const useTipePembayaranLazy = () => {
  const query = useTipePembayaranOptions({
    staleTime: 0, // Always fetch fresh data on first load, then cache
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  return {
    tipePembayaranOptions: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    fetchTipePembayaran: query.refetch, // Alias for backward compatibility
    ...query, // Expose full query object
  };
};

export default useTipePembayaranLazy;
