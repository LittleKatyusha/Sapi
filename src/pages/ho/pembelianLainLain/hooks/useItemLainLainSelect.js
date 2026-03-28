import { useState, useEffect, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const DEFAULT_PAGE_SIZE = 1000;

const normalizeItemLainLain = (item, index, fallbackKlasifikasiId = null) => ({
    id: item.id || item.pid || item.pubid || `TEMP-${index + 1}`,
    numericId: item.id,
    pid: item.pid || item.pubid,
    pubid: item.pubid,
    name: item.name || item.nama || 'Item Lain-Lain',
    description: item.description || item.keterangan || '',
    id_klasifikasi_lainlain: item.id_klasifikasi_lainlain || item.id_klasifikasi_lain_lain || fallbackKlasifikasiId,
    klasifikasi: item.klasifikasi || item.nama_klasifikasi_lainlain || item.nama_klasifikasi_lain_lain || '',
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
});

const buildSelectOption = (item) => ({
    value: item.numericId || item.id,
    label: item.name || 'Item Lain-Lain',
    description: item.description,
    pid: item.pid,
    numericId: item.numericId,
    originalData: item,
});

/**
 * Hook for fetching and formatting Item Lain-Lain data for select dropdowns.
 * Supports fetching all items or filtering by classification.
 */
const useItemLainLainSelect = (klasifikasiId = null) => {
    const [itemLainLain, setItemLainLain] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchItemLainLainByKlasifikasi = useCallback(async (idKlasifikasi) => {
        setLoading(true);
        setError(null);

        try {
            const result = await HttpClient.post(
                `${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/databyklasifikasi`,
                { id: idKlasifikasi }
            );

            const dataArray = Array.isArray(result)
                ? result
                : Array.isArray(result?.data)
                    ? result.data
                    : [];

            setItemLainLain(
                dataArray.map((item, index) => normalizeItemLainLain(item, index, idKlasifikasi))
            );
        } catch (err) {
            console.error('❌ Error fetching Item Lain-Lain by klasifikasi:', err);
            setError(err.message || 'Failed to fetch Item Lain-Lain data');
            setItemLainLain([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAllItemLainLain = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const firstPage = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/data`, {
                params: {
                    draw: 1,
                    start: 0,
                    length: DEFAULT_PAGE_SIZE,
                    'order[0][column]': 0,
                    'order[0][dir]': 'asc',
                    t: Date.now(),
                },
                cache: false,
            });

            const firstPageData = Array.isArray(firstPage?.data)
                ? firstPage.data
                : Array.isArray(firstPage)
                    ? firstPage
                    : [];

            const totalRecords = Number(
                firstPage?.recordsFiltered ?? firstPage?.recordsTotal ?? firstPageData.length ?? 0
            );

            if (!totalRecords || firstPageData.length >= totalRecords) {
                setItemLainLain(firstPageData.map((item, index) => normalizeItemLainLain(item, index)));
                return;
            }

            const remainingStarts = [];
            for (let start = firstPageData.length; start < totalRecords; start += DEFAULT_PAGE_SIZE) {
                remainingStarts.push(start);
            }

            const remainingPages = await Promise.all(
                remainingStarts.map((start, pageIndex) =>
                    HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/data`, {
                        params: {
                            draw: pageIndex + 2,
                            start,
                            length: DEFAULT_PAGE_SIZE,
                            'order[0][column]': 0,
                            'order[0][dir]': 'asc',
                            t: Date.now() + pageIndex + 1,
                        },
                        cache: false,
                    })
                )
            );

            const remainingData = remainingPages.flatMap((page) =>
                Array.isArray(page?.data) ? page.data : Array.isArray(page) ? page : []
            );

            const allItems = [...firstPageData, ...remainingData]
                .slice(0, totalRecords)
                .map((item, index) => normalizeItemLainLain(item, index));

            setItemLainLain(allItems);
        } catch (err) {
            console.error('❌ Error fetching Item Lain-Lain:', err);
            setError(err.message || 'Failed to fetch Item Lain-Lain data');
            setItemLainLain([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchItemLainLain = useCallback(async (overrideKlasifikasiId = null) => {
        const targetKlasifikasiId = overrideKlasifikasiId || klasifikasiId;

        if (targetKlasifikasiId) {
            await fetchItemLainLainByKlasifikasi(targetKlasifikasiId);
        } else {
            await fetchAllItemLainLain();
        }
    }, [klasifikasiId, fetchItemLainLainByKlasifikasi, fetchAllItemLainLain]);

    useEffect(() => {
        fetchItemLainLain();
    }, [fetchItemLainLain]);

    const itemLainLainOptions = useMemo(() => {
        return itemLainLain.map(buildSelectOption);
    }, [itemLainLain]);

    return {
        itemLainLainOptions,
        itemLainLain,
        loading,
        error,
        refetch: fetchItemLainLain,
        fetchItemLainLain,
    };
};

export default useItemLainLainSelect;
