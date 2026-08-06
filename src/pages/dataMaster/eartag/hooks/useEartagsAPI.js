import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useEartagsAPI = () => {
    const { getAuthHeader, loading: authLoading } = useAuthSecure();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filteredRecords, setFilteredRecords] = useState(0);

    const API_BASE = API_ENDPOINTS.MASTER.EARTAG;

    const mapStatusToText = useCallback((status) => (status === 1 ? 'Aktif' : 'Nonaktif'), []);
    const mapUsedStatusToText = useCallback((usedStatus) => (usedStatus === 1 ? 'Sudah Terpasang' : 'Belum Terpasang'), []);

    // Fetch data server-side with params
    const fetchEartags = useCallback(async (params = {}) => {
        if (authLoading) return { success: false, message: 'Auth loading' };

        setLoading(true);
        setError(null);
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }

            const queryParams = new URLSearchParams({
                draw: params.draw || 1,
                start: params.start ?? 0,
                length: params.length ?? 10,
                'search[value]': params.search || '',
                'order[0][column]': params.orderColumn ?? 1,
                'order[0][dir]': params.orderDir || 'asc',
                _ts: Date.now(),
            });

            const filters = params.filters || {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    queryParams.append(`filters[${key}]`, value);
                }
            });

            const result = await HttpClient.get(`${API_BASE}/data?${queryParams.toString()}`);

            const dataArray = result?.data || [];
            const mapped = dataArray.map((item, index) => ({
                pid: item.pid || item.pubid || `TEMP-${index + 1}`,
                rawPubid: item.pubid,
                id: item.id || item.kode || `EAR${(index + 1).toString().padStart(3, '0')}`,
                kode: item.kode || item.code || 'Kode tidak tersedia',
                used_status: item.used_status !== undefined ? item.used_status : 0,
                status: item.status !== undefined ? item.status : 1,
                created_at: item.created_at || null,
                updated_at: item.updated_at || null,
                statusText: mapStatusToText(item.status !== undefined ? item.status : 1),
                usedStatusText: mapUsedStatusToText(item.used_status !== undefined ? item.used_status : 0),
                tanggalPemasangan: (item.used_status === 1) ? (item.updated_at || item.created_at || '') : '',
                deskripsi: `Eartag ${item.kode || item.code || 'tanpa kode'} - ${mapStatusToText(item.status !== undefined ? item.status : 1)}`,
            }));

            setData(mapped);
            setTotalRecords(result?.recordsTotal || 0);
            setFilteredRecords(result?.recordsFiltered || 0);
            return {
                success: true,
                data: mapped,
                recordsTotal: result?.recordsTotal || 0,
                recordsFiltered: result?.recordsFiltered || 0,
            };
        } catch (err) {
            const msg = err?.message || 'Gagal memuat data';
            setError(msg);
            setData([]);
            return { success: false, message: msg, data: [] };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, authLoading, mapStatusToText, mapUsedStatusToText, API_BASE]);

    // Create eartag
    const createEartag = useCallback(async (eartagData) => {
        setLoading(true);
        setError(null);
        try {
            const cleanEartagData = {
                kode: String(eartagData.kode).trim(),
                used_status: parseInt(eartagData.used_status, 10),
            };
            const result = await HttpClient.post(`${API_BASE}/store`, cleanEartagData);
            return { success: true, message: result.message || 'Data berhasil ditambahkan' };
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Gagal membuat data';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE]);

    // Update eartag
    const updateEartag = useCallback(async (pid, eartagData) => {
        setLoading(true);
        setError(null);
        try {
            const eartag = data.find((e) => e.pid === pid);
            const actualPid = eartag?.rawPubid || eartag?.pid || pid;
            const payload = {
                pid: String(actualPid).trim(),
                kode: String(eartagData.kode).trim(),
                used_status: parseInt(eartagData.used_status, 10),
            };
            const result = await HttpClient.post(`${API_BASE}/update`, payload);
            return { success: true, message: result.message || 'Data berhasil diperbarui' };
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Gagal memperbarui data';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, data]);

    // Delete eartag
    const deleteEartag = useCallback(async (pid) => {
        setLoading(true);
        setError(null);
        try {
            const eartag = data.find((e) => e.pid === pid);
            const actualPid = eartag?.rawPubid || eartag?.pid || pid;
            const result = await HttpClient.post(`${API_BASE}/hapus`, { pid: String(actualPid).trim() });
            return { success: true, message: result.message || 'Data berhasil dihapus' };
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Gagal menghapus data';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    }, [API_BASE, data]);

    const stats = useMemo(() => {
        const total = totalRecords;
        const inUse = data.filter((i) => i.used_status === 1).length;
        const active = data.filter((i) => i.status === 1).length;
        const inactive = data.filter((i) => i.status === 0).length;
        return { total, active, inactive, inUse };
    }, [totalRecords, data]);

    return {
        eartags: data,
        data,
        loading,
        error,
        stats,
        fetchEartags,
        createEartag,
        updateEartag,
        deleteEartag,
        mapStatusToText,
        mapUsedStatusToText,
        totalRecords,
        filteredRecords,
    };
};

export default useEartagsAPI;