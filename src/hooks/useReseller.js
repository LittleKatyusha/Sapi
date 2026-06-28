/**
 * React Hook for Reseller Operations
 * Provides state management and API calls for reseller CRUD operations
 */

import { useState, useCallback } from 'react';
import ResellerService from '../services/resellerService';

/**
 * Custom hook for reseller operations
 * @returns {Object} Hook object with state and methods
 */
export const useReseller = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resellers, setResellers] = useState([]);
  const [activeResellers, setActiveResellers] = useState([]);
  const [currentReseller, setCurrentReseller] = useState(null);

  /**
   * Fetch paginated reseller data for DataTable
   */
  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerService.getData(params);
      if (result.success) {
        return result;
      } else {
        setError(result.message);
        return result;
      }
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data reseller';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all resellers
   */
  const fetchAll = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerService.getAll(params);
      if (result.success) {
        setResellers(result.data);
      } else {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data reseller';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch active resellers only
   */
  const fetchActive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerService.getActive();
      if (result.success) {
        setActiveResellers(result.data);
      } else {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data reseller aktif';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch single reseller detail
   */
  const fetchDetail = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerService.show(pid);
      if (result.success) {
        setCurrentReseller(result.data);
      } else {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat detail reseller';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new reseller
   */
  const create = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerService.store(payload);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal menambahkan reseller';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update existing reseller
   */
  const update = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerService.update(payload);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memperbarui reseller';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete reseller
   */
  const remove = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerService.delete(pid);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal menghapus reseller';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear current reseller
   */
  const clearCurrent = useCallback(() => {
    setCurrentReseller(null);
    setError(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    resellers,
    activeResellers,
    currentReseller,
    fetchData,
    fetchAll,
    fetchActive,
    fetchDetail,
    create,
    update,
    remove,
    clearCurrent,
    clearError,
  };
};

export default useReseller;
