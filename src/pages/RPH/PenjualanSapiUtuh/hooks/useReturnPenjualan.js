import { useState, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Hook untuk managing Return Penjualan Sapi Utuh operations
 */
const useReturnPenjualan = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [kondisiOptions, setKondisiOptions] = useState([]);

    /**
     * Create return for penjualan sapi utuh (supports multiple cattle)
     */
    const createReturn = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        try {
            // Prepare data with cattle details
            const payload = {
                id_penjualan: data.id_penjualan,
                tanggal_return: data.tanggal_return,
                tipe_return: data.tipe_return,
                alasan_return: data.alasan_return,
                catatan: data.catatan,
                cattle_details: data.cattle_details || [], // Array of {id_hewan, kondisi_sapi, catatan_detail}
            };

            const response = await HttpClient.post(
                `${API_ENDPOINTS.RPH.RETURN_PENJUALAN_SAPI_UTUH}`,
                payload
            );

            if (response.status === 'ok') {
                return response.data;
            } else {
                setError(response.message || 'Failed to create return');
                return null;
            }
        } catch (err) {
            setError(err.message || 'Error creating return');
            console.error('Error creating return:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get return history for penjualan
     */
    const getReturnHistory = useCallback(async (idPenjualan) => {
        setLoading(true);
        setError(null);
        try {
            const response = await HttpClient.get(
                `${API_ENDPOINTS.RPH.RETURN_PENJUALAN_SAPI_UTUH}?id_penjualan=${idPenjualan}`
            );

            if (response.status === 'ok') {
                return response.data;
            } else {
                setError(response.message || 'Failed to fetch return history');
                return [];
            }
        } catch (err) {
            setError(err.message || 'Error fetching return history');
            console.error('Error fetching return history:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Approve return
     */
    const approveReturn = useCallback(async (returnId, notes = null) => {
        setLoading(true);
        setError(null);
        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.RPH.RETURN_PENJUALAN_SAPI_UTUH}/${returnId}/approve`,
                { catatan_approval: notes }
            );

            if (response.status === 'ok') {
                return response.data;
            } else {
                setError(response.message || 'Failed to approve return');
                return null;
            }
        } catch (err) {
            setError(err.message || 'Error approving return');
            console.error('Error approving return:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Reject return
     */
    const rejectReturn = useCallback(async (returnId, notes) => {
        setLoading(true);
        setError(null);
        try {
            const response = await HttpClient.post(
                `${API_ENDPOINTS.RPH.RETURN_PENJUALAN_SAPI_UTUH}/${returnId}/reject`,
                { catatan_approval: notes }
            );

            if (response.status === 'ok') {
                return response.data;
            } else {
                setError(response.message || 'Failed to reject return');
                return null;
            }
        } catch (err) {
            setError(err.message || 'Error rejecting return');
            console.error('Error rejecting return:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch kondisi hewan options
     */
    const fetchKondisiOptions = useCallback(async () => {
        try {
            const response = await HttpClient.post('/api/system/parameter/dataByGroup', { group: 'kondisi_hewan' });
            const data = response.data || response;
            if (Array.isArray(data)) {
                const options = data.map(item => ({
                    value: item.value,
                    label: item.name,
                }));
                setKondisiOptions(options);
            }
        } catch (err) {
            console.error('Failed to fetch kondisi options:', err);
            // Set default options if API fails
            setKondisiOptions([
                { value: 1, label: 'Sehat' },
                { value: 2, label: 'Sakit' },
                { value: 3, label: 'Cacat' },
                { value: 4, label: 'Lainnya' },
            ]);
        }
    }, []);

    return {
        loading,
        error,
        kondisiOptions,
        createReturn,
        getReturnHistory,
        approveReturn,
        rejectReturn,
        fetchKondisiOptions,
    };
};

export default useReturnPenjualan;
