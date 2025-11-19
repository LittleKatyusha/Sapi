import { useState, useCallback, useEffect } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook for fetching and managing master data barang
 * Connected to BarangController API endpoint
 * Used for populating "Barang" dropdown in Tanda Terima
 */
const useItemMasterData = () => {
    const [itemOptions, setItemOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cache, setCache] = useState(null);

    // Fetch items from Barang API
    const fetchItems = useCallback(async (forceRefresh = false) => {
        // Return cached data if available and not forcing refresh
        if (cache && !forceRefresh) {
            setItemOptions(cache);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Call Barang API endpoint using GET method
            // Backend returns DataTables format: { draw, recordsTotal, recordsFiltered, data }
            // Use large length value to get all records
            const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.BARANG}/data`, {
                params: {
                    length: 10000, // Large number to get all records
                    start: 0
                }
            });

            // Check if response has DataTables format
            if (response && response.data && Array.isArray(response.data)) {
                // Transform data to options format for SearchableSelect
                const options = response.data.map(item => ({
                    value: item.id, // Use numeric ID as value
                    label: item.name, // Display name
                    description: item.description, // Additional info
                    pid: item.pid, // Encrypted PID for reference
                    pubid: item.pubid, // Public ID
                    numericId: item.id // Explicit numeric ID
                }));

                setItemOptions(options);
                setCache(options); // Cache the results
            } else {
                throw new Error('Format response tidak valid');
            }
        } catch (err) {
            console.error('Error fetching barang items:', err);
            setError(err.message || 'Gagal memuat data barang');
            setItemOptions([]);
        } finally {
            setLoading(false);
        }
    }, [cache]);

    // Fetch items on mount
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Get item by ID
    const getItemById = useCallback((id) => {
        return itemOptions.find(item => item.value === id || item.numericId === id);
    }, [itemOptions]);

    // Get item by name
    const getItemByName = useCallback((name) => {
        return itemOptions.find(item =>
            item.label.toLowerCase() === name.toLowerCase()
        );
    }, [itemOptions]);

    // Search items by description
    const searchItemsByDescription = useCallback((searchTerm) => {
        if (!searchTerm) return itemOptions;
        const term = searchTerm.toLowerCase();
        return itemOptions.filter(item =>
            item.label.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term)
        );
    }, [itemOptions]);

    // Refresh items (force fetch from API)
    const refreshItems = useCallback(() => {
        setCache(null);
        fetchItems(true);
    }, [fetchItems]);

    return {
        itemOptions,
        loading,
        error,
        fetchItems,
        refreshItems,
        getItemById,
        getItemByName,
        searchItemsByDescription
    };
};

export default useItemMasterData;