import { useState, useEffect, useMemo } from 'react';

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
            // Mock data for persetujuan RPH
            const mockPersetujuan = [
                { id: 1, name: 'Manager RPH', code: 'MGR01', level: 1 },
                { id: 2, name: 'Supervisor RPH', code: 'SPV01', level: 2 },
                { id: 3, name: 'Kepala Bagian RPH', code: 'KBG01', level: 3 },
                { id: 4, name: 'Direktur RPH', code: 'DIR01', level: 4 }
            ];
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setPersetujuanList(mockPersetujuan);
        } catch (err) {
            setError(err.message || 'Failed to fetch persetujuan list');
            setPersetujuanList([]);
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
                options.push({
                    value: persetujuan.id,
                    label: `${persetujuan.name} (${persetujuan.code})`
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