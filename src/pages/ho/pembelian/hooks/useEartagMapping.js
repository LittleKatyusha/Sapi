import { useState, useEffect, useCallback, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

/**
 * Custom hook for fetching and mapping eartag master data
 * Used to convert eartag IDs to their actual names/codes from master data
 */
const useEartagMapping = () => {
    const [eartagMasterData, setEartagMasterData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all eartag master data
    const fetchEartagMasterData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Try the centralized parameter endpoint first (which includes eartag data)
            let result;
            try {
                console.log('🔄 Trying centralized parameter endpoint...');
                result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
                
                // Check if this endpoint has eartag data
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                    const parameterData = result.data[0];
                    if (parameterData.eartag && Array.isArray(parameterData.eartag)) {
                        console.log('✅ Found eartag data in parameter endpoint');
                        result = { data: parameterData.eartag };
                    } else {
                        throw new Error('No eartag data in parameter endpoint');
                    }
                } else {
                    throw new Error('Invalid parameter endpoint response');
                }
            } catch (paramError) {
                console.log('⚠️ Parameter endpoint failed, trying direct eartag endpoint...', paramError.message);
                
                // Fallback to direct eartag endpoint
                result = await HttpClient.get(`${API_ENDPOINTS.MASTER.EARTAG}/data`, {
                    params: {
                        length: 1000, // Get a large number of records
                        start: 0,
                        '_': Date.now() // Cache buster
                    }
                });
            }
            
            // Handle different response formats
            let dataArray = [];
            if (result.data && Array.isArray(result.data)) {
                dataArray = result.data;
            } else if (result.status === 'ok' && result.data) {
                dataArray = result.data;
            } else {
                throw new Error('Invalid response format from eartag API');
            }
            
            console.log('🔍 Raw API Response:', {
                resultKeys: Object.keys(result),
                dataType: typeof result.data,
                isArray: Array.isArray(result.data),
                sampleData: result.data ? result.data.slice(0, 2) : null
            });
            
            // Map and validate the data
            const validatedData = dataArray.map((item, index) => ({
                id: item.id || item.pubid || item.pid || index,
                pubid: item.pubid,
                pid: item.pid,
                kode: item.kode || item.code || `EAR${index + 1}`,
                nama: item.name || item.nama || item.kode || item.code || `Eartag ${index + 1}`, // Prioritize 'name' field
                deskripsi: item.deskripsi || item.description || `Eartag ${item.kode || item.code || index + 1}`,
                status: item.status !== undefined ? item.status : 1,
                used_status: item.used_status !== undefined ? item.used_status : 0,
                created_at: item.created_at || item.createdAt,
                updated_at: item.updated_at || item.updatedAt
            }));
            
            console.log('🔍 Eartag Master Data Fetched:', {
                totalRecords: validatedData.length,
                sampleRecord: validatedData[0],
                mappingKeys: validatedData.slice(0, 5).map(item => ({ id: item.id, nama: item.nama }))
            });
            
            setEartagMasterData(validatedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching eartag master data:', err);
            setError(err.message || 'Failed to fetch eartag master data');
            setEartagMasterData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a mapping object for quick lookup
    const eartagMap = useMemo(() => {
        const map = new Map();
        
        eartagMasterData.forEach(eartag => {
            // Map by different possible keys for maximum compatibility
            if (eartag.id) map.set(String(eartag.id), eartag);
            if (eartag.pubid) map.set(String(eartag.pubid), eartag);
            if (eartag.pid) map.set(String(eartag.pid), eartag);
            if (eartag.kode) map.set(String(eartag.kode), eartag);
        });
        
        return map;
    }, [eartagMasterData]);

    // Function to get eartag info by ID
    const getEartagById = useCallback((eartagId) => {
        if (!eartagId) return null;
        
        // Try to find the eartag by different possible keys
        const stringId = String(eartagId);
        const found = eartagMap.get(stringId);
        
        // Debug logging
        if (!found) {
            console.log('❌ Eartag not found for ID:', eartagId, 'Available keys:', Array.from(eartagMap.keys()).slice(0, 10));
        } else {
            console.log('✅ Eartag found for ID:', eartagId, 'Name:', found.nama);
        }
        
        return found || null;
    }, [eartagMap]);

    // Function to get eartag name by ID with fallback
    const getEartagName = useCallback((eartagId) => {
        const eartag = getEartagById(eartagId);
        if (eartag) {
            return eartag.nama || eartag.kode || `Eartag ${eartagId}`;
        }
        return `Eartag ${eartagId}`; // Fallback to original ID
    }, [getEartagById]);

    // Function to get eartag code by ID with fallback
    const getEartagCode = useCallback((eartagId) => {
        const eartag = getEartagById(eartagId);
        if (eartag) {
            return eartag.kode || `EAR${eartagId}`;
        }
        return `EAR${eartagId}`; // Fallback
    }, [getEartagById]);

    // Function to map an array of detail records with eartag names
    const mapDetailsWithEartagNames = useCallback((detailData) => {
        if (!Array.isArray(detailData)) return detailData;
        
        console.log('🔄 Mapping detail data with eartag names. Sample eartag IDs:', detailData.slice(0, 3).map(d => d.eartag));
        
        return detailData.map(detail => {
            const eartagInfo = getEartagById(detail.eartag);
            const eartagName = getEartagName(detail.eartag);
            
            console.log(`📋 Detail mapping for eartag ${detail.eartag}:`, {
                originalEartag: detail.eartag,
                eartagInfo: eartagInfo ? { id: eartagInfo.id, nama: eartagInfo.nama } : null,
                eartagName: eartagName
            });
            
            return {
                ...detail,
                eartagInfo,
                eartagName,
                eartagCodeMaster: getEartagCode(detail.eartag),
                // Keep original eartag ID for reference
                eartagId: detail.eartag
            };
        });
    }, [getEartagById, getEartagName, getEartagCode]);

    // Fetch data on mount
    useEffect(() => {
        fetchEartagMasterData();
    }, [fetchEartagMasterData]);

    // Test function to verify mapping works
    const testMapping = useCallback(() => {
        console.log('🧪 Testing eartag mapping...');
        console.log('📊 Current eartag map keys:', Array.from(eartagMap.keys()));
        console.log('📊 Current eartag master data sample:', eartagMasterData.slice(0, 3));
        
        // Test with the specific case from the user
        const testId = "129";
        const testResult = getEartagById(testId);
        console.log('🧪 Test mapping for ID "129":', testResult);
        
        return testResult;
    }, [eartagMap, eartagMasterData, getEartagById]);

    return {
        // Raw data
        eartagMasterData,
        loading,
        error,
        
        // Utility functions
        getEartagById,
        getEartagName,
        getEartagCode,
        mapDetailsWithEartagNames,
        
        // Map for custom usage
        eartagMap,
        
        // Test function
        testMapping,
        
        // Refresh function
        refetch: fetchEartagMasterData
    };
};

export default useEartagMapping;
