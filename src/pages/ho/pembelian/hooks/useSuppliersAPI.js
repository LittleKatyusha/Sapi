import { useState, useEffect, useMemo } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useSuppliersAPI = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { getAuthHeader } = useAuthSecure();

    const fetchSuppliers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeaders = getAuthHeader();
            // Use same URL pattern as other working APIs with pagination to get all records
            const response = await fetch('https://puput-api.ternasys.com/api/master/supplier/data?length=1000&start=0', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': '92b1d1ee96659e5b9630a51808b9372c',
                    ...authHeaders
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('🔍 DEBUG: Supplier API Response:', result);
            
            // Handle DataTables format response
            if (result.data && Array.isArray(result.data)) {
                // Log first supplier to see the data structure
                if (result.data.length > 0) {
                    console.log('🔍 DEBUG: First supplier structure:', result.data[0]);
                }
                setSuppliers(result.data);
                console.log(`✅ Suppliers loaded: ${result.data.length} items`);
            } else {
                throw new Error(result.message || 'Failed to fetch suppliers');
            }
        } catch (err) {
            console.error('Error fetching suppliers:', err);
            setError(err.message);
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const supplierOptions = useMemo(() => {
        return suppliers.map(supplier => {
            // Coba gunakan PID - encrypted string yang mungkin berisi ID sebenarnya
            console.log('🔍 DEBUG: Supplier mapping:', {
                name: supplier.name,
                pubid: supplier.pubid,
                pid: supplier.pid,
                order_no: supplier.order_no
            });
            
            return {
                value: supplier.pid, // Gunakan PID sebagai encrypted ID
                label: supplier.name,
                pubid: supplier.pubid,
                pid: supplier.pid,
                order_no: supplier.order_no
            };
        }).filter(option => option.value); // Filter suppliers with valid PID
    }, [suppliers]);

    return {
        suppliers,
        supplierOptions,
        loading,
        error,
        refetch: fetchSuppliers
    };
};

export default useSuppliersAPI;