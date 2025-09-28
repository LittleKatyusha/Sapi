import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing pagination state and logic
 */
export const usePagination = (data, initialPerPage = 10) => {
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: initialPerPage,
    totalItems: 0,
    totalPages: 0
  });

  // Update pagination when data changes
  useEffect(() => {
    if (data.length >= 0) {
      const totalPages = Math.ceil(data.length / pagination.perPage);
      setPagination(prev => ({
        ...prev,
        totalItems: data.length,
        totalPages: totalPages,
        // Reset to page 1 if current page exceeds total pages
        currentPage: prev.currentPage > totalPages && totalPages > 0 ? 1 : prev.currentPage
      }));
    }
  }, [data.length, pagination.perPage]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  }, []);

  // Handle per page change
  const handlePerPageChange = useCallback((perPage) => {
    const newTotalPages = Math.ceil(data.length / perPage);
    setPagination(prev => ({
      ...prev,
      perPage: perPage,
      totalPages: newTotalPages,
      currentPage: 1 // Reset to first page when changing per page
    }));
  }, [data.length]);

  // Get paginated data
  const getPaginatedData = useCallback(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.perPage;
    const endIndex = startIndex + pagination.perPage;
    return data.slice(startIndex, endIndex);
  }, [data, pagination.currentPage, pagination.perPage]);

  // Update pagination after item deletion
  const updatePaginationAfterDelete = useCallback(() => {
    const newTotalItems = data.length - 1;
    const newTotalPages = Math.ceil(newTotalItems / pagination.perPage);
    
    if (pagination.currentPage > newTotalPages && newTotalPages > 0) {
      setPagination(prev => ({
        ...prev,
        currentPage: newTotalPages,
        totalItems: newTotalItems,
        totalPages: newTotalPages
      }));
    } else {
      setPagination(prev => ({
        ...prev,
        totalItems: newTotalItems,
        totalPages: newTotalPages
      }));
    }
  }, [data.length, pagination.currentPage, pagination.perPage]);

  return {
    pagination,
    handlePageChange,
    handlePerPageChange,
    getPaginatedData,
    updatePaginationAfterDelete
  };
};