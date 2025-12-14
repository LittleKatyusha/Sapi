/**
 * Debounced Query Hook
 * Provides debounced search functionality with React Query
 * Prevents excessive API calls during typing
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook to debounce a value
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook that combines React Query with debounced search
 * @param {string} searchTerm - Current search term (not debounced)
 * @param {Function} queryFn - React Query query function
 * @param {Array} queryKey - React Query key
 * @param {Object} options - Query options
 * @returns {Object} Query result with debounced search
 */
export const useDebouncedQuery = (searchTerm, queryFn, queryKey, options = {}) => {
  const debouncedSearchTerm = useDebounce(searchTerm, options.debounceDelay || 500);

  const memoizedQueryKey = useMemo(() => {
    return typeof queryKey === 'function'
      ? queryKey(debouncedSearchTerm)
      : [...queryKey, debouncedSearchTerm];
  }, [queryKey, debouncedSearchTerm]);

  const query = useQuery({
    queryKey: memoizedQueryKey,
    queryFn: () => queryFn(debouncedSearchTerm),
    enabled: options.enabled !== false,
    ...options,
  });

  return {
    ...query,
    debouncedSearchTerm,
    isTyping: searchTerm !== debouncedSearchTerm,
  };
};

/**
 * Hook that optimizes search queries with debouncing and caching
 * @param {Object} config - Configuration object
 * @param {string} config.searchTerm - Current search input
 * @param {Function} config.queryFn - Function that takes search term and returns promise
 * @param {Array} config.queryKey - Base query key array
 * @param {Object} config.options - Additional query options
 * @returns {Object} Enhanced query result
 */
export const useSearchQuery = ({ searchTerm, queryFn, queryKey, options = {} }) => {
  const debouncedSearchTerm = useDebounce(searchTerm, options.debounceDelay || 500);

  // Generate query key with search term
  const memoizedQueryKey = useMemo(() => {
    if (typeof queryKey === 'function') {
      return queryKey(debouncedSearchTerm);
    }
    return [...queryKey, debouncedSearchTerm];
  }, [queryKey, debouncedSearchTerm]);

  const query = useQuery({
    queryKey: memoizedQueryKey,
    queryFn: () => queryFn(debouncedSearchTerm),
    enabled: options.enabled !== false,
    // For search queries, keep previous data while new data loads
    keepPreviousData: true,
    // Customize stale time for search (shorter than default)
    staleTime: options.staleTime || 1 * 60 * 1000, // 1 minute default for search
    ...options,
  });

  return {
    ...query,
    searchTerm,
    debouncedSearchTerm,
    isTyping: searchTerm !== debouncedSearchTerm,
    // Helper to know if we should show "Searching..." state
    showSearching: query.isFetching && searchTerm !== debouncedSearchTerm,
  };
};

export default {
  useDebounce,
  useDebouncedQuery,
  useSearchQuery,
};
