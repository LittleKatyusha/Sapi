import { useState, useEffect, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Hook for fetching and formatting Item Lain-Lain data for select dropdowns
 * Supports fetching all items or filtering by classification
 */
const useItemLainLainSelect = (klasifikasiId = null) => {
    const [itemLainLain, setItemLainLain] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch item lain-lain data based on classification
    const fetchItemLainLainByKlasifikasi = useCallback(async (idKlasifikasi) => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Fetching Item Lain-Lain by klasifikasi:', idKlasifikasi);
            
            const result = await HttpClient.post(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/databyklasifikasi`, {
                id: idKlasifikasi  // Backend expects 'id' not 'id_klasifikasi'
            });

            // Handle various response formats
            let dataArray = [];
            
            if (Array.isArray(result)) {
                dataArray = result;
            } else if (Array.isArray(result?.data)) {
                dataArray = result.data;
            } else if (result?.status === 'ok' && Array.isArray(result?.data)) {
                dataArray = result.data;
            }
            
            console.log(`✅ Successfully fetched ${dataArray.length} Item Lain-Lain records for klasifikasi ${idKlasifikasi}`);

            // Validate and transform data
            const validatedData = dataArray.map((item, index) => {
                // Debug log to see actual data structure
                if (index === 0) {
                    console.log('🔍 First Item Lain-Lain raw data:', item);
                }
                
                return {
                    // Use numeric id as primary identifier
                    id: item.id || item.pid || item.pubid || `TEMP-${index + 1}`,
                    numericId: item.id, // Keep numeric ID separately
                    pid: item.pid || item.pubid,
                    pubid: item.pubid,
                    name: item.name || item.nama || 'Item Lain-Lain',
                    description: item.description || item.keterangan || '',
                    id_klasifikasi_lainlain: item.id_klasifikasi_lainlain || idKlasifikasi,
                    created_at: item.created_at || null,
                    updated_at: item.updated_at || null,
                };
            });

            setItemLainLain(validatedData);
            console.log(`✅ Loaded ${validatedData.length} Item Lain-Lain for klasifikasi`);
            if (validatedData.length > 0) {
                console.log('📊 Sample Item Lain-Lain:', validatedData[0]);
            }
        } catch (err) {
            console.error('❌ Error fetching Item Lain-Lain by klasifikasi:', err);
            setError(err.message || 'Failed to fetch Item Lain-Lain data');
            setItemLainLain([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all item lain-lain data from API
    const fetchAllItemLainLain = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Fetching all Item Lain-Lain data...');
            
            // First, make a request to get the total count
            const countParams = new URLSearchParams({
                start: '0',
                length: '1',     // Request just 1 item to get total count
                draw: '1',
                't': Date.now()  // Cache buster
            });
            
            const countResult = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/data?${countParams.toString()}`);
            
            // Get total records from the response
            let totalRecords = 0;
            if (countResult?.recordsTotal) {
                totalRecords = countResult.recordsTotal;
            } else if (countResult?.data?.length) {
                totalRecords = countResult.data.length;
            }
            
            console.log(`📊 Total Item Lain-Lain records available: ${totalRecords}`);
            
            // Now fetch all records using the total count (or use a very large number as fallback)
            const params = new URLSearchParams({
                start: '0',
                length: totalRecords > 0 ? String(totalRecords) : '999999',  // Request all records
                draw: '1',
                't': Date.now()
            });
            
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.ITEM_LAIN_LAIN}/data?${params.toString()}`);

            // Handle various response formats
            let dataArray = [];
            
            if (Array.isArray(result)) {
                dataArray = result;
            } else if (Array.isArray(result?.data)) {
                dataArray = result.data;
            } else if (result?.status === 'ok' && Array.isArray(result?.data)) {
                dataArray = result.data;
            }
            
            console.log(`✅ Successfully fetched ${dataArray.length} Item Lain-Lain records`);

            // Validate and transform data
            const validatedData = dataArray.map((item, index) => {
                // Debug log to see actual data structure
                if (index === 0) {
                    console.log('🔍 First Item Lain-Lain raw data:', item);
                }
                
                return {
                    // Use numeric id as primary identifier
                    id: item.id || item.pid || item.pubid || `TEMP-${index + 1}`,
                    numericId: item.id, // Keep numeric ID separately
                    pid: item.pid || item.pubid,
                    pubid: item.pubid,
                    name: item.name || item.nama || 'Item Lain-Lain',
                    description: item.description || item.keterangan || '',
                    id_klasifikasi_lainlain: item.id_klasifikasi_lainlain || null,
                    created_at: item.created_at || null,
                    updated_at: item.updated_at || null,
                };
            });

            setItemLainLain(validatedData);
            console.log(`✅ Loaded ${validatedData.length} Item Lain-Lain`);
            if (validatedData.length > 0) {
                console.log('📊 Sample Item Lain-Lain:', validatedData[0]);
            }
        } catch (err) {
            console.error('❌ Error fetching Item Lain-Lain:', err);
            setError(err.message || 'Failed to fetch Item Lain-Lain data');
            setItemLainLain([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Main fetch function that decides which API to call
    const fetchItemLainLain = useCallback(async (overrideKlasifikasiId = null) => {
        const targetKlasifikasiId = overrideKlasifikasiId || klasifikasiId;
        
        if (targetKlasifikasiId) {
            await fetchItemLainLainByKlasifikasi(targetKlasifikasiId);
        } else {
            await fetchAllItemLainLain();
        }
    }, [klasifikasiId, fetchItemLainLainByKlasifikasi, fetchAllItemLainLain]);

    // Fetch data on mount or when klasifikasiId changes
    useEffect(() => {
        fetchItemLainLain();
    }, [klasifikasiId]);

    // Format data for SearchableSelect component
    const itemLainLainOptions = useMemo(() => {
        const options = itemLainLain.map(item => ({
            // Use numeric id if available, otherwise use what we have
            value: item.numericId || item.id,
            label: item.name || 'Item Lain-Lain',
            description: item.description,
            // Keep encrypted pid for other operations
            pid: item.pid,
            // Keep numeric ID for backend
            numericId: item.numericId,
            // Keep original data for reference
            originalData: item
        }));
        
        if (options.length > 0) {
            console.log('📋 First Item Option:', options[0]);
        }
        
        return options;
    }, [itemLainLain]);

    return {
        // Options formatted for SearchableSelect
        itemLainLainOptions,
        // Raw data if needed
        itemLainLain,
        // State
        loading,
        error,
        // Actions
        refetch: fetchItemLainLain,
        fetchItemLainLain // Export the main fetch function
    };
};

export default useItemLainLainSelect;