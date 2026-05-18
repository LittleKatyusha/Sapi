import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useTarifDof = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchData = useCallback(async ({ draw = 1, start = 0, length = 10, search = '' } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.TARIF_DOF}/data`, {
        params: { draw, start, length, 'search[value]': search },
      });

      let dataArray = [];
      let total = 0;
      let filtered = 0;
      if (result?.data) {
        dataArray = result.data;
        total = result.recordsTotal || dataArray.length;
        filtered = result.recordsFiltered || total;
      } else if (Array.isArray(result)) {
        dataArray = result;
        total = dataArray.length;
        filtered = total;
      }
      setData(dataArray);
      setTotalRecords(total);
      return { data: dataArray, recordsTotal: total, recordsFiltered: filtered, draw };
    } catch (err) {
      setError(`API Error: ${err.message}`);
      setData([]);
      return { data: [], recordsTotal: 0, recordsFiltered: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.TARIF_DOF}/store`, payload);
      if (result?.status === 'ok' || result?.data) {
        return result;
      }
      throw new Error(result?.message || 'Gagal membuat data');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal membuat data';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData, createItem, totalRecords };
};

export default useTarifDof;
