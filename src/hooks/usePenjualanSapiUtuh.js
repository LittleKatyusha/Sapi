/**
 * React Hook for Penjualan Sapi Utuh Operations
 * Provides state management and API calls for whole cattle sales
 */

import { useState, useCallback } from 'react';
import PenjualanSapiUtuhService from '../services/penjualanSapiUtuhService';

/**
 * Custom hook for penjualan sapi utuh operations
 * @returns {Object} Hook object with state and methods
 */
export const usePenjualanSapiUtuh = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  /**
   * Fetch paginated data for DataTable
   */
  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.getData(params);
      if (result.success) {
        return result;
      } else {
        setError(result.message);
        return result;
      }
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data penjualan';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch available sapi for dropdown
   */
  const fetchAvailableSapi = useCallback(async (jenisTransaksi = 'sapi_utuh', transactionId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.getAvailableSapi(jenisTransaksi, transactionId);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data sapi';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch single transaction detail
   */
  const fetchDetail = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.show(pid);
      if (result.success) {
        setCurrentTransaction(result.data);
      } else {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat detail penjualan';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new transaction
   */
  const create = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.store(payload);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal menambahkan penjualan';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update existing transaction
   */
  const update = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.update(payload);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memperbarui penjualan';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete transaction
   */
  const remove = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.delete(pid);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal menghapus penjualan';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Confirm transaction
   */
  const confirm = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.confirm(pid);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal mengkonfirmasi transaksi';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancel transaction
   */
  const cancel = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.cancel(pid);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal membatalkan transaksi';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Record payment / pelunasan
   */
  const bayar = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.bayar(payload);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal mencatat pembayaran';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get payment history for a transaction
   */
  const fetchPembayaranHistory = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.getPembayaranHistory(pid);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat history pembayaran';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update delivery status & details
   */
  const updateDelivery = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.updateDelivery(payload);
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memperbarui data pengiriman';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get faktur print data
   */
  const printFaktur = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.printFaktur(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data faktur';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get invoice print data
   */
  const printInvoice = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.printInvoice(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data invoice';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get surat jalan print data
   */
  const printSuratJalan = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanSapiUtuhService.printSuratJalan(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data surat jalan';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear current transaction
   */
  const clearCurrent = useCallback(() => {
    setCurrentTransaction(null);
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
    currentTransaction,
    fetchData,
    fetchAvailableSapi,
    fetchDetail,
    create,
    update,
    remove,
    confirm,
    cancel,
    bayar,
    fetchPembayaranHistory,
    updateDelivery,
    printFaktur,
    printInvoice,
    printSuratJalan,
    clearCurrent,
    clearError,
  };
};

export default usePenjualanSapiUtuh;
