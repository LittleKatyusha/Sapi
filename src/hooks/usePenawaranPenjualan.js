/**
 * React Hook for Penawaran Penjualan RPH Operations
 * Provides state management and API calls for sales quotations
 */

import { useState, useCallback } from 'react';
import PenawaranPenjualanRphService from '../services/penawaranPenjualanRphService';

export const usePenawaranPenjualan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.getData(params);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data penawaran';
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
      const result = await PenawaranPenjualanRphService.show(pid);
      if (result.success) setDetail(result.data);
      else setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat detail penawaran';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const store = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.store(data);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal menyimpan penawaran';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.update(data);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memperbarui penawaran';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const hapus = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.hapus(pid);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal menghapus penawaran';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const ajukan = useCallback(async (pid, diajukan_kepada) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.ajukan(pid, diajukan_kepada);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal mengajukan penawaran';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const setujui = useCallback(async (pid, approved, disetujuiOlehId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.setujui(pid, approved, disetujuiOlehId);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memproses persetujuan';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPedagang = useCallback(async (rph_id) => {
    setLoading(true);
    try {
      const result = await PenawaranPenjualanRphService.getPedagangList(rph_id);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data pedagang';
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApprovers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await PenawaranPenjualanRphService.getApprovers();
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data approver';
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const gunakanDispensasi = useCallback(async (pedagang_id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.gunakanDispensasi(pedagang_id);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal menggunakan dispensasi';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const rollbackDispensasi = useCallback(async (detail_id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PenawaranPenjualanRphService.rollbackDispensasi(detail_id);
      if (!result.success) setError(result.message);
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal me-rollback dispensasi';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    detail,
    fetchData,
    fetchDetail,
    store,
    update,
    hapus,
    ajukan,
    setujui,
    fetchPedagang,
    fetchApprovers,
    gunakanDispensasi,
    rollbackDispensasi,
  };
};

export default usePenawaranPenjualan;
