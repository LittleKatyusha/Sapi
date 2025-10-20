import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../../config/api';

const usePersetujuanRphSelect = () => {
    const [persetujuanList, setPersetujuanList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPersetujuan();
    }, []);

    const fetchPersetujuan = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch real data from API - same endpoint as data master
            const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/data`, {
                cache: true // Enable caching for master data
            });
            
            // Handle response format (same as in usePersetujuanRph)
            let dataArray = [];
            
            if (response?.data) {
                dataArray = response.data;
            } else if (Array.isArray(response)) {
                dataArray = response;
            }
            
            // Validate and map data
            const validatedData = dataArray.map((item, index) => ({
                id: item.id || null,
                pubid: item.pubid || `TEMP-${index + 1}`,
                pid: item.pid || item.pubid,
                name: item.name || 'Nama tidak tersedia',
                description: item.description || '',
                created_at: item.created_at || null,
                updated_at: item.updated_at || null,
            }));
            
            setPersetujuanList(validatedData);
            console.log('✅ Fetched persetujuan RPH data from master:', validatedData.length, 'records');
        } catch (err) {
            console.error('❌ Error fetching persetujuan RPH:', err);
            setError(err.message || 'Failed to fetch persetujuan list');
            
            // Fallback to mock data if API fails
            const mockPersetujuan = [
                { id: 1, name: 'Manager RPH', code: 'MGR01', level: 1 },
                { id: 2, name: 'Supervisor RPH', code: 'SPV01', level: 2 },
                { id: 3, name: 'Kepala Bagian RPH', code: 'KBG01', level: 3 },
                { id: 4, name: 'Direktur RPH', code: 'DIR01', level: 4 }
            ];
            setPersetujuanList(mockPersetujuan);
        } finally {
            setLoading(false);
        }
    };

    // Convert to options format for dropdown
    const persetujuanOptions = useMemo(() => {
        const options = [
            { value: '', label: 'Pilih Persetujuan...', disabled: true }
        ];
        
        if (persetujuanList && persetujuanList.length > 0) {
            persetujuanList.forEach(persetujuan => {
                // Use the validated data structure from master
                const id = persetujuan.id || persetujuan.pubid;
                const name = persetujuan.name || '';
                const description = persetujuan.description || '';
                
                options.push({
                    value: id,
                    label: description ? `${name} - ${description}` : name,
                    pid: persetujuan.pid || persetujuan.pubid
                });
            });
        }
        
        return options;
    }, [persetujuanList]);

    return {
        persetujuanList,
        persetujuanOptions,
        loading,
        error,
        refetch: fetchPersetujuan
    };
};

export default usePersetujuanRphSelect;