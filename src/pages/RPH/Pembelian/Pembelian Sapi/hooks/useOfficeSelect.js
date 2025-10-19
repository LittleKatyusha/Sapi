import { useState, useEffect, useMemo } from 'react';

const useOfficeSelect = () => {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        setLoading(true);
        setError(null);
        try {
            // Mock data for offices
            const mockOffices = [
                { id: 1, name: 'RPH Pusat', code: 'RPH01' },
                { id: 2, name: 'RPH Cabang Jakarta', code: 'RPH02' },
                { id: 3, name: 'RPH Cabang Surabaya', code: 'RPH03' },
                { id: 4, name: 'RPH Cabang Bandung', code: 'RPH04' }
            ];
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setOffices(mockOffices);
        } catch (err) {
            setError(err.message || 'Failed to fetch offices');
            setOffices([]);
        } finally {
            setLoading(false);
        }
    };

    // Convert to options format for dropdown
    const officeOptions = useMemo(() => {
        const options = [
            { value: '', label: 'Pilih Office...', disabled: true }
        ];
        
        if (offices && offices.length > 0) {
            offices.forEach(office => {
                options.push({
                    value: office.id,
                    label: `${office.name} (${office.code})`
                });
            });
        }
        
        return options;
    }, [offices]);

    return {
        offices,
        officeOptions,
        loading,
        error,
        refetch: fetchOffices
    };
};

export default useOfficeSelect;