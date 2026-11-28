import { useCallback, useState } from 'react';
import HttpClient from '../../../../services/httpClient';

/**
 * Hook untuk master "nama item" (sub-item) yang bergantung pada Item Lain-Lain.
 *
 * Contoh: Item "Perlengkapan Kantor" → Pulpen, Tipex, Map.
 * Dipakai untuk pemetaan opname perlengkapan (kartu stok per nama barang).
 */
const useItemSubLainlain = () => {
    const [subItems, setSubItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const normalize = (response) => {
        const payload = response?.data ?? response;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    };

    const SUB_ITEM_ENDPOINT = '/api/master/itemlainlain/sub/data';

    const fetchSubItems = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // GET di-cache 5 menit oleh HttpClient; bersihkan agar nama item yang
            // baru ditambahkan langsung muncul di dropdown.
            HttpClient.clearCache(SUB_ITEM_ENDPOINT);

            const response = await HttpClient.get(SUB_ITEM_ENDPOINT, {
                params: { include_inactive: false, _ts: Date.now() },
                cache: false
            });
            setSubItems(normalize(response));
        } catch (err) {
            console.error('❌ Error fetching sub item:', err);
            setError(err?.message || 'Gagal memuat nama item');
            setSubItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const createSubItem = useCallback(async ({ idItem, name, satuan }) => {
        const response = await HttpClient.post('/api/master/itemlainlain/sub/store', {
            id_item: idItem,
            name,
            satuan: satuan || null
        });
        await fetchSubItems();
        return normalize(response)[0] ?? response?.data ?? null;
    }, [fetchSubItems]);

    /**
     * Opsi SearchableSelect untuk sebuah item induk.
     */
    const optionsFor = useCallback((idItem) => {
        if (!idItem) return [];

        return subItems
            .filter((sub) => String(sub.id_item) === String(idItem))
            .map((sub) => ({
                value: sub.name,
                label: sub.satuan ? `${sub.name} (${sub.satuan})` : sub.name,
                originalData: sub
            }));
    }, [subItems]);

    return {
        subItems,
        optionsFor,
        loading,
        error,
        fetchSubItems,
        createSubItem
    };
};

export default useItemSubLainlain;
