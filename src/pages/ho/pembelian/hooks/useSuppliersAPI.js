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
            return;
        }
        
        // Create filter key for comparison
        const currentFilterKey = `${filterJenisSupplier}_${filterKategoriSupplier}`;
        
        // Only skip if we have data and same filter
        if (lastFilter === currentFilterKey && suppliers.length > 0) {
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
            
            // Use same URL pattern as other working APIs with pagination to get all records
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.SUPPLIER}/data`, {
                params
            });
            
            // Handle DataTables format response
            if (result.data && Array.isArray(result.data)) {
                // Apply kategori_supplier filter on frontend if specified
                let filteredSuppliers = result.data;
                if (filterKategoriSupplier !== null) {
                    filteredSuppliers = result.data.filter(supplier => {
                        // Parse kategori_supplier from the display text or use raw value
                        if (supplier.kategori_supplier) {
                            if (typeof supplier.kategori_supplier === 'string') {
                                // Convert display text back to number
                                const kategoriMap = {
                                    'Ternak': 1,
                                    'Feedmil': 2,
                                    'Ovk': 3
                                };
                                return kategoriMap[supplier.kategori_supplier] === filterKategoriSupplier;
                            } else {
                                // Direct number comparison
                                return supplier.kategori_supplier === filterKategoriSupplier;
                            }
                        }
                        return false;
                    });
                }
                
                setSuppliers(filteredSuppliers);
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

    // Remove auto-fetch on mount to avoid duplicate calls
    // Let the parent component control when to fetch
    // useEffect(() => {
    //     fetchSuppliers();
    // }, []);

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