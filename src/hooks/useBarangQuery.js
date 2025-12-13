/**
 * React Query Hooks for Barang (Items) Management
 * Optimized with caching, background refetching, optimistic updates, and automatic deduplication
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, QUERY_OPTIONS, MUTATION_OPTIONS, apiCalls } from '../utils/queryFactory';

/**
 * Hook for fetching barang list with search
 * @param {string} search - Search term
 * @param {Object} options - Additional query options
 * @returns {Object} Query object
 */
export const useBarangList = (search = '', options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.MASTER.BARANG_LIST(search),
    queryFn: () => apiCalls.master.getBarangList(search),
    ...QUERY_OPTIONS.LIST_SEARCH, // 1 min stale time, no auto-refetch
    select: (data) => {
      // Validate and format data
      if (Array.isArray(data)) {
        return data.map((item, index) => ({
          id: item.id || null,
          pubid: item.pubid || `TEMP-${index + 1}`,
          pid: item.pid || item.pubid, // encrypted PID from backend
          name: item.name || 'Nama tidak tersedia',
          description: item.description || '',
          created_at: item.created_at || null,
          updated_at: item.updated_at || null,
        }));
      }
      return [];
    },
    ...options,
  });
};

/**
 * Hook for fetching single barang detail
 * @param {string} pid - Barang PID
 * @param {Object} options - Additional query options
 * @returns {Object} Query object
 */
export const useBarangDetail = (pid, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.MASTER.BARANG_DETAIL(pid),
    queryFn: () => apiCalls.master.getBarangById(pid),
    ...QUERY_OPTIONS.MASTER,
    enabled: !!pid, // Only fetch if pid is provided
    ...options,
  });
};

/**
 * Hook for creating barang with optimistic updates
 * @returns {Object} Mutation object
 */
export const useCreateBarang = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiCalls.master.createBarang(data),
    ...MUTATION_OPTIONS.SYNC, // Wait for server response
    onSuccess: () => {
      // Invalidate and refetch all barang queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MASTER.BARANG
      });
    },
    onError: (error) => {
      console.error('Failed to create barang:', error);
    },
  });
};

/**
 * Hook for updating barang with optimistic updates
 * @returns {Object} Mutation object
 */
export const useUpdateBarang = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pid, data }) => apiCalls.master.updateBarang(pid, data),
    ...MUTATION_OPTIONS.SYNC,
    onSuccess: (result, variables) => {
      // Update the specific item in all relevant queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MASTER.BARANG
      });

      // If we have the item detail, update it
      if (variables.pid) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.MASTER.BARANG_DETAIL(variables.pid)
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update barang:', error);
    },
  });
};

/**
 * Hook for deleting barang with optimistic updates
 * @returns {Object} Mutation object
 */
export const useDeleteBarang = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pid) => apiCalls.master.deleteBarang(pid),
    ...MUTATION_OPTIONS.SYNC,
    onSuccess: () => {
      // Invalidate all barang queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MASTER.BARANG
      });
    },
    onError: (error) => {
      console.error('Failed to delete barang:', error);
    },
  });
};

/**
 * Custom hook that mimics the original useBarang behavior
 * @returns {Object} Hook object with data and methods
 */
export const useBarang = (defaultSearch = '') => {
  const [searchTerm, setSearchTerm] = React.useState(defaultSearch);

  // Queries
  const listQuery = useBarangList(searchTerm, {
    // Additional options for debounced search
    keepPreviousData: true,
  });

  // Mutations
  const createMutation = useCreateBarang();
  const updateMutation = useUpdateBarang();
  const deleteMutation = useDeleteBarang();

  // Computed values
  const stats = React.useMemo(() => ({
    total: listQuery.data?.length || 0,
    displayed: listQuery.data?.length || 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
  }), [listQuery.data, listQuery.isLoading, listQuery.isError]);

  // Action methods
  const createBarang = React.useCallback(async (data) => {
    const result = await createMutation.mutateAsync(data);
    return result;
  }, [createMutation]);

  const updateBarang = React.useCallback(async (pid, data) => {
    const result = await updateMutation.mutateAsync({ pid, data });
    return result;
  }, [updateMutation]);

  const deleteBarang = React.useCallback(async (pid) => {
    const result = await deleteMutation.mutateAsync(pid);
    return result;
  }, [deleteMutation]);

  return {
    // Data
    barang: listQuery.data || [],
    loading: listQuery.isLoading || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    error: listQuery.error?.message || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message,
    stats,

    // Search
    searchTerm,
    setSearchTerm,

    // Actions - compatible with original hook
    fetchBarang: listQuery.refetch,
    createBarang,
    updateBarang,
    deleteBarang,

    // Additional React Query data
    isMutating: createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
  };
};

// For backward compatibility, export as default
export default useBarang;
