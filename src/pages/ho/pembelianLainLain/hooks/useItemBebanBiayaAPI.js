import { useState, useEffect, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';

/**
 * Hook for fetching Item Beban Biaya from new backend endpoint
 * Fetches items from /api/master/parameter/select with itembebanbiaya key
 * Filters items with classification "BEBAN DAN BIAYA-BIAYA"
 */
const useItemBebanBiayaAPI = () => {
    const [itemBebanBiaya, setItemBebanBiaya] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch item beban biaya from the new parameter select endpoint
     */
    const fetchItemBebanBiaya = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Fetching Item Beban Biaya from master parameter data endpoint...');
            
            // Call the endpoint: GET /api/master/parameter/data
            // This returns all parameters, we only need itembebanbiaya
            const response = await HttpClient.get('/api/master/parameter/data');

            console.log('📦 Raw Response from /api/master/parameter/data:', response);

            // Extract itembebanbiaya from response
            let dataArray = [];
            
            // Try multiple possible response structures
            if (response?.data?.[0]?.itembebanbiaya && Array.isArray(response.data[0].itembebanbiaya)) {
                // Response structure: { data: [{ itembebanbiaya: [...] }] }
                dataArray = response.data[0].itembebanbiaya;
                console.log('✅ Found itembebanbiaya in data[0]');
            } else if (response?.data?.itembebanbiaya && Array.isArray(response.data.itembebanbiaya)) {
                // Response structure: { data: { itembebanbiaya: [...] } }
                dataArray = response.data.itembebanbiaya;
                console.log('✅ Found itembebanbiaya in data');
            } else if (response?.itembebanbiaya && Array.isArray(response.itembebanbiaya)) {
                // Response structure: { itembebanbiaya: [...] }
                dataArray = response.itembebanbiaya;
                console.log('✅ Found itembebanbiaya in root');
            } else {
                console.warn('⚠️ itembebanbiaya not found in response or not an array');
                console.warn('⚠️ Response structure:', Object.keys(response || {}));
                if (response?.data?.[0]) {
                    console.warn('⚠️ Available keys in data[0]:', Object.keys(response.data[0]));
                }
            }
            
            console.log(`✅ Successfully fetched ${dataArray.length} Item Beban Biaya records`);

            // Validate and transform data
            const validatedData = dataArray.map((item, index) => {
                // Debug log to see actual data structure
                if (index === 0) {
                    console.log('🔍 First Item Beban Biaya raw data:', item);
                }
                
                return {
                    id: item.id,
                    name: item.name || 'Item Beban Biaya',
                    // Keep original data for reference
                    originalData: item
                };
            });

            setItemBebanBiaya(validatedData);
            console.log(`✅ Loaded ${validatedData.length} Item Beban Biaya`);
            if (validatedData.length > 0) {
                console.log('📊 Sample Item Beban Biaya:', validatedData[0]);
            }
        } catch (err) {
            console.error('❌ Error fetching Item Beban Biaya:', err);
            setError(err.message || 'Failed to fetch Item Beban Biaya data');
            setItemBebanBiaya([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchItemBebanBiaya();
    }, [fetchItemBebanBiaya]);

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