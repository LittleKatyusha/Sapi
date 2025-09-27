import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

/**
 * Custom hook for managing PembayaranPage state
 * @param {Object} params - Parameters for state management
 * @param {Function} params.fetchPembayaran - Function to fetch pembayaran data
 * @param {Function} params.deletePembayaran - Function to delete pembayaran
 * @param {Object} params.serverPagination - Server pagination object
 * @param {string} params.searchTerm - Current search term
 * @returns {Object} State and handlers
 */
export const usePembayaranPageState = ({
  fetchPembayaran,
  deletePembayaran,
  serverPagination,
  searchTerm
}) => {
  const location = useLocation();
  
  // UI state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = useState(null);

  // Reset openMenuId when data changes to prevent auto-opening
  useEffect(() => {
    setOpenMenuId(null);
  }, []);

  // Refresh data when returning from edit page
  useEffect(() => {
    if (location.state?.fromEdit) {
      console.log('🔄 Pembayaran Feedmill: Auto-refreshing data after returning from edit page');
      console.log('🔄 Pembayaran Feedmill: Current state:', { 
        currentPage: serverPagination.currentPage, 
        perPage: serverPagination.perPage, 
        searchTerm 
      });
      fetchPembayaran(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
      
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchPembayaran, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

  // Action handlers
  const handleEdit = useCallback((pembayaranItem) => {
    const id = pembayaranItem.id;
    if (!id || id.toString().startsWith('TEMP-')) {
      throw new Error(ERROR_MESSAGES.CANNOT_EDIT);
    }
    console.log('🔍 Feedmill Edit - pembayaranItem:', pembayaranItem);
    console.log('🔍 Feedmill Edit - using database id:', id);
    console.log('🔍 Feedmill Edit - id type:', typeof id);
    return { id, action: 'edit' };
  }, []);

  const handleDetail = useCallback((pembayaranItem) => {
    const id = pembayaranItem.id;
    if (!id || id.toString().startsWith('TEMP-')) {
      throw new Error(ERROR_MESSAGES.CANNOT_VIEW_DETAIL);
    }
    console.log('🔍 Feedmill Detail - pembayaranItem:', pembayaranItem);
    console.log('🔍 Feedmill Detail - using database id:', id);
    console.log('🔍 Feedmill Detail - id type:', typeof id);
    return { id, action: 'detail' };
  }, []);

  const handleDelete = useCallback((pembayaranItem) => {
    setSelectedPembayaran(pembayaranItem);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  }, []);

  // Modal handlers
  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedPembayaran(null);
  }, []);

  const handleDeletePembayaran = useCallback(async (pembayaran) => {
    try {
      const id = pembayaran.id;
      
      if (!id) {
        throw new Error(ERROR_MESSAGES.NO_ID_FOR_DELETE);
      }
      
      if (id.toString().startsWith('TEMP-')) {
        throw new Error(ERROR_MESSAGES.TEMP_DATA_DELETE);
      }

      const result = await deletePembayaran(id, pembayaran);
      
      if (result.success) {
        handleCloseDeleteModal();
        return {
          success: true,
          message: result.message || SUCCESS_MESSAGES.DELETE_SUCCESS
        };
      } else {
        return {
          success: false,
          message: result.message || ERROR_MESSAGES.DELETE_FAILED
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || ERROR_MESSAGES.DELETE_ERROR
      };
    }
  }, [deletePembayaran, handleCloseDeleteModal]);

  return {
    // State
    openMenuId,
    setOpenMenuId,
    isDeleteModalOpen,
    selectedPembayaran,
    
    // Handlers
    handleEdit,
    handleDetail,
    handleDelete,
    handleCloseDeleteModal,
    handleDeletePembayaran
  };
};
