import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Hook for fetching and formatting Item Lain-Lain data for select dropdowns
 * This replaces the itemOvk options with dedicated Item Lain-Lain master data
 */
const useItemLainLainSelect = () => {
    const [itemLainLain, setItemLainLain] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch item lain-lain data from API
    const fetchItemLainLain = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Fetching Item Lain-Lain data...');
            
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
    };

    // Fetch data on mount
    useEffect(() => {
        fetchItemLainLain();
    }, []);

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
        refetch: fetchItemLainLain
    };
};

export default useItemLainLainSelect;