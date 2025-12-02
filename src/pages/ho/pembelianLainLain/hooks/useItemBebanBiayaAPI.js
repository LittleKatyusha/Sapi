import { useState, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';

/**
 * Hook for fetching Item Lain-Lain from master parameter data
 * Fetches items from /api/master/parameter/data and extracts itemlainlain key
 * Only fetches when explicitly called (lazy loading)
 */
const useItemBebanBiayaAPI = () => {
    const [itemBebanBiaya, setItemBebanBiaya] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch item lain-lain from master parameter data endpoint
     * This will be called manually when modal opens
     */
    const fetchItemBebanBiaya = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Fetching Item Lain-Lain from master parameter data endpoint...');
            
            // Call the endpoint: GET /api/master/parameter/data
            // Extract itemlainlain from response
            const response = await HttpClient.get('/api/master/parameter/data');

            console.log('📦 Raw Response from /api/master/parameter/data:', response);

            // Extract itemlainlain from response
            let dataArray = [];
            
            // Try multiple possible response structures
            if (response?.data?.[0]?.itemlainlain && Array.isArray(response.data[0].itemlainlain)) {
                // Response structure: { data: [{ itemlainlain: [...] }] }
                dataArray = response.data[0].itemlainlain;
                console.log('✅ Found itemlainlain in data[0]');
            } else if (response?.data?.itemlainlain && Array.isArray(response.data.itemlainlain)) {
                // Response structure: { data: { itemlainlain: [...] } }
                dataArray = response.data.itemlainlain;
                console.log('✅ Found itemlainlain in data');
            } else if (response?.itemlainlain && Array.isArray(response.itemlainlain)) {
                // Response structure: { itemlainlain: [...] }
                dataArray = response.itemlainlain;
                console.log('✅ Found itemlainlain in root');
            } else {
                console.warn('⚠️ itemlainlain not found in response or not an array');
                console.warn('⚠️ Response structure:', Object.keys(response || {}));
                if (response?.data?.[0]) {
                    console.warn('⚠️ Available keys in data[0]:', Object.keys(response.data[0]));
                }
            }
            
            console.log(`✅ Successfully fetched ${dataArray.length} Item Lain-Lain records`);

            // Validate and transform data
            const validatedData = dataArray.map((item, index) => {
                // Debug log to see actual data structure
                if (index === 0) {
                    console.log('🔍 First Item Lain-Lain raw data:', item);
                }
                
                return {
                    id: item.id,
                    name: item.name || 'Item Lain-Lain',
                    // Keep original data for reference
                    originalData: item
                };
            });

            setItemBebanBiaya(validatedData);
            console.log(`✅ Loaded ${validatedData.length} Item Lain-Lain`);
            if (validatedData.length > 0) {
                console.log('📊 Sample Item Lain-Lain:', validatedData[0]);
            }
        } catch (err) {
            console.error('❌ Error fetching Item Lain-Lain:', err);
            setError(err.message || 'Failed to fetch Item Lain-Lain data');
            setItemBebanBiaya([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Format data for SearchableSelect component
    const itemBebanBiayaOptions = useMemo(() => {
        const options = itemBebanBiaya.map(item => ({
            value: item.id?.toString() || '',
            label: item.name || 'Item Beban Biaya',
            // Keep original data for reference
            originalData: item
        }));
        
        if (options.length > 0) {
            console.log('📋 First Item Beban Biaya Option:', options[0]);
        }
        
        return options;
    }, [itemBebanBiaya]);

    return {
        // Options formatted for SearchableSelect
        itemBebanBiayaOptions,
        // Raw data if needed
        itemBebanBiaya,
        // State
        loading,
        error,
        // Actions
        refetch: fetchItemBebanBiaya,
        fetchItemBebanBiaya
    };
};

export default useItemBebanBiayaAPI;