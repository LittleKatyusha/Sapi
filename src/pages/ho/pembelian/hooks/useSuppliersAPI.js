import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useSuppliersAPI = (jenisSupplier = null) => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFilter, setLastFilter] = useState(null); // Track last filter to avoid duplicate calls

    const fetchSuppliers = async (filterJenisSupplier = jenisSupplier) => {
        // Avoid duplicate calls with same filter
        if (loading || (lastFilter === filterJenisSupplier && suppliers.length > 0)) {
            console.log('🚫 Skipping duplicate supplier fetch:', { 
                loading, 
                lastFilter, 
                currentFilter: filterJenisSupplier,
                hasData: suppliers.length > 0 
            });
            return;
        }
        setLoading(true);
        setError(null);
        
        try {
            // Build params object with optional jenis_supplier filter
            const params = {
                length: 1000,
                start: 0
            };
            
            // Add jenis_supplier filter if provided
            if (filterJenisSupplier) {
                params.jenis_supplier = filterJenisSupplier;
            }
            
            console.log('🔍 DEBUG: Fetching suppliers with params:', params);
            
            // Use same URL pattern as other working APIs with pagination to get all records
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.SUPPLIER}/data`, {
                params
            });
            
            console.log('🔍 DEBUG: Supplier API Response:', result);
            
            // Handle DataTables format response
            if (result.data && Array.isArray(result.data)) {
                // Log first supplier to see the data structure
                if (result.data.length > 0) {
                    console.log('🔍 DEBUG: First supplier structure:', result.data[0]);
                }
                setSuppliers(result.data);
                setLastFilter(filterJenisSupplier); // Track the filter used
                console.log(`✅ Suppliers loaded: ${result.data.length} items with filter:`, filterJenisSupplier);
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

    // Remove auto-fetch on mount to avoid duplicate calls
    // Let the parent component control when to fetch
    // useEffect(() => {
    //     fetchSuppliers();
    // }, []);

    const supplierOptions = useMemo(() => {
        return suppliers.map(supplier => {
            // Coba gunakan PID - encrypted string yang mungkin berisi ID sebenarnya
            console.log('🔍 DEBUG: Supplier mapping:', {
                name: supplier.name,
                pubid: supplier.pubid,
                pid: supplier.pid,
                order_no: supplier.order_no,
                jenis_supplier: supplier.jenis_supplier
            });
            
            return {
                value: supplier.pid, // Gunakan PID sebagai encrypted ID
                label: supplier.name,
                pubid: supplier.pubid,
                pid: supplier.pid,
                order_no: supplier.order_no,
                jenis_supplier: supplier.jenis_supplier // Include jenis_supplier for filtering
            };
        }).filter(option => option.value); // Filter suppliers with valid PID
    }, [suppliers]);

    return {
        suppliers,
        supplierOptions,
        loading,
        error,
        refetch: fetchSuppliers,
        fetchSuppliersWithFilter: fetchSuppliers // Expose method to fetch with filter
    };
};

export default useSuppliersAPI;