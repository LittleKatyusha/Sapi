import { useState, useEffect, useMemo, useCallback } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useSuppliersAPI = (jenisSupplier = null, kategoriSupplier = null) => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFilter, setLastFilter] = useState(null); // Track last filter to avoid duplicate calls

    const fetchSuppliers = useCallback(async (filterJenisSupplier = jenisSupplier, filterKategoriSupplier = kategoriSupplier) => {
        // Avoid duplicate calls with same filter
        if (loading) {
            console.log('📊 Supplier API: Already loading, skipping duplicate call');
            return;
        }
        
        // Create filter key for comparison
        const currentFilterKey = `${filterJenisSupplier}_${filterKategoriSupplier}`;
        
        // Only skip if we have data and same filter
        if (lastFilter === currentFilterKey && suppliers.length > 0) {
            console.log('📊 Supplier API: Using cached data for filter:', currentFilterKey);
            return;
        }
        
        console.log('📊 Supplier API: Fetching data for filter:', currentFilterKey);
        
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
            
            // Add kategori_supplier filter if provided
            if (filterKategoriSupplier !== null) {
                params.kategori_supplier = filterKategoriSupplier;
            }
            
            // Use same URL pattern as other working APIs with pagination to get all records
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.SUPPLIER}/data`, {
                params
            });
            
            // Handle DataTables format response
            if (result.data && Array.isArray(result.data)) {
                // Backend already filters by kategori_supplier, so use data directly
                setSuppliers(result.data);
                setLastFilter(currentFilterKey); // Track the filter used
                
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
    }, [jenisSupplier, kategoriSupplier]); // Depend on both filter params

    // Auto-fetch on mount if kategoriSupplier is provided
    useEffect(() => {
        if (kategoriSupplier !== null) {
            fetchSuppliers();
        }
    }, [kategoriSupplier, fetchSuppliers]);

    const supplierOptions = useMemo(() => {
        if (suppliers.length > 0) {
            
        }
        
        return suppliers.map(supplier => {
            // Now we have the actual database ID from the backend
            const rawId = supplier.id; // This is the actual database primary key
            
            return {
                value: supplier.id, // Use raw database ID for backend compatibility
                label: supplier.name,
                rawId: supplier.id ? parseInt(supplier.id) : null,
                id: supplier.id ? parseInt(supplier.id) : null,
                pubid: supplier.pubid,
                pid: supplier.pid, // Keep PID for reference if needed
                order_no: supplier.order_no,
                jenis_supplier: supplier.jenis_supplier, // Include jenis_supplier for filtering
                kategori_supplier: supplier.kategori_supplier // Include kategori_supplier for filtering
            };
        }).filter(option => option.value && option.id); // Filter suppliers with valid database ID
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