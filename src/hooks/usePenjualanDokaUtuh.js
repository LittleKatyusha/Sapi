/**
 * React Hook for Penjualan Doka Utuh Operations
 * Provides state management and API calls for whole doka/kambing/domba sales
 */

import { useState, useCallback } from 'react';
import PenjualanDokaUtuhService from '../services/penjualanDokaUtuhService';

export const usePenjualanDokaUtuh = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.getData(params);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data penjualan doka';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableDoka = useCallback(async (transactionId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.getAvailableDoka(transactionId);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data doka';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.show(pid);
      if (result.success) {
        setCurrentTransaction(result.data);
      } else {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat detail penjualan doka';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.store(payload);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal menambahkan penjualan doka';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.update(payload);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memperbarui penjualan doka';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.delete(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal menghapus penjualan doka';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const confirm = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.confirm(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal mengkonfirmasi transaksi';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.cancel(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal membatalkan transaksi';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const bayar = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.bayar(payload);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal mencatat pembayaran';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPembayaranHistory = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.getPembayaranHistory(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat history pembayaran';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDelivery = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.updateDelivery(payload);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memperbarui data pengiriman';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const printFaktur = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.printFaktur(pid);
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

  const printInvoice = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.printInvoice(pid);
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

  const printSuratJalan = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.printSuratJalan(pid);
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

  const fetchPenerimaanHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.getPenerimaanHistory(params);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat riwayat penerimaan';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReturnHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.getReturnHistory(params);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat history return';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReturns = useCallback(async (idPenjualan = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.getReturns(idPenjualan);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal memuat data return';
      setError(errorMessage);
      return { success: false, message: errorMessage, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const storeReturn = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenjualanDokaUtuhService.storeReturn(payload);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Gagal membuat return';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCurrent = useCallback(() => {
    setCurrentTransaction(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    currentTransaction,
    fetchData,
    fetchAvailableDoka,
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
    fetchPenerimaanHistory,
    fetchReturnHistory,
    fetchReturns,
    storeReturn,
    clearCurrent,
    clearError,
  };
};

export default usePenjualanDokaUtuh;
