import { useState, useCallback } from 'react';

/**
 * Generic hook that adapts a *Service class (KendaraanService, SopirService, etc.)
 * to the contract expected by MasterDataTablePage.
 *
 * Expected ServiceClass methods:
 * - getData(resource, params)
 * - store(resource, payload)
 * - update(resource, payload)
 * - delete(resource, pid)
 * - getAll(resource)   (optional, used to load select options)
 */
const useMasterService = (ServiceClass, resource) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ServiceClass.getData(resource, {
        draw: params.draw || 1,
        start: params.start ?? 0,
        length: params.length ?? 10,
        orderColumn: params.orderColumn ?? 1,
        orderDir: params.orderDir || 'asc',
        filters: params.filters || {},
        _ts: Date.now(),
      });
      if (!result.success) {
        setError(result.message || 'Gagal memuat data');
      }
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memuat data';
      setError(msg);
      return { success: false, message: msg, data: [] };
    } finally {
      setLoading(false);
    }
  }, [ServiceClass, resource]);

  const create = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ServiceClass.store(resource, payload);
      if (!result.success) {
        setError(result.message || 'Gagal menyimpan data');
      }
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal menyimpan data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [ServiceClass, resource]);

  const update = useCallback(async (pid, payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ServiceClass.update(resource, { pid, ...payload });
      if (!result.success) {
        setError(result.message || 'Gagal memperbarui data');
      }
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal memperbarui data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [ServiceClass, resource]);

  const remove = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ServiceClass.delete(resource, pid);
      if (!result.success) {
        setError(result.message || 'Gagal menghapus data');
      }
      return result;
    } catch (err) {
      const msg = err?.message || 'Gagal menghapus data';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [ServiceClass, resource]);

  const getAll = useCallback(async () => {
    if (!ServiceClass.getAll) return { success: true, data: [] };
    return ServiceClass.getAll(resource);
  }, [ServiceClass, resource]);

  return {
    loading,
    error,
    fetch,
    create,
    update,
    remove,
    getAll,
  };
};

export default useMasterService;
