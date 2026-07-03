import { useState, useCallback } from 'react';
import PenerimaanHoService from '../services/penerimaanHoService';

export const usePenerimaanHo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenerimaanHoService.getList(params);
      return { success: true, ...result };
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data penerimaan';
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
      const result = await PenerimaanHoService.getDetail(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat detail penerimaan';
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
      const result = await PenerimaanHoService.bayar(data);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal mencatat penerimaan';
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
      const result = await PenerimaanHoService.getHistory(params);
      return { success: true, ...result };
    } catch (err) {
      const msg = err?.message || 'Gagal memuat riwayat penerimaan';
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchList, fetchDetail, bayar, fetchHistory };
};

export default usePenerimaanHo;
