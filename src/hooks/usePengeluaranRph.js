import { useState, useCallback } from 'react';
import PengeluaranRphService from '../services/pengeluaranRphService';

export const usePengeluaranRph = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PengeluaranRphService.getList(params);
      return { success: true, ...result };
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data pengeluaran';
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PengeluaranRphService.getDetail(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat detail pengeluaran';
      setError(msg);
      return { success: false, message: msg, data: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const bayar = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PengeluaranRphService.bayar(data);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal mencatat pembayaran';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PengeluaranRphService.getHistory(params);
      return { success: true, ...result };
    } catch (err) {
      const msg = err?.message || 'Gagal memuat riwayat pengeluaran';
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchList, fetchDetail, bayar, fetchHistory };
};

export default usePengeluaranRph;
